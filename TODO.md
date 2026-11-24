# TODO / checkpoint

Branch: `milestone-1-lake-test` (pushed to GitHub). Design log `docs/design-decisions.md` untouched; ask Aidan before editing it.

## Aidan's decisions (2026-11-24)
- Install Studio: yes. Models: more complex Blender models (not blocks). Placeholder lake fish: OK. Phone controls: yes.
- Publishing/title: skip for now. Git: commit and push.

## Milestone 0: Setup
- [x] OS: Windows 11 Home x64
- [x] Roblox Studio 0.748 installed (official installer, signature verified)
- [ ] **Aidan:** sign in to Studio. The saved session expired (401), so it's on the login screen.
- [ ] **Aidan:** run `rojo plugin install`, then `cd game; rojo serve`, then Studio → Plugins → Rojo → Connect
- [x] Rojo 7.6.1 and the project in `game/`
- [x] Blender 5.3.0 at `%LOCALAPPDATA%\Programs\Blender\...` and the MCP for Blender add-on (enabled; server on :9876)
  - MCP tool calls show permission prompts. When unattended, use headless `blender -b --python` instead.
- [ ] Figma style guide (not started)
- Tooling: Luau 0.748, luau-lsp 1.70.1 and Roblox defs in `~/.local/luau-tools`

## Milestone 1: Lake test
- [x] Pure shared modules and unit tests (`luau game/tests/run.luau`)
- [x] Server: terrain lake (shallow ring plus a 30-stud deep hole), dock, cabin, shop, buyer, rowboats, fishing remotes
- [x] Client: charge cast, nibbles/take, fight UI, keep/release card with 3D fish, shop, boat driving, touch buttons, F3 debug
- [x] luau-lsp type check clean; `rojo build` OK
- [x] Blender models: Rowboat, DockSection, Cabin, Tree, TreeRound, 5 fish → `game/assets/*.fbx` with palette-driven colors
- [ ] **Aidan:** import the FBX files into ReplicatedStorage/Assets (see `game/assets/README.md`)
- [ ] First Studio playtest. Likely tweaks: rod grip angle, boat float height and speed, fight feel and numbers.
- [ ] Friends playtest. Needs publishing (skipped for now).

## Ideas, not done
- Trophy pose (avatar holds up big catches) is in the art direction but isn't built yet.
- Real sounds: placeholders use the built-in `rbxasset://sounds/impact_water.mp3`.
