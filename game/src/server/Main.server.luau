--!strict
-- Server entry point.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local GameInfo = require(ReplicatedStorage.Shared.GameInfo)

print(`[Server] {GameInfo.Name} - milestone {GameInfo.Milestone} - Rojo sync OK`)
