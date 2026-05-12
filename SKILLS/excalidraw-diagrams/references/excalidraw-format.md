# Excalidraw JSON Format Reference

Complete property reference for `.excalidraw` elements. Read this when you need details beyond what SKILL.md covers.

## Table of Contents

1. [Common properties](#common-properties)
2. [Rectangle](#rectangle)
3. [Text](#text)
4. [Arrow](#arrow)
5. [Ellipse](#ellipse)
6. [Line](#line)
7. [Property value reference](#property-value-reference)
8. [Complete example](#complete-example)

## Common properties

Every element shares these:

| Property | Type | Description |
|---|---|---|
| `id` | string | Unique identifier (use descriptive kebab-case) |
| `type` | string | `"rectangle"`, `"text"`, `"arrow"`, `"ellipse"`, `"line"` |
| `x` | number | X position (top-left corner) |
| `y` | number | Y position (top-left corner) |
| `width` | number | Element width in pixels |
| `height` | number | Element height in pixels |
| `opacity` | number | 0-100 |
| `strokeColor` | string | Border/outline color (hex) |
| `backgroundColor` | string | Fill color (hex) or `"transparent"` |
| `fillStyle` | string | `"solid"`, `"hachure"`, `"cross-hatch"` |
| `strokeWidth` | number | Border thickness (1-4 typical) |
| `roughness` | number | 0=smooth, 1=sketchy (default), 2=very rough |

## Rectangle

For boxes, containers, cards.

```json
{
  "id": "component-name",
  "type": "rectangle",
  "x": 100, "y": 100,
  "width": 200, "height": 80,
  "strokeColor": "#1565C0",
  "backgroundColor": "#E3F2FD",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "roughness": 1,
  "roundness": { "type": 3 },
  "opacity": 100
}
```

**`roundness`**: `{ "type": 3 }` for rounded corners, omit or `null` for sharp corners.

## Text

Labels, titles. Always position manually — there's no auto-centering relative to parent.

```json
{
  "id": "label-name",
  "type": "text",
  "x": 110, "y": 120,
  "width": 180, "height": 25,
  "text": "Line 1\nLine 2",
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

| Property | Values | Notes |
|---|---|---|
| `fontSize` | number | 12-20 typical |
| `fontFamily` | `1` (Virgil/hand-drawn), `2` (Helvetica), `3` (Cascadia/mono) | Use 1 for sketch look |
| `textAlign` | `"left"`, `"center"`, `"right"` | Horizontal alignment within width |

**Sizing tips**:
- Single line: `height: 25`
- Two lines: `height: 45`
- Three lines: `height: 65`
- Always set `roughness: 0` for text readability

**Centering text in a box**: Set text `x` so that `text.x + text.width/2 = box.x + box.width/2`. Set `textAlign: "center"`.

## Arrow

Connections between components. Points are relative to `x,y`.

```json
{
  "id": "arrow-a-to-b",
  "type": "arrow",
  "x": 300, "y": 140,
  "width": 150, "height": 30,
  "points": [[0, 0], [150, 30]],
  "strokeColor": "#1565C0",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 1,
  "roundness": { "type": 2 },
  "startArrowhead": null,
  "endArrowhead": "arrow",
  "opacity": 100
}
```

| Property | Values | Notes |
|---|---|---|
| `points` | `[[x,y], ...]` | Relative to element's `x,y`. Min 2 points. |
| `startArrowhead` | `null`, `"arrow"`, `"bar"`, `"dot"`, `"triangle"` | Start decoration |
| `endArrowhead` | same as above | End decoration |
| `strokeStyle` | `"solid"`, `"dashed"`, `"dotted"` | Line pattern |
| `roundness.type` | `2` | Smooth curves through points |

**Straight arrow**: 2 points `[[0,0], [dx, dy]]`

**Curved arrow**: 3+ points — the middle points act as curve control:
```json
"points": [[0, 0], [75, -40], [150, 0]]
```

**Setting width/height**: Should match the bounding box of points. For `points: [[0,0], [150, 30]]`, set `width: 150, height: 30`.

## Ellipse

Circles and ovals. Same properties as rectangle, just `"type": "ellipse"`.

```json
{
  "id": "circle-1",
  "type": "ellipse",
  "x": 100, "y": 100,
  "width": 80, "height": 80,
  "strokeColor": "#333",
  "backgroundColor": "#E3F2FD",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "roughness": 1,
  "opacity": 100
}
```

## Line

Like arrow but without arrowheads. Same `points` system.

```json
{
  "id": "line-1",
  "type": "line",
  "x": 100, "y": 200,
  "width": 200, "height": 0,
  "points": [[0, 0], [200, 0]],
  "strokeColor": "#999",
  "strokeWidth": 1,
  "roughness": 1,
  "opacity": 100
}
```

## Property value reference

### fillStyle

| Value | Effect |
|---|---|
| `"solid"` | Flat fill (most common) |
| `"hachure"` | Diagonal lines (hand-drawn feel) |
| `"cross-hatch"` | Cross-hatched lines |

### roughness

| Value | Effect | When to use |
|---|---|---|
| `0` | Smooth, clean lines | Text labels, precise elements |
| `1` | Slightly wobbly (default) | Most shapes — gives the sketch feel |
| `2` | Very rough/wobbly | Emphasis, draft-feeling elements |

### fontFamily

| Value | Font | When to use |
|---|---|---|
| `1` | Virgil (hand-drawn) | Default — matches sketch style |
| `2` | Helvetica | When readability is critical |
| `3` | Cascadia (monospace) | Code, paths, technical identifiers |

## Complete example

A simple two-box diagram with an arrow:

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "api",
  "elements": [
    {
      "id": "box-a",
      "type": "rectangle",
      "x": 50, "y": 50,
      "width": 150, "height": 70,
      "strokeColor": "#1565C0",
      "backgroundColor": "#E3F2FD",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "roundness": { "type": 3 },
      "opacity": 100
    },
    {
      "id": "box-a-label",
      "type": "text",
      "x": 70, "y": 72,
      "width": 110, "height": 25,
      "text": "Service A",
      "fontSize": 16,
      "fontFamily": 1,
      "textAlign": "center",
      "strokeColor": "#0D47A1",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "roughness": 0,
      "opacity": 100
    },
    {
      "id": "arrow-a-b",
      "type": "arrow",
      "x": 200, "y": 85,
      "width": 100, "height": 0,
      "points": [[0, 0], [100, 0]],
      "strokeColor": "#1565C0",
      "strokeWidth": 2,
      "roughness": 1,
      "roundness": { "type": 2 },
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "opacity": 100
    },
    {
      "id": "box-b",
      "type": "rectangle",
      "x": 300, "y": 50,
      "width": 150, "height": 70,
      "strokeColor": "#C62828",
      "backgroundColor": "#FFEBEE",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "roundness": { "type": 3 },
      "opacity": 100
    },
    {
      "id": "box-b-label",
      "type": "text",
      "x": 320, "y": 72,
      "width": 110, "height": 25,
      "text": "Service B",
      "fontSize": 16,
      "fontFamily": 1,
      "textAlign": "center",
      "strokeColor": "#B71C1C",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "roughness": 0,
      "opacity": 100
    }
  ],
  "appState": { "viewBackgroundColor": "#FAFBFC" },
  "files": {}
}
```
