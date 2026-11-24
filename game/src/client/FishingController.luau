--!strict
-- Client side of the catch loop.
--   Hold the action (mouse / R2 / touch button) to charge, release to cast where the camera faces.
--   Watch the bobber: nibbles are small dips, the take pulls it under. Press during the take to hook.
--   Fight: hold the action to reel, steer with A/D, arrows, left stick or the on-screen buttons.
-- Controls work the same on PC, gamepad and phone (basic phone controls for Milestone 1).

local ContextActionService = game:GetService("ContextActionService")
local HapticService = game:GetService("HapticService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")
local Workspace = game:GetService("Workspace")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Gear = require(Shared.Config.Gear)
local Fight = require(Shared.Fishing.Fight)
local Rng = require(Shared.Util.Rng)
local Net = require(Shared.Net)
local UI = require(script.Parent.UI)

local FishingController = {}

local player = Players.LocalPlayer
local WATER_Y = 0
local CHARGE_TIME = 1.1

type Stage = "idle" | "charging" | "flying" | "waiting" | "hooking" | "fighting" | "deciding"
local stage: Stage = "idle"
local rodId = Gear.StartRod
local equipped = false
local power = 0
local reelHeld = false
local steerStick = 0
local steerTouch = 0
local fight: Fight.State? = nil
local castTarget = Vector3.zero
local bobber: Part? = nil
local lineBeam: Beam? = nil
local waitToken = 0
local debugOn = false
local bindSteer: (on: boolean) -> () -- defined below, next to the steer handler

-- Placeholder sounds from Roblox's built-in content (swap for real ones in the sound pass)
local function playSound(volume: number, speed: number)
	local s = Instance.new("Sound")
	s.SoundId = "rbxasset://sounds/impact_water.mp3"
	s.Volume = volume
	s.PlaybackSpeed = speed
	s.Parent = bobber or Workspace
	s:Play()
	s.Ended:Once(function()
		s:Destroy()
	end)
end

local function rumble(strength: number, seconds: number)
	local pad = Enum.UserInputType.Gamepad1
	if HapticService:IsVibrationSupported(pad) and HapticService:IsMotorSupported(pad, Enum.VibrationMotor.Small) then
		HapticService:SetMotor(pad, Enum.VibrationMotor.Small, strength)
		task.delay(seconds, function()
			HapticService:SetMotor(pad, Enum.VibrationMotor.Small, 0)
		end)
	end
end

local function root(): BasePart?
	local c = player.Character
	return c and c:FindFirstChild("HumanoidRootPart") :: BasePart?
end

local function rodTip(): Attachment?
	local c = player.Character
	local tool = c and c:FindFirstChild("Rod")
	local handle = tool and tool:FindFirstChild("Handle")
	return handle and handle:FindFirstChild("Tip") :: Attachment?
end

local function clearBobber()
	if bobber then
		bobber:Destroy()
		bobber = nil
	end
	lineBeam = nil
end

local function makeBobber(at: Vector3)
	clearBobber()
	local b = Instance.new("Part")
	b.Name = "Bobber"
	b.Shape = Enum.PartType.Ball
	b.Size = Vector3.new(0.7, 0.7, 0.7)
	b.Color = Color3.fromRGB(220, 60, 50)
	b.Material = Enum.Material.SmoothPlastic
	b.Anchored = true
	b.CanCollide = false
	b.CanQuery = false
	b.Position = at
	b.Parent = Workspace
	local a1 = Instance.new("Attachment")
	a1.Parent = b
	local tip = rodTip()
	if tip then
		local beam = Instance.new("Beam")
		beam.Attachment0 = tip
		beam.Attachment1 = a1
		beam.Width0 = 0.04
		beam.Width1 = 0.04
		beam.Color = ColorSequence.new(Color3.fromRGB(235, 235, 225))
		beam.FaceCamera = true
		beam.CurveSize0 = 0
		beam.Parent = b
		lineBeam = beam
	end
	bobber = b
end

local function setFightLock(on: boolean)
	player:SetAttribute("InFight", on)
	bindSteer(on)
	local c = player.Character
	local hum = c and c:FindFirstChildOfClass("Humanoid")
	if not hum then
		return
	end
	if on then
		hum:SetAttribute("SavedWalk", hum.WalkSpeed)
		hum:SetAttribute("SavedJump", hum.JumpHeight)
		hum.WalkSpeed = 0
		hum.JumpHeight = 0
	else
		hum.WalkSpeed = (hum:GetAttribute("SavedWalk") :: number?) or 16
		hum.JumpHeight = (hum:GetAttribute("SavedJump") :: number?) or 7.2
	end
end

local function reset()
	stage = "idle"
	fight = nil
	reelHeld = false
	waitToken += 1
	clearBobber()
	UI.showPower(nil)
	UI.showFight(nil)
	setFightLock(false)
end

local function finishFight(outcome: string)
	stage = "deciding"
	UI.showFight(nil)
	setFightLock(false)
	clearBobber()
	local res = Net.fn("FightResult"):InvokeServer(outcome)
	if res.result == "landed" then
		local info = res.fish
		playSound(1, 0.8)
		UI.showCatch(info, function(keep: boolean)
			local r = Net.fn("Decide"):InvokeServer(keep)
			if r.ok then
				UI.showCatch(nil)
				UI.toast(if keep then `Kept the {info.name}` else `Released the {info.name}`)
				stage = "idle"
			else
				UI.toast(r.reason, UI.Colors.bad)
			end
		end)
	else
		local what = if res.result == "snapped" then "The line snapped!" else "It threw the hook!"
		UI.toast(`{what}  {res.spotted or ""}`, UI.Colors.bad)
		stage = "idle"
	end
end

local function startFight(params: any, seed: number)
	fight = Fight.new(params, Rng.new(seed))
	stage = "fighting"
	reelHeld = false
	setFightLock(true)
	rumble(0.8, 0.4)
	UI.toast("Fish on!", UI.Colors.good)
end

local function tryHook()
	if stage ~= "waiting" then
		return
	end
	stage = "hooking"
	waitToken += 1
	local res = Net.fn("Hook"):InvokeServer()
	if res.result == "hooked" then
		startFight(res.params, res.seed)
	else
		clearBobber()
		stage = "idle"
		if res.result == "spooked" then
			UI.toast("Too early — the fish spooked", UI.Colors.bad)
		elseif res.result == "stolen" then
			UI.toast("Too late — your bait was stolen", UI.Colors.bad)
		end
	end
end

-- Plays the nibble/take schedule on the bobber. Reading it is the skill; no on-screen cue.
local function playBites(res: any, token: number)
	local start = os.clock()
	local function waitUntil(t: number): boolean
		while os.clock() - start < t do
			task.wait()
			if token ~= waitToken then
				return false
			end
		end
		return true
	end
	local function dip(depth: number, seconds: number)
		local b = bobber
		if not b then
			return
		end
		local base = Vector3.new(castTarget.X, WATER_Y + 0.1, castTarget.Z)
		local down = TweenService:Create(b, TweenInfo.new(0.08), { Position = base - Vector3.new(0, depth, 0) })
		down:Play()
		task.delay(seconds, function()
			if bobber == b and token == waitToken then
				TweenService:Create(b, TweenInfo.new(0.15), { Position = base }):Play()
			end
		end)
	end
	for _, t in res.nibbles do
		if not waitUntil(t) then
			return
		end
		dip(0.25, 0.2)
		playSound(0.25, 1.6)
		rumble(0.25, 0.12)
	end
	if not waitUntil(res.takeAt) then
		return
	end
	dip(1.1, res.window)
	playSound(0.9, 1)
	rumble(0.9, res.window)
	if not waitUntil(res.takeAt + res.window + 0.35) then
		return
	end
	tryHook() -- missed it; the server will call it stolen
end

local function cast(p: number)
	local r = root()
	if not r or p < 0.08 then
		stage = "idle"
		return
	end
	local rod = Gear.Rods[rodId]
	local look = Workspace.CurrentCamera.CFrame.LookVector
	local dir = Vector3.new(look.X, 0, look.Z)
	if dir.Magnitude < 0.01 then
		dir = r.CFrame.LookVector
	end
	dir = dir.Unit
	local target = r.Position + dir * (p * rod.maxCast)
	target = Vector3.new(target.X, WATER_Y, target.Z)
	stage = "flying"
	local res = Net.fn("Cast"):InvokeServer(target)
	if not res.ok then
		UI.toast(res.reason, UI.Colors.bad)
		stage = "idle"
		return
	end
	castTarget = target
	-- bobber flies from the rod tip in an arc
	local tip = rodTip()
	local from = if tip then tip.WorldPosition else r.Position + Vector3.new(0, 3, 0)
	makeBobber(from)
	local t0 = os.clock()
	while os.clock() - t0 < res.flight do
		local a = (os.clock() - t0) / res.flight
		local pos = from:Lerp(target, a) + Vector3.new(0, math.sin(a * math.pi) * (4 + p * 10), 0)
		if bobber then
			bobber.Position = pos
		end
		RunService.RenderStepped:Wait()
	end
	if bobber then
		bobber.Position = target + Vector3.new(0, 0.1, 0)
	end
	playSound(0.4, 1.3)
	stage = "waiting"
	waitToken += 1
	task.spawn(playBites, res, waitToken)
end

local function onAction(_name: string, state: Enum.UserInputState, _input: InputObject): Enum.ContextActionResult
	if UI.shopOpen() then
		return Enum.ContextActionResult.Pass
	end
	if state == Enum.UserInputState.Begin then
		if stage == "idle" and equipped then
			stage = "charging"
			power = 0
		elseif stage == "waiting" then
			task.spawn(tryHook)
		elseif stage == "fighting" then
			reelHeld = true
		end
	elseif state == Enum.UserInputState.End or state == Enum.UserInputState.Cancel then
		if stage == "charging" then
			UI.showPower(nil)
			task.spawn(cast, power)
		elseif stage == "fighting" then
			reelHeld = false
		end
	end
	return Enum.ContextActionResult.Sink
end

local function onSteer(name: string, state: Enum.UserInputState, _input: InputObject): Enum.ContextActionResult
	if stage ~= "fighting" then
		return Enum.ContextActionResult.Pass
	end
	local held = state == Enum.UserInputState.Begin
	local dir = if name == "SteerLeft" then -1 else 1
	if held then
		steerTouch = dir
	elseif steerTouch == dir then
		steerTouch = 0
	end
	return Enum.ContextActionResult.Sink
end

-- Steering buttons only exist during a fight (touch buttons + A/D/arrows)
bindSteer = function(on: boolean)
	steerTouch = 0
	if on then
		ContextActionService:BindAction("SteerLeft", onSteer, true, Enum.KeyCode.A, Enum.KeyCode.Left)
		ContextActionService:BindAction("SteerRight", onSteer, true, Enum.KeyCode.D, Enum.KeyCode.Right)
		ContextActionService:SetTitle("SteerLeft", "◀")
		ContextActionService:SetTitle("SteerRight", "▶")
		ContextActionService:SetPosition("SteerLeft", UDim2.new(1, -270, 1, -90))
		ContextActionService:SetPosition("SteerRight", UDim2.new(1, -205, 1, -90))
	else
		ContextActionService:UnbindAction("SteerLeft")
		ContextActionService:UnbindAction("SteerRight")
	end
end

local function bindActions()
	ContextActionService:BindAction("Fish", onAction, true, Enum.UserInputType.MouseButton1, Enum.KeyCode.ButtonR2)
	ContextActionService:SetTitle("Fish", "Cast / Reel")
	ContextActionService:SetPosition("Fish", UDim2.new(1, -150, 1, -150))
end

local function unbindActions()
	if stage == "fighting" then
		return -- keep controls during a fight even if the rod is put away
	end
	ContextActionService:UnbindAction("Fish")
end

local function watchTool(tool: Instance)
	if not tool:IsA("Tool") or tool.Name ~= "Rod" then
		return
	end
	tool.Equipped:Connect(function()
		equipped = true
		bindActions()
	end)
	tool.Unequipped:Connect(function()
		equipped = false
		if stage == "charging" or stage == "waiting" then
			reset()
		end
		unbindActions()
	end)
end

function FishingController.setRod(id: string)
	rodId = id
end

function FishingController.start()
	local function hookCharacter(char: Model)
		reset()
		char.ChildAdded:Connect(watchTool)
		local backpack = player:WaitForChild("Backpack")
		for _, t in backpack:GetChildren() do
			watchTool(t)
		end
	end
	player:WaitForChild("Backpack").ChildAdded:Connect(watchTool)
	player.CharacterAdded:Connect(hookCharacter)
	if player.Character then
		hookCharacter(player.Character)
	end


	UserInputService.InputChanged:Connect(function(input)
		if input.KeyCode == Enum.KeyCode.Thumbstick1 then
			steerStick = if math.abs(input.Position.X) > 0.2 then input.Position.X else 0
		end
	end)
	UserInputService.InputBegan:Connect(function(input, processed)
		if not processed and input.KeyCode == Enum.KeyCode.F3 then
			debugOn = not debugOn
			if not debugOn then
				UI.setDebug(nil)
			end
		end
	end)

	RunService.RenderStepped:Connect(function(dt: number)
		if stage == "charging" then
			power = math.min(1, power + dt / CHARGE_TIME)
			UI.showPower(power)
		elseif stage == "fighting" and fight then
			local f = fight
			local steer = math.clamp(steerTouch + steerStick, -1, 1)
			local outcome = Fight.step(f, math.min(dt, 0.1), { reel = reelHeld, steer = steer })
			UI.showFight(f)
			-- bobber follows the fish: closer as line comes in, sideways with its runs
			local r = root()
			if bobber and r then
				local home = Vector3.new(r.Position.X, WATER_Y, r.Position.Z)
				local out = castTarget - home
				local side = Vector3.new(-out.Z, 0, out.X).Unit
				bobber.Position = home + out * math.max(f.line, 0.05) + side * f.fishDir * 4 + Vector3.new(0, -0.2, 0)
			end
			if lineBeam then
				lineBeam.Color = ColorSequence.new(if f.tension > f.zoneHigh then Color3.fromRGB(240, 120, 100) else Color3.fromRGB(235, 235, 225))
			end
			if f.tension > f.zoneHigh then
				rumble(0.3, 0.05)
			end
			if debugOn then
				UI.setDebug(string.format("style %s\nphase %s\ntension %.2f [%.2f-%.2f]\nline %.2f stamina %.2f\nstrain %.2f slack %.2f\nfishDir %.2f  t %.1fs", f.params.style, f.phase, f.tension, f.zoneLow, f.zoneHigh, f.line, f.stamina, f.strain, f.slack, f.fishDir, f.t))
			end
			if outcome then
				fight = nil
				task.spawn(function()
					finishFight(outcome)
				end)
				if not equipped then
					ContextActionService:UnbindAction("Fish")
				end
			end
		end
	end)
end

return FishingController
