--!strict
-- Builds the Milestone 1 lake greybox from code, so the whole test lives in the repo.
-- If a model with the same name exists in ReplicatedStorage.Assets (e.g. imported from
-- Blender), it is used instead of the block fallback.

local Lighting = game:GetService("Lighting")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local World = {}

World.WaterY = 0
World.LakeRadius = 150
World.MaxDepth = 30
World.DockStart = Vector3.new(172, 0, 0) -- shore end of the dock
World.DockEnd = Vector3.new(122, 0, 0) -- lake end

local WOOD = Color3.fromRGB(150, 105, 70)
local DARK_WOOD = Color3.fromRGB(105, 72, 48)

local function asset(name: string): Model?
	local folder = ReplicatedStorage:FindFirstChild("Assets")
	local m = folder and folder:FindFirstChild(name)
	if m and m:IsA("Model") then
		return m:Clone()
	end
	return nil
end

local function part(props: { [string]: any }, parent: Instance): Part
	local p = Instance.new("Part")
	p.Anchored = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	for k, v in props do
		(p :: any)[k] = v
	end
	p.Parent = parent
	return p
end

local function buildTerrain()
	local t = Workspace.Terrain
	t:Clear()
	local up = CFrame.new
	-- Ground (top at y = 0)
	t:FillBlock(up(0, -10, 0), Vector3.new(800, 20, 800), Enum.Material.Grass)
	-- Beach ring
	t:FillCylinder(up(0, -1, 0), 2, World.LakeRadius + 12, Enum.Material.Sand)
	-- Shallow basin: 12 deep
	t:FillCylinder(up(0, -6, 0), 12, World.LakeRadius, Enum.Material.Air)
	t:FillCylinder(up(0, -14, 0), 4, World.LakeRadius, Enum.Material.Sand)
	-- Deep hole off-centre: 30 deep (pike and catfish live here)
	local deep = Vector3.new(-25, 0, 20)
	t:FillCylinder(up(deep.X, -21, deep.Z), 18, 70, Enum.Material.Air)
	t:FillCylinder(up(deep.X, -32, deep.Z), 4, 70, Enum.Material.Mud)
	-- Water
	t:FillCylinder(up(0, -6, 0), 12, World.LakeRadius, Enum.Material.Water)
	t:FillCylinder(up(deep.X, -21, deep.Z), 18, 70, Enum.Material.Water)
	-- Mid shelf (~20 deep) between shore and the hole
	t:FillCylinder(up(deep.X, -16, deep.Z), 8, 100, Enum.Material.Water)
	t.WaterColor = Color3.fromRGB(46, 96, 88)
	t.WaterTransparency = 0.6
	t.WaterWaveSize = 0.08
	t.WaterWaveSpeed = 6
end

local function buildDock(parent: Instance)
	local m = asset("Dock")
	if m then
		m:PivotTo(CFrame.lookAt(World.DockStart, World.DockEnd))
		m.Parent = parent
		return
	end
	local dock = Instance.new("Model")
	dock.Name = "Dock"
	local len = (World.DockStart - World.DockEnd).Magnitude
	local mid = (World.DockStart + World.DockEnd) / 2
	-- planks with small gaps
	local plankCount = math.floor(len / 2)
	for i = 0, plankCount - 1 do
		local x = World.DockStart.X - 1 - i * 2
		part({
			Name = "Plank",
			Size = Vector3.new(1.8, 0.4, 8),
			Position = Vector3.new(x, 1.3, mid.Z),
			Material = Enum.Material.WoodPlanks,
			Color = if i % 3 == 0 then DARK_WOOD else WOOD,
		}, dock)
	end
	for i = 0, math.floor(len / 8) do
		for _, side in { -3.6, 3.6 } do
			part({
				Name = "Post",
				Shape = Enum.PartType.Cylinder,
				Size = Vector3.new(14, 0.9, 0.9),
				CFrame = CFrame.new(World.DockStart.X - i * 8, -5, side) * CFrame.Angles(0, 0, math.rad(90)),
				Material = Enum.Material.Wood,
				Color = DARK_WOOD,
			}, dock)
		end
	end
	dock.Parent = parent
end

local function buildCabin(parent: Instance)
	local origin = CFrame.new(205, 0, 26) * CFrame.Angles(0, math.rad(-90), 0)
	local m = asset("Cabin")
	if m then
		m:PivotTo(origin)
		m.Parent = parent
		return
	end
	local cabin = Instance.new("Model")
	cabin.Name = "Cabin"
	local logColor = Color3.fromRGB(128, 86, 56)
	part({ Name = "Floor", Size = Vector3.new(20, 1, 16), CFrame = origin * CFrame.new(0, 0.5, 0), Material = Enum.Material.WoodPlanks, Color = WOOD }, cabin)
	part({ Name = "Back", Size = Vector3.new(20, 10, 1), CFrame = origin * CFrame.new(0, 6, 7.5), Material = Enum.Material.Wood, Color = logColor }, cabin)
	part({ Name = "Left", Size = Vector3.new(1, 10, 16), CFrame = origin * CFrame.new(-9.5, 6, 0), Material = Enum.Material.Wood, Color = logColor }, cabin)
	part({ Name = "Right", Size = Vector3.new(1, 10, 16), CFrame = origin * CFrame.new(9.5, 6, 0), Material = Enum.Material.Wood, Color = logColor }, cabin)
	part({ Name = "FrontL", Size = Vector3.new(7, 10, 1), CFrame = origin * CFrame.new(-6, 6, -7.5), Material = Enum.Material.Wood, Color = logColor }, cabin)
	part({ Name = "FrontR", Size = Vector3.new(7, 10, 1), CFrame = origin * CFrame.new(6, 6, -7.5), Material = Enum.Material.Wood, Color = logColor }, cabin)
	part({ Name = "Lintel", Size = Vector3.new(6, 3, 1), CFrame = origin * CFrame.new(0, 9.5, -7.5), Material = Enum.Material.Wood, Color = logColor }, cabin)
	local roofColor = Color3.fromRGB(92, 60, 50)
	for _, side in { -1, 1 } do
		part({
			Name = "Roof",
			Size = Vector3.new(23, 1, 11.5),
			CFrame = origin * CFrame.new(0, 13.2, side * 4.6) * CFrame.Angles(math.rad(side * 32), 0, 0),
			Material = Enum.Material.Slate,
			Color = roofColor,
		}, cabin)
	end
	-- warm window glow for the cozy-lake mood
	local window = part({ Name = "Window", Size = Vector3.new(4, 3, 0.2), CFrame = origin * CFrame.new(-6, 6.5, -8.05), Material = Enum.Material.Neon, Color = Color3.fromRGB(255, 196, 120) }, cabin)
	local light = Instance.new("PointLight")
	light.Color = window.Color
	light.Range = 14
	light.Brightness = 1.2
	light.Parent = window
	cabin.Parent = parent
end

local function sign(parent: Instance, name: string, text: string, pos: Vector3, promptName: string, actionText: string)
	local stand = Instance.new("Model")
	stand.Name = name
	-- face the dock walkway (z = 0); board sits behind the counter
	local facing = Vector3.new(0, 0, if pos.Z > 0 then -1 else 1)
	local back = -facing * 1.2
	part({ Name = "Counter", Size = Vector3.new(6, 3, 3), Position = pos + Vector3.new(0, 1.5, 0), Material = Enum.Material.WoodPlanks, Color = WOOD }, stand)
	local board = part({ Name = "Board", Size = Vector3.new(6, 2.4, 0.4), Position = pos + back + Vector3.new(0, 6, 0), Material = Enum.Material.Wood, Color = DARK_WOOD }, stand)
	for _, x in { -2.6, 2.6 } do
		part({ Name = "Pole", Size = Vector3.new(0.4, 6, 0.4), Position = pos + back + Vector3.new(x, 3, 0), Material = Enum.Material.Wood, Color = DARK_WOOD }, stand)
	end
	local gui = Instance.new("SurfaceGui")
	gui.Face = Enum.NormalId.Front
	gui.PixelsPerStud = 40
	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.Text = text
	label.TextScaled = true
	label.Font = Enum.Font.GothamBold
	label.TextColor3 = Color3.fromRGB(245, 230, 200)
	label.Parent = gui
	gui.Parent = board
	board.CFrame = CFrame.lookAt(board.Position, board.Position + facing)
	local counter = stand:FindFirstChild("Counter") :: Part
	local prompt = Instance.new("ProximityPrompt")
	prompt.Name = promptName
	prompt.ActionText = actionText
	prompt.ObjectText = text
	prompt.MaxActivationDistance = 10
	prompt.RequiresLineOfSight = false
	prompt.Parent = counter
	stand.Parent = parent
	return prompt
end

local function buildTrees(parent: Instance)
	local rng = Random.new(7)
	local folder = Instance.new("Folder")
	folder.Name = "Trees"
	for _ = 1, 70 do
		local angle = rng:NextNumber(0, math.pi * 2)
		local r = rng:NextNumber(World.LakeRadius + 25, 330)
		local pos = Vector3.new(math.cos(angle) * r, 0, math.sin(angle) * r)
		if (pos - Vector3.new(190, 0, 0)).Magnitude > 45 then -- keep the dock/cabin clearing open
			local m = asset("Tree")
			if m then
				m:PivotTo(CFrame.new(pos) * CFrame.Angles(0, rng:NextNumber(0, 6.28), 0))
				m.Parent = folder
			else
				local h = rng:NextNumber(14, 26)
				part({ Name = "Trunk", Size = Vector3.new(h * 0.3, 1.6, 1.6), Shape = Enum.PartType.Cylinder, CFrame = CFrame.new(pos + Vector3.new(0, h * 0.15, 0)) * CFrame.Angles(0, 0, math.rad(90)), Material = Enum.Material.Wood, Color = DARK_WOOD }, folder)
				for i = 0, 2 do
					local s = (3 - i) * h * 0.14
					part({ Name = "Leaves", Shape = Enum.PartType.Ball, Size = Vector3.new(s, s, s), Position = pos + Vector3.new(0, h * 0.35 + i * s * 0.5, 0), Material = Enum.Material.Grass, Color = Color3.fromRGB(58 + i * 12, 110 + i * 10, 62) }, folder)
				end
			end
		end
	end
	folder.Parent = parent
end

local function setLighting()
	-- Lake mood: cozy, golden morning (design log, Art direction)
	Lighting.ClockTime = 7.3
	Lighting.Brightness = 2
	Lighting.OutdoorAmbient = Color3.fromRGB(150, 140, 120)
	Lighting.Ambient = Color3.fromRGB(90, 80, 70)
	local atmo = Lighting:FindFirstChildOfClass("Atmosphere") or Instance.new("Atmosphere")
	atmo.Density = 0.32
	atmo.Offset = 0.2
	atmo.Color = Color3.fromRGB(235, 205, 160)
	atmo.Decay = Color3.fromRGB(120, 110, 100)
	atmo.Glare = 0.4
	atmo.Haze = 1.6
	atmo.Parent = Lighting
end

function World.build(): { shop: ProximityPrompt, sell: ProximityPrompt }
	local old = Workspace:FindFirstChild("Lake")
	if old then
		old:Destroy()
	end
	local root = Instance.new("Folder")
	root.Name = "Lake"
	root.Parent = Workspace

	buildTerrain()
	buildDock(root)
	buildCabin(root)
	buildTrees(root)
	setLighting()

	local spawn = Instance.new("SpawnLocation")
	spawn.Anchored = true
	spawn.Neutral = true
	spawn.Size = Vector3.new(8, 1, 8)
	spawn.Position = Vector3.new(188, 0.5, 0)
	spawn.Transparency = 1
	spawn.CanCollide = false
	spawn.Duration = 0
	local decal = spawn:FindFirstChildOfClass("Decal")
	if decal then
		decal:Destroy()
	end
	spawn.Parent = root

	local shop = sign(root, "TackleShop", "Tackle Shop", Vector3.new(178, 0, -14), "ShopPrompt", "Browse")
	local sell = sign(root, "FishBuyer", "Fish Buyer", Vector3.new(178, 0, 14), "SellPrompt", "Sell catch")
	return { shop = shop, sell = sell }
end

-- Water depth below a point on the surface, or nil if the point isn't over water.
function World.depthAt(pos: Vector3): number?
	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Include
	params.FilterDescendantsInstances = { Workspace.Terrain }
	params.IgnoreWater = false
	local top = Vector3.new(pos.X, World.WaterY + 20, pos.Z)
	local hit = Workspace:Raycast(top, Vector3.new(0, -40, 0), params)
	if not hit or hit.Material ~= Enum.Material.Water then
		return nil
	end
	params.IgnoreWater = true
	local bottom = Workspace:Raycast(hit.Position, Vector3.new(0, -60, 0), params)
	if not bottom then
		return World.MaxDepth
	end
	return hit.Position.Y - bottom.Position.Y
end

return World
