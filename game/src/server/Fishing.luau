--!strict
-- Server side of the catch loop: cast -> nibbles/take -> fight -> land -> keep/release -> sell.
-- The server picks the fish, judges hook timing, and owns money and the cooler.
-- The client runs the fight simulation (same seed) and reports the outcome; the server
-- sanity-checks it. Good enough for a friends-only test; tighten before launch.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local StarterPack = game:GetService("StarterPack")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local FishList = require(Shared.Config.Fish)
local Gear = require(Shared.Config.Gear)
local Bite = require(Shared.Fishing.Bite)
local Catch = require(Shared.Fishing.Catch)
local Rng = require(Shared.Util.Rng)
local Net = require(Shared.Net)
local World = require(script.Parent.World)

local Fishing = {}

local FLIGHT_TIME = 0.6 -- seconds the bobber is in the air
local HOOK_TOLERANCE = 0.2
local MIN_FIGHT_SECONDS = 5

type FishDef = Catch.FishDef
type Session = {
	stage: string, -- "waiting" | "fighting" | "landed"
	landsAt: number,
	schedule: Bite.Schedule,
	fish: FishDef,
	weight: number,
	weightNorm: number,
	distance: number,
	seed: number,
	fightStart: number,
}
type CoolerFish = { id: string, name: string, weight: number, value: number }
type PlayerData = {
	money: number,
	rod: string,
	line: string,
	owned: { [string]: boolean },
	cooler: { CoolerFish },
	caught: { [string]: boolean },
	spotted: { { size: string, style: string } },
	session: Session?,
	lastCast: number,
}

local data: { [Player]: PlayerData } = {}
local master = Rng.new(os.time())

local STYLE_HINT = {
	runner = "fast runner",
	diver = "deep diver",
	jumper = "jumper",
	heavyweight = "heavy fish",
}

local function coolerWeight(d: PlayerData): number
	local w = 0
	for _, f in d.cooler do
		w += f.weight
	end
	return w
end

local function pushState(player: Player)
	local d = data[player]
	if not d then
		return
	end
	local caughtCount = 0
	for _ in d.caught do
		caughtCount += 1
	end
	Net.event("State"):FireClient(player, {
		money = d.money,
		rod = d.rod,
		line = d.line,
		owned = d.owned,
		coolerWeight = math.floor(coolerWeight(d) * 10 + 0.5) / 10,
		coolerCap = Gear.RowboatCargo,
		coolerCount = #d.cooler,
		speciesFound = caughtCount,
		speciesTotal = #FishList,
	})
end

local function notify(player: Player, text: string)
	Net.event("Notify"):FireClient(player, text)
end

local function rootOf(player: Player): BasePart?
	local char = player.Character
	return char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
end

local function onCast(player: Player, target: any): any
	local d = data[player]
	local root = rootOf(player)
	if not d or not root or typeof(target) ~= "Vector3" then
		return { ok = false, reason = "Not ready" }
	end
	if d.session and d.session.stage ~= "waiting" then
		return { ok = false, reason = "Finish your current catch first" }
	end
	local now = os.clock()
	if now - d.lastCast < 0.8 then
		return { ok = false, reason = "Too fast" }
	end
	d.lastCast = now

	local rod = Gear.Rods[d.rod]
	local flat = Vector3.new(target.X - root.Position.X, 0, target.Z - root.Position.Z)
	if flat.Magnitude > rod.maxCast + 5 then
		return { ok = false, reason = "Too far for this rod" }
	end
	local depth = World.depthAt(target)
	if not depth then
		d.session = nil
		return { ok = false, reason = "Cast into the water" }
	end

	local seed = math.floor(master() * 1e9)
	local rng = Rng.new(seed)
	local depthFraction = math.clamp(depth / World.MaxDepth, 0, 1)
	local fish = Catch.pickFish(rng, FishList, depthFraction) :: FishDef
	local weight, weightNorm = Catch.rollWeight(rng, fish)
	local schedule = Bite.schedule(rng, fish.nibbleMin, fish.nibbleMax)
	d.session = {
		stage = "waiting",
		landsAt = now + FLIGHT_TIME,
		schedule = schedule,
		fish = fish,
		weight = weight,
		weightNorm = weightNorm,
		distance = 0.4 + 0.6 * math.clamp(flat.Magnitude / 70, 0, 1),
		seed = seed,
		fightStart = 0,
	}
	return {
		ok = true,
		flight = FLIGHT_TIME,
		depth = math.floor(depth),
		nibbles = schedule.nibbles,
		takeAt = schedule.takeAt,
		window = schedule.window,
	}
end

local function onHook(player: Player): any
	local d = data[player]
	local s = d and d.session
	if not d or not s or s.stage ~= "waiting" then
		return { result = "none" }
	end
	-- Judge on the server clock, minus the player's round-trip latency
	local elapsed = os.clock() - s.landsAt - player:GetNetworkPing()
	local result = Bite.judge(s.schedule, elapsed, HOOK_TOLERANCE)
	if result ~= "hooked" then
		d.session = nil
		return { result = result }
	end
	s.stage = "fighting"
	s.fightStart = os.clock()
	local fish = s.fish
	return {
		result = "hooked",
		seed = s.seed,
		params = {
			style = fish.style,
			power = fish.power,
			weight = s.weight,
			weightNorm = s.weightNorm,
			lineStrength = Gear.Lines[d.line].strength,
			safeZoneWidth = Gear.Rods[d.rod].safeZoneWidth,
			staminaSeconds = fish.staminaSeconds * (0.7 + 0.6 * s.weightNorm),
			distance = s.distance,
		},
	}
end

local function onFightResult(player: Player, outcome: any): any
	local d = data[player]
	local s = d and d.session
	if not d or not s or s.stage ~= "fighting" then
		return { result = "none" }
	end
	if outcome == "landed" and os.clock() - s.fightStart < MIN_FIGHT_SECONDS then
		outcome = "escaped" -- implausibly fast
	end
	if outcome == "landed" then
		s.stage = "landed"
		local isNew = not d.caught[s.fish.id]
		d.caught[s.fish.id] = true
		return {
			result = "landed",
			fish = {
				id = s.fish.id,
				name = s.fish.name,
				weight = s.weight,
				value = Catch.value(s.fish, s.weight),
				isNew = isNew,
			},
		}
	end
	-- Lost fish are logged as "spotted": rough size and fighting style, never the species
	local spotted = { size = Catch.roughSize(s.weightNorm), style = STYLE_HINT[s.fish.style] or "fish" }
	table.insert(d.spotted, spotted)
	d.session = nil
	return {
		result = if outcome == "snapped" then "snapped" else "escaped",
		spotted = `Spotted: a {spotted.size} {spotted.style}`,
	}
end

local function onDecide(player: Player, keep: any): any
	local d = data[player]
	local s = d and d.session
	if not d or not s or s.stage ~= "landed" then
		return { ok = false, reason = "Nothing to decide" }
	end
	if keep == true then
		local cap = Gear.RowboatCargo
		if coolerWeight(d) + s.weight > cap then
			return { ok = false, reason = `Cooler full ({cap} lb). Sell at the dock or release it.` }
		end
		table.insert(d.cooler, { id = s.fish.id, name = s.fish.name, weight = s.weight, value = Catch.value(s.fish, s.weight) })
	end
	d.session = nil
	pushState(player)
	return { ok = true }
end

local function onBuy(player: Player, itemId: any): any
	local d = data[player]
	if not d or typeof(itemId) ~= "string" then
		return { ok = false, reason = "Not ready" }
	end
	local rod = Gear.Rods[itemId]
	local line = Gear.Lines[itemId]
	local item = rod or line
	if not item then
		return { ok = false, reason = "Unknown item" }
	end
	if d.owned[itemId] then
		-- already owned: just equip it
	elseif d.money < item.price then
		return { ok = false, reason = `Need ${item.price - d.money} more` }
	else
		d.money -= item.price
		d.owned[itemId] = true
	end
	if rod then
		d.rod = itemId
	else
		d.line = itemId
	end
	pushState(player)
	return { ok = true }
end

local function onSell(player: Player)
	local d = data[player]
	if not d then
		return
	end
	if #d.cooler == 0 then
		notify(player, "Your cooler is empty")
		return
	end
	local total = 0
	for _, f in d.cooler do
		total += f.value
	end
	local count = #d.cooler
	d.money += total
	table.clear(d.cooler)
	notify(player, `Sold {count} fish for ${total}`)
	pushState(player)
end

local function makeRodTool(): Tool
	local tool = Instance.new("Tool")
	tool.Name = "Rod"
	tool.CanBeDropped = false
	tool.RequiresHandle = true
	tool.ToolTip = "Hold to charge a cast, release to throw"
	local handle = Instance.new("Part")
	handle.Name = "Handle"
	handle.Size = Vector3.new(0.25, 0.25, 6)
	handle.Color = Color3.fromRGB(70, 50, 35)
	handle.Material = Enum.Material.Wood
	handle.CanCollide = false
	handle.Massless = true
	handle.Parent = tool
	local tip = Instance.new("Attachment")
	tip.Name = "Tip"
	tip.Position = Vector3.new(0, 0, -3)
	tip.Parent = handle
	-- hold near one end, rod tilted up and forward (may need tweaking in Studio)
	tool.Grip = CFrame.new(0, 0, 2.4) * CFrame.Angles(math.rad(-35), 0, 0)
	return tool
end

function Fishing.start(prompts: { shop: ProximityPrompt, sell: ProximityPrompt })
	local assets = ReplicatedStorage:FindFirstChild("Assets")
	local rodAsset = assets and assets:FindFirstChild("Rod")
	local rod = if rodAsset and rodAsset:IsA("Tool") then rodAsset:Clone() else makeRodTool()
	rod.Parent = StarterPack

	Net.fn("Cast").OnServerInvoke = onCast
	Net.fn("Hook").OnServerInvoke = onHook
	Net.fn("FightResult").OnServerInvoke = onFightResult
	Net.fn("Decide").OnServerInvoke = onDecide
	Net.fn("Buy").OnServerInvoke = onBuy
	prompts.sell.Triggered:Connect(onSell)

	local function add(player: Player)
		-- No saving in Milestone 1: everyone starts fresh each session
		data[player] = {
			money = 0,
			rod = Gear.StartRod,
			line = Gear.StartLine,
			owned = { [Gear.StartRod] = true, [Gear.StartLine] = true },
			cooler = {},
			caught = {},
			spotted = {},
			session = nil,
			lastCast = 0,
		}
		pushState(player)
		player.CharacterAdded:Connect(function()
			local d = data[player]
			if d then
				d.session = nil
			end
			task.defer(pushState, player)
		end)
	end
	Players.PlayerAdded:Connect(add)
	for _, p in Players:GetPlayers() do
		add(p)
	end
	Players.PlayerRemoving:Connect(function(p)
		data[p] = nil
	end)
end

return Fishing
