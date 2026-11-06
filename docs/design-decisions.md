# Design Decisions Log

A running record of the game's design, built up one topic at a time. This is not a full design document yet.

- **Confirmed:** decided. Change only on purpose.
- **Proposed:** suggested and not rejected, but not formally decided.
- **Open:** still needs a decision.
- **Parked:** decided for now, to revisit later.

Last updated: 2026-11-06

---

## Topic status

| Topic | Status |
|---|---|
| World design | ✅ Mostly done |
| Boat progression | ✅ Done |
| Fishing equipment | ✅ Done |
| Fishing mechanics | ✅ Done |
| Fish ecosystem | 🟡 In progress |
| Economy | ✅ Done (numbers later) |
| Multiplayer | ✅ Done |
| Art direction | ✅ Done |
| Retention | 🟡 Partly covered |

---

## Platform, goals, and tools

**Confirmed**
- Platform: **Roblox** (a standalone version may come later; art and design stay portable)
- Main goal: **earning money**
- Team: solo developer with coding experience
- AI does the 3D modeling (Blender through MCP); the developer art-directs and approves
- Figma for UI design and the style guide (through the Figma connector)
- A "Forge" UI tool (ForgeGUI, GuiForge, or similar): decide during the UI phase

**Proposed**
- Design for retention and fair monetization from the start
  - Sell: cosmetics (boat paint, branding, HQ decor), convenience that isn't power (dock space, passive gear slots, private servers)
  - Earn from Roblox Premium payouts (time Premium members spend in the game)
  - Never sell: luck, better catch odds, or skipping progress

---

## Look and feel

**Confirmed**
- **Realistic gameplay, soft toon visuals.** Realism comes from behavior, not detail.
- **Realism with a hint of myth.** Myth is rare and special.

**Proposed**
- Show realism mainly through animation and fish behavior
- Modular, shared building pieces (docks, shacks, rocks) recolored for each region
- Modular boat models (hull plus parts) suited to AI modeling
- A Figma style guide (colors, fonts, buttons) made before UI work starts

---

## Research lessons from similar games

**Confirmed principles**
1. **Every item stays useful.** No "skip these" items (Fisch's biggest complaint).
2. **Each species fights differently**, so reeling never gets repetitive (Dredge's weakness).
3. **Knowing beats luck.** Where, when, and in what conditions matter more than a luck stat.
4. **Storage creates choices without fiddly menus** (Dredge's grid cargo was fiddly).
5. **Fair monetization.** Grind and pay-to-win sank Russian Fishing 4 and Fishing Planet.

Reference games: Fisch, Fish It!, Fishing Simulator (Roblox), Dredge, Russian Fishing 4, Fishing Planet, Webfishing.

---

## World

**Confirmed**
- **Six regions, all at launch.** Each has **shallow, mid, and deep** layers.
  1. Home lake/river (the starting cabin)
  2. Tropical lagoon and reefs
  3. Mangrove delta
  4. Volcanic coast
  5. Fjord/arctic
  6. Deep trench/open ocean
- **No hard locks.** Any region can be entered early; how dangerous that is depends on the region.
- **Outposts** are mainly fast-travel points. You unlock one by **sailing there first** from the marina (a long trip), then fast-travel afterward.
- When you fast-travel, **your boat comes with you**, for a **small fee based on distance**.
- Long trips have things to do: **trolling** (lines behind a moving boat), **signs at sea** (diving birds, ripples), and **weather and events**.

**Proposed: region hazards**

| Region | Danger | Hazard | Boat trait that helps |
|---|---|---|---|
| Home lake/river | Mild | Almost none (tutorial) | Anything |
| Tropical lagoon | Mild | Reefs scrape the hull | Shallow hull |
| Mangrove delta | Medium | Tight channels, roots | Small and nimble |
| Volcanic coast | Medium | Hot vents, currents | Heat-resistant hull |
| Fjord/arctic | Harsh | Ice damage, cold | Reinforced hull |
| Deep trench/ocean | Harsh | Huge waves, storms, distance | Large and stable |

- Mild regions mean inefficiency; medium means hull damage, repairs, and getting towed; harsh means a disabled boat and losing part of your catch (never the boat itself).
- Clear warnings ("Your hull is straining") before anything bad happens.
- The home lake works as the tutorial.

**Parked**
- All six regions at launch vs. launching sooner. Revisit during build planning.

---

## Home base and business

**Confirmed**
- Start in a **small cabin on the lake**, grow into a **fishing business HQ** on the harbor.
- **One main base plus outposts.**
- The HQ is where you **order gear, bait, and boats** and **sell your catch**.
- Each player's HQ is a **plot along a shared harbor** in the server (roughly 8–12 players per server).
- **Optional contracts** on a board at HQ: daily, specific, conditions, big jobs, and group contracts.
- **Reputation** (earned from contracts *and* regular selling) unlocks better suppliers and new catalog items.
- **Crew** can be hired later for chores only (checking crab pots, selling), never active fishing.
- **Deliveries are instant**, except boats, which take a short build time. **Paid skips are never sold.**

**Proposed**
- Every property upgrade should improve fishing (boat dock, processing, trophy wall)
- Brand identity: business name, logo, colors, and matching boat paint
- Keep business management to a few big choices, not spreadsheets

---

## Boats

**Confirmed**
- A **lineup of specialized boat types**, not one boat upgraded forever. No upgrade levels.
- Unlocked in a **set order**.
- A **balanced all-rounder** that isn't overpowered.
- **Engine noise scares fish** in shallow water, so small, quiet boats stay useful.
- **Weight-based cargo** (for example, "200 lb").
- **Easy controls, distinct handling** for each boat; light wind and waves in harsh regions.
- **Fuel costs money.**
- Long-term goals for boats: **branding and paint, cosmetic add-ons, a fleet dock at HQ, and boat history** (best catches, distance traveled).

**Proposed: lineup and order**

| # | Boat | Region | Signature ability |
|---|---|---|---|
| 1 | Rowboat | Home lake | Silent; never scares fish; needs no fuel |
| 2 | Reef runner | Tropical lagoon | Shallow hull, no reef damage |
| 3 | Airboat | Mangrove delta | Glides over roots and weeds |
| 4 | Vent cruiser | Volcanic coast | Heat-plated, safe near vents |
| 5 | All-rounder | Anywhere | None (middle stats everywhere) |
| 6 | Icebreaker | Fjord/arctic | Breaks ice to reach fishing spots under it |
| 7 | Trawler | Anywhere, slowly | Huge cargo, carries lots of passive gear |
| 8 | Deep-sea vessel | Deep trench/ocean | Stays steady in storms and huge waves |

- Shared stats: speed, cargo, toughness, handling, fuel range, plus one signature ability.
- All-rounder rules: no signature ability, never top in any stat, still damaged in harsh regions, medium noise, arrives mid-game.
- Fuel safety: a free tow home when you run out, the rowboat needs no fuel, and fuel stays cheap compared to catch value.

---

## Fishing equipment

**Confirmed**
- **Tiered gear with separate parts**: rod, reel, and line.
- **Gear controls depth** (boats decide where you go, gear decides how deep).
- **Bait is a choice, not a tier.** It decides which species bite.
- Bait sources: **order it, catch it** (small fish become live bait), **find it** (dig worms, collect shrimp).
- **Weakest-link rule:** the weakest part fails first, and the setup screen warns you.
- **Specialized tools are bought once, never tiered:**
  - Passive gear (crab pots, long lines, traps); your boat limits how many you carry
  - Fish finder: shows shapes and depth, not species
  - Barometer: forecasts weather and conditions
  - Ice auger: fishing through ice in the fjord
  - Landing net and gaff: help land giant fish
  - Lures: reusable, pickier than bait

**Proposed: what each part does**

| Part | Controls | When it's too weak |
|---|---|---|
| Rod | Casting distance, fight control (size of the safe zone) | Harder to control, more escapes |
| Reel | Depth, pulling power | Can't reach deeper water |
| Line | Strength (heaviest fish it holds) | Snaps |
| Bait | Which species bite | The target fish won't bite |

- Fewer, bigger tiers; each tier unlocks new depth or fish. If a tier opens nothing new, cut it.

---

## Fishing mechanics

**Confirmed**
- Catch flow: **aim and charge the cast → read nibbles, hook on the take → fight → land → keep or release**
- **Aim-and-power casting.**
- **Nibble-then-take bites**, with float, sound, and vibration signals. Hook too early and the fish is spooked; too late and the bait is stolen.
- **Fight = tension meter plus steering.** Keep tension in the safe zone; steer against the fish's runs and dives.
- Fish fighting styles: runners, divers, jumpers, heavyweights.
- **Fights last 10 seconds to 2 minutes, heavily varied.**
- **Fight phases:** first run → tiring → second wind → last push.
- **Lost fish are logged as "spotted"** (rough size or species).
- **Pure skill.** No assist mode; better gear (a wider safe zone) is the only help.
- **Catch and release**, useful when your hold is full or a fish isn't your contract target.

**Proposed**
- Fight length based on size and rarity
- Home lake fish are forgiving, as a tutorial
- Accessibility settings that don't change difficulty: colorblind-friendly signals, vibration, one-hand controls
- One-tap release button; optional "keep only" filter later in the game
- Released fish still count in your catch log; trophy photos

---

## Fish ecosystem

**Confirmed**
- About **40–50 species at launch** (2–3 per depth layer), with more added in updates.
- **Random weights** within each species' range; a record-size common fish can be worth more than a small rare one.
- **Rarity is hidden until your first catch** of a species, then shown in your catch log.
- **Real-world color variants** as the collectible layer: albino, melanistic, piebald, golden.
- **Legends are catchable**, except **one trench creature** that only appears during rare world events.
- **Special events (all of them)**, with a **mix of scheduled and random** timing:
  - Feeding frenzies (diving birds, a short burst of easy bites)
  - Migrations (a species passes through a region for a few days, hinted by rumors)
  - Moon and tide events (some fish bite only at full moon or high tide)
  - Server-wide events (the trench creature surfaces)

**Proposed**
- One legend per region (a giant old pike in the lake, a glowing reef fish, something under the fjord ice, etc.)
- Legends are found through rumors and sightings, not map markers
- Legends need specific conditions (bait, weather, time, depth)
- Sunken ruins in the deep layers to explore
- Shared body types reshaped into many species, to keep AI modeling practical

**Open**
- Which species live in which region and depth layer
- Which events are scheduled and which are random

---

## Economy

**Confirmed**
- **Money is always a little tight**, so every purchase is a real decision.
- **Tightness comes from big purchases** (boats, gear tiers), not from bills. **Running costs stay small** (fuel, bait, repairs, fast-travel and tow fees); a trip should almost always pay for itself.
- **The first meaningful upgrade comes soon** (within about 10 minutes): the player **chooses a better line or a better rod.**
- **Fish value = base species price × weight × color variant bonus.**
- **Prices use all three layers:**
  - **Fixed base price** for each species
  - **Daily market** at HQ: a few species in demand (about +50%), a few flooded (about −25%)
  - **Selling a lot of the same fish lowers your price for a while** (kept gentle)

**Proposed: first 30 minutes**

| Time | What happens |
|---|---|
| 0–2 min | Arrive at the lake cabin; first catch is easy and quick |
| 2–5 min | A few lake fish, the first "new species!" reveal, learn nibble vs. take |
| 5–8 min | First sale, first look at the order catalog |
| 8–10 min | First upgrade: choose a better line or a better rod |
| 10–20 min | First optional contract, first bait choice, a rumor of the lake legend |
| 20–30 min | Saving toward the reef runner; the economy starts to feel tight |

- **Long-term wealth goes to:** a bigger HQ (warehouses, bigger dock, storefront), prestige cosmetics, legend hunts (specialty bait, expeditions), and records and leaderboards. **No prestige reset.**
- **Rule for side earners: they give players a reason to fish and never replace fishing.**
- **Side ways to make money:**
  - **Stocks:** an HQ upgrade (a trading desk) for investing in fictional in-world companies whose prices react to game events (migrations, storms, scheduled events). In-game money only, never Robux.
  - **Tournaments:** entry fees and prizes (details in multiplayer)
  - **Seafood restaurant:** an HQ wing that runs **passively** (set a menu, it earns over time)
  - **Artifacts:** salvaged and sold, or kept
- Cut for now: aquarium exhibit, charter tours, auction house

**Proposed**
- Show the price breakdown on the sell screen (base, demand, saturation)
- Stocks: cap investment by HQ level or reputation; returns stay below active fishing per hour
- Check Roblox's current rules on gambling-style mechanics before building stocks
- Restaurant: turn flooded fish into meals; recipes discovered by combining species; crew can run the kitchen late game
- Artifacts: found by snags while deep fishing, a magnet-fishing tool, and sunken ruins; some hold clues to regional legends

**Open**
- Actual prices and numbers (during build)

---

## Multiplayer

**Confirmed**
- **Side-by-side play:** everyone fishes in the same world and mostly plays alone, with no shared boats.
- **No trading** between players (avoids scams).
- **Other players' engine noise never affects your bites** (prevents griefing).
- **Light co-op extras:**
  - Fishing-together bonus (a small boost when friends fish near each other)
  - Join a friend (fast-travel to a friend, if you've unlocked that region)
  - Convoys (sail to new regions as a group)
  - HQ visits (see a friend's trophies, fleet, and restaurant)
  - Group contracts (for friends or the whole server)
- **Tournaments:**
  - Formats: biggest fish, most total weight, target species, variant hunt
  - Scale: **server tournaments** (about 15–20 minutes, several times a day) and **global tournaments** (weekly or during events)
  - Fairness: **brackets by progress** and **gear-limited tournaments**

---

## Art direction

**Confirmed**
- **Storybook and atmospheric soft toon:** mood comes from lighting, fog, sky colors, and weather, not detailed models (simple AI-made models plus strong lighting).
- **UI: modern nautical.** Modern in how it works (clean, rounded, easy-to-tap cards, big readable text), nautical in how it looks (rope or brass trim, compass icons, faint sea-chart textures). The **catch log looks like a real logbook.**
- **Players use their own Roblox avatars.**
- **Fishing outfits are cosmetic only** (raincoats, waders, captain hats, a fjord parka), with no stat bonuses.
- **Trophy pose:** your avatar holds up big catches for a photo moment.
- **Sound: ambient plus music per region, with dynamic music** that rises during big fights and legend encounters.

**Region moods**

| Region | Mood | Colors | Light |
|---|---|---|---|
| Lake | Cozy, home | Greens, warm wood | Golden mornings, fireflies at night |
| Lagoon | Bright, inviting | Turquoise, sand, coral | Sparkling midday sun |
| Mangroves | Humid, mysterious | Deep greens, murky brown | Hazy, shafts of light |
| Volcanic | Strange, warm | Black rock, orange glow | Steam, glowing vents at night |
| Fjord | Cold, quiet, lonely | Icy blues, white | Pale light, northern lights |
| Trench | Vast, ominous | Dark navy, storm grey | Heavy storms, lightning |

**Proposed**
- Graphics-quality settings so the atmospheric effects run on cheap phones
- A Figma style guide before any UI is built
- Casting, reeling, and fighting animations are a top art priority

---

## Not started yet
- Retention: long-term goals, update plan, daily and weekly loops
- Build planning: launch scope, milestones, tech setup (Roblox Studio, Rojo, MCPs)
