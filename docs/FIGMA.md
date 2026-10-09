# Figma workspace

File: https://www.figma.com/design/PisRWtaat5DSUBod7witDT (Laddex Enterprise, Design System & Storefront). Created through the Figma MCP server with the `use_figma` tool; every item below was read back or screenshotted after creation.

## What the MCP server could and could not do here

| Capability | Result |
|---|---|
| Create a design file | Worked (`create_new_file`) |
| Create variables, text styles, effect styles | Worked |
| Create components with variants, bound to variables | Worked |
| Read nodes and take screenshots of them | Worked (`use_figma` with `node.screenshot()`) |
| Upload app screenshots into the file | **Blocked.** `upload_assets` issued an upload URL, but the build sandbox's network policy returned 403 for `mcp.figma.com`. The Screens page therefore indexes the screens instead of showing them |
| Fetch screenshot URLs from `get_screenshot` | Blocked for the same reason; inline `node.screenshot()` was used instead |
| More than 3 pages | **Blocked by the Starter plan** (file limit of 3 pages), so the structure is Foundations, Components, Screens |
| Code Connect mappings | Not done |

## Contents

- **Variables:** `Primitives` (34 colours), `Color` (31 semantic aliases with web code syntax such as `var(--color-ember)`), `Spacing` (9), `Radius` (4). Scopes are set explicitly; none are `ALL_SCOPES`.
- **Styles:** 12 text styles (Display, Heading, Body, Label, Eyebrow, Data) and 3 effect styles (Shadow/Rule, Raised, Pop).
- **Foundations page:** the three directions with the selection and reasons, semantic colour swatches bound to the variables, type specimen.
- **Components page:** `Button` (3 styles by 3 states), `Status Tag` (5 kinds, text plus marker), `Pack Option` (selected true/false). Fills and strokes are bound to variables.
- **Screens page:** index of every implemented route and its capture file in `/screenshots`.

## Sync status

The palette was changed in code after the first Figma pass (the validator rejected the slate and neutral series colours, see `DESIGN_DIRECTIONS.md`). Figma primitives for tapioca blue, retail green and wholesale ochre were updated to match. Semantic tokens alias the primitives, so they follow. Components built before that change use the aliased variables and picked up the new values. The code is the source of truth; keep `src/lib/design/tokens.ts` and the Figma variables in step when either changes.
