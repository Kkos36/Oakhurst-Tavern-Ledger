import { HOTSPOTS, HOTSPOT_NATURAL_WIDTH, HOTSPOT_NATURAL_HEIGHT } from "../data/hotspots.js";
import { renderHotspots } from "./hotspot-renderer.js";

export function reducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Wires up the tavern landing scene: hotspot rendering, the rules modal, and
// the "lean in toward the book" zoom transition into the book scene.
// `onShowBookScene` is called once the transition (or its reduced-motion
// equivalent) reaches the point where the book scene should actually be
// populated and shown — that population logic still lives in main.js today.
// Returns { closeBook } so the caller's back-button handler can trigger the
// reverse transition.
export function initLandingScene({ landing, bookScene, hotspotsSvg, rulesModal, onShowBookScene }) {
  var hotspotLabel = document.getElementById("hotspotLabel");

  function positionLabel(el, text) {
    var box = el.getBoundingClientRect();
    hotspotLabel.style.left = (box.left + box.width / 2) + "px";
    hotspotLabel.style.top = box.top + "px";
    hotspotLabel.textContent = text;
    hotspotLabel.classList.add("show");
  }
  function hideLabel() { hotspotLabel.classList.remove("show"); }

  function openRulesModal() {
    rulesModal.hidden = false;
    document.getElementById("rulesClose").focus();
  }
  function closeRulesModal() { rulesModal.hidden = true; }
  document.getElementById("rulesClose").addEventListener("click", closeRulesModal);
  document.getElementById("rulesBackdrop").addEventListener("click", closeRulesModal);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !rulesModal.hidden) closeRulesModal(); });

  function setLeanOrigin() {
    var box = hotspotEls.book.getBoundingClientRect();
    var vw = window.innerWidth, vh = window.innerHeight;
    var cx = ((box.left + box.width / 2) / vw * 100).toFixed(1) + "%";
    var cy = ((box.top + box.height / 2) / vh * 100).toFixed(1) + "%";
    landing.style.setProperty("--zoom-x", cx);
    landing.style.setProperty("--zoom-y", cy);
  }

  function openBook() {
    setLeanOrigin();
    if (reducedMotion()) {
      landing.hidden = true;
      onShowBookScene();
      return;
    }
    landing.classList.add("zooming");
    window.setTimeout(function () {
      landing.hidden = true;
      onShowBookScene();
    }, 720);
  }

  function closeBook() {
    if (reducedMotion()) {
      bookScene.hidden = true;
      landing.hidden = false;
      return;
    }
    setLeanOrigin();
    landing.classList.remove("returning");
    landing.classList.add("on-top");
    landing.hidden = false;
    landing.classList.add("zooming");
    void landing.offsetWidth;
    landing.classList.remove("zooming");
    landing.classList.add("returning");
    window.setTimeout(function () {
      bookScene.hidden = true;
      landing.classList.remove("returning", "on-top");
    }, 900);
  }

  var hotspotEls = renderHotspots(hotspotsSvg, HOTSPOTS, {
    naturalWidth: HOTSPOT_NATURAL_WIDTH,
    naturalHeight: HOTSPOT_NATURAL_HEIGHT,
    handlers: { openRulesModal: openRulesModal, openBook: openBook },
    onLabel: positionLabel,
    onLabelHide: hideLabel
  });

  return { closeBook: closeBook };
}
