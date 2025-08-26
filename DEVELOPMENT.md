# Development Tasks and Scripts

This project includes several npm scripts to help with development workflow:

## Build Commands

- `npm run build` - Compile SCSS to CSS (one-time build)
- `npm run build:watch` - Watch for changes and auto-compile
- `npm run dev` - Alias for build:watch (development mode)

## Code Quality

- `npm run lint` - Run stylelint on SCSS files
- `npm run lint:fix` - Auto-fix linting issues where possible
- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check if files are properly formatted

## Validation

- `npm run validate` - Run full validation (lint + format check + build)
- `npm run clean` - Remove generated CSS files

## Deployment

**Node.js version (cross-platform):**

- `npm run deploy` - Download and install latest release to Firefox profile
- `npm run deploy:local` - Install from local build to Firefox profile
- `npm run test:deploy` - Test deployment functionality without installing

**PowerShell version (no dependencies required):**

- `npm run deploy:ps1` - PowerShell version (latest release)
- `npm run deploy:ps1:local` - PowerShell version (local build)
- Direct: `pwsh scripts/deploy.ps1` or `pwsh scripts/deploy.ps1 -Local`

Both versions automatically detect Firefox profiles and configure preferences.

## Development Workflow

1. **Setup**: `npm install`
2. **Development**: `npm run dev` (starts watching for changes)
3. **Validate**: `npm run validate` (before committing)
4. **Build**: `npm run build` (for final output)

## VS Code Integration

This project includes VS Code workspace settings that:

- Enable GitHub Copilot for all file types
- Configure auto-formatting on save
- Set up recommended extensions
- Optimize for SCSS/CSS development

### Recommended Extensions

- GitHub Copilot
- GitHub Copilot Chat
- Prettier - Code formatter
- Stylelint
- SCSS Intellisense
- GitLens

## File Structure

```
├── .vscode/              # VS Code workspace configuration
├── src/                  # Source SCSS files
│   ├── findbar.scss     # Main configuration file
│   └── refined-findbar.scss # Mixin implementation
├── chrome/              # Firefox userChrome files
│   ├── userChrome.css   # Firefox entry point
│   └── findbar.css      # Generated CSS (not in git)
└── docs/                # GitHub Pages helper tool
```

## Firefox Integration

1. Build the CSS: `npm run build`
2. Deploy automatically: `npm run deploy:local` or `npm run deploy:ps1:local`
   - Or manually copy the `chrome/` folder to your Firefox profile
   - And manually enable legacy stylesheets in `about:config`
3. Restart Firefox

## Customization

Edit `src/findbar.scss` to customize the findbar appearance. The file includes
detailed comments explaining each option.
