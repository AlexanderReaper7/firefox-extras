# Firefox Extras: Refined Findbar

Firefox Extras is a userChrome.css customization project that provides a refined
findbar (centered, fixed, scalable) for Firefox. The project uses SCSS source
files that compile to CSS, with automated deployment scripts for Firefox
installation.

Always reference these instructions first and fallback to search or bash
commands only when you encounter unexpected information that does not match the
info here.

Keep this documentation up-to-date.

## Working Effectively

### Bootstrap and Build

Run these commands to set up the development environment:

```bash
npm install              # Install dependencies (~10 seconds)
npm run build           # Compile SCSS to CSS (~0.5 seconds)
npm run validate        # Full validation: lint + format + build (~2 seconds)
```

All build operations are very fast (< 3 seconds). No extended timeouts needed.

### Development Workflow

1. **Setup**: `npm install`
2. **Development**: `npm run dev` (starts SCSS watch mode for auto-compilation)
3. **Validate**: `npm run validate` (run before committing - takes ~2 seconds)
4. **Deploy**: `npm run deploy:local` (install to Firefox profile)

### Code Quality and Validation

- `npm run lint` - Run stylelint on SCSS files
- `npm run lint:fix` - Auto-fix linting issues where possible
- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check if files are properly formatted
- `npm run clean` - Remove generated CSS files

### Deployment to Firefox

**Node.js version (cross-platform, recommended):**

- `npm run deploy` - Download and install latest release to Firefox profile
- `npm run deploy:local` - Install from local build to Firefox profile
- `npm run test:deploy` - Test deployment functionality without installing

**PowerShell version (no Node.js dependencies required):**

- `npm run deploy:ps1` - PowerShell version (latest release)
- `npm run deploy:ps1:local` - PowerShell version (local build)
- Direct: `pwsh scripts/deploy.ps1` or `pwsh scripts/deploy.ps1 -Local`

Both deployment versions automatically detect Firefox profiles and configure
preferences.

## Manual Validation Scenarios

### After Making Changes to SCSS

1. **Build validation**: `npm run build` - Ensure SCSS compiles without errors
2. **Code quality**: `npm run validate` - Ensure linting and formatting pass
3. **Local deployment**: `npm run deploy:local` - Install to Firefox profile
4. **Firefox testing**:
   - Restart Firefox
   - Open any web page
   - Press Ctrl+F to open findbar
   - Verify findbar appearance (centered, scaled, styled correctly)
   - Test findbar functionality (search, navigation, close button)

### Complete End-to-End Validation

```bash
npm run clean           # Start fresh
npm run build          # Compile SCSS
npm run validate       # Run all quality checks
npm run deploy:local   # Install to Firefox
# Then manually test in Firefox as described above
```

### Firefox Integration Requirements

- Firefox profile must have
  `toolkit.legacyUserProfileCustomizations.stylesheets = true` in about:config
- The `chrome/` folder must be copied to Firefox profile directory
- Firefox restart required after installation

## Build System Details

### File Structure

```
├── src/
│   └── findbar.scss     # Main SCSS source file (edit this to customize)
├── chrome/
│   ├── userChrome.css   # Firefox entry point (imports findbar.css)
│   └── findbar.css      # Generated CSS output (not in git)
├── scripts/
│   ├── deploy.js        # Node.js deployment script
│   ├── deploy.ps1       # PowerShell deployment script
│   └── test-deploy.js   # Test deployment functionality
└── docs/
    └── index.html       # GitHub Pages helper tool
```

### Key Technologies

- **SASS**: SCSS compilation to CSS
- **Stylelint**: SCSS linting with Firefox-specific rules
- **Prettier**: Code formatting
- **Node.js**: Build scripts and deployment
- **PowerShell**: Alternative deployment option

### Generated Files (Git Ignored)

- `chrome/findbar.css` - Compiled CSS output
- `chrome/findbar.css.map` - Source map (when generated)

## Common Tasks

The following are outputs from frequently run commands. Reference them instead
of running bash commands to save time.

### Repository Root Structure

```
ls -la
.editorconfig          # Editor configuration
.git/                  # Git repository data
.github/               # GitHub workflows and settings
.gitignore            # Git ignore rules
.prettierignore       # Prettier ignore rules
.prettierrc           # Prettier configuration
.stylelintrc.json     # Stylelint configuration
.vscode/              # VS Code workspace settings
DEVELOPMENT.md        # Detailed development documentation
LICENSE               # MIT license
README.md             # Project documentation
chrome/               # Firefox userChrome files
docs/                 # GitHub Pages tool
package-lock.json     # NPM lock file
package.json          # NPM package configuration
scripts/              # Deployment and utility scripts
src/                  # SCSS source files
```

### NPM Scripts Summary

```javascript
// From package.json "scripts" section:
"build": "sass src/findbar.scss chrome/findbar.css --no-source-map",
"build:watch": "sass --watch src/findbar.scss:chrome/findbar.css --no-source-map",
"dev": "npm run build:watch",
"lint": "stylelint 'src/**/*.scss'",
"lint:fix": "stylelint 'src/**/*.scss' --fix",
"format": "prettier --write .",
"format:check": "prettier --check .",
"clean": "rm -f chrome/findbar.css chrome/findbar.css.map",
"validate": "npm run lint && npm run format:check && npm run build",
"deploy": "node scripts/deploy.js",
"deploy:local": "node scripts/deploy.js --local",
"deploy:ps1": "pwsh scripts/deploy.ps1",
"deploy:ps1:local": "pwsh scripts/deploy.ps1 -Local",
"test:deploy": "node scripts/test-deploy.js"
```

### Main SCSS Configuration

The `src/findbar.scss` file contains the main configuration options:

- `$float: true` - Enable floating positioning
- `$fixed: true` - Use fixed positioning (stays in viewport)
- `$centered: true` - Center horizontally on page
- `$scale: 1.5` - Scale factor for size (1.0 = default)
- `$side-margin: null` - Custom side margins (null = auto)

### Stylelint Configuration Highlights

Key rules from `.stylelintrc.json`:

- Extends `stylelint-config-standard-scss`
- Firefox-specific property allowlist: `-moz-appearance`, `scrollbar-width`,
  etc.
- Custom selector allowlist: `findbar`, `toolbarbutton`, `description`, etc.
- Ignores generated files: `chrome/findbar.css`, `**/*.css.map`

## Troubleshooting

### Build Issues

- **SCSS compilation errors**: Check syntax in `src/findbar.scss`
- **Missing dependencies**: Run `npm install`
- **Permission errors**: Ensure write access to `chrome/` directory

### Deployment Issues

- **Firefox profile not found**: Deployment scripts auto-detect profiles on
  Windows/macOS/Linux
- **Legacy stylesheets disabled**: Enable
  `toolkit.legacyUserProfileCustomizations.stylesheets = true` in about:config
- **Changes not visible**: Restart Firefox after deployment

### Development Issues

- **Watch mode not working**: Stop with Ctrl+C and restart `npm run dev`
- **Linting failures**: Run `npm run lint:fix` to auto-fix issues
- **Formatting issues**: Run `npm run format` to fix formatting

## Project-Specific Notes

- This project has **no traditional unit tests** - validation is CSS
  compilation + deployment testing
- All operations are **very fast** (< 3 seconds) - no need for extended timeouts
- The project is **Firefox-specific** - requires Firefox for manual testing
- **VS Code integration** is optimized with workspace settings for SCSS
  development
- **GitHub Actions** automatically build and release on version tags
- **Cross-platform deployment** supports Windows, macOS, and Linux
