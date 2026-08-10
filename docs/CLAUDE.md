# Fantasy West Marches Character Portal

## Project Purpose

This website is a fantasy-themed landing page and character-generation portal for a D&D 3.5 West Marches campaign.

The site should feel like the player is physically entering a fantasy tavern and interacting with objects inside the scene rather than navigating a conventional web application.

The primary user journey is:

1. Arrive at a fantasy tavern/bar scene.
2. Interact with the bartender to view the West Marches campaign rules.
3. Interact with an open or closed book on the bar to begin character creation.
4. Select a player.
5. Turn the page into the random character generator.
6. Generate a D&D 3.5 character.
7. Export that character in a Fantasy Grounds-friendly format for direct import.

The design should prioritize immersion, clarity, and ease of use for non-technical players.

---

# Core Design Philosophy

This is **not** a modern dashboard with fantasy colors.

It should feel like an illustrated fantasy environment and physical book implemented as a web page.

Avoid:

- Dashboard layouts
- Generic cards
- Repeated rounded rectangles
- Bootstrap-style panels
- Pill-shaped UI elements
- Floating modern buttons when an in-world object can serve the same purpose
- Excessive drop shadows
- Glowing game-UI borders
- Sci-fi or MMORPG HUD styling
- Excessive ornamental framing around every individual value

Prefer:

- Parchment
- Ink
- Hand-drawn quill ornamentation
- Old books
- Wood
- Candlelight
- Medieval tavern details
- Physical page layouts
- Subtle hover feedback
- Illustrated objects acting as controls
- Section-level decoration rather than a border around every data field

The interface should look like a physical fantasy document or environment, not a modern website wearing a fantasy skin.

---

# Landing Page

## Scene

The landing page is a fantasy tavern/bar scene.

The main visible interactive objects are currently:

- Bartender
- Book resting on the bar

Additional interactive objects may be added later.

The landing page should therefore be built so that future interactive scene objects can be added without restructuring the entire application.

## Interaction Style

Interactive scene objects should feel like objects in the environment.

Examples:

- Slight visual highlight on hover
- Cursor change
- Very subtle scale or lighting shift
- Tooltip or small handwritten label if needed
- Keyboard-accessible equivalent for accessibility

Do not place large modern UI buttons directly over the artwork unless absolutely necessary.

Interactive regions may use invisible or transparent hitboxes positioned over the illustrated objects.

---

# Bartender Interaction

The bartender opens or presents the rules for the West Marches campaign.

The rules currently exist in a view-only Google Doc.

Claude may recreate those rules inside the website after being given access to or supplied with the document contents.

Do not modify the source Google Doc.

## Rules Presentation

The rules should remain visually consistent with the rest of the site.

Preferred presentation ideas include:

- A parchment sheet
- Tavern notice board
- Ledger
- Scroll
- Book page
- Dialog area visually tied to the bartender

Avoid presenting the rules as a generic modal containing plain white cards.

The rules should be readable above all else. Decorative elements must never interfere with text legibility.

---

# Book Interaction

The book on the bar is the entry point to the character-generation workflow.

When clicked:

1. The camera/view should visually move toward the book.
2. Transition from the tavern scene to a front-facing open-book view.
3. The open book becomes the primary interface.

The transition should feel like the viewer is focusing on or moving toward the physical book.

Avoid abrupt replacement of the entire page if a smooth transition can be achieved simply and reliably.

---

# Open Book Interface

The book is the primary UI surface after leaving the tavern scene.

Pages should look like parchment book pages.

UI elements should be arranged as if written, printed, or drawn onto those pages.

## Important Styling Rule

Do **not** turn every statistic, field, or option into an individual bordered card.

For example, ability scores should be arranged as part of one cohesive section.

Bad:

- Six separate boxed panels for STR, DEX, CON, INT, WIS, and CHA

Preferred:

- One "Ability Scores" section
- Typography and spacing used to organize the six stats
- A single section-level ornament or divider
- Small quill-style embellishments where useful

---

# Player Selection Page

The first book page is the player-selection screen.

The user selects which player they are generating a character for.

The player selection should remain visually integrated with the physical book.

Possible approaches:

- Handwritten names
- Bookmarks
- Ledger entries
- Inked selection marks
- Illustrated tabs

Avoid generic web-app user cards unless the design strongly resembles something printed into the book.

After selecting a player, transition to the next page using a page-turning animation.

---

# Page-Turning Transition

After player selection, the book transitions to the random character generator.

The animation should suggest an actual page turning.

Requirements:

- Smooth
- Brief
- Does not block the user unnecessarily
- Works reliably on desktop browsers
- Gracefully degrades if advanced animation is unsupported
- Respects reduced-motion accessibility settings

Do not sacrifice reliability for an overly complicated 3D animation.

A convincing 2D/CSS page-turn effect is acceptable.

---

# Random Character Generator

The next book page contains the D&D 3.5 random character generator.

The generator should produce a complete usable character according to the rules implemented by the project.

Character-generation logic should remain separate from visual presentation.

Recommended conceptual structure:

```text
Character Generator Logic
        ↓
Internal Character Object
        ↓
Book UI Renderer
        ↓
Export Formatter(s)
```

The UI should not be responsible for calculating the character.

The export system should not be responsible for generating the character.

This separation is important because additional output formats or generators may be added later.

---

# Internal Character Data

Use one canonical internal character representation.

Example conceptually:

```js
character = {
    identity: {},
    race: {},
    classes: [],
    abilityScores: {},
    combat: {},
    saves: {},
    skills: [],
    feats: [],
    equipment: [],
    spells: [],
    traits: {},
    metadata: {}
}
```

The exact schema may evolve.

The important rule is:

**Generate the character once, then transform that character into whatever presentation or export format is needed.**

Do not make Fantasy Grounds formatting part of the core generation algorithm.

---

# Fantasy Grounds Export

After generating the character, the user should be able to export the character in a Fantasy Grounds-friendly format suitable for direct import.

The exact export structure should match the version/ruleset being targeted by this project.

Keep export formatting isolated from generation logic.

Conceptually:

```text
Internal Character Object
        ↓
Fantasy Grounds Exporter
        ↓
Downloadable Import File
```

The export module should be replaceable or extendable without changing the generator.

If Fantasy Grounds requires XML or another structured format, produce that format from the internal character object.

Validate exported data before presenting it to the user.

---

# Current Scope

The site currently includes:

- Fantasy tavern landing scene
- Interactive bartender
- West Marches rules view
- Interactive book
- Zoom/focus transition into the book
- Player selection page
- Page-turn transition
- Random D&D 3.5 character generator
- Fantasy Grounds-friendly character export

---

# Future Scope

Potential future features include:

- Inventory generator
- Additional tavern interactions
- Additional objects in the landing scene
- Additional export formats
- More character-generation options

These are **not part of the current implementation unless specifically requested**.

Do not build placeholder systems or unnecessary abstractions for speculative features.

However, keep the architecture modular enough that these features can be added later.

---

# Decorative Art Assets

The project uses transparent hand-sketched quill-style ornaments.

Recommended asset organization:

```text
/assets/
    tavern/
    book/
    characters/
    ornaments/
        corner-flourish.webp
        horizontal-divider.webp
        vertical-divider.webp
        ornamental-diamond-rune.webp
        section-header-underline.webp
        large-frame-ornament.webp
```

Use WebP for normal site delivery where supported.

PNG versions may be retained as source/reference files.

## Ornament Usage

These ornaments should enhance the page rather than dominate it.

Use:

- Corner flourishes for major section framing
- Horizontal dividers between major sections
- Vertical dividers only when useful for page composition
- Small diamond/rune for separators or visual anchors
- Section-header underline beneath important headings
- Large frame ornament only for major framed content

Do not put every stat or label inside a decorative frame.

Do not stretch decorative images so far that linework becomes visibly distorted.

Preserve aspect ratios unless a specific repeating-line treatment is intentionally used.

---

# Visual Hierarchy

The order of visual importance should generally be:

1. Character/player information
2. Current action or decision
3. Section headings
4. Decorative artwork

Decoration should support the content, never compete with it.

---

# Responsive Behavior

The primary experience may be desktop-first, but the site should not completely break on smaller screens.

For the book interface:

- Preserve readable text sizes
- Avoid tiny two-page layouts on narrow screens
- Consider collapsing to a single-page presentation when needed
- Keep interaction targets large enough to click
- Prevent ornaments from clipping content

---

# Accessibility

Maintain the immersive design while supporting basic accessibility.

Interactive scene objects should have:

- Keyboard focus
- Accessible labels
- Sufficient hitbox sizes

Images with functional meaning should have useful alternative text or accessible labels.

Decorative images should not be announced unnecessarily.

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

Page-turn and zoom animations should degrade to simple fades or direct transitions when reduced motion is requested.

---

# Animation Guidance

Animations should reinforce physical interaction.

Good examples:

- Book gently enlarges before transition
- Page curls or slides during page turn
- Ink elements subtly fade into place
- Hovering an object slightly increases contrast or illumination

Avoid:

- Constant movement
- Excessive particles
- Bouncing buttons
- Large glowing effects
- Long cinematic transitions for routine actions

---

# Development Guidance

When implementing or modifying this project:

1. Preserve existing working character-generation logic unless the task specifically requires changing it.
2. Keep styling separate from generation rules.
3. Prefer reusable section-level layout components.
4. Avoid creating a generic `Card` component and using it everywhere.
5. Inspect the rendered page after significant styling changes.
6. Check browser console errors.
7. Verify interactive hitboxes still align with artwork after responsive changes.
8. Test player selection → page turn → character generation → export as one complete flow.
9. Keep new features scoped to the user's request.
10. Do not redesign unrelated portions of the site during a targeted change.

---

# Styling Guidance for Claude

When given vague requests such as:

> "Make this section more fantasy."

Interpret that as:

- Improve typography
- Improve spacing
- Add restrained hand-drawn ornamentation
- Improve parchment integration
- Make the section feel printed into the book

Do **not** automatically respond by:

- Adding another border
- Creating another card
- Adding rounded corners
- Adding a gradient background
- Adding a glowing box shadow

When asked to make something more ornate, first ask:

> Would this object exist as a separate physical panel on a real parchment page?

If no, prefer typography, whitespace, dividers, or small ornaments instead.

---

# CSS / Layout Preference

Use standard layout tools such as:

- CSS Grid
- Flexbox
- Absolute positioning only where the illustrated scene requires it
- CSS custom properties for repeated colors and spacing

Do not use hardcoded pixel positioning for normal book-page content unless necessary.

Absolute positioning is acceptable for scene-object hitboxes because those correspond to locations in a background illustration.

---

# Scene Hotspot Architecture

Interactive objects on the tavern page should be implemented in a way that supports future additions.

Conceptually:

```js
const hotspots = [
    {
        id: "bartender",
        label: "Talk to the bartender",
        action: "showRules"
    },
    {
        id: "book",
        label: "Open the character book",
        action: "openBook"
    }
];
```

The precise implementation may differ.

The important goal is to avoid embedding all scene logic directly into one large click-handler.

---

# State Flow

The application's major states can be thought of as:

```text
TAVERN
  ├── RULES
  └── BOOK
        ├── PLAYER_SELECTION
        ├── CHARACTER_GENERATOR
        └── CHARACTER_RESULT
              └── EXPORT
```

This does not require a large state-management framework.

Use the simplest reliable implementation appropriate to the current project.

---

# Character Generation Reliability

The random generator should be testable independently of the UI.

Where practical, include automated checks for rules such as:

- Valid ability-score ranges
- Correct racial adjustments
- Valid class/race combinations where rules require restrictions
- Correct derived modifiers
- Valid hit points
- Valid saves
- Correct base attack bonus
- Skill-point calculations
- Feat eligibility
- Exported required fields

Large batches of generated characters can be used during development to detect invalid combinations.

For example:

```text
Generate 10,000 characters
        ↓
Validate each character
        ↓
Report any rule violations
```

This testing should operate on generation logic, not through the browser UI.

---

# Browser Testing

Browser-based testing is primarily useful for verifying:

- Layout
- Animations
- Scene hotspot alignment
- Buttons and interactive elements
- Player selection
- Page transitions
- Generated character rendering
- Export button behavior
- Console errors

The visual browser test should complement logic/unit testing, not replace it.

---

# File Organization

A reasonable project organization might resemble:

```text
/src/
    components/
    scenes/
        Tavern/
        Book/
    generator/
        characterGenerator.js
        validators.js
    exporters/
        fantasyGrounds.js
    data/
        races/
        classes/
        feats/
        skills/
    styles/

/assets/
    tavern/
    book/
    characters/
    ornaments/

/tests/
```

Use the actual framework and structure already present in the project rather than reorganizing everything solely to match this example.

---

# Important Scope Rule

When asked to make a small visual or functional change:

**Make the smallest change that correctly accomplishes the request.**

Do not refactor unrelated working code.

Do not replace functioning systems with a new framework without a strong reason.

Do not add future inventory-generation functionality until specifically requested.

---

# Final Experience Goal

The finished site should make a player feel as though they:

1. Walked into a fantasy tavern.
2. Spoke with the bartender about the campaign.
3. Opened a mysterious character ledger.
4. Chose their identity/player.
5. Turned the page.
6. Let fate determine their D&D 3.5 character.
7. Took that character directly into Fantasy Grounds.

The technology should stay in the background.

The fantasy interaction is the interface.
