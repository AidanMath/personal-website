--!strict
-- Nibble-then-take bites. Pure Luau.
-- Hook before the take = spooked. Miss the take window = bait stolen.

local Bite = {}

export type Schedule = {
	nibbles: { number }, -- seconds after the bobber lands
	takeAt: number,
	window: number, -- seconds the take lasts
}

export type Result = "hooked" | "spooked" | "stolen"

Bite.Tuning = {
	firstWaitMin = 2.0,
	firstWaitMax = 6.0,
	gapMin = 0.7,
	gapMax = 1.6,
	window = 0.9,
}

local function range(rng: () -> number, lo: number, hi: number): number
	return lo + (hi - lo) * rng()
end

function Bite.schedule(rng: () -> number, nibbleMin: number, nibbleMax: number): Schedule
	local T = Bite.Tuning
	local t = range(rng, T.firstWaitMin, T.firstWaitMax)
	local count = nibbleMin + math.floor(rng() * (nibbleMax - nibbleMin + 1))
	local nibbles = {}
	for i = 1, count do
		nibbles[i] = t
		t += range(rng, T.gapMin, T.gapMax)
	end
	return { nibbles = nibbles, takeAt = t, window = T.window }
end

-- elapsed: seconds since the bobber landed, as measured by the judge.
-- tolerance: slack for network latency.
function Bite.judge(s: Schedule, elapsed: number, tolerance: number): Result
	if elapsed < s.takeAt - tolerance then
		return "spooked"
	elseif elapsed > s.takeAt + s.window + tolerance then
		return "stolen"
	end
	return "hooked"
end

function Bite.expired(s: Schedule, elapsed: number, tolerance: number): boolean
	return elapsed > s.takeAt + s.window + tolerance
end

return Bite
