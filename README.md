# Firefox Extras: Refined Findbar (centered, fixed, scalable)

This repository provides a Firefox `chrome/` customization focused on a refined
findbar.

### Based on and inspired by: https://github.com/ravindUwU/firefox-refined-findbar

## Options (SCSS)

```scss
@include refined-findbar(
  // === Positioning Options ===
  $float: true,
  // Enable floating/overlay mode
  $float-alignment: top,
  // Position at top of viewport
  $float-distance: 18px,

  // Distance from viewport edge
  // === Button Configuration ===
  $buttons: true,
  // Show prev/next navigation buttons
  $buttons-grouped: true,

  // Group buttons visually with text box
  // === Visibility Options ===
  $hide-close-button: false,
  // Show/hide the close button
  $hide-when-unfocused: false,
  // Auto-hide when not in use
  $opacity-when-unfocused: 1,

  // Transparency when not focused (0-1)
  // === Element Order ===
  // Customize the order of findbar elements
  $order: (
      TEXT_BOX,
      // Search input field
      CHECKBOX_HIGHLIGHT_ALL,
      // Highlight all matches option
      CHECKBOX_MATCH_CASE,
      // Case-sensitive search option
      CHECKBOX_MATCH_DIACRITICS,
      // Match diacritics option
      CHECKBOX_WHOLE_WORDS,
      // Whole words only option
      LABELS,
      // Status labels (e.g., "1 of 5")
      DESCRIPTION,
      // Additional descriptions
    ),

  // === Extended Layout Options ===
  $fixed: true,
  // Use fixed positioning (stays in viewport)
  $centered: true,
  // Center horizontally on the page
  $scale: 1.5,
  // Scale factor for size (1.0 = default)
  $side-margin: null // Custom side margins (null = auto)
);
```

---

## Install

Option A: Quick Install (Recommended)

To install automatically via PowerShell (no manual downloads needed), run:
PowerShell

    iwr https://raw.githubusercontent.com/AlexanderReaper7/firefox-extras/main/scripts/deploy.ps1 | iex

PowerShell Core required on non-Windows platforms. **Always review remote
scripts before running.**

Option B: Manual Installation

1. Go to Releases and download:
   - `firefox-chrome.zip` (contains `chrome/userChrome.css` and compiled
     `chrome/findbar.css`)
2. Open your Firefox profile (about:profiles → your profile → Open Folder).
3. Extract `chrome/` from the zip into your profile directory (merge if asked).
4. Ensure `about:config` →
   `toolkit.legacyUserProfileCustomizations.stylesheets = true`.
5. Restart Firefox.

Option C: Build locally

1. `npm install`
2. `npm run build` (outputs `chrome/findbar.css` locally; note it’s ignored by
   git)
3. Copy the `chrome/` folder into your Firefox profile and restart Firefox.

Option D: Automated deployment

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
