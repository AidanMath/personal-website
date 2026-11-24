"""Builds the Milestone 1 lake models procedurally and exports them for Roblox.

Run headless (no MCP needed):
  blender -b --factory-startup --python art/blender/build_models.py

Outputs
  game/assets/*.fbx                     one file per model (file name = model name in Studio)
  game/assets/Fish/*.fbx                one per species (file name = fish id)
  art/previews/*.png                    quick renders for review
  art/blender/lake_models.blend         editable source
  game/src/shared/Config/Palette.luau   colors/materials per part role (game applies them)

Style: storybook soft toon. Simple, clean shapes with a few defining details;
color comes from the palette (flat colors), so pieces can be recolored per region.
Each model's parts are joined per role (Hull, Trim, Log, Roof, ...) to keep part counts low.
Axes: built with Blender +Y = model front, +Z = up. FBX export converts to Roblox (-Z front, +Y up).
1 Blender unit = 1 stud.
"""

import bpy
import bmesh
import math
import os
import random
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT_FBX = os.path.join(REPO, "game", "assets")
OUT_FISH = os.path.join(OUT_FBX, "Fish")
OUT_PREV = os.path.join(REPO, "art", "previews")
PALETTE_LUAU = os.path.join(REPO, "game", "src", "shared", "Config", "Palette.luau")
for d in (OUT_FBX, OUT_FISH, OUT_PREV):
    os.makedirs(d, exist_ok=True)

# ---------------------------------------------------------------------------
# Palette: model -> role -> (hex color, Roblox material). Single source of truth.
# ---------------------------------------------------------------------------
PALETTE = {
    "Rowboat": {
        "Hull": ("B57A4A", "Wood"),
        "Trim": ("3F6577", "Wood"),
        "Bench": ("8E5F3D", "WoodPlanks"),
        "Oar": ("D2B482", "Wood"),
    },
    "DockSection": {
        "Plank": ("9C6B47", "WoodPlanks"),
        "PlankDark": ("7E5538", "WoodPlanks"),
        "Stringer": ("6A4630", "Wood"),
        "Post": ("5E3E2B", "Wood"),
        "Rope": ("CDB68A", "Fabric"),
    },
    "Cabin": {
        "Log": ("8A5A3A", "Wood"),
        "LogEnd": ("C29A6B", "Wood"),
        "Gable": ("7A4F33", "WoodPlanks"),
        "Roof": ("5B3B33", "Slate"),
        "Shingle": ("6E4A3E", "Slate"),
        "Trim": ("4A3326", "Wood"),
        "Chimney": ("8D8A82", "Cobblestone"),
        "Door": ("6B4A2E", "WoodPlanks"),
        "Frame": ("E8DCC0", "Wood"),
        "Window": ("FFC478", "Neon"),
        "Floor": ("A27650", "WoodPlanks"),
        "Brass": ("C9A25A", "Metal"),
    },
    "Tree": {
        "Trunk": ("6B4A33", "Wood"),
        "Leaves": ("3F7A4C", "SmoothPlastic"),
    },
    "TreeRound": {
        "Trunk": ("6E4C35", "Wood"),
        "Leaves": ("6E9A4A", "SmoothPlastic"),
    },
    # Fish (keyed by fish id from Config/Fish.luau)
    "perch": {"Back": ("6F8A3A", "SmoothPlastic"), "Belly": ("F2E6B8", "SmoothPlastic"),
              "Fin": ("E07A3C", "SmoothPlastic"), "Stripe": ("3B4A22", "SmoothPlastic"),
              "Eye": ("1B1B1B", "SmoothPlastic")},
    "bass": {"Back": ("4F6B3A", "SmoothPlastic"), "Belly": ("E8E2C4", "SmoothPlastic"),
             "Fin": ("6E7F4A", "SmoothPlastic"), "Stripe": ("2E3D22", "SmoothPlastic"),
             "Eye": ("1B1B1B", "SmoothPlastic")},
    "trout": {"Back": ("5C6E5A", "SmoothPlastic"), "Belly": ("EFE8DC", "SmoothPlastic"),
              "Fin": ("8C8A78", "SmoothPlastic"), "Stripe": ("E08A9A", "SmoothPlastic"),
              "Spot": ("2A2A2A", "SmoothPlastic"), "Eye": ("1B1B1B", "SmoothPlastic")},
    "pike": {"Back": ("46603C", "SmoothPlastic"), "Belly": ("E6E0BE", "SmoothPlastic"),
             "Fin": ("9A6A3A", "SmoothPlastic"), "Spot": ("D8D49A", "SmoothPlastic"),
             "Eye": ("1B1B1B", "SmoothPlastic")},
    "catfish": {"Back": ("5A5A4E", "SmoothPlastic"), "Belly": ("D9D4C4", "SmoothPlastic"),
                "Fin": ("4A4A40", "SmoothPlastic"), "Barbel": ("3A3A32", "SmoothPlastic"),
                "Eye": ("1B1B1B", "SmoothPlastic")},
}


def hex_rgb(h):
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


# ---------------------------------------------------------------------------
# Scene helpers
# ---------------------------------------------------------------------------
def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def material(model, role):
    name = f"{model}_{role}"
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    rgb = hex_rgb(PALETTE[model][role][0])
    lin = tuple(srgb_to_linear(c) for c in rgb)
    m.diffuse_color = (*lin, 1.0)
    m.use_nodes = True
    bsdf = next((n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
    if bsdf:
        bsdf.inputs[0].default_value = (*lin, 1.0)
        rough = next((i for i in bsdf.inputs if i.identifier == "Roughness"), None)
        if rough:
            rough.default_value = 0.8
    return m


def link(obj):
    bpy.context.scene.collection.objects.link(obj)
    return obj


def mesh_obj(name, verts, faces):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], faces)
    me.update()
    return link(bpy.data.objects.new(name, me))


def tag(obj, model, role, smooth=False):
    obj["role"] = role
    obj.data.materials.clear()
    obj.data.materials.append(material(model, role))
    for p in obj.data.polygons:
        p.use_smooth = smooth
    return obj


def apply_all(obj):
    """Apply transforms and modifiers so exported geometry is final."""
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    if obj.type != "MESH":
        bpy.ops.object.convert(target="MESH")
    for mod in list(obj.modifiers):
        bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return obj


def box(model, role, size, loc, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.scale = size
    apply_all(o)
    return tag(o, model, role)


def bevel_box(model, role, size, loc, rot=(0, 0, 0), width=0.06):
    o = box(model, role, size, loc, rot)
    m = o.modifiers.new("bevel", "BEVEL")
    m.width = width
    m.segments = 2
    apply_all(o)
    return o


def cyl(model, role, r, depth, loc, rot=(0, 0, 0), verts=12, r2=None, smooth=True):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object
    apply_all(o)
    return tag(o, model, role, smooth)


def sphere(model, role, r, loc, scale=(1, 1, 1), subdiv=2, smooth=True):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdiv, radius=r, location=loc)
    o = bpy.context.active_object
    o.scale = scale
    apply_all(o)
    return tag(o, model, role, smooth)


def tube(model, role, points, radius, smooth=True):
    cu = bpy.data.curves.new(f"{role}_curve", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = radius
    cu.bevel_resolution = 2
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(points) - 1)
    for i, p in enumerate(points):
        sp.points[i].co = (p[0], p[1], p[2], 1)
    o = link(bpy.data.objects.new(role, cu))
    apply_all(o)
    return tag(o, model, role, smooth)


def solidify(obj, thickness, offset=0.0):
    m = obj.modifiers.new("solid", "SOLIDIFY")
    m.thickness = thickness
    m.offset = offset
    return apply_all(obj)


def join_by_role(objs):
    """Join all objects sharing a role into one mesh named after the role."""
    by_role = {}
    for o in objs:
        by_role.setdefault(o["role"], []).append(o)
    joined = []
    for role, group in by_role.items():
        bpy.ops.object.select_all(action="DESELECT")
        for o in group:
            o.select_set(True)
        bpy.context.view_layer.objects.active = group[0]
        if len(group) > 1:
            bpy.ops.object.join()
        o = bpy.context.view_layer.objects.active
        o.name = role
        o.data.name = role
        o["role"] = role
        joined.append(o)
    return joined


def export_fbx(objs, path):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.export_scene.fbx(
        filepath=path,
        use_selection=True,
        object_types={"MESH"},
        axis_forward="-Z",
        axis_up="Y",
        bake_space_transform=True,
        apply_unit_scale=True,
        apply_scale_options="FBX_SCALE_NONE",
        use_mesh_modifiers=True,
        mesh_smooth_type="FACE",
        add_leaf_bones=False,
    )


def render_preview(objs, path, size=(640, 480), elev=22, azim=35):
    scene = bpy.context.scene
    try:
        scene.render.engine = "BLENDER_WORKBENCH"
    except TypeError:
        pass
    sh = scene.display.shading
    sh.light = "STUDIO"
    sh.color_type = "MATERIAL"
    sh.show_shadows = True
    sh.show_cavity = True
    sh.cavity_type = "BOTH"
    scene.render.resolution_x, scene.render.resolution_y = size
    scene.render.film_transparent = False
    if not scene.world:
        scene.world = bpy.data.worlds.new("World")
    scene.world.color = (0.82, 0.86, 0.88)
    # frame the bounding box
    lo = Vector((1e9, 1e9, 1e9))
    hi = Vector((-1e9, -1e9, -1e9))
    for o in objs:
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            lo = Vector(map(min, lo, w))
            hi = Vector(map(max, hi, w))
    center = (lo + hi) / 2
    radius = (hi - lo).length / 2
    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = 50
    cam = link(bpy.data.objects.new("cam", cam_data))
    e, a = math.radians(elev), math.radians(azim)
    dist = radius * 3.0
    cam.location = center + Vector((math.sin(a) * math.cos(e), math.cos(a) * math.cos(e), math.sin(e))) * dist
    direction = center - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam, do_unlink=True)


def finish(model, objs, fbx_path, preview_name, **view):
    objs = join_by_role(objs)
    export_fbx(objs, fbx_path)
    render_preview(objs, os.path.join(OUT_PREV, preview_name + ".png"), **view)
    print(f"[models] {model}: {len(objs)} parts -> {os.path.relpath(fbx_path, REPO)}")
    return objs


# ---------------------------------------------------------------------------
# Fish: one shared body generator reshaped per species (design log: shared body types)
# ---------------------------------------------------------------------------
FISH = {
    # L length, H/W half height/width, a = where the body is deepest (>1 = further back),
    # b = fullness, head = extra head width (catfish), dorsal = (start, end, height) as body fractions
    "perch": dict(L=2.2, H=0.36, W=0.17, a=1.0, b=0.85, head=0.0, dorsal=(0.35, 0.75, 0.55), tail=0.55, stripes=6),
    "bass": dict(L=3.0, H=0.55, W=0.26, a=0.95, b=0.75, head=0.15, dorsal=(0.3, 0.72, 0.45), tail=0.75, band=True),
    "trout": dict(L=3.0, H=0.38, W=0.2, a=1.0, b=0.8, head=0.0, dorsal=(0.48, 0.62, 0.45), tail=0.75, band=True, spots=18),
    "pike": dict(L=4.2, H=0.4, W=0.24, a=1.5, b=0.55, head=0.1, dorsal=(0.12, 0.25, 0.6), tail=0.9, spots=22, snout=True),
    "catfish": dict(L=4.0, H=0.4, W=0.36, a=1.25, b=0.6, head=0.7, dorsal=(0.55, 0.68, 0.5), tail=0.85, barbels=True),
}


def fish_profile(p, s):
    """Half-height, half-width and centre z at body fraction s (0 = tail, 1 = nose)."""
    x = 0.03 + 0.95 * s
    prof = max(0.0, math.sin(math.pi * x ** p["a"])) ** p["b"]
    prof = max(prof, 0.18 * (1 - s) if s < 0.25 else prof)  # tail wrist
    h = p["H"] * prof
    w = p["W"] * prof * (1 + p["head"] * max(0.0, s - 0.55) / 0.45)
    if p.get("snout") and s > 0.8:
        h *= 1 - (s - 0.8) * 2.2  # pike duck-bill snout: flatter, keeps width
    cz = -0.12 * h
    return h, w, cz


def build_fish(fid):
    p = FISH[fid]
    L = p["L"]
    rings, seg = 28, 10
    parts = []

    def ring_y(s):
        return (s - 0.5) * L

    for half, role in ((0, "Back"), (1, "Belly")):
        verts, faces = [], []
        for i in range(rings + 1):
            s = i / rings
            h, w, cz = fish_profile(p, s)
            for j in range(seg + 1):
                t = math.pi * j / seg + half * math.pi
                verts.append((w * math.cos(t), ring_y(s), cz + h * math.sin(t)))
        for i in range(rings):
            for j in range(seg):
                a = i * (seg + 1) + j
                b = a + seg + 1
                faces.append((a, b, b + 1, a + 1) if half == 0 else (a, a + 1, b + 1, b))
        # nose and tail caps
        nose = len(verts)
        verts.append((0, L / 2 + 0.02, fish_profile(p, 1)[2]))
        last = rings * (seg + 1)
        for j in range(seg):
            faces.append((last + j, nose, last + j + 1) if half == 0 else (last + j + 1, nose, last + j))
        parts.append(tag(mesh_obj(role, verts, faces), fid, role, smooth=True))

    # tail fin (forked), in the YZ plane
    F = p["tail"] * p["H"] * 2.2
    y0 = -L / 2 + 0.02
    tail = mesh_obj("Fin", [(0, y0 + 0.08, 0.06), (0, y0 - F * 0.9, F * 0.85), (0, y0 - F * 0.55, 0.0),
                            (0, y0 - F * 0.9, -F * 0.85), (0, y0 + 0.08, -0.06)], [(0, 1, 2, 3, 4)])
    parts.append(solidify(tag(tail, fid, "Fin"), 0.035, 0))

    # dorsal fin along the back
    s0, s1, fh = p["dorsal"]
    pts = []
    for k in range(9):
        s = s0 + (s1 - s0) * k / 8
        h, _, cz = fish_profile(p, s)
        pts.append((0, ring_y(s), cz + h * 0.92))
    top = []
    for k in range(9):
        s = s0 + (s1 - s0) * k / 8
        h, _, cz = fish_profile(p, s)
        rise = p["H"] * fh * math.sin(math.pi * (0.15 + 0.85 * k / 8)) ** 0.6
        top.append((0, ring_y(s) - 0.05, cz + h + rise))
    verts = pts + list(reversed(top))
    dorsal = mesh_obj("Fin", verts, [tuple(range(len(verts)))])
    parts.append(solidify(tag(dorsal, fid, "Fin"), 0.03, 0))

    # pectoral and pelvic fins
    for side in (-1, 1):
        for s, zf, size in ((0.72, -0.35, 0.9), (0.45, -0.85, 0.7)):
            h, w, cz = fish_profile(p, s)
            base = Vector((side * w * 0.85, ring_y(s), cz + h * zf))
            fl = p["H"] * size
            v = [base + Vector((0, 0.06, 0)), base + Vector((side * fl * 0.6, -fl * 0.9, -fl * 0.25)),
                 base + Vector((side * fl * 0.2, -fl * 1.0, -fl * 0.35)), base + Vector((0, -0.08, 0))]
            parts.append(solidify(tag(mesh_obj("Fin", v, [(0, 1, 2, 3)]), fid, "Fin"), 0.02, 0))

    # eyes
    s = 0.9 if not p.get("snout") else 0.83
    h, w, cz = fish_profile(p, s)
    er = max(0.045, p["H"] * 0.17)
    for side in (-1, 1):
        parts.append(sphere(fid, "Eye", er, (side * w * 0.88, ring_y(s), cz + h * 0.3), subdiv=2))

    rng = random.Random(fid)
    # perch: dark vertical bars over the back
    for k in range(p.get("stripes", 0)):
        s = 0.3 + 0.45 * k / max(1, p["stripes"] - 1)
        verts, faces = [], []
        band = 0.035 * L
        n = 8
        for r, ds in enumerate((-band / 2, band / 2)):
            ss = s + ds / L
            h, w, cz = fish_profile(p, ss)
            for j in range(n + 1):
                t = math.radians(25 + 130 * j / n)
                verts.append((w * 1.03 * math.cos(t), ring_y(ss), cz + h * 1.03 * math.sin(t)))
        for j in range(n):
            faces.append((j, j + n + 1, j + n + 2, j + 1))
        parts.append(tag(mesh_obj("Stripe", verts, faces), fid, "Stripe", smooth=True))

    # bass/trout: lateral band along each side
    if p.get("band"):
        for side in (0, 1):
            verts, faces = [], []
            n = 20
            for i in range(n + 1):
                s = 0.12 + 0.75 * i / n
                h, w, cz = fish_profile(p, s)
                for t in (-0.18, 0.18):
                    ang = t + side * math.pi
                    verts.append((w * 1.02 * math.cos(ang), ring_y(s), cz + h * 1.02 * math.sin(ang * (1 if side == 0 else -1)) * (1 if side == 0 else -1)))
            for i in range(n):
                a = i * 2
                faces.append((a, a + 2, a + 3, a + 1) if side == 0 else (a, a + 1, a + 3, a + 2))
            parts.append(tag(mesh_obj("Stripe", verts, faces), fid, "Stripe", smooth=True))

    # trout/pike: spots
    for _ in range(p.get("spots", 0)):
        s = rng.uniform(0.15, 0.8)
        t = rng.uniform(0.25, 1.2) * (1 if rng.random() < 0.5 else -1)
        side = 1 if rng.random() < 0.5 else -1
        h, w, cz = fish_profile(p, s)
        ang = t if side > 0 else math.pi - t
        pos = (w * math.cos(ang) * 1.0, ring_y(s), cz + h * math.sin(abs(t)) * 0.9)
        parts.append(sphere(fid, "Spot", p["H"] * 0.07, pos, scale=(0.6, 1.6, 1.0), subdiv=1))

    # catfish: whiskers
    if p.get("barbels"):
        h, w, cz = fish_profile(p, 0.97)
        y = L / 2 - 0.05
        for side in (-1, 1):
            for drop, length in ((0.0, 1.0), (-0.6, 0.55)):
                a = Vector((side * w * 0.7, y, cz + h * drop * 0.5))
                pts = [a, a + Vector((side * 0.25, 0.15, -0.05)) * length, a + Vector((side * 0.55, 0.05, -0.25)) * length,
                       a + Vector((side * 0.8, -0.2, -0.45)) * length]
                parts.append(tube(fid, "Barbel", [tuple(v) for v in pts], 0.025))
    return parts


# ---------------------------------------------------------------------------
# Rowboat
# ---------------------------------------------------------------------------
def build_rowboat():
    M = "Rowboat"
    L, W, D = 11.0, 5.0, 1.7
    rings, K = 26, 14
    parts = []

    def hw(s):  # half width: square-ish stern (transom), pointed bow
        if s < 0.45:
            return W / 2 * (0.78 + 0.22 * math.sin(s / 0.45 * math.pi / 2))
        return W / 2 * max(0.03, math.cos((s - 0.45) / 0.55 * math.pi / 2) ** 0.85)

    def depth(s):
        return D * (0.72 + 0.28 * math.sin(math.pi * min(1, s * 1.1)) ) * (1 - 0.35 * max(0, s - 0.75) / 0.25)

    def sheer(s):  # gunwale height, rising toward the bow
        return 0.55 * s ** 3 + 0.12 * (1 - s) ** 2

    verts, faces = [], []
    for i in range(rings + 1):
        s = i / rings
        for k in range(K + 1):
            phi = -math.pi / 2 + math.pi * k / K
            x = hw(s) * math.sin(phi)
            z = sheer(s) - depth(s) * (math.cos(phi) ** 0.55)
            verts.append((x, (s - 0.5) * L, z))
    for i in range(rings):
        for k in range(K):
            a = i * (K + 1) + k
            b = a + K + 1
            faces.append((a, a + 1, b + 1, b))
    faces.append(tuple(range(K, -1, -1)))  # transom
    hull = tag(mesh_obj("Hull", verts, faces), M, "Hull", smooth=True)
    parts.append(solidify(hull, 0.16, -1))

    # gunwale trim, keel and transom cap
    for side in (-1, 1):
        pts = [(side * hw(i / 30), (i / 30 - 0.5) * L, sheer(i / 30) + 0.04) for i in range(31)]
        parts.append(tube(M, "Trim", pts, 0.13))
    keel = [(0, (i / 30 - 0.5) * L, sheer(i / 30) - depth(i / 30) - 0.02) for i in range(1, 31)]
    parts.append(tube(M, "Trim", keel, 0.09))
    parts.append(bevel_box(M, "Trim", (W * 0.8, 0.22, 0.22), (0, -L / 2 + 0.05, sheer(0) + 0.02)))

    # benches (thwarts) and stern seat
    for s, depth_frac in ((0.62, 0.45), (0.36, 0.45), (0.1, 0.4)):
        z = sheer(s) - depth(s) * depth_frac
        width = 2 * hw(s) * 0.93
        parts.append(bevel_box(M, "Bench", (width, 1.2 if s > 0.2 else 1.6, 0.18), (0, (s - 0.5) * L, z)))

    # oars resting inside, crossing the benches
    for side in (-1, 1):
        y0, y1 = -2.6, 3.2
        z = sheer(0.5) - 0.25
        shaft_len = y1 - y0
        ang = math.atan2(side * 0.9, shaft_len)
        cx = side * 1.2
        parts.append(cyl(M, "Oar", 0.08, shaft_len, (cx, (y0 + y1) / 2, z), rot=(math.pi / 2, 0, -ang), verts=10))
        bx = cx - side * 0.45 * math.sin(ang) * 2
        parts.append(bevel_box(M, "Oar", (0.5, 1.5, 0.08), (bx - side * 0.5, y0 - 0.5, z - 0.05), rot=(0, 0, -ang), width=0.03))
        # oarlocks
        parts.append(cyl(M, "Trim", 0.07, 0.35, (side * hw(0.5) * 0.98, 0.5, sheer(0.5) + 0.2), verts=8))
    return parts


# ---------------------------------------------------------------------------
# Dock section (modular, 8 x 8; tiled along the dock in game)
# ---------------------------------------------------------------------------
def build_dock_section():
    M = "DockSection"
    parts = []
    rng = random.Random(3)
    n = 4
    for i in range(n):
        y = -4 + 1 + i * 2
        role = "PlankDark" if i % 3 == 1 else "Plank"
        parts.append(bevel_box(M, role, (8 + rng.uniform(-0.15, 0.15), 1.8, 0.35), (rng.uniform(-0.08, 0.08), y, -0.175),
                               rot=(0, 0, math.radians(rng.uniform(-1, 1))), width=0.05))
    for x in (-3.0, 3.0):
        parts.append(bevel_box(M, "Stringer", (0.45, 8, 0.55), (x, 0, -0.65)))
    for x in (-3.7, 3.7):
        parts.append(cyl(M, "Post", 0.45, 8.6, (x, -3.4, -4.0), verts=10))
        parts.append(cyl(M, "Post", 0.47, 0.25, (x, -3.4, 0.38), verts=10, r2=0.3))
        # rope wrap
        parts.append(cyl(M, "Rope", 0.5, 0.12, (x, -3.4, -0.2), verts=10))
        parts.append(cyl(M, "Rope", 0.5, 0.12, (x, -3.4, -0.4), verts=10))
    return parts


# ---------------------------------------------------------------------------
# Log cabin (front = +Y). Footprint 20 x 16, origin at floor centre.
# ---------------------------------------------------------------------------
def build_cabin():
    M = "Cabin"
    parts = []
    r = 0.5
    layers = 10
    door = (-1.6, 1.6, 0.0, 7.2)
    windows = [(-7.6, -3.6, 3.4, 7.0), (3.6, 7.6, 3.4, 7.0)]

    def log_x(x0, x1, y, z):
        parts.append(cyl(M, "Log", r, x1 - x0, ((x0 + x1) / 2, y, z), rot=(0, math.pi / 2, 0), verts=10))

    for i in range(layers):
        z = r + i * 0.95
        # back wall (full) and front wall (split around door/windows)
        log_x(-10.8, 10.8, -8, z)
        gaps = sorted([(g[0], g[1]) for g in [door] + windows if g[2] <= z <= g[3]])
        x = -10.8
        for g0, g1 in gaps:
            if g0 > x:
                log_x(x, g0, 8, z)
            x = g1
        log_x(x, 10.8, 8, z)
        # side walls, interleaved half a log up
        zs = z + 0.475
        if i < layers - 1:
            for side in (-10, 10):
                parts.append(cyl(M, "Log", r, 17.6, (side, 0, zs), rot=(math.pi / 2, 0, 0), verts=10))
    # log ends at the corners (lighter end grain)
    for x in (-10.8, 10.8):
        for y in (-8, 8):
            for i in range(layers):
                parts.append(cyl(M, "LogEnd", r * 0.92, 0.05, (x + (0.03 if x > 0 else -0.03), y, r + i * 0.95), rot=(0, math.pi / 2, 0), verts=10))

    top = layers * 0.95
    ridge = top + 5.0
    # gables
    for side in (-10, 10):
        g = mesh_obj("Gable", [(side, -8.4, top), (side, 8.4, top), (side, 0, ridge)], [(0, 1, 2)])
        parts.append(solidify(tag(g, M, "Gable"), 0.6, 0))
    # roof slabs + shingle rows + ridge cap
    # Each slab runs from the ridge (y = 0) down to an eave past the wall (y = +/-run).
    # Rotation about X: a positive angle lifts +Y, so the +Y slab needs a negative angle.
    run = 9.8
    ridge_z = ridge + 0.3
    eave_z = top - 0.5
    rise = ridge_z - eave_z
    slope = math.atan2(rise, run)
    slab_len = math.hypot(run, rise)
    for side in (-1, 1):
        tilt = (-side * slope, 0, 0)
        parts.append(bevel_box(M, "Roof", (23.5, slab_len, 0.4), (0, side * run / 2, (ridge_z + eave_z) / 2), rot=tilt, width=0.08))
        for k in range(7):
            f = (k + 0.5) / 7
            parts.append(bevel_box(M, "Shingle", (23.6, slab_len / 7 * 0.92, 0.16),
                                   (0, side * run * f, ridge_z - rise * f + 0.27), rot=tilt, width=0.04))
    parts.append(cyl(M, "Trim", 0.38, 24.0, (0, 0, ridge_z + 0.3), rot=(0, math.pi / 2, 0), verts=10))

    # chimney (rises ~2.5 above the ridge)
    parts.append(bevel_box(M, "Chimney", (2.4, 2.4, 8.0), (6.5, -3.5, 4.0), width=0.15))
    parts.append(bevel_box(M, "Chimney", (2.1, 2.1, 9.3), (6.5, -3.5, 12.6), width=0.15))
    parts.append(bevel_box(M, "Trim", (2.5, 2.5, 0.35), (6.5, -3.5, 17.4), width=0.05))
    # door, frames, windows
    parts.append(bevel_box(M, "Door", (3.0, 0.3, 7.0), (0, 8.15, 3.5)))
    parts.append(sphere(M, "Brass", 0.18, (1.0, 8.4, 3.5)))
    for x in (-1.7, 1.7):
        parts.append(bevel_box(M, "Frame", (0.3, 0.6, 7.4), (x, 8.2, 3.6)))
    parts.append(bevel_box(M, "Frame", (3.8, 0.6, 0.35), (0, 8.2, 7.3)))
    for x0, x1, z0, z1 in windows:
        cx, cz, w, h = (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0
        parts.append(box(M, "Window", (w, 0.15, h), (cx, 7.9, cz)))
        for dx in (-w / 2, w / 2):
            parts.append(bevel_box(M, "Frame", (0.28, 0.5, h + 0.3), (cx + dx, 8.15, cz)))
        for dz in (-h / 2, h / 2):
            parts.append(bevel_box(M, "Frame", (w + 0.3, 0.5, 0.28), (cx, 8.15, cz + dz)))
        parts.append(bevel_box(M, "Frame", (0.14, 0.4, h), (cx, 8.15, cz)))
        parts.append(bevel_box(M, "Frame", (w, 0.4, 0.14), (cx, 8.15, cz)))
        parts.append(bevel_box(M, "Trim", (w + 0.8, 0.9, 0.25), (cx, 8.45, z0 - 0.3)))  # sill

    # floor and porch
    parts.append(box(M, "Floor", (20.5, 16.5, 0.5), (0, 0, 0.05)))
    parts.append(bevel_box(M, "Floor", (21, 4.0, 0.4), (0, 10.3, 0.2)))
    for k in range(2):
        parts.append(bevel_box(M, "Floor", (4.0, 0.8, 0.25), (0, 12.6 + k * 0.8, -0.05 - k * 0.2)))
    for x in (-9.8, 9.8):
        parts.append(cyl(M, "Log", 0.35, 8.6, (x, 12.0, 4.6), verts=10))
    parts.append(bevel_box(M, "Roof", (22, 4.8, 0.3), (0, 10.4, 9.0), rot=(-math.radians(12), 0, 0)))
    return parts


# ---------------------------------------------------------------------------
# Trees
# ---------------------------------------------------------------------------
def build_pine():
    M = "Tree"
    parts = [cyl(M, "Trunk", 0.6, 4.0, (0, 0, 2.0), verts=9, r2=0.45, smooth=False)]
    tiers = [(4.2, 4.6, 2.8), (3.5, 4.2, 5.2), (2.7, 3.8, 7.4), (1.8, 3.4, 9.4)]
    for i, (r, h, z) in enumerate(tiers):
        parts.append(cyl(M, "Leaves", r, h, (0, 0, z + h / 2), rot=(0, 0, i * 0.4), verts=9, r2=0.15, smooth=False))
    return parts


def build_round_tree():
    M = "TreeRound"
    parts = [cyl(M, "Trunk", 0.7, 6.0, (0, 0, 3.0), verts=9, r2=0.5, smooth=False)]
    for x, y, z, r in ((0, 0, 7.6, 3.2), (1.8, 0.6, 6.4, 2.3), (-1.6, 0.9, 6.6, 2.4), (0.3, -1.7, 6.5, 2.3), (0.2, 0.4, 9.2, 2.2)):
        parts.append(sphere(M, "Leaves", r, (x, y, z), subdiv=1, smooth=False))
    return parts


# ---------------------------------------------------------------------------
def write_palette_luau():
    lines = [
        "--!strict",
        "-- GENERATED by art/blender/build_models.py — edit the PALETTE there and re-run.",
        "-- Colors and materials for imported models, by model name -> part role.",
        "-- Recolor per region by swapping these tables (design log: shared pieces recolored per region).",
        "",
        "export type Entry = { color: Color3, material: Enum.Material }",
        "",
        "local Palette: { [string]: { [string]: Entry } } = {",
    ]
    for model, roles in PALETTE.items():
        lines.append(f"\t[\"{model}\"] = {{")
        for role, (hx, mat) in roles.items():
            r, g, b = (int(hx[i:i + 2], 16) for i in (0, 2, 4))
            lines.append(f"\t\t{role} = {{ color = Color3.fromRGB({r}, {g}, {b}), material = Enum.Material.{mat} }},")
        lines.append("\t},")
    lines += ["}", "", "return Palette", ""]
    with open(PALETTE_LUAU, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines))


def main():
    write_palette_luau()
    builds = [
        ("Rowboat", build_rowboat, os.path.join(OUT_FBX, "Rowboat.fbx"), dict(elev=28, azim=140)),
        ("DockSection", build_dock_section, os.path.join(OUT_FBX, "DockSection.fbx"), dict(elev=25, azim=35)),
        ("Cabin", build_cabin, os.path.join(OUT_FBX, "Cabin.fbx"), dict(elev=18, azim=30)),
        ("Tree", build_pine, os.path.join(OUT_FBX, "Tree.fbx"), dict(elev=10, azim=30)),
        ("TreeRound", build_round_tree, os.path.join(OUT_FBX, "TreeRound.fbx"), dict(elev=10, azim=30)),
    ]
    for fid in FISH:
        builds.append((fid, (lambda f=fid: build_fish(f)), os.path.join(OUT_FISH, f"{fid}.fbx"), dict(elev=15, azim=75)))

    keep_scene = []
    for name, fn, path, view in builds:
        reset_scene()
        objs = fn()
        finish(name, objs, path, name, **view)
        # save each into the .blend library as its own collection
        keep_scene.append(name)

    # Build everything once more into one editable .blend, one collection per model
    reset_scene()
    offset = 0.0
    for name, fn, _, _ in builds:
        coll = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(coll)
        objs = join_by_role(fn())
        for o in objs:
            for c in o.users_collection:
                c.objects.unlink(o)
            coll.objects.link(o)
            o.location.x += offset
        offset += 28.0
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "lake_models.blend"))
    print("[models] done")


main()
