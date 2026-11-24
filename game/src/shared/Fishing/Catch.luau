--!strict
-- Which fish bites, how heavy it is, and what it's worth. Pure Luau.
-- Value = base species price x weight x color-variant bonus (design log, Economy).

local Catch = {}

export type FishDef = {
	id: string,
	name: string,
	style: string,
	pricePerLb: number,
	minWeight: number,
	maxWeight: number,
	spawnWeight: number, -- relative chance
	minDepth: number, -- 0..1 fraction of the lake's max depth needed
	power: number,
	staminaSeconds: number,
	nibbleMin: number,
	nibbleMax: number,
}

-- Picks a species among those living at this water depth (0..1 of the lake's max depth).
function Catch.pickFish(rng: () -> number, fish: { FishDef }, depthFraction: number): FishDef?
	local total = 0
	for _, f in fish do
		if depthFraction >= f.minDepth then
			total += f.spawnWeight
		end
	end
	if total <= 0 then
		return nil
	end
	local roll = rng() * total
	for _, f in fish do
		if depthFraction >= f.minDepth then
			roll -= f.spawnWeight
			if roll <= 0 then
				return f
			end
		end
	end
	return nil
end

-- Random weight in the species range, skewed toward small fish so big ones feel special.
function Catch.rollWeight(rng: () -> number, f: FishDef): (number, number)
	local norm = rng() ^ 2
	local weight = f.minWeight + (f.maxWeight - f.minWeight) * norm
	return math.floor(weight * 100 + 0.5) / 100, norm
end

function Catch.value(f: FishDef, weight: number, variantBonus: number?): number
	return math.floor(f.pricePerLb * weight * (variantBonus or 1) + 0.5)
end

-- Vague size description for fish that got away ("spotted").
function Catch.roughSize(weightNorm: number): string
	return if weightNorm < 0.25 then "small" elseif weightNorm < 0.6 then "decent" elseif weightNorm < 0.85 then "big" else "huge"
end

return Catch
