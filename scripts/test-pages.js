#!/usr/bin/env node

/**
 * Test script to verify GitHub Pages deployment
 * 
 * This script checks if the GitHub Pages site is accessible and serves the correct content.
 */

const https = require('https');

const GITHUB_PAGES_URL = 'https://alexanderreaper7.github.io/firefox-extras/';

function checkGitHubPages() {
  console.log('🔍 Checking GitHub Pages deployment...');
  console.log(`📡 Testing URL: ${GITHUB_PAGES_URL}`);
  
  return new Promise((resolve, reject) => {
    const request = https.get(GITHUB_PAGES_URL, {
      headers: {
        'User-Agent': 'firefox-extras-test-script',
      },
      timeout: 10000,
    }, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        if (response.statusCode === 200) {
          // Check if the content contains expected elements
          const hasTitle = data.includes('Firefox Refined Findbar');
          const hasScss = data.includes('SCSS template');
          const hasPlayground = data.includes('Sass Playground');
          
          if (hasTitle && hasScss && hasPlayground) {
            console.log('✅ GitHub Pages is working correctly!');
            console.log('📄 Page contains expected content:');
            console.log('   ✓ Title: Firefox Refined Findbar');
            console.log('   ✓ SCSS template section');
            console.log('   ✓ Sass Playground links');
            resolve(true);
          } else {
            console.log('⚠️  GitHub Pages is accessible but content may be incomplete');
            console.log('📄 Content check results:');
            console.log(`   ${hasTitle ? '✓' : '✗'} Title: Firefox Refined Findbar`);
            console.log(`   ${hasScss ? '✓' : '✗'} SCSS template section`);
            console.log(`   ${hasPlayground ? '✓' : '✗'} Sass Playground links`);
            resolve(false);
          }
        } else {
          console.log(`❌ GitHub Pages returned HTTP ${response.statusCode}`);
          reject(new Error(`HTTP ${response.statusCode}`));
        }
      });
    });
    
    request.on('error', (error) => {
      if (error.code === 'ENOTFOUND') {
        console.log('❌ GitHub Pages site not found - may not be deployed yet');
        console.log('💡 This can happen if:');
        console.log('   • GitHub Pages is not enabled in repository settings');
        console.log('   • The deployment workflow hasn\'t run yet');
        console.log('   • DNS propagation is still in progress');
      } else {
        console.log(`❌ Error accessing GitHub Pages: ${error.message}`);
      }
      reject(error);
    });
    
    request.on('timeout', () => {
      console.log('❌ Request timed out');
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function main() {
  try {
    await checkGitHubPages();
    console.log('\n🎉 GitHub Pages test completed successfully!');
  } catch (error) {
    console.log('\n💡 To fix GitHub Pages deployment:');
    console.log('1. Ensure the workflow runs successfully');
    console.log('2. Check repository Settings > Pages');
    console.log('3. Verify "Source" is set to "GitHub Actions"');
    console.log('4. Wait a few minutes for deployment to complete');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkGitHubPages };