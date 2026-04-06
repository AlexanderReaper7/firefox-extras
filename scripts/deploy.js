#!/usr/bin/env node

/**
 * Firefox Extras Deployment Script
 *
 * Downloads the latest release from GitHub and installs it to the Firefox profile.
 * Usage:
 *   npm run deploy [version]        - Download and install from GitHub releases
 *   npm run deploy:local            - Install from local chrome/ directory
 *
 * If no version is specified, downloads the latest release.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const { execSync } = require('child_process');

// Configuration
const REPO_OWNER = 'AlexanderReaper7';
const REPO_NAME = 'firefox-extras';
const RELEASE_ASSET_NAME = 'firefox-chrome.zip';

/**
 * Log messages with timestamps
 */
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

/**
 * Download a file from a URL
 */
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);

    https
      .get(url, response => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Handle redirects
          file.close();
          fs.unlinkSync(outputPath);
          return downloadFile(response.headers.location, outputPath).then(resolve).catch(reject);
        }

        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(outputPath);
          return reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });

        file.on('error', err => {
          file.close();
          fs.unlinkSync(outputPath);
          reject(err);
        });
      })
      .on('error', err => {
        file.close();
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
        reject(err);
      });
  });
}

/**
 * Extract zip file using system commands
 */
function extractZip(zipPath, outputDir) {
  return new Promise((resolve, reject) => {
    try {
      const platform = os.platform();
      let command;

      if (platform === 'win32') {
        // Use PowerShell on Windows
        command = `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outputDir}' -Force"`;
      } else {
        // Use unzip on Unix-like systems (macOS, Linux)
        command = `unzip -o "${zipPath}" -d "${outputDir}"`;
      }

      execSync(command, { stdio: 'pipe' });
      resolve();
    } catch (error) {
      reject(new Error(`Failed to extract zip: ${error.message}`));
    }
  });
}

/**
 * Find Firefox profiles directory based on OS
 */
function getFirefoxProfilesDir() {
  const platform = os.platform();
  const homeDir = os.homedir();

  switch (platform) {
    case 'win32':
      return path.join(homeDir, 'AppData', 'Roaming', 'Mozilla', 'Firefox', 'Profiles');
    case 'darwin':
      return path.join(homeDir, 'Library', 'Application Support', 'Firefox', 'Profiles');
    case 'linux':
      return path.join(homeDir, '.mozilla', 'firefox');
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Find the active Firefox profile
 */
function findActiveProfile() {
  const profilesDir = getFirefoxProfilesDir();

  if (!fs.existsSync(profilesDir)) {
    throw new Error(`Firefox profiles directory not found: ${profilesDir}`);
  }

  const profiles = fs
    .readdirSync(profilesDir)
    .filter(dir => fs.statSync(path.join(profilesDir, dir)).isDirectory())
    .filter(dir => !dir.startsWith('.') && dir.includes('.'))
    .sort((a, b) => {
      // Prefer default profile
      if (a.includes('default')) return -1;
      if (b.includes('default')) return 1;
      return 0;
    });

  if (profiles.length === 0) {
    throw new Error('No Firefox profiles found');
  }

  if (profiles.length > 1) {
    log(`Found multiple profiles: ${profiles.join(', ')}`);
    log(`Using: ${profiles[0]}`);
  }

  return path.join(profilesDir, profiles[0]);
}

/**
 * Update Firefox preferences
 */
function updateFirefoxPreferences(profileDir) {
  const userJsPath = path.join(profileDir, 'user.js');
  const prefLine = 'user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);';

  try {
    let content = '';
    if (fs.existsSync(userJsPath)) {
      content = fs.readFileSync(userJsPath, 'utf8');
    }

    // Check if preference is already set
    if (content.includes('toolkit.legacyUserProfileCustomizations.stylesheets')) {
      // Update existing preference
      content = content.replace(
        /user_pref\("toolkit\.legacyUserProfileCustomizations\.stylesheets",\s*(true|false)\);/,
        prefLine
      );
    } else {
      // Add new preference
      content += `\n${prefLine}\n`;
    }

    fs.writeFileSync(userJsPath, content);
    log('Updated Firefox preferences to enable legacy user profile customizations');
  } catch (error) {
    log(`Warning: Could not update Firefox preferences: ${error.message}`, 'error');
    log('Please manually set toolkit.legacyUserProfileCustomizations.stylesheets = true in about:config');
  }
}

/**
 * Get release information from GitHub API
 */
function getRelease(version = 'latest') {
  return new Promise((resolve, reject) => {
    const apiUrl =
      version === 'latest'
        ? `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`
        : `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/${version}`;

    https
      .get(
        apiUrl,
        {
          headers: {
            'User-Agent': 'firefox-extras-deploy',
          },
        },
        response => {
          let data = '';

          response.on('data', chunk => {
            data += chunk;
          });

          response.on('end', () => {
            if (response.statusCode !== 200) {
              return reject(new Error(`GitHub API error: ${response.statusCode}`));
            }

            try {
              const release = JSON.parse(data);
              resolve(release);
            } catch (error) {
              reject(new Error(`Failed to parse GitHub API response: ${error.message}`));
            }
          });
        }
      )
      .on('error', reject);
  });
}

/**
 * Find the Firefox installation directory based on OS
 */
function getFirefoxInstallDir() {
  const platform = os.platform();
  if (platform === 'win32') {
    const candidates = [
      path.join('C:\\Program Files\\Mozilla Firefox'),
      path.join('C:\\Program Files (x86)\\Mozilla Firefox'),
    ];
    for (const c of candidates) {
      if (fs.existsSync(path.join(c, 'firefox.exe'))) return c;
    }
    throw new Error('Could not find Firefox installation directory.');
  }
  if (platform === 'darwin') {
    return '/Applications/Firefox.app/Contents/Resources';
  }
  if (platform === 'linux') {
    const candidates = ['/usr/lib/firefox', '/usr/lib64/firefox', '/usr/share/firefox', '/opt/firefox'];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    throw new Error('Could not find Firefox installation directory.');
  }
  throw new Error(`Unsupported platform: ${platform}`);
}

/**
 * Deploy the vendored fx-autoconfig loader files
 */
function deployLoader(profileDir) {
  const vendorDir = path.join(__dirname, '..', 'vendor', 'fx-autoconfig');

  if (!fs.existsSync(vendorDir)) {
    log('Vendor directory not found: ' + vendorDir, 'error');
    log('The fx-autoconfig loader files should be in vendor/fx-autoconfig/');
    return;
  }

  // Profile-side: utils/ files
  const srcUtils = path.join(vendorDir, 'profile', 'chrome', 'utils');
  const destUtils = path.join(profileDir, 'chrome', 'utils');
  fs.mkdirSync(destUtils, { recursive: true });
  for (const file of fs.readdirSync(srcUtils)) {
    fs.copyFileSync(path.join(srcUtils, file), path.join(destUtils, file));
    log(`Deployed loader: ${file} -> chrome/utils/`);
  }

  // Ensure loader-required directories exist in the profile
  for (const dir of ['chrome/JS', 'chrome/CSS', 'chrome/resources']) {
    fs.mkdirSync(path.join(profileDir, dir), { recursive: true });
  }

  // Install-dir-side: program files (may need elevation)
  try {
    const ffInstall = getFirefoxInstallDir();
    log(`Firefox install directory: ${ffInstall}`);

    fs.copyFileSync(path.join(vendorDir, 'program', 'config.js'), path.join(ffInstall, 'config.js'));
    log('Deployed: config.js -> Firefox install dir');

    const prefDest = path.join(ffInstall, 'defaults', 'pref');
    fs.mkdirSync(prefDest, { recursive: true });
    fs.copyFileSync(
      path.join(vendorDir, 'program', 'defaults', 'pref', 'config-prefs.js'),
      path.join(prefDest, 'config-prefs.js')
    );
    log('Deployed: config-prefs.js -> Firefox install dir/defaults/pref/');
    log('Loader deployed to Firefox install directory successfully!', 'success');
  } catch (error) {
    log(`Could not deploy loader to Firefox install directory: ${error.message}`, 'error');
    log('You may need to run as Administrator (Windows) or with sudo (Linux/macOS).');
    log('Manually copy vendor/fx-autoconfig/program/config.js to your Firefox installation directory.');
    log('Manually copy vendor/fx-autoconfig/program/defaults/pref/config-prefs.js to <FF install>/defaults/pref/');
  }
}

async function deployLocal() {
  try {
    log('Starting local deployment of firefox-extras');

    // Find Firefox profile
    log('Finding Firefox profile...');
    const profileDir = findActiveProfile();
    log(`Using Firefox profile: ${profileDir}`);

    // Check if local chrome directory exists
    const localChromeDir = path.join(__dirname, '..', 'chrome');
    if (!fs.existsSync(localChromeDir)) {
      throw new Error('Local chrome/ directory not found. Run "npm run build" first.');
    }

    // Copy chrome directory to profile
    const targetChromeDir = path.join(profileDir, 'chrome');
    fs.mkdirSync(targetChromeDir, { recursive: true });

    const files = fs.readdirSync(localChromeDir);
    for (const file of files) {
      const srcPath = path.join(localChromeDir, file);
      const destPath = path.join(targetChromeDir, file);
      // Only copy files (not subdirectories like JS/, CSS/, resources/)
      if (fs.statSync(srcPath).isFile()) {
        fs.copyFileSync(srcPath, destPath);
        log(`Copied ${file} to Firefox profile`);
      }
    }

    // Copy chrome subdirectories (JS/, CSS/, resources/)
    for (const subdir of ['JS', 'CSS', 'resources']) {
      const srcSubdir = path.join(localChromeDir, subdir);
      if (fs.existsSync(srcSubdir)) {
        const destSubdir = path.join(targetChromeDir, subdir);
        fs.mkdirSync(destSubdir, { recursive: true });
        for (const file of fs.readdirSync(srcSubdir)) {
          const srcPath = path.join(srcSubdir, file);
          const destPath = path.join(destSubdir, file);
          if (fs.statSync(srcPath).isFile()) {
            fs.copyFileSync(srcPath, destPath);
            log(`Copied ${subdir}/${file} to Firefox profile`);
          }
        }
      }
    }

    // Deploy the vendored JS loader
    deployLoader(profileDir);

    // Update Firefox preferences
    updateFirefoxPreferences(profileDir);

    log('Local deployment completed successfully!', 'success');
    log('Please restart Firefox to apply the changes.');
  } catch (error) {
    log(`Local deployment failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

/**
 * Main deployment function
 */
async function deploy() {
  try {
    const args = process.argv.slice(2);
    const version = args[0] || 'latest';

    log(`Starting deployment of firefox-extras ${version}`);

    // Get release information
    log('Fetching release information...');
    const release = await getRelease(version);

    // Find the chrome zip asset
    const asset = release.assets.find(a => a.name === RELEASE_ASSET_NAME);
    if (!asset) {
      throw new Error(`Asset ${RELEASE_ASSET_NAME} not found in release ${release.tag_name}`);
    }

    log(`Found release ${release.tag_name} with asset ${asset.name}`);

    // Find Firefox profile
    log('Finding Firefox profile...');
    const profileDir = findActiveProfile();
    log(`Using Firefox profile: ${profileDir}`);

    // Create temporary directory for download
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'firefox-extras-'));
    const zipPath = path.join(tempDir, RELEASE_ASSET_NAME);

    try {
      // Download the release
      log(`Downloading ${asset.name}...`);
      await downloadFile(asset.browser_download_url, zipPath);
      log('Download completed');

      // Extract to profile directory
      log('Extracting files to Firefox profile...');
      await extractZip(zipPath, profileDir);
      log('Files extracted successfully');

      // Update Firefox preferences
      updateFirefoxPreferences(profileDir);

      log('Deployment completed successfully!', 'success');
      log('Please restart Firefox to apply the changes.');
    } finally {
      // Cleanup
      if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
      }
      fs.rmdirSync(tempDir);
    }
  } catch (error) {
    log(`Deployment failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the deployment
if (require.main === module) {
  const args = process.argv.slice(2);

  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Firefox Extras Deployment Script

Usage:
  npm run deploy                 Download and install latest release
  npm run deploy v1.0.0          Download and install specific version
  npm run deploy:local           Install from local build
  npm run deploy:ps1             PowerShell version (latest release)
  npm run deploy:ps1:local       PowerShell version (local build)
  npm run test:deploy            Test deployment functionality

Options:
  --help, -h                     Show this help message

The deployment script will:
- Automatically detect your Firefox profile directory
- Download the latest release from GitHub (or use local build)
- Extract and install the chrome folder
- Deploy the vendored fx-autoconfig JS loader (utils/ files to profile)
- Copy loader program files to Firefox install directory (may require elevation)
- Configure Firefox preferences
- No external dependencies required!

Supported platforms: Windows, macOS, Linux
PowerShell version: Requires PowerShell Core on non-Windows platforms
Note: Deploying config.js to the Firefox install directory may require running
      as Administrator (Windows) or with sudo (Linux/macOS).
    `);
    process.exit(0);
  }

  if (args.includes('--local')) {
    deployLocal();
  } else {
    deploy();
  }
}

module.exports = { deploy, deployLocal };
