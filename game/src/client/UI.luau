--!strict
-- All Milestone 1 UI, built in code. "Modern nautical" (design log, Art direction):
-- clean rounded cards and big readable text, with brass trim on navy panels.
-- A Figma style guide will replace these placeholder colors later.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local Fight = require(ReplicatedStorage:WaitForChild("Shared").Fishing.Fight)

local UI = {}

local NAVY = Color3.fromRGB(22, 38, 56)
local NAVY_LIGHT = Color3.fromRGB(36, 58, 82)
local BRASS = Color3.fromRGB(201, 162, 90)
local CREAM = Color3.fromRGB(246, 236, 214)
local GOOD = Color3.fromRGB(96, 186, 130)
local BAD = Color3.fromRGB(214, 92, 80)
local FONT = Enum.Font.GothamBold
local FONT_BODY = Enum.Font.GothamMedium

local gui: ScreenGui
local hud: { money: TextLabel, cooler: TextLabel, gear: TextLabel, species: TextLabel }
local toastLabel: TextLabel
local toastToken = 0
local powerFrame: Frame
local powerFill: Frame
local fightFrame: Frame
local tensionZone: Frame
local tensionMarker: Frame
local lineFill: Frame
local fishArrow: TextLabel
local phaseLabel: TextLabel
local catchCard: Frame
local shopPanel: Frame
local shopList: Frame
local debugLabel: TextLabel

local function corner(parent: Instance, r: number?)
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, r or 12)
	c.Parent = parent
end

local function stroke(parent: Instance, color: Color3?, thickness: number?)
	local s = Instance.new("UIStroke")
	s.Color = color or BRASS
	s.Thickness = thickness or 2
	s.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
	s.Parent = parent
end

local function frame(props: { [string]: any }, parent: Instance): Frame
	local f = Instance.new("Frame")
	f.BorderSizePixel = 0
	f.BackgroundColor3 = NAVY
	for k, v in props do
		(f :: any)[k] = v
	end
	f.Parent = parent
	return f
end

local function label(props: { [string]: any }, parent: Instance): TextLabel
	local l = Instance.new("TextLabel")
	l.BackgroundTransparency = 1
	l.Font = FONT
	l.TextColor3 = CREAM
	l.TextScaled = true
	for k, v in props do
		(l :: any)[k] = v
	end
	l.Parent = parent
	return l
end

local function button(text: string, color: Color3, parent: Instance): TextButton
	local b = Instance.new("TextButton")
	b.Text = text
	b.Font = FONT
	b.TextScaled = true
	b.TextColor3 = CREAM
	b.BackgroundColor3 = color
	b.AutoButtonColor = true
	b.BorderSizePixel = 0
	corner(b, 10)
	stroke(b, BRASS, 1.5)
	local pad = Instance.new("UIPadding")
	pad.PaddingTop = UDim.new(0.18, 0)
	pad.PaddingBottom = UDim.new(0.18, 0)
	pad.Parent = b
	b.Parent = parent
	return b
end

function UI.init()
	local player = Players.LocalPlayer
	gui = Instance.new("ScreenGui")
	gui.Name = "FishingUI"
	gui.ResetOnSpawn = false
	gui.IgnoreGuiInset = false
	gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
	gui.Parent = player:WaitForChild("PlayerGui")

	-- HUD (top-left card)
	local card = frame({ Size = UDim2.fromOffset(250, 118), Position = UDim2.fromOffset(12, 12), BackgroundTransparency = 0.12 }, gui)
	corner(card)
	stroke(card)
	local pad = Instance.new("UIPadding")
	pad.PaddingLeft = UDim.new(0, 12)
	pad.PaddingTop = UDim.new(0, 8)
	pad.Parent = card
	hud = {
		money = label({ Size = UDim2.new(1, -12, 0, 32), Text = "$0", TextXAlignment = Enum.TextXAlignment.Left, TextColor3 = BRASS }, card),
		cooler = label({ Size = UDim2.new(1, -12, 0, 22), Position = UDim2.fromOffset(0, 36), Font = FONT_BODY, Text = "Cooler 0 / 60 lb", TextXAlignment = Enum.TextXAlignment.Left }, card),
		gear = label({ Size = UDim2.new(1, -12, 0, 18), Position = UDim2.fromOffset(0, 60), Font = FONT_BODY, Text = "", TextXAlignment = Enum.TextXAlignment.Left }, card),
		species = label({ Size = UDim2.new(1, -12, 0, 18), Position = UDim2.fromOffset(0, 82), Font = FONT_BODY, Text = "", TextXAlignment = Enum.TextXAlignment.Left }, card),
	}

	-- Toast (top-centre)
	toastLabel = label({
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 20),
		Size = UDim2.fromOffset(520, 40),
		Text = "",
		TextStrokeTransparency = 0.4,
		Visible = false,
	}, gui)

	-- Cast power bar (bottom-centre)
	powerFrame = frame({ AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -110), Size = UDim2.fromOffset(300, 22), BackgroundColor3 = NAVY_LIGHT, Visible = false }, gui)
	corner(powerFrame, 8)
	stroke(powerFrame)
	powerFill = frame({ Size = UDim2.fromScale(0, 1), BackgroundColor3 = BRASS }, powerFrame)
	corner(powerFill, 8)
	label({ Size = UDim2.new(1, 0, 0, 18), Position = UDim2.fromOffset(0, -22), Text = "CAST POWER", Font = FONT_BODY }, powerFrame)

	-- Fight panel (bottom-centre)
	fightFrame = frame({ AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -96), Size = UDim2.fromOffset(440, 118), BackgroundTransparency = 0.1, Visible = false }, gui)
	corner(fightFrame)
	stroke(fightFrame)
	phaseLabel = label({ Size = UDim2.new(1, 0, 0, 22), Position = UDim2.fromOffset(0, 6), Text = "" }, fightFrame)
	local tensionBar = frame({ Position = UDim2.new(0, 20, 0, 36), Size = UDim2.new(1, -40, 0, 26), BackgroundColor3 = Color3.fromRGB(60, 40, 40) }, fightFrame)
	corner(tensionBar, 6)
	tensionZone = frame({ Size = UDim2.fromScale(0.3, 1), Position = UDim2.fromScale(0.35, 0), BackgroundColor3 = GOOD, BackgroundTransparency = 0.25 }, tensionBar)
	corner(tensionZone, 6)
	tensionMarker = frame({ AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.new(0, 6, 1, 10), BackgroundColor3 = CREAM }, tensionBar)
	corner(tensionMarker, 3)
	local lineBar = frame({ Position = UDim2.new(0, 20, 0, 70), Size = UDim2.new(1, -110, 0, 12), BackgroundColor3 = NAVY_LIGHT }, fightFrame)
	corner(lineBar, 6)
	lineFill = frame({ Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromRGB(120, 170, 200) }, lineBar)
	corner(lineFill, 6)
	label({ Position = UDim2.new(1, -86, 0, 64), Size = UDim2.fromOffset(70, 22), Text = "LINE OUT", Font = FONT_BODY }, fightFrame)
	fishArrow = label({ Position = UDim2.new(0, 20, 0, 88), Size = UDim2.new(1, -40, 0, 24), Text = "", TextColor3 = BRASS }, fightFrame)

	-- Catch card (centre)
	catchCard = frame({ AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.45), Size = UDim2.fromOffset(340, 210), Visible = false }, gui)
	corner(catchCard, 16)
	stroke(catchCard, BRASS, 3)

	-- Shop (centre)
	shopPanel = frame({ AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromOffset(420, 340), Visible = false }, gui)
	corner(shopPanel, 16)
	stroke(shopPanel, BRASS, 3)
	label({ Size = UDim2.new(1, 0, 0, 36), Position = UDim2.fromOffset(0, 10), Text = "TACKLE SHOP" }, shopPanel)
	label({ Size = UDim2.new(1, -24, 0, 18), Position = UDim2.fromOffset(12, 46), Text = "Choose your first upgrade: reach and control, or strength.", Font = FONT_BODY }, shopPanel)
	shopList = frame({ Position = UDim2.fromOffset(16, 72), Size = UDim2.new(1, -32, 1, -130), BackgroundTransparency = 1 }, shopPanel)
	local layout = Instance.new("UIListLayout")
	layout.Padding = UDim.new(0, 8)
	layout.Parent = shopList
	local close = button("Close", NAVY_LIGHT, shopPanel)
	close.AnchorPoint = Vector2.new(0.5, 1)
	close.Position = UDim2.new(0.5, 0, 1, -12)
	close.Size = UDim2.fromOffset(140, 40)
	close.Activated:Connect(function()
		shopPanel.Visible = false
	end)

	debugLabel = label({ AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -12, 0, 12), Size = UDim2.fromOffset(260, 120), TextScaled = false, TextSize = 14, Font = Enum.Font.Code, TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Top, BackgroundTransparency = 0.4, BackgroundColor3 = Color3.new(0, 0, 0), Visible = false }, gui)
end

export type ClientState = {
	money: number,
	rod: string,
	line: string,
	owned: { [string]: boolean },
	coolerWeight: number,
	coolerCap: number,
	coolerCount: number,
	speciesFound: number,
	speciesTotal: number,
}

function UI.setState(s: ClientState, rodName: string, lineName: string)
	hud.money.Text = `${s.money}`
	hud.cooler.Text = `Cooler {s.coolerWeight} / {s.coolerCap} lb  ({s.coolerCount} fish)`
	hud.gear.Text = `{rodName} · {lineName}`
	hud.species.Text = `Species found {s.speciesFound} / {s.speciesTotal}`
end

function UI.toast(text: string, color: Color3?)
	toastToken += 1
	local token = toastToken
	toastLabel.Text = text
	toastLabel.TextColor3 = color or CREAM
	toastLabel.TextTransparency = 0
	toastLabel.Visible = true
	task.delay(2.6, function()
		if token == toastToken then
			TweenService:Create(toastLabel, TweenInfo.new(0.4), { TextTransparency = 1 }):Play()
		end
	end)
end

UI.Colors = { good = GOOD, bad = BAD, brass = BRASS }

function UI.showPower(power: number?)
	powerFrame.Visible = power ~= nil
	if power then
		powerFill.Size = UDim2.fromScale(power, 1)
	end
end

export type FightView = {
	tension: number,
	zoneLow: number,
	zoneHigh: number,
	line: number,
	fishDir: number,
	phase: Fight.Phase,
	strain: number,
	slack: number,
}

local PHASE_TEXT = {
	firstRun = "FIRST RUN — hold on!",
	tiring = "It's tiring — reel it in",
	secondWind = "SECOND WIND!",
	lastPush = "Last push — almost there",
}

function UI.showFight(v: FightView?)
	fightFrame.Visible = v ~= nil
	if not v then
		return
	end
	tensionZone.Position = UDim2.fromScale(v.zoneLow, 0)
	tensionZone.Size = UDim2.fromScale(v.zoneHigh - v.zoneLow, 1)
	tensionMarker.Position = UDim2.fromScale(math.clamp(v.tension, 0, 1), 0.5)
	local danger = v.tension > v.zoneHigh or v.tension < v.zoneLow
	tensionMarker.BackgroundColor3 = if danger then BAD else CREAM
	lineFill.Size = UDim2.fromScale(math.clamp(v.line, 0, 1), 1)
	phaseLabel.Text = PHASE_TEXT[v.phase] or v.phase
	if v.fishDir < -0.25 then
		fishArrow.Text = "◀◀ fish pulling left — steer RIGHT"
	elseif v.fishDir > 0.25 then
		fishArrow.Text = "fish pulling right — steer LEFT ▶▶"
	else
		fishArrow.Text = "fish pulling down"
	end
	fightFrame.BackgroundColor3 = if v.strain > 0.6 then Color3.fromRGB(70, 30, 30) else NAVY
end

export type CatchInfo = { name: string, weight: number, value: number, isNew: boolean }

function UI.showCatch(info: CatchInfo?, onDecide: ((keep: boolean) -> ())?)
	for _, c in catchCard:GetChildren() do
		if not c:IsA("UICorner") and not c:IsA("UIStroke") then
			c:Destroy()
		end
	end
	catchCard.Visible = info ~= nil
	if not info or not onDecide then
		return
	end
	if info.isNew then
		label({ Size = UDim2.new(1, 0, 0, 24), Position = UDim2.fromOffset(0, 10), Text = "NEW SPECIES!", TextColor3 = BRASS }, catchCard)
	end
	label({ Size = UDim2.new(1, -20, 0, 40), Position = UDim2.fromOffset(10, 38), Text = info.name }, catchCard)
	label({ Size = UDim2.new(1, -20, 0, 28), Position = UDim2.fromOffset(10, 84), Font = FONT_BODY, Text = `{info.weight} lb  ·  worth ${info.value}` }, catchCard)
	local keep = button("Keep", Color3.fromRGB(40, 100, 70), catchCard)
	keep.Position = UDim2.new(0, 20, 1, -64)
	keep.Size = UDim2.new(0.5, -30, 0, 46)
	local release = button("Release", NAVY_LIGHT, catchCard)
	release.Position = UDim2.new(0.5, 10, 1, -64)
	release.Size = UDim2.new(0.5, -30, 0, 46)
	keep.Activated:Connect(function()
		onDecide(true)
	end)
	release.Activated:Connect(function()
		onDecide(false)
	end)
end

export type ShopItem = { id: string, name: string, price: number, detail: string, owned: boolean, equipped: boolean }

function UI.openShop(items: { ShopItem }, onBuy: (id: string) -> ())
	for _, c in shopList:GetChildren() do
		if c:IsA("Frame") then
			c:Destroy()
		end
	end
	for i, item in items do
		local row = frame({ Size = UDim2.new(1, 0, 0, 50), BackgroundColor3 = NAVY_LIGHT, LayoutOrder = i }, shopList)
		corner(row, 10)
		label({ Position = UDim2.fromOffset(12, 4), Size = UDim2.new(1, -150, 0, 22), Text = item.name, TextXAlignment = Enum.TextXAlignment.Left }, row)
		label({ Position = UDim2.fromOffset(12, 27), Size = UDim2.new(1, -150, 0, 16), Text = item.detail, Font = FONT_BODY, TextXAlignment = Enum.TextXAlignment.Left }, row)
		local text = if item.equipped then "Equipped" elseif item.owned then "Equip" else `${item.price}`
		local b = button(text, if item.equipped then NAVY else Color3.fromRGB(40, 100, 70), row)
		b.AnchorPoint = Vector2.new(1, 0.5)
		b.Position = UDim2.new(1, -8, 0.5, 0)
		b.Size = UDim2.fromOffset(120, 38)
		b.Active = not item.equipped
		b.Activated:Connect(function()
			if not item.equipped then
				onBuy(item.id)
			end
		end)
	end
	shopPanel.Visible = true
end

function UI.shopOpen(): boolean
	return shopPanel.Visible
end

function UI.setDebug(text: string?)
	debugLabel.Visible = text ~= nil
	if text then
		debugLabel.Text = text
	end
end

return UI
