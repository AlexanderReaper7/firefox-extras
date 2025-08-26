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
const yauzl = require('yauzl');

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
 * Extract zip file
 */
function extractZip(zipPath, outputDir) {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(err);

      zipfile.readEntry();
      zipfile.on('entry', entry => {
        const outputPath = path.join(outputDir, entry.fileName);

        if (/\/$/.test(entry.fileName)) {
          // Directory
          fs.mkdirSync(outputPath, { recursive: true });
          zipfile.readEntry();
        } else {
          // File
          fs.mkdirSync(path.dirname(outputPath), { recursive: true });
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) return reject(err);

            const writeStream = fs.createWriteStream(outputPath);
            readStream.pipe(writeStream);

            writeStream.on('close', () => {
              zipfile.readEntry();
            });

            writeStream.on('error', reject);
          });
        }
      });

      zipfile.on('end', () => {
        resolve();
      });

      zipfile.on('error', reject);
    });
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
 * Local deployment function - installs from local chrome/ directory
 */
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
      fs.copyFileSync(srcPath, destPath);
      log(`Copied ${file} to Firefox profile`);
    }

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

  if (args.includes('--local')) {
    deployLocal();
  } else {
    deploy();
  }
}

module.exports = { deploy, deployLocal };
