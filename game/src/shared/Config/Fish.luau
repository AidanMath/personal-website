--!strict
-- Lake fish for the Milestone 1 test.
-- PLACEHOLDERS: species-per-region is still Open in the design log, and all numbers are for tuning.

export type FishDef = {
	id: string,
	name: string,
	style: string,
	pricePerLb: number,
	minWeight: number,
	maxWeight: number,
	spawnWeight: number,
	minDepth: number,
	power: number,
	staminaSeconds: number,
	nibbleMin: number,
	nibbleMax: number,
}

local Fish: { FishDef } = {
	{
		id = "perch", name = "Yellow Perch", style = "runner",
		pricePerLb = 8, minWeight = 0.4, maxWeight = 1.6, spawnWeight = 40, minDepth = 0,
		power = 0.35, staminaSeconds = 7, nibbleMin = 1, nibbleMax = 2,
	},
	{
		id = "bass", name = "Largemouth Bass", style = "jumper",
		pricePerLb = 6, minWeight = 1, maxWeight = 8, spawnWeight = 28, minDepth = 0.2,
		power = 0.5, staminaSeconds = 14, nibbleMin = 1, nibbleMax = 3,
	},
	{
		id = "trout", name = "Rainbow Trout", style = "runner",
		pricePerLb = 7, minWeight = 1, maxWeight = 6, spawnWeight = 20, minDepth = 0.35,
		power = 0.55, staminaSeconds = 16, nibbleMin = 2, nibbleMax = 3,
	},
	{
		id = "pike", name = "Northern Pike", style = "diver",
		pricePerLb = 5, minWeight = 3, maxWeight = 18, spawnWeight = 9, minDepth = 0.6,
		power = 0.6, staminaSeconds = 19, nibbleMin = 1, nibbleMax = 2,
	},
	{
		id = "catfish", name = "Channel Catfish", style = "heavyweight",
		pricePerLb = 3, minWeight = 4, maxWeight = 25, spawnWeight = 6, minDepth = 0.75,
		power = 0.62, staminaSeconds = 38, nibbleMin = 2, nibbleMax = 4,
	},
}

return Fish
