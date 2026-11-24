--!strict
-- Imported models live in ReplicatedStorage.Assets (fish in Assets.Fish), imported from
-- game/assets/*.fbx in Studio. Rojo doesn't manage that folder, so it survives syncs.
-- Parts are named by role (Hull, Trim, Log, Back, Fin...) and painted from Config.Palette.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Palette = require(script.Parent.Config.Palette)

local Assets = {}

local function roleOf(name: string): string
	local base = string.gsub(name, "%.%d+$", "")
	base = string.gsub(base, "_%d+$", "")
	return base
end

function Assets.paint(model: Instance, key: string)
	local roles = Palette[key]
	if not roles then
		return
	end
	for _, d in model:GetDescendants() do
		if d:IsA("BasePart") then
			local entry = roles[roleOf(d.Name)]
			if entry then
				d.Color = entry.color
				d.Material = entry.material
			end
		end
	end
end

-- Returns a painted clone of an imported model, or nil if it hasn't been imported yet.
function Assets.get(name: string, subfolder: string?, anchored: boolean?): Model?
	local root: Instance? = ReplicatedStorage:FindFirstChild("Assets")
	if root and subfolder then
		root = root:FindFirstChild(subfolder)
	end
	local found = root and root:FindFirstChild(name)
	if not found or not found:IsA("Model") then
		return nil
	end
	local m = found:Clone()
	Assets.paint(m, name)
	if anchored ~= nil then
		for _, d in m:GetDescendants() do
			if d:IsA("BasePart") then
				d.Anchored = anchored
			end
		end
	end
	return m
end

function Assets.has(name: string, subfolder: string?): boolean
	local root: Instance? = ReplicatedStorage:FindFirstChild("Assets")
	if root and subfolder then
		root = root:FindFirstChild(subfolder)
	end
	local found = root and root:FindFirstChild(name)
	return found ~= nil and found:IsA("Model")
end

-- Pivot the model to cf, then shift it vertically so its bounding-box bottom sits at y.
function Assets.placeBottom(model: Model, cf: CFrame, y: number)
	model:PivotTo(cf)
	local box, size = model:GetBoundingBox()
	model:PivotTo(model:GetPivot() + Vector3.new(0, y - (box.Position.Y - size.Y / 2), 0))
end

-- Same, but puts the bounding-box top at y (dock deck height).
function Assets.placeTop(model: Model, cf: CFrame, y: number)
	model:PivotTo(cf)
	local box, size = model:GetBoundingBox()
	model:PivotTo(model:GetPivot() + Vector3.new(0, y - (box.Position.Y + size.Y / 2), 0))
end

return Assets
