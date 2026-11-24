--!strict
-- Rods and lines for the Milestone 1 test. Numbers are placeholders for tuning.
-- First upgrade (~10 min in): choose a better line OR a better rod (design log, Economy).

export type Rod = { id: string, name: string, price: number, maxCast: number, safeZoneWidth: number }
export type Line = { id: string, name: string, price: number, strength: number }

local Gear = {
	Rods = {
		starterRod = { id = "starterRod", name = "Starter Rod", price = 0, maxCast = 70, safeZoneWidth = 0.3 },
		fiberglassRod = { id = "fiberglassRod", name = "Fiberglass Rod", price = 100, maxCast = 100, safeZoneWidth = 0.4 },
	} :: { [string]: Rod },
	Lines = {
		starterLine = { id = "starterLine", name = "Mono Line (6 lb)", price = 0, strength = 6 },
		braidedLine = { id = "braidedLine", name = "Braided Line (20 lb)", price = 100, strength = 20 },
	} :: { [string]: Line },
	StartRod = "starterRod",
	StartLine = "starterLine",
	-- Rowboat cargo, in lb (weight-based cargo)
	RowboatCargo = 60,
}

return Gear
