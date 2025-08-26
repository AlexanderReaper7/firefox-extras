#!/usr/bin/env node

/**
 * Test script for deployment functionality
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Mock Firefox profile detection for testing
function testFirefoxDetection() {
  console.log('Testing Firefox profile detection...');

  const platform = os.platform();
  const homeDir = os.homedir();

  let profilesDir;
  switch (platform) {
    case 'win32':
      profilesDir = path.join(homeDir, 'AppData', 'Roaming', 'Mozilla', 'Firefox', 'Profiles');
      break;
    case 'darwin':
      profilesDir = path.join(homeDir, 'Library', 'Application Support', 'Firefox', 'Profiles');
      break;
    case 'linux':
      profilesDir = path.join(homeDir, '.mozilla', 'firefox');
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  console.log(`Platform: ${platform}`);
  console.log(`Expected profiles directory: ${profilesDir}`);
  console.log(`Directory exists: ${fs.existsSync(profilesDir)}`);

  // Test with mock directory
  const testProfilesDir = '/tmp/firefox-test/.mozilla/firefox';
  if (fs.existsSync(testProfilesDir)) {
    const profiles = fs
      .readdirSync(testProfilesDir)
      .filter(dir => fs.statSync(path.join(testProfilesDir, dir)).isDirectory())
      .filter(dir => !dir.startsWith('.') && dir.includes('.'));

    console.log(`Mock profiles found: ${profiles.join(', ')}`);

    if (profiles.length > 0) {
      const selectedProfile = path.join(testProfilesDir, profiles[0]);
      console.log(`Would use profile: ${selectedProfile}`);
      return selectedProfile;
    }
  }

  return null;
}

// Test preference update
function testPreferenceUpdate(profileDir) {
  if (!profileDir) return;

  console.log('\nTesting preference update...');

  const userJsPath = path.join(profileDir, 'user.js');
  const prefLine = 'user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);';

  try {
    // Create user.js with test content
    fs.writeFileSync(userJsPath, '// Test user.js\n');
    console.log(`Created test user.js at: ${userJsPath}`);

    // Read and update
    let content = fs.readFileSync(userJsPath, 'utf8');
    content += `\n${prefLine}\n`;
    fs.writeFileSync(userJsPath, content);

    console.log('Updated user.js with preference');
    console.log('Final content:');
    console.log(fs.readFileSync(userJsPath, 'utf8'));
  } catch (error) {
    console.error(`Error updating preferences: ${error.message}`);
  }
}

// Test chrome folder creation
function testChromeInstall(profileDir) {
  if (!profileDir) return;

  console.log('\nTesting chrome folder installation...');

  const chromeDir = path.join(profileDir, 'chrome');
  fs.mkdirSync(chromeDir, { recursive: true });

  // Copy current chrome files as test
  const sourceChromeDir = path.join(__dirname, '..', 'chrome');
  if (fs.existsSync(sourceChromeDir)) {
    const files = fs.readdirSync(sourceChromeDir);
    files.forEach(file => {
      const srcPath = path.join(sourceChromeDir, file);
      const destPath = path.join(chromeDir, file);
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${file} to profile chrome directory`);
    });
  }

  console.log(`Chrome directory created at: ${chromeDir}`);
  console.log(`Files in chrome directory: ${fs.readdirSync(chromeDir).join(', ')}`);
}

// Run tests
async function runTests() {
  console.log('🧪 Running deployment functionality tests...\n');

  try {
    const profileDir = testFirefoxDetection();
    testPreferenceUpdate(profileDir);
    testChromeInstall(profileDir);

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}
