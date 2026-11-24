--!strict
-- Drives your rowboat while you sit in it. The VehicleSeat gives throttle/steer from
-- WASD, the left stick, or the phone thumbstick; we turn that into gentle rowing.
-- Easy controls, slow and silent (design log, Boats).

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local BoatController = {}

local SPEED = 14 -- studs/s, rowboat is the slowest boat
local TURN = 1.1 -- rad/s
local ACCEL = 2.5

function BoatController.start()
	local player = Players.LocalPlayer
	local speed = 0

	RunService.Heartbeat:Connect(function(dt: number)
		local char = player.Character
		local hum = char and char:FindFirstChildOfClass("Humanoid")
		local seat = hum and hum.SeatPart
		if not seat or not seat:IsA("VehicleSeat") or not seat:GetAttribute("Rowboat") then
			speed = 0
			return
		end
		local model = seat:FindFirstAncestorOfClass("Model")
		local hull = model and model.PrimaryPart
		if not hull then
			return
		end
		local lv = hull:FindFirstChild("Drive") :: LinearVelocity?
		local av = hull:FindFirstChild("Turn") :: AngularVelocity?
		if not lv or not av then
			return
		end
		local fishing = player:GetAttribute("InFight") == true
		local throttle = if fishing then 0 else seat.ThrottleFloat
		local steer = if fishing then 0 else seat.SteerFloat
		speed += (throttle * SPEED - speed) * math.min(1, dt * ACCEL)
		local fwd = hull.CFrame.LookVector
		local v = Vector3.new(fwd.X, 0, fwd.Z).Unit * speed
		lv.PlaneVelocity = Vector2.new(v.X, v.Z)
		av.AngularVelocity = Vector3.new(0, -steer * TURN, 0)
	end)
end

return BoatController
