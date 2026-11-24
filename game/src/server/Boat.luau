--!strict
-- Rowboat: one per player, moored along the dock.
-- Silent, needs no fuel (design log, Boats). Floats on terrain water by low density;
-- the driver's client steers it through LinearVelocity/AngularVelocity (it owns the physics).

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local World = require(script.Parent.World)
local Assets = require(ReplicatedStorage:WaitForChild("Shared").Assets)

local Boat = {}

local boats: { [Player]: Model } = {}
local folder: Folder

local HULL_COLOR = Color3.fromRGB(176, 120, 74)
local TRIM_COLOR = Color3.fromRGB(70, 104, 120)

local function weld(a: BasePart, b: BasePart)
	local w = Instance.new("WeldConstraint")
	w.Part0 = a
	w.Part1 = b
	w.Parent = a
end

local function fallbackModel(): Model
	local m = Instance.new("Model")
	local function p(name: string, size: Vector3, offset: CFrame, color: Color3): Part
		local part = Instance.new("Part")
		part.Name = name
		part.Size = size
		part.CFrame = offset
		part.Color = color
		part.Material = Enum.Material.Wood
		part.TopSurface = Enum.SurfaceType.Smooth
		part.BottomSurface = Enum.SurfaceType.Smooth
		part.Parent = m
		return part
	end
	local hull = p("Hull", Vector3.new(5, 1, 11), CFrame.new(), HULL_COLOR)
	p("SideL", Vector3.new(0.4, 1.4, 11), CFrame.new(-2.5, 0.9, 0), HULL_COLOR)
	p("SideR", Vector3.new(0.4, 1.4, 11), CFrame.new(2.5, 0.9, 0), HULL_COLOR)
	p("Bow", Vector3.new(5, 1.4, 0.4), CFrame.new(0, 0.9, -5.5), TRIM_COLOR)
	p("Stern", Vector3.new(5, 1.4, 0.4), CFrame.new(0, 0.9, 5.5), TRIM_COLOR)
	p("Bench", Vector3.new(4.6, 0.3, 1.4), CFrame.new(0, 1.2, -2.5), HULL_COLOR)
	for _, side in { -1, 1 } do
		local oar = p("Oar", Vector3.new(0.25, 0.25, 7), CFrame.new(side * 3.2, 1.4, 1) * CFrame.Angles(0, math.rad(side * 15), 0), Color3.fromRGB(200, 170, 120))
		oar.CanCollide = false
	end
	m.PrimaryPart = hull
	return m
end

local function build(owner: Player, slot: number): Model
	local imported = Assets.get("Rowboat", nil, false)
	local m: Model = imported or fallbackModel()
	m.Name = owner.Name .. "_Rowboat"
	local hull: BasePart
	if imported then
		-- Imported meshes are visual only (hollow hulls make poor physics shapes).
		-- An invisible float box carries buoyancy, collisions and the drive constraints.
		m:PivotTo(CFrame.new())
		local box, size = m:GetBoundingBox()
		local float = Instance.new("Part")
		float.Name = "Float"
		float.Size = Vector3.new(size.X * 0.85, 1, size.Z * 0.85)
		float.CFrame = CFrame.new(box.Position.X, box.Position.Y - size.Y / 2 + 0.5, box.Position.Z)
		float.Transparency = 1
		float.Parent = m
		for _, d in m:GetDescendants() do
			if d:IsA("BasePart") and d ~= float then
				d.Massless = true
				d.CanCollide = false
			end
		end
		hull = float
	else
		hull = m:FindFirstChild("Hull") :: BasePart
	end
	m.PrimaryPart = hull

	for _, d in m:GetDescendants() do
		if d:IsA("BasePart") then
			d.Anchored = false
			-- light wood so the boat rides high on terrain water
			d.CustomPhysicalProperties = PhysicalProperties.new(0.2, 0.3, 0.2)
			if d ~= hull then
				weld(hull, d)
			end
		end
	end

	local seat = m:FindFirstChildWhichIsA("VehicleSeat", true)
	if not seat then
		local s = Instance.new("VehicleSeat")
		s.Name = "Seat"
		s.Size = Vector3.new(2, 0.4, 2)
		s.CFrame = hull.CFrame * CFrame.new(0, 1.1, 1.5)
		s.Transparency = 1
		s.CustomPhysicalProperties = PhysicalProperties.new(0.2, 0.3, 0.2)
		s.Parent = m
		weld(hull, s)
		seat = s
	end
	local vseat = seat :: VehicleSeat
	vseat.HeadsUpDisplay = false
	vseat.MaxSpeed = 0 -- we drive with constraints, not the legacy seat motor
	vseat:SetAttribute("Rowboat", true)

	local att = Instance.new("Attachment")
	att.Name = "Drive"
	att.Parent = hull
	local lv = Instance.new("LinearVelocity")
	lv.Name = "Drive"
	lv.Attachment0 = att
	lv.VelocityConstraintMode = Enum.VelocityConstraintMode.Plane
	lv.RelativeTo = Enum.ActuatorRelativeTo.World
	lv.PrimaryTangentAxis = Vector3.xAxis
	lv.SecondaryTangentAxis = Vector3.zAxis
	lv.PlaneVelocity = Vector2.zero
	lv.MaxForce = 6000
	lv.Parent = hull
	local av = Instance.new("AngularVelocity")
	av.Name = "Turn"
	av.Attachment0 = att
	av.RelativeTo = Enum.ActuatorRelativeTo.World
	av.AngularVelocity = Vector3.zero
	av.MaxTorque = 20000
	av.Parent = hull

	-- moor along the south side of the dock, one slot per player
	local x = World.DockEnd.X + 6 + (slot % 2) * 13
	local z = 9 + math.floor(slot / 2) * 7
	m:PivotTo(CFrame.new(x, World.WaterY + 0.6, z) * CFrame.Angles(0, math.rad(90), 0))
	m:SetAttribute("Owner", owner.UserId)
	m:SetAttribute("HomeCFrame", m:GetPivot())
	m.Parent = folder

	vseat:GetPropertyChangedSignal("Occupant"):Connect(function()
		local hum = vseat.Occupant
		if hum then
			local rider = Players:GetPlayerFromCharacter(hum.Parent)
			if rider ~= owner then
				hum.Sit = false
				hum.Jump = true
				return
			end
			hull:SetNetworkOwner(owner)
		else
			lv.PlaneVelocity = Vector2.zero
			av.AngularVelocity = Vector3.zero
			if hull:IsDescendantOf(Workspace) then
				hull:SetNetworkOwner(nil)
			end
		end
	end)
	return m
end

local function freeSlot(): number
	local used = {}
	for _, m in boats do
		used[m:GetAttribute("Slot") :: number] = true
	end
	local i = 0
	while used[i] do
		i += 1
	end
	return i
end

function Boat.start()
	folder = Instance.new("Folder")
	folder.Name = "Boats"
	folder.Parent = Workspace

	local function add(player: Player)
		local slot = freeSlot()
		local m = build(player, slot)
		m:SetAttribute("Slot", slot)
		boats[player] = m
	end
	Players.PlayerAdded:Connect(add)
	for _, p in Players:GetPlayers() do
		add(p)
	end
	Players.PlayerRemoving:Connect(function(p)
		local m = boats[p]
		if m then
			m:Destroy()
			boats[p] = nil
		end
	end)

	-- Recover flipped, sunk, or stranded empty boats
	task.spawn(function()
		while true do
			task.wait(5)
			for _, m in boats do
				local hull = m.PrimaryPart
				local seat = m:FindFirstChildWhichIsA("VehicleSeat", true) :: VehicleSeat?
				if hull and seat and not seat.Occupant then
					local bad = hull.CFrame.UpVector.Y < 0.3 or hull.Position.Y < World.WaterY - 6
					if bad then
						m:PivotTo(m:GetAttribute("HomeCFrame") :: CFrame)
						hull.AssemblyLinearVelocity = Vector3.zero
						hull.AssemblyAngularVelocity = Vector3.zero
					end
				end
			end
		end
	end)
end

return Boat
