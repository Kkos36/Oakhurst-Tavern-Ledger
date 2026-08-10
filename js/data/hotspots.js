// Landing-scene interactive hotspots. Each hotspot's clickable shape is an
// irregular polygon (not a rectangle), so position/size is expressed as
// percentages of the source artwork (1536x1024) per-vertex rather than a
// single bounding box — the renderer (js/ui/hotspot-renderer.js) multiplies
// these back into real pixel coordinates against that fixed reference size
// to build the actual SVG <polygon> points. This is percentages-in-data,
// pixels-in-generated-markup: SVG has no native way to express an irregular
// polygon in percentages, so the real benefit here is that hotspot shapes
// live as data instead of hand-authored HTML, not new responsive behavior
// (the existing viewBox + preserveAspectRatio letterbox already handles that).
export const HOTSPOTS = [
  {
    id: "bartender",
    ariaLabel: "Ask the bartender about the rules",
    label: "Ask about the rules",
    action: "openRulesModal",
    polygon: [
      { xPct: 48.307, yPct: 9.082 },
      { xPct: 43.034, yPct: 9.766 },
      { xPct: 39.909, yPct: 19.531 },
      { xPct: 38.932, yPct: 30.859 },
      { xPct: 38.867, yPct: 42.188 },
      { xPct: 39.648, yPct: 52.539 },
      { xPct: 41.471, yPct: 62.793 },
      { xPct: 59.31, yPct: 62.793 },
      { xPct: 58.594, yPct: 52.539 },
      { xPct: 59.961, yPct: 42.188 },
      { xPct: 59.115, yPct: 30.859 },
      { xPct: 56.771, yPct: 19.531 },
      { xPct: 53.32, yPct: 9.766 }
    ]
  },
  {
    id: "book",
    ariaLabel: "Open the ledger to roll a character",
    label: "Open the ledger",
    action: "openBook",
    polygon: [
      { xPct: 26.758, yPct: 64.648 },
      { xPct: 35.677, yPct: 63.281 },
      { xPct: 48.307, yPct: 62.5 },
      { xPct: 63.737, yPct: 63.77 },
      { xPct: 70.573, yPct: 67.285 },
      { xPct: 69.922, yPct: 84.277 },
      { xPct: 67.839, yPct: 91.797 },
      { xPct: 28.776, yPct: 91.797 },
      { xPct: 24.023, yPct: 85.449 },
      { xPct: 22.591, yPct: 70.02 }
    ]
  }
];

export const HOTSPOT_NATURAL_WIDTH = 1536;
export const HOTSPOT_NATURAL_HEIGHT = 1024;
