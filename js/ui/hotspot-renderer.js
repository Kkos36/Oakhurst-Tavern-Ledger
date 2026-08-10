// Generic renderer for scene hotspots defined as data (js/data/hotspots.js).
// Builds one <polygon> per hotspot inside the given <svg>, wires up hover/
// focus label display and click/keyboard activation, and dispatches to the
// handler named by each hotspot's `action`. This is the one reusable piece
// so new hotspots only mean a new data entry, not new wiring code.

function activate(el, fn) {
  el.addEventListener("click", fn);
  el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } });
}

const SVG_NS = "http://www.w3.org/2000/svg";

// Returns a map of hotspot id -> the rendered <polygon> element, so callers
// that need one specific hotspot's live geometry (e.g. a zoom-transition
// origin) can still get at it without the renderer knowing about that need.
export function renderHotspots(svgEl, hotspots, opts) {
  var naturalWidth = opts.naturalWidth;
  var naturalHeight = opts.naturalHeight;
  var handlers = opts.handlers || {};
  var onLabel = opts.onLabel;
  var onLabelHide = opts.onLabelHide;
  var elements = {};

  hotspots.forEach(function (hotspot) {
    var points = hotspot.polygon.map(function (pt) {
      return (pt.xPct / 100 * naturalWidth) + "," + (pt.yPct / 100 * naturalHeight);
    }).join(" ");

    var polygon = document.createElementNS(SVG_NS, "polygon");
    polygon.setAttribute("class", "hotspot");
    polygon.setAttribute("role", "button");
    polygon.setAttribute("tabindex", "0");
    polygon.setAttribute("aria-label", hotspot.ariaLabel);
    polygon.setAttribute("points", points);

    if (onLabel) {
      polygon.addEventListener("mouseenter", function () { onLabel(polygon, hotspot.label); });
      polygon.addEventListener("focus", function () { onLabel(polygon, hotspot.label); });
    }
    if (onLabelHide) {
      polygon.addEventListener("mouseleave", onLabelHide);
      polygon.addEventListener("blur", onLabelHide);
    }

    var fn = handlers[hotspot.action];
    if (fn) activate(polygon, fn);

    svgEl.appendChild(polygon);
    elements[hotspot.id] = polygon;
  });

  return elements;
}
