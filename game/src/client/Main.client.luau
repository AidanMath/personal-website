--!strict
-- Client entry point.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local GameInfo = require(ReplicatedStorage.Shared.GameInfo)

print(`[Client] {GameInfo.Name} - milestone {GameInfo.Milestone} - Rojo sync OK`)
