--!strict
-- Client entry point.

local ProximityPromptService = game:GetService("ProximityPromptService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local GameInfo = require(Shared.GameInfo)
local Gear = require(Shared.Config.Gear)
local Net = require(Shared.Net)
local UI = require(script.Parent.UI)
local FishingController = require(script.Parent.FishingController)
local BoatController = require(script.Parent.BoatController)

UI.init()
FishingController.start()
BoatController.start()

local state: UI.ClientState? = nil

local function shopItems(s: UI.ClientState): { UI.ShopItem }
	local items: { UI.ShopItem } = {}
	for _, id in { "starterRod", "fiberglassRod" } do
		local r = Gear.Rods[id]
		table.insert(items, {
			id = id,
			name = r.name,
			price = r.price,
			detail = `Cast {r.maxCast} studs · safe zone {math.floor(r.safeZoneWidth * 100)}%`,
			owned = s.owned[id] == true,
			equipped = s.rod == id,
		})
	end
	for _, id in { "starterLine", "braidedLine" } do
		local l = Gear.Lines[id]
		table.insert(items, {
			id = id,
			name = l.name,
			price = l.price,
			detail = `Holds fish up to {l.strength} lb`,
			owned = s.owned[id] == true,
			equipped = s.line == id,
		})
	end
	return items
end

local function openShop()
	local s = state
	if not s then
		return
	end
	UI.openShop(shopItems(s), function(id)
		local res = Net.fn("Buy"):InvokeServer(id)
		if not res.ok then
			UI.toast(res.reason, UI.Colors.bad)
		end
	end)
end

Net.event("State").OnClientEvent:Connect(function(s: UI.ClientState)
	state = s
	FishingController.setRod(s.rod)
	UI.setState(s, Gear.Rods[s.rod].name, Gear.Lines[s.line].name)
	if UI.shopOpen() then
		openShop() -- refresh after a purchase
	end
end)

Net.event("Notify").OnClientEvent:Connect(function(text: string)
	UI.toast(text, UI.Colors.good)
end)

ProximityPromptService.PromptTriggered:Connect(function(prompt)
	if prompt.Name == "ShopPrompt" then
		openShop()
	end
end)

UI.toast("Equip your rod, hold to charge, release to cast", nil)
print(`[Client] {GameInfo.Name} - milestone {GameInfo.Milestone} ready`)
