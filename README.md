# Firefox Extras: Refined Findbar (centered, fixed, scalable)

This repository provides a Firefox `chrome/` customization focused on a refined findbar:
- Fixed and optionally centered positioning
- Scale factor (e.g., 150%) including font-size and spacing
- Side margin (defaults to float distance)
- CI builds compiled CSS and attaches it to GitHub Releases (not committed to source)

Attribution
- Based on and inspired by: https://github.com/ravindUwU/firefox-refined-findbar

---

## Install

Option A: Download from Releases (recommended)
1) Go to Releases and download:
   - `firefox-chrome.zip` (contains `chrome/userChrome.css` and compiled `chrome/findbar.css`)
2) Open your Firefox profile (about:profiles → your profile → Open Folder).
3) Extract `chrome/` from the zip into your profile directory (merge if asked).
4) Ensure `about:config` → `toolkit.legacyUserProfileCustomizations.stylesheets = true`.
5) Restart Firefox.

Option B: Build locally
1) `npm install`
2) `npm run build` (outputs `chrome/findbar.css` locally; note it’s ignored by git)
3) Copy the `chrome/` folder into your Firefox profile and restart Firefox.

---

## Customize (easy)

- Helper page (GitHub Pages): https://AlexanderReaper7.github.io/firefox-extras/
  - Click “Copy SCSS”
  - Open the Sass Playground: https://sass-lang.com/playground/
  - Paste into the SCSS pane, tweak options, copy generated CSS into `chrome/findbar.css`.

---

## Options (SCSS)

New options:
- `$fixed: true|false` — viewport anchoring
- `$centered: true|false` — horizontal centering
- `$scale: number` — scale overall size (1.5 = 150%)
- `$side-margin: length|null` — default `null` uses `$float-distance`

Example:
```scss
@include refined-findbar(
  $float: true,
  $float-alignment: top,
  $float-distance: 18px,
  $buttons: true,
  $buttons-grouped: true,
  $hide-close-button: false,
  $hide-when-unfocused: false,
  $opacity-when-unfocused: 1,
  $order: (
    TEXT_BOX,
    CHECKBOX_HIGHLIGHT_ALL,
    CHECKBOX_MATCH_CASE,
    CHECKBOX_MATCH_DIACRITICS,
    CHECKBOX_WHOLE_WORDS,
    LABELS,
    DESCRIPTION,
  ),
  $fixed: true,
  $centered: true,
  $scale: 1.5,
  $side-margin: null
);
```

---

## Repo layout

- `chrome/userChrome.css` — imports the compiled `findbar.css` at runtime.
- `src/refined-findbar.scss` — the mixin and styles
- `src/findbar.scss` — entry file configuring options
- `docs/` — helper page for Sass Playground (published via GitHub Pages)
- GitHub Actions:
  - `release.yml`: builds compiled CSS on tag push, uploads release assets
  - `pages.yml`: publishes `docs/` to GitHub Pages

Note: `chrome/findbar.css` is generated and excluded from source. It is included only in Releases.

---

## FAQ

- Can I reload userChrome.css without restarting Firefox?
  - No; restart is required. Use the Browser Toolbox for temporary iteration, then restart.

---

## License

MIT (see LICENSE). Please retain attribution to the original project linked above.