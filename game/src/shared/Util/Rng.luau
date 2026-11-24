--!strict
-- Small deterministic RNG (Park-Miller). Pure Luau so tests run outside Roblox,
-- and the server and client can replay the same fight from one seed.

local Rng = {}

export type Rng = () -> number

function Rng.new(seed: number): Rng
	local state = math.floor(math.abs(seed)) % 2147483646 + 1
	return function(): number
		state = (state * 16807) % 2147483647
		return (state - 1) / 2147483646
	end
end

function Rng.range(rng: Rng, lo: number, hi: number): number
	return lo + (hi - lo) * rng()
end

return Rng
