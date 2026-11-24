--!strict
-- Server entry point.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local GameInfo = require(ReplicatedStorage.Shared.GameInfo)
local World = require(script.Parent.World)
local Boat = require(script.Parent.Boat)
local Fishing = require(script.Parent.Fishing)

local prompts = World.build()
Boat.start()
Fishing.start(prompts)

print(`[Server] {GameInfo.Name} - milestone {GameInfo.Milestone} ready`)
