# Vendored: MrOtherGuy/fx-autoconfig

- **Upstream:** https://github.com/MrOtherGuy/fx-autoconfig
- **Pinned commit:** `8da9268f7afcbf5d438b099e976fe8aa46a111d0` (2026-03-09)
- **Loader version:** `0.10.12` (see `profile/chrome/utils/boot.sys.mjs` header)
- **License:** GPL-3.0 (see upstream repo — https://github.com/MrOtherGuy/fx-autoconfig/blob/master/LICENSE)

## Files vendored

| Local path | Upstream path | Deploy destination |
|---|---|---|
| `program/config.js` | `program/config.js` | `<FF install dir>/config.js` |
| `program/defaults/pref/config-prefs.js` | `program/defaults/pref/config-prefs.js` | `<FF install dir>/defaults/pref/config-prefs.js` |
| `profile/chrome/utils/boot.sys.mjs` | `profile/chrome/utils/boot.sys.mjs` | `<profile>/chrome/utils/boot.sys.mjs` |
| `profile/chrome/utils/chrome.manifest` | `profile/chrome/utils/chrome.manifest` | `<profile>/chrome/utils/chrome.manifest` |
| `profile/chrome/utils/fs.sys.mjs` | `profile/chrome/utils/fs.sys.mjs` | `<profile>/chrome/utils/fs.sys.mjs` |
| `profile/chrome/utils/module_loader.mjs` | `profile/chrome/utils/module_loader.mjs` | `<profile>/chrome/utils/module_loader.mjs` |
| `profile/chrome/utils/uc_api.sys.mjs` | `profile/chrome/utils/uc_api.sys.mjs` | `<profile>/chrome/utils/uc_api.sys.mjs` |
| `profile/chrome/utils/utils.sys.mjs` | `profile/chrome/utils/utils.sys.mjs` | `<profile>/chrome/utils/utils.sys.mjs` |

## Updating

1. Review changes between pinned commit and new commit on upstream:
   `https://github.com/MrOtherGuy/fx-autoconfig/compare/<old-sha>...<new-sha>`
2. Audit the diff — pay particular attention to `boot.sys.mjs` (the core loader)
3. Copy the updated files into this directory, maintaining the same layout
4. Update the pinned commit, date, and version in this file
5. Commit with message: `chore: update fx-autoconfig vendor to <new-sha>`

## Replacing with a different loader

Delete this directory and replace with a new `vendor/<loader-name>/` following
the same layout convention. Update `scripts/deploy.ps1` and `scripts/deploy.js`
to point at the new vendor paths.
