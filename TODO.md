# TODO / checkpoint

Branch: `milestone-1-lake-test` (local only, not pushed). Design log `docs/design-decisions.md` is untouched — ask Aidan before editing.

## Milestone 0 — Setup
- [x] OS: Windows 11 Home x64
- [ ] Roblox Studio — NOT installed (no official winget pkg). Aidan: install from create.roblox.com, log in, then `rojo plugin install`
- [x] Rojo 7.6.1 + project in `game/` (build/sourcemap/serve verified)
- [x] Blender 5.3.0 at `%LOCALAPPDATA%\Programs\Blender\Blender Foundation\Blender 5.3\` (MSI hash + signature verified, extracted without admin)
- [x] MCP for Blender add-on installed + enabled; server listened on :9876 when Blender opened
- [ ] Figma style guide (not started)
- Tooling: Luau 0.748 + luau-lsp 1.70.1 + Roblox defs in `~/.local/luau-tools`

## Milestone 1 — Lake test (building autonomously; defaults below are assumptions)
Assumed defaults (Aidan may override): Studio-primitive rough art, placeholder fish (perch, bass, trout, pike, catfish), basic phone controls, no saving.
- [x] Pure shared modules: Rng, Fight, Bite, Catch, Config (Fish, Gear)
- [x] Unit tests pass (`luau game/tests/run.luau`; bot fights 14-39s, upgrade ~11.7 min) — fight durations 10s–2min, idle loses, weakest-link snaps
- [ ] Server: world greybox, rod tool, remotes, cast/hook/fight/land/sell/buy, rowboat
- [ ] Client: cast charge, bobber + nibbles, fight UI, keep/release, shop, boat driving
- [ ] luau-lsp type check clean
- [ ] Studio playtest (needs Studio — Aidan)
