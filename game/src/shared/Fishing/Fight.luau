--!strict
-- Fight simulation: tension meter + steering.
-- Pure Luau (no Roblox APIs) so it runs in unit tests and on the client.
--
-- Player inputs each frame: reel (held or not) and steer (-1..1).
-- Keep tension inside the safe zone. Above it the line strains and snaps;
-- below it the line goes slack and the fish throws the hook.
-- Steer against the fish's pull (steer = -fishDir) to cut its force.
-- Phases: firstRun -> tiring -> secondWind (once) -> lastPush.

local Fight = {}

export type Style = "runner" | "diver" | "jumper" | "heavyweight"
export type Phase = "firstRun" | "tiring" | "secondWind" | "lastPush"
export type Outcome = "landed" | "snapped" | "escaped"

export type Params = {
	style: Style,
	power: number, -- 0..1 base pull of the species
	weight: number, -- lb
	weightNorm: number, -- 0..1, where this fish sits in its species' weight range
	lineStrength: number, -- lb the line holds (weakest link)
	safeZoneWidth: number, -- from the rod
	staminaSeconds: number, -- how long the fish can fight at medium tension
	distance: number, -- starting line out, 0..1 (longer casts = longer fights)
}

export type Input = { reel: boolean, steer: number }

export type State = {
	params: Params,
	rng: () -> number,
	t: number,
	tension: number,
	line: number,
	stamina: number,
	phase: Phase,
	fishDir: number,
	targetDir: number,
	nextTurn: number,
	burstMult: number,
	burstKind: string?,
	burstUntil: number,
	nextBurst: number,
	secondWindUntil: number,
	usedSecondWind: boolean,
	strain: number,
	slack: number,
	zoneLow: number,
	zoneHigh: number,
	outcome: Outcome?,
}

type StyleDef = {
	runSpeed: number,
	dirMag: number,
	turnMin: number,
	turnMax: number,
	burstMin: number?,
	burstMax: number?,
}

-- Tuning knobs (exposed for tests and a future debug panel)
Fight.Styles = {
	runner = { runSpeed = 0.11, dirMag = 1.0, turnMin = 1.5, turnMax = 3.0 },
	diver = { runSpeed = 0.05, dirMag = 0.3, turnMin = 2.5, turnMax = 4.0, burstMin = 3.5, burstMax = 6.0 },
	jumper = { runSpeed = 0.06, dirMag = 0.7, turnMin = 2.0, turnMax = 3.5, burstMin = 3.0, burstMax = 5.0 },
	heavyweight = { runSpeed = 0.045, dirMag = 0.6, turnMin = 3.0, turnMax = 6.0 },
} :: { [string]: StyleDef }

Fight.PhaseMult = { firstRun = 1.0, tiring = 0.6, secondWind = 1.1, lastPush = 0.85 } :: { [string]: number }

Fight.Tuning = {
	zoneCenter = 0.5,
	reelBase = 0.45, -- tension from reeling alone
	idleBase = 0.12, -- tension from line weight alone
	pullScale = 0.45, -- how much fish force adds to tension
	steerEffect = 0.35, -- force cut when steering fully against the fish
	tensionResponse = 5, -- how fast tension follows its target
	reelRate = 0.07, -- line recovered per second at zero resistance
	snapAt = 0.97, -- instant snap
	strainLimit = 1.2, -- seconds of overload before snap
	slackLimit = 2.5, -- seconds of slack before the hook is thrown
	secondWindAt = 0.35,
	secondWindBoost = 0.12,
	secondWindSeconds = 4,
	lastPushAt = 0.15,
	tiringAt = 0.6,
}

local function clamp(x: number, lo: number, hi: number): number
	return if x < lo then lo elseif x > hi then hi else x
end

local function range(rng: () -> number, lo: number, hi: number): number
	return lo + (hi - lo) * rng()
end

function Fight.new(params: Params, rng: () -> number): State
	local T = Fight.Tuning
	local style = Fight.Styles[params.style]
	assert(style, "unknown fight style " .. tostring(params.style))
	local half = params.safeZoneWidth / 2
	local state: State = {
		params = params,
		rng = rng,
		t = 0,
		tension = T.reelBase,
		line = clamp(params.distance, 0.2, 1),
		stamina = 1,
		phase = "firstRun",
		fishDir = 0,
		targetDir = 0,
		nextTurn = 0,
		burstMult = 1,
		burstKind = nil,
		burstUntil = 0,
		nextBurst = if style.burstMin then range(rng, style.burstMin, style.burstMax :: number) else math.huge,
		secondWindUntil = 0,
		usedSecondWind = false,
		strain = 0,
		slack = 0,
		zoneLow = T.zoneCenter - half,
		zoneHigh = T.zoneCenter + half,
		outcome = nil,
	}
	return state
end

local function updatePhase(s: State)
	local T = Fight.Tuning
	if s.t < s.secondWindUntil then
		s.phase = "secondWind"
	elseif not s.usedSecondWind and s.stamina <= T.secondWindAt then
		s.usedSecondWind = true
		s.stamina += T.secondWindBoost
		s.secondWindUntil = s.t + T.secondWindSeconds
		s.phase = "secondWind"
	elseif s.stamina <= T.lastPushAt then
		s.phase = "lastPush"
	elseif s.stamina <= T.tiringAt then
		s.phase = "tiring"
	else
		s.phase = "firstRun"
	end
end

local function updateFishMovement(s: State, style: StyleDef, dt: number)
	local rng = s.rng
	if s.t >= s.nextTurn then
		local turnScale = if s.phase == "lastPush" then 0.5 else 1
		local sign = if rng() < 0.5 then -1 else 1
		s.targetDir = sign * style.dirMag * range(rng, 0.5, 1)
		s.nextTurn = s.t + range(rng, style.turnMin, style.turnMax) * turnScale
	end
	s.fishDir += (s.targetDir - s.fishDir) * math.min(1, dt * 3)

	-- Bursts: divers dive (force spike), jumpers leap (slack, then a jolt on landing)
	local kind = s.params.style
	if s.burstKind and s.t >= s.burstUntil then
		if s.burstKind == "jump" then
			s.burstKind = "land"
			s.burstMult = 1.7
			s.burstUntil = s.t + 0.5
		else
			s.burstKind = nil
			s.burstMult = 1
			s.nextBurst = s.t + range(rng, style.burstMin :: number, style.burstMax :: number)
		end
	elseif not s.burstKind and s.t >= s.nextBurst then
		if kind == "diver" then
			s.burstKind = "dive"
			s.burstMult = 1.6
			s.burstUntil = s.t + 1.5
		elseif kind == "jumper" then
			s.burstKind = "jump"
			s.burstMult = 0
			s.burstUntil = s.t + 0.6
		end
	end
end

-- Advances the fight by dt seconds. Returns the outcome once the fight ends.
function Fight.step(s: State, dt: number, input: Input): Outcome?
	if s.outcome then
		return s.outcome
	end
	local T = Fight.Tuning
	local p = s.params
	local style = Fight.Styles[p.style]
	s.t += dt

	updatePhase(s)
	updateFishMovement(s, style, dt)

	local steer = clamp(input.steer, -1, 1)
	local phaseMult = Fight.PhaseMult[s.phase]
	if s.phase == "lastPush" then
		-- the last push fades as the fish runs out of stamina
		phaseMult *= 0.4 + 0.6 * s.stamina / T.lastPushAt
	end
	local force = p.power * (0.6 + 0.4 * p.weightNorm) * phaseMult * s.burstMult
	local align = steer * s.fishDir -- negative = steering against the fish (good)
	local alignFactor = 1 + T.steerEffect * align
	local overload = math.max(1, p.weight / p.lineStrength) -- weakest link: too-light line spikes tension

	local base = if input.reel then T.reelBase else T.idleBase
	local target = base + force * T.pullScale * alignFactor * overload
	s.tension += (target - s.tension) * math.min(1, dt * T.tensionResponse)

	-- Line: reeling inside (or below) the zone brings the fish in; the fish's runs take line back
	if input.reel and s.tension <= s.zoneHigh then
		s.line -= T.reelRate * clamp(1.1 - force * 0.8, 0.2, 1) * dt
	end
	s.line += style.runSpeed * force * (1 - 0.5 * math.max(0, -align)) * dt
	s.line = math.min(s.line, 1)

	-- Stamina: the harder you pull (higher tension), the faster the fish tires
	s.stamina = math.max(0, s.stamina - dt / p.staminaSeconds * (0.5 + s.tension))

	-- Fail states
	if s.tension >= s.zoneHigh then
		s.strain += dt * (1 + (s.tension - s.zoneHigh) * 6)
	else
		s.strain = math.max(0, s.strain - dt)
	end
	if s.tension < s.zoneLow then
		s.slack += dt
	else
		s.slack = math.max(0, s.slack - dt * 2)
	end

	if s.tension >= T.snapAt or s.strain > T.strainLimit then
		s.outcome = "snapped"
	elseif s.slack > T.slackLimit then
		s.outcome = "escaped"
	elseif s.line <= 0 then
		s.outcome = "landed"
	end
	return s.outcome
end

return Fight
