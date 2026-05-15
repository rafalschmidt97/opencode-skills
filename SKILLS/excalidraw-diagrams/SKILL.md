---
name: excalidraw-diagrams
description: >-
  Create and export Excalidraw diagrams — architecture diagrams, communication
  diagrams, flowcharts, system overviews. Use this skill whenever the user asks
  to create, update, modify, or export any kind of visual diagram, drawing, or
  architecture visualization. Also use when the user mentions boxes, arrows,
  connections between components, or wants to visualize system architecture,
  data flows, or service interactions. Handles both creating .excalidraw JSON
  files programmatically and exporting them to SVG/PNG server-side without a
  browser.
compatibility: Requires Node.js 18+. Run install.js first to install excalidraw-cli.
metadata:
  version: "1.1"
allowed-tools: Bash(node:*) Bash(npx:*) Bash(open:*) Read Write Edit Create
---

# Excalidraw Diagrams

Create hand-drawn sketch-style diagrams by generating `.excalidraw` JSON files and exporting them to SVG/PNG via CLI.

## Why Excalidraw?

Excalidraw gives diagrams a distinctive hand-drawn look (via `roughness` property) that feels approachable and informal — perfect for architecture docs that change often. The JSON format gives full control over positioning (no fighting auto-layout engines), and the CLI export means everything works server-side without a browser.

## Prerequisites

Run the installer first:

```bash
node <SKILL_DIR>/install.js
```

where `<SKILL_DIR>` is the directory containing this SKILL.md file.
This installs `@swiftlysingh/excalidraw-cli` locally in the skill directory.

## CLI setup

Set the CLI alias (adjust `SKILL_DIR` to your installation location):

```bash
SKILL_DIR=~/.claude/skills/excalidraw-diagrams
EXCALIDRAW="npx --prefix $SKILL_DIR excalidraw-cli"
```

## Quick start

1. Create/edit an `.excalidraw` JSON file in your project directory
2. Export: `$EXCALIDRAW convert path/to/DIAGRAM.excalidraw --format svg`
3. Verify (open the SVG in your browser or image viewer):
   - macOS: `open path/to/DIAGRAM.svg`
   - Linux: `xdg-open path/to/DIAGRAM.svg`
   - Windows (PowerShell): `start path/to/DIAGRAM.svg`

Diagram files (`.excalidraw`, `.svg`, `.png`) live in the user's project — use whatever path the user specifies or a sensible default like `docs/`.

## Workflow

### Creating a new diagram

1. Gather requirements: what components exist, how they connect, what groupings make sense
2. Sketch the layout mentally — decide on rough positions before writing JSON
3. Write the `.excalidraw` JSON file (see format reference below)
4. Export to SVG and PNG
5. Open and verify visually
6. Iterate on positions/sizes until it looks clean

### Editing an existing diagram

1. Read the existing `.excalidraw` file
2. Modify elements (adjust positions, add/remove components, change connections)
3. Re-export and verify

### Export commands

```bash
# SVG (for docs, web, markdown embedding)
$EXCALIDRAW convert path/to/DIAGRAM.excalidraw --format svg

# PNG at 2x resolution (for presentations, retina screens)
$EXCALIDRAW convert path/to/DIAGRAM.excalidraw --format png --scale 2

# Dark mode variant
$EXCALIDRAW convert path/to/DIAGRAM.excalidraw --format svg --dark

# Transparent background
$EXCALIDRAW convert path/to/DIAGRAM.excalidraw --format png --no-export-background
```

After exporting, always `open` the SVG/PNG to verify the result looks correct.

## Excalidraw JSON format

An `.excalidraw` file is plain JSON. The top-level structure:

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "api",
  "elements": [ ... ],
  "appState": { "viewBackgroundColor": "#FAFBFC" },
  "files": {}
}
```

Elements render in array order — later elements appear on top. This matters for containers: place the background rectangle first, then the inner elements after it.

### Element types

There are three core element types. For full property reference, see [references/excalidraw-format.md](references/excalidraw-format.md).

**Rectangle** — boxes, containers, cards:
```json
{
  "id": "my-box",
  "type": "rectangle",
  "x": 100, "y": 100, "width": 200, "height": 80,
  "strokeColor": "#1565C0",
  "backgroundColor": "#E3F2FD",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "roughness": 1,
  "roundness": { "type": 3 },
  "opacity": 100
}
```

**Text** — labels (positioned manually, no auto-centering):
```json
{
  "id": "my-label",
  "type": "text",
  "x": 110, "y": 120, "width": 180, "height": 25,
  "text": "Component Name",
  "fontSize": 14,
  "fontFamily": 1,
  "textAlign": "center",
  "strokeColor": "#0D47A1",
  "backgroundColor": "transparent",
  "fillStyle": "solid",
  "roughness": 0,
  "opacity": 100
}
```

**Arrow** — connections between components:
```json
{
  "id": "my-arrow",
  "type": "arrow",
  "x": 300, "y": 140, "width": 100, "height": 20,
  "points": [[0, 0], [100, 20]],
  "strokeColor": "#1565C0",
  "strokeWidth": 2,
  "roughness": 1,
  "roundness": { "type": 2 },
  "startArrowhead": null,
  "endArrowhead": "arrow",
  "opacity": 100
}
```

### Layout guidelines

- **Language**: All diagram content (labels, descriptions, annotations) must be in English
- **Text alignment**: Always center-align text within boxes — set `textAlign: "center"` and match the text element's `x` and `width` to its parent box
- **Containers**: large rectangle first in the array, inner elements after (z-order)
- **Container labels**: position text near the top of the container box, not centered vertically
- **Multi-line text**: use `\n` in the `text` field, increase `height` accordingly (~20px per line)
- **Curved arrows**: use 3+ points for bezier curves: `[[0,0], [50,-30], [100,0]]`
- **Dashed lines**: add `"strokeStyle": "dashed"` for secondary/alternative flows
- **Sketch feel**: keep `roughness: 1` for shapes, `roughness: 0` for text (readability)
- **Aspect ratio**: aim for ~16:9 or 4:3 for diagrams that embed well in docs

### Safety checks after every change

**CRITICAL**: After moving, resizing, or adding any element, always verify you haven't broken something else:

- **Arrows still connect**: check that arrows between components still touch the correct edges — if you moved a box, the arrow endpoints may need updating too
- **No overlaps**: verify that resized/moved elements don't overlap or cover other elements (e.g., a widened container covering an arrow between containers)
- **Z-order intact**: if background rectangles were reordered, confirm that arrows and text still render on top (later in the elements array = higher z-index)
- **Margins preserved**: ensure child elements still have reasonable padding from their parent container edges (~15-20px minimum)
- **Label positions**: after moving boxes, check that text labels are still centered within their boxes (x and width must match)

### Consistent colors

When creating multiple diagrams for the same project, use consistent colors for the same types of components across all diagrams. Define a color palette early and stick with it.

## Common Questions

| User says | What to do |
|---|---|
| "Create an architecture diagram" | Gather components and connections, write `.excalidraw` JSON, export to SVG |
| "Add a box/component to this diagram" | Read existing `.excalidraw`, add the element, re-export |
| "Export this diagram as PNG" | Run `$EXCALIDRAW convert ... --format png` |
| "Make this diagram dark mode" | Re-export with the `--dark` flag |
| "Convert this to SVG" | Run `$EXCALIDRAW convert ... --format svg` |
| "Draw a flowchart" | Create `.excalidraw` with rectangles, diamonds (rotated squares), and arrows |
| "Visualize our service architecture" | Gather service names and connections, create architecture diagram |

## Error Handling

| Error | Cause / fix |
|---|---|
| `npx: command not found` | Node.js not installed or not in PATH |
| `excalidraw-cli: not found` | Run `node <SKILL_DIR>/install.js` to install the CLI |
| Invalid JSON in `.excalidraw` file | Check JSON syntax, ensure all required fields (`type`, `version`, `elements`, `appState`) are present |
| Export produces blank/empty image | Check element coordinates are within canvas bounds (positive `x`/`y`, reasonable `width`/`height`) |
| `open` command fails | Provide the file path to the user to open manually |

## Tips

- Export SVG for web/docs, PNG for presentations
- Use `--scale 2` for retina/high-DPI PNG output
- Keep `roughness: 1` for shapes (hand-drawn feel) and `roughness: 0` for text (readability)
- Arrow `points` are relative to the arrow's `x`/`y` position — not absolute coordinates
- Elements render in array order — later elements appear on top (z-order)
- Use consistent colors across related diagrams for the same component types
- Reference [references/excalidraw-format.md](references/excalidraw-format.md) for the full element property reference

## Dependency

Requires `@swiftlysingh/excalidraw-cli` (installed via `install.js`).

For full element property reference, see [references/excalidraw-format.md](references/excalidraw-format.md).
