# Firefox Extras: Refined Findbar (centered, fixed, scalable)

This repository provides a Firefox `chrome/` customization focused on a refined
findbar:

- Fixed and optionally centered positioning
- Scale factor (e.g., 150%) including font-size and spacing
- Side margin (defaults to float distance)
- CI builds compiled CSS and attaches it to GitHub Releases (not committed to
  source)

Attribution

- Based on and inspired by: https://github.com/ravindUwU/firefox-refined-findbar

---

## Install

Option A: Quick Install (Recommended)

To install automatically via PowerShell (no manual downloads needed), run:
PowerShell

iwr https://raw.githubusercontent.com/AlexanderReaper7/firefox-extras/main/scripts/deploy.ps1 | iex

    No dependencies: Only PowerShell required (Windows PowerShell or PowerShell Core on macOS/Linux)
    What it does:
        Finds your active Firefox profile
        Downloads and installs the latest release
        Configures required preferences
        No manual steps or zip file handling

    PowerShell Core required on non-Windows platforms.
    Always review remote scripts before running.


Option B: Manual Installation

1. Go to Releases and download:
   - `firefox-chrome.zip` (contains `chrome/userChrome.css` and compiled
     `chrome/findbar.css`)
2. Open your Firefox profile (about:profiles → your profile → Open Folder).
3. Extract `chrome/` from the zip into your profile directory (merge if asked).
4. Ensure `about:config` →
   `toolkit.legacyUserProfileCustomizations.stylesheets = true`.
5. Restart Firefox.

Option B: Build locally

1. `npm install`
2. `npm run build` (outputs `chrome/findbar.css` locally; note it’s ignored by
   git)
3. Copy the `chrome/` folder into your Firefox profile and restart Firefox.

Option C: Automated deployment

**Node.js version (cross-platform):**

1. `npm install`
2. `npm run deploy` (downloads latest release and installs automatically)
   - Or `npm run deploy v1.0.0` to install a specific version
   - Or `npm run deploy:local` to install from local build

**PowerShell version:**

1. `pwsh scripts/deploy.ps1` (downloads latest release and installs
   automatically)
   - Or `pwsh scripts/deploy.ps1 -Version v1.0.0` to install a specific version
   - Or `pwsh scripts/deploy.ps1 -Local` to install from local build
   - Or use npm: `npm run deploy:ps1` / `npm run deploy:ps1:local`

The deployment command will:

- Automatically find your Firefox profile directory
- Download and extract the latest release
- Install the chrome folder to your profile
- Configure Firefox preferences
- No manual steps required!

**Supported platforms:** Windows, macOS, Linux  
**PowerShell version:** Requires PowerShell Core on non-Windows platforms

---

## Customize (easy)

- Helper page (GitHub Pages): https://AlexanderReaper7.github.io/firefox-extras/
  - Click “Copy SCSS”
  - Open the Sass Playground: https://sass-lang.com/playground/
  - Paste into the SCSS pane, tweak options, copy generated CSS into
    `chrome/findbar.css`.

---

## Development

For developers working on this project, we provide an optimized environment:

### Quick Start

```bash
npm install          # Install dependencies
npm run dev         # Start development (watch mode)
npm run validate    # Run linting, formatting, and build
```

### Features

- **GitHub Copilot Integration**: VS Code workspace configured for optimal
  Copilot experience
- **Code Quality**: Stylelint for SCSS linting, Prettier for formatting
- **Hot Reload**: Watch mode for automatic rebuilding during development
- **Validation**: Pre-commit hooks and validation scripts

### VS Code Setup

This project includes VS Code workspace settings with:

- GitHub Copilot enabled and optimized
- Recommended extensions for SCSS/CSS development
- Auto-formatting on save
- File associations and syntax highlighting

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development instructions.

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

Note: `chrome/findbar.css` is generated and excluded from source. It is included
only in Releases.

---

## FAQ

- Can I reload userChrome.css without restarting Firefox?
  - No; restart is required. Use the Browser Toolbox for temporary iteration,
    then restart.

---

## License

MIT (see LICENSE). Please retain attribution to the original project linked
above.
