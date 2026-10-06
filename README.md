# SciFest 2026 demo pages

Visitor pages for the Materials Theory booth, one per demo, reached by QR code. Every page is in Swedish and English on equal footing.

## Files

| Path | What it is |
|---|---|
| `index.html` | Landing page: all 13 demos by station; live pages are links, the rest say "coming soon" |
| `superconductor.html` | Demo page (template for the others) |
| `pvt-surface.html` | Interactive 3D P–V–T surface (made separately; needs internet for three.js) |
| `assets/site.css` | Shared "lab notebook" styles: squared paper, fonts, layout, dark mode, station accents (poster colours) |
| `assets/site.js` | Language switch, quiz, reduced-motion handling |
| `assets/fonts/` | Familjen Grotesk (text) and IBM Plex Mono (labels, measurements), self-hosted, SIL Open Font License |
| `assets/media/` | Videos and images, one set per demo |
| `assets/uu_logo.svg` | Uppsala University logo |
| `content/` | Page text for review, English and Swedish side by side |
| `tools/make_preview.py` | Makes a copy of a page for the Claude Artifact preview (not needed for hosting) |

## How the two languages work

Every piece of text is written twice, as siblings:

```html
<p lang="sv">Svensk text …</p>
<p lang="en">English text …</p>
```

The page shows one language at a time. It starts in the phone's language (Swedish if the phone is neither Swedish nor English), and the Svenska | English switch changes it and remembers the choice. Anything with `class="both"` always shows in both languages (the page title, the switch buttons). Without JavaScript, both languages show.

**Rule: never add text in one language only.**

## Making a new demo page

1. Copy `superconductor.html` and rename it (for example `ferrofluid.html`).
2. Set the station colour on the `.page` wrapper: `data-station="1"`, `"2"`, `"3"`, `"4"` or `"act"`.
3. Update `data-title-sv` / `data-title-en`, the `<title>` and the description.
4. Replace the text section by section, always in both languages.
5. Put the demo's video or image in `assets/media/`.

## Hosting

Plain static files with relative links, so the folder works as-is on GitHub Pages or any web host. No build step, no cookies, no tracking.

## Design ("lab notebook")

- Squared paper background; ink-dark text; each station's poster colour as its accent only (1 violet, 2 blue, 3 rust, 4 green).
- A demo page is a notebook entry: a mono header line (`Försök 02 · Station 1 · T = 77 K`), then lab-report sections
  §1 Observation, §2 Explanation, §3 (a measurement or scale), §4 Going deeper, §5 Applications, §6 Self-test, §7 About us.
- Figures are numbered (`Fig. 1`, `Fig. 2`) with mono captions; diagrams are drawn straight on the grid, to scale where they show numbers.
- Side notes use the `OBS!` box. Avoid cards, pills, icons and emoji.
