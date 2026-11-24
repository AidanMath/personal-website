--!strict
-- Unit tests for the pure shared modules. Run from the repo root:
--   ~/.local/luau-tools/luau.exe game/tests/run.luau

local Rng = require("../src/shared/Util/Rng")
local Fight = require("../src/shared/Fishing/Fight")
local Bite = require("../src/shared/Fishing/Bite")
local Catch = require("../src/shared/Fishing/Catch")
local FishList = require("../src/shared/Config/Fish")
local Gear = require("../src/shared/Config/Gear")

local failures = 0
local function check(cond: boolean, msg: string)
	if not cond then
		failures += 1
		print("FAIL: " .. msg)
	end
end

type Strategy = (s: Fight.State) -> Fight.Input

-- A reasonable human: steer against the fish, reel unless tension is near the top of the zone.
local function skilledBot(s: Fight.State): Fight.Input
	local steer = if math.abs(s.fishDir) > 0.15 then -math.sign(s.fishDir) else 0
	return { reel = s.tension < s.zoneHigh - 0.07, steer = steer }
end
local function idleBot(_s: Fight.State): Fight.Input
	return { reel = false, steer = 0 }
end
local function mashBot(_s: Fight.State): Fight.Input
	return { reel = true, steer = 0 }
end

local function playOnce(f: Catch.FishDef, weightNorm: number, lineStrength: number, zone: number, seed: number, strategy: Strategy, distance: number?)
	local weight = f.minWeight + (f.maxWeight - f.minWeight) * weightNorm
	local s = Fight.new({
		style = f.style :: Fight.Style,
		power = f.power,
		weight = weight,
		weightNorm = weightNorm,
		lineStrength = lineStrength,
		safeZoneWidth = zone,
		staminaSeconds = f.staminaSeconds * (0.7 + 0.6 * weightNorm),
		distance = distance or 0.8,
	}, Rng.new(seed))
	local dt = 1 / 30
	local outcome: Fight.Outcome? = nil
	while not outcome and s.t < 600 do
		outcome = Fight.step(s, dt, strategy(s))
	end
	return outcome or "timeout", s.t
end

local function stats(f: Catch.FishDef, weightNorm: number, lineStrength: number, zone: number, strategy: Strategy, runs: number?)
	local n = runs or 40
	local landed, snapped, escaped, totalT, maxT, minT = 0, 0, 0, 0, 0, math.huge
	for seed = 1, n do
		local outcome, t = playOnce(f, weightNorm, lineStrength, zone, seed * 7919, strategy)
		if outcome == "landed" then
			landed += 1
			totalT += t
			maxT = math.max(maxT, t)
			minT = math.min(minT, t)
		elseif outcome == "snapped" then
			snapped += 1
		else
			escaped += 1
		end
	end
	return {
		landRate = landed / n,
		snapRate = snapped / n,
		escapeRate = escaped / n,
		avgT = if landed > 0 then totalT / landed else 0,
		minT = if landed > 0 then minT else 0,
		maxT = maxT,
	}
end

-- Fight: skilled play on adequate gear --------------------------------------
print(string.format("%-16s %4s %6s %6s %6s %6s %6s", "fish", "wN", "land", "snap", "avgT", "minT", "maxT"))
local braided = Gear.Lines.braidedLine.strength
for _, f in FishList do
	for _, wn in { 0.1, 0.5, 0.9 } do
		local line = math.max(braided, f.maxWeight + 1)
		local r = stats(f, wn, line, Gear.Rods.starterRod.safeZoneWidth, skilledBot)
		print(string.format("%-16s %4.1f %5.0f%% %5.0f%% %5.1fs %5.1fs %5.1fs", f.name, wn, r.landRate * 100, r.snapRate * 100, r.avgT, r.minT, r.maxT))
		check(r.landRate >= 0.6, `{f.name} wN={wn}: skilled land rate {r.landRate} < 60%`)
		check(r.landRate == 0 or (r.minT >= 8 and r.maxT <= 125), `{f.name} wN={wn}: fight length {r.minT}-{r.maxT}s outside ~10s-2min`)
	end
end

-- Fight: doing nothing loses; mashing reel is worse than playing well -------
for _, f in FishList do
	local idle = stats(f, 0.5, 30, 0.3, idleBot)
	check(idle.landRate == 0, `{f.name}: idle player landed fish ({idle.landRate})`)
end
local function avgLand(strategy: Strategy): number
	local sum = 0
	for _, f in FishList do
		sum += stats(f, 0.6, 30, 0.3, strategy).landRate
	end
	return sum / #FishList
end
local skilledAvg, mashAvg = avgLand(skilledBot), avgLand(mashBot)
print(string.format("avg land rate: skilled %.0f%%, mash-reel %.0f%%", skilledAvg * 100, mashAvg * 100))
check(skilledAvg > mashAvg + 0.2, "skill should beat mashing reel by a clear margin")

-- Fight: weakest link — a big fish on a light line snaps far more often -----
local catfish = FishList[5]
local starterLine = Gear.Lines.starterLine.strength
local weak = stats(catfish, 0.8, starterLine, 0.3, skilledBot)
local strong = stats(catfish, 0.8, braided + 10, 0.3, skilledBot)
print(string.format("catfish wN=0.8: 6 lb line land %.0f%% / snap %.0f%%; heavy line land %.0f%%", weak.landRate * 100, weak.snapRate * 100, strong.landRate * 100))
check(weak.snapRate > 0.5, "big catfish on starter line should usually snap")
check(strong.landRate > weak.landRate + 0.3, "stronger line should land the big catfish much more often")

-- Fight: wider safe zone (better rod) helps on a hard fish -------------------
local pike = FishList[4]
local narrow = stats(pike, 0.9, 40, Gear.Rods.starterRod.safeZoneWidth, mashBot)
local wide = stats(pike, 0.9, 40, Gear.Rods.fiberglassRod.safeZoneWidth, mashBot)
check(wide.landRate >= narrow.landRate, "wider safe zone should never be worse")

-- Fight: phases happen in order ----------------------------------------------
do
	local f = FishList[3]
	local s = Fight.new({
		style = "runner", power = f.power, weight = 3, weightNorm = 0.4, lineStrength = 30,
		safeZoneWidth = 0.3, staminaSeconds = 30, distance = 1,
	}, Rng.new(42))
	local seen: { string } = {}
	while not Fight.step(s, 1 / 30, skilledBot(s)) do
		if seen[#seen] ~= s.phase then
			table.insert(seen, s.phase)
		end
	end
	local order = table.concat(seen, ">")
	print("phase order: " .. order)
	check(seen[1] == "firstRun", "fight starts with firstRun")
	check(string.find(order, "secondWind", 1, true) ~= nil, "second wind happens in a long fight")
end

-- Bite ----------------------------------------------------------------------
do
	local sched = Bite.schedule(Rng.new(5), 2, 2)
	check(#sched.nibbles == 2, "nibble count")
	check(sched.nibbles[1] >= Bite.Tuning.firstWaitMin and sched.takeAt > sched.nibbles[2], "nibbles come before the take")
	check(Bite.judge(sched, sched.nibbles[1], 0.2) == "spooked", "hooking on a nibble spooks the fish")
	check(Bite.judge(sched, sched.takeAt + 0.3, 0.2) == "hooked", "hooking during the take works")
	check(Bite.judge(sched, sched.takeAt + sched.window + 1, 0.2) == "stolen", "too late = bait stolen")
	check(not Bite.expired(sched, sched.takeAt, 0.2) and Bite.expired(sched, sched.takeAt + 5, 0.2), "expiry")
end

-- Catch ---------------------------------------------------------------------
do
	local rng = Rng.new(9)
	for _ = 1, 200 do
		local f = Catch.pickFish(rng, FishList, 0.1)
		check(f ~= nil and f.minDepth <= 0.1, "shallow water only has shallow fish")
	end
	local sawCatfish = false
	for _ = 1, 500 do
		local f = Catch.pickFish(rng, FishList, 1)
		if f and f.id == "catfish" then
			sawCatfish = true
		end
	end
	check(sawCatfish, "deep water can have catfish")
	for _ = 1, 200 do
		local w, n = Catch.rollWeight(rng, catfish)
		check(w >= catfish.minWeight and w <= catfish.maxWeight and n >= 0 and n <= 1, "weight in range")
	end
	check(Catch.value(FishList[1], 1.5) == 12, "value = price x weight")
	check(Catch.value(FishList[1], 1.5, 2) == 24, "variant bonus multiplies value")
end

-- Economy sanity: first upgrade lands around the 10-minute mark --------------
do
	local rng = Rng.new(77)
	local money, minutes = 0, 0
	local upgrade = math.min(Gear.Rods.fiberglassRod.price, Gear.Lines.braidedLine.price)
	-- ~1 catch per 50s for a new player; mid-range casts; only fish the starter line can hold
	while money < upgrade and minutes < 60 do
		minutes += 50 / 60
		local f = Catch.pickFish(rng, FishList, 0.3 + rng() * 0.5)
		if f then
			local w = Catch.rollWeight(rng, f)
			if w <= starterLine then
				money += Catch.value(f, w)
			end
		end
	end
	print(string.format("first upgrade affordable at ~%.1f min", minutes))
	check(minutes >= 6 and minutes <= 14, "first upgrade should be ~10 minutes in")
end

print(if failures == 0 then "ALL TESTS PASSED" else `{failures} FAILURE(S)`)
if failures > 0 then
	error("tests failed")
end
