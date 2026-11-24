--!strict
-- Remote functions/events shared by server and client.
-- The server creates them; clients wait for them.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Net = {}

local FUNCTIONS = { "Cast", "Hook", "FightResult", "Decide", "Buy" }
local EVENTS = { "State", "Notify" }

local folder: Folder
if RunService:IsServer() then
	local f = Instance.new("Folder")
	f.Name = "Net"
	for _, name in FUNCTIONS do
		local r = Instance.new("RemoteFunction")
		r.Name = name
		r.Parent = f
	end
	for _, name in EVENTS do
		local r = Instance.new("RemoteEvent")
		r.Name = name
		r.Parent = f
	end
	f.Parent = ReplicatedStorage
	folder = f
else
	folder = ReplicatedStorage:WaitForChild("Net") :: Folder
end

function Net.fn(name: string): RemoteFunction
	return folder:WaitForChild(name) :: RemoteFunction
end

function Net.event(name: string): RemoteEvent
	return folder:WaitForChild(name) :: RemoteEvent
end

return Net
