# Game code (Rojo)

Luau source for the Roblox game. Rojo syncs it into Roblox Studio.

| Folder | Lands in Studio as | Runs on |
|---|---|---|
| `src/shared` | `ReplicatedStorage.Shared` | both |
| `src/server` | `ServerScriptService.Server` | server |
| `src/client` | `StarterPlayer.StarterPlayerScripts.Client` | client |

File suffixes: `*.server.luau` = Script, `*.client.luau` = LocalScript, plain `*.luau` = ModuleScript.

## Live sync

1. Install the Rojo Studio plugin once: `rojo plugin install` (or from the Creator Store).
2. In this folder: `rojo serve`
3. In Studio: open a place, then Plugins → Rojo → **Connect**.

Edits here now show up in Studio immediately. Code is owned by this repo; don't edit synced scripts inside Studio.

## Build a place file

```
rojo build -o FishingGame.rbxl
```
