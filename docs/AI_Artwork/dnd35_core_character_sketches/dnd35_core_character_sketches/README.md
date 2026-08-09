# D&D 3.5 Core Character Sketches

77 SVG assets:
- 7 core races
- 11 core classes

## Filename format
`race_class.svg`

Examples:
- `human_fighter.svg`
- `half-orc_wizard.svg`
- `half-elf_bard.svg`
- `gnome_druid.svg`

All SVG files use the same `viewBox="0 0 512 512"` so they can be swapped
without changing your page layout.

## JavaScript example

```js
function sketchPath(race, characterClass) {
  const slug = s => s.toLowerCase().replaceAll(" ", "-");
  return `character-sketches/${slug(race)}_${slug(characterClass)}.svg`;
}

characterImage.src = sketchPath("Half-Orc", "Wizard");
```

`manifest.json` contains every race/class/file mapping.
