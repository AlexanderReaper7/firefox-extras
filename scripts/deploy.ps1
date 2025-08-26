#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Firefox Extras Deployment Script

.DESCRIPTION
    Downloads the latest release from GitHub and installs it to the Firefox profile.
    This script requires no external dependencies and works on Windows PowerShell,
    PowerShell Core, and cross-platform environments.

.PARAMETER Version
    The version to download. Defaults to 'latest'.

.PARAMETER Local
    Install from local chrome/ directory instead of downloading from GitHub.

.PARAMETER Help
    Show help information.

.EXAMPLE
    .\deploy.ps1
    Downloads and installs the latest release

.EXAMPLE
    .\deploy.ps1 -Version "v1.0.0"
    Downloads and installs version v1.0.0

.EXAMPLE
    .\deploy.ps1 -Local
    Installs from local chrome/ directory

.NOTES
    No external dependencies required. Uses built-in PowerShell cmdlets only.
#>

param(
    [string]$Version = "latest",
    [switch]$Local,
    [switch]$Help
)

# Configuration
$RepoOwner = "AlexanderReaper7"
$RepoName = "firefox-extras"
$ReleaseAssetName = "firefox-chrome.zip"

# Show help
if ($Help) {
    Write-Host @"

Firefox Extras Deployment Script

Usage:
  .\deploy.ps1                    Download and install latest release
  .\deploy.ps1 -Version v1.0.0    Download and install specific version
  .\deploy.ps1 -Local             Install from local build
  .\deploy.ps1 -Help              Show this help message

The deployment script will:
- Automatically detect your Firefox profile directory
- Download the latest release from GitHub (or use local build)
- Extract and install the chrome folder
- Configure Firefox preferences
- No manual steps required!

Supported platforms: Windows, macOS, Linux (with PowerShell Core)

"@
    exit 0
}

# Logging function
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "Info"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
    $prefix = switch ($Level) {
        "Error" { "❌" }
        "Success" { "✅" }
        default { "ℹ️" }
    }
    
    Write-Host "$prefix [$timestamp] $Message"
}

# Get Firefox profiles directory based on OS
function Get-FirefoxProfilesDirectory {
    $platform = [System.Environment]::OSVersion.Platform
    $homeDir = [System.Environment]::GetFolderPath("UserProfile")
    
    if ($IsWindows -or $platform -eq "Win32NT") {
        return Join-Path $env:APPDATA "Mozilla\Firefox\Profiles"
    }
    elseif ($IsMacOS -or $platform -eq "MacOSX") {
        return Join-Path $homeDir "Library/Application Support/Firefox/Profiles"
    }
    elseif ($IsLinux -or $platform -eq "Unix") {
        return Join-Path $homeDir ".mozilla/firefox"
    }
    else {
        throw "Unsupported platform: $platform"
    }
}

# Find active Firefox profile
function Find-ActiveFirefoxProfile {
    $profilesDir = Get-FirefoxProfilesDirectory
    
    if (-not (Test-Path $profilesDir)) {
        throw "Firefox profiles directory not found: $profilesDir"
    }
    
    $profiles = Get-ChildItem $profilesDir -Directory | 
                Where-Object { $_.Name -match '\.' -and -not $_.Name.StartsWith('.') } |
                Sort-Object { if ($_.Name -match 'default') { 0 } else { 1 } }
    
    if ($profiles.Count -eq 0) {
        throw "No Firefox profiles found"
    }
    
    if ($profiles.Count -gt 1) {
        Write-Log "Found multiple profiles: $($profiles.Name -join ', ')"
        Write-Log "Using: $($profiles[0].Name)"
    }
    
    return $profiles[0].FullName
}

# Update Firefox preferences
function Update-FirefoxPreferences {
    param([string]$ProfileDir)
    
    $userJsPath = Join-Path $ProfileDir "user.js"
    $prefLine = 'user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);'
    
    try {
        $content = ""
        if (Test-Path $userJsPath) {
            $content = Get-Content $userJsPath -Raw
        }
        
        # Check if preference is already set
        if ($content -match 'toolkit\.legacyUserProfileCustomizations\.stylesheets') {
            # Update existing preference
            $content = $content -replace 'user_pref\("toolkit\.legacyUserProfileCustomizations\.stylesheets",\s*(true|false)\);', $prefLine
        }
        else {
            # Add new preference
            $content += "`n$prefLine`n"
        }
        
        Set-Content $userJsPath $content -NoNewline
        Write-Log "Updated Firefox preferences to enable legacy user profile customizations"
    }
    catch {
        Write-Log "Warning: Could not update Firefox preferences: $($_.Exception.Message)" -Level "Error"
        Write-Log "Please manually set toolkit.legacyUserProfileCustomizations.stylesheets = true in about:config"
    }
}

# Get release information from GitHub API
function Get-GitHubRelease {
    param([string]$Version = "latest")
    
    $apiUrl = if ($Version -eq "latest") {
        "https://api.github.com/repos/$RepoOwner/$RepoName/releases/latest"
    } else {
        "https://api.github.com/repos/$RepoOwner/$RepoName/releases/tags/$Version"
    }
    
    try {
        $headers = @{
            'User-Agent' = 'firefox-extras-deploy'
        }
        
        $response = Invoke-RestMethod -Uri $apiUrl -Headers $headers -ErrorAction Stop
        return $response
    }
    catch {
        throw "Failed to get release information: $($_.Exception.Message)"
    }
}

# Download file with progress
function Download-File {
    param(
        [string]$Url,
        [string]$OutputPath
    )
    
    try {
        Write-Log "Downloading from: $Url"
        Invoke-WebRequest -Uri $Url -OutFile $OutputPath -ErrorAction Stop
        Write-Log "Download completed: $OutputPath"
    }
    catch {
        throw "Failed to download file: $($_.Exception.Message)"
    }
}

# Local deployment function
function Deploy-Local {
    try {
        Write-Log "Starting local deployment of firefox-extras"
        
        # Find Firefox profile
        Write-Log "Finding Firefox profile..."
        $profileDir = Find-ActiveFirefoxProfile
        Write-Log "Using Firefox profile: $profileDir"
        
        # Check if local chrome directory exists
        $scriptDir = Split-Path $MyInvocation.MyCommand.Path -Parent
        $localChromeDir = Join-Path (Split-Path $scriptDir -Parent) "chrome"
        
        if (-not (Test-Path $localChromeDir)) {
            throw "Local chrome/ directory not found. Run build command first."
        }
        
        # Copy chrome directory to profile
        $targetChromeDir = Join-Path $profileDir "chrome"
        if (-not (Test-Path $targetChromeDir)) {
            New-Item $targetChromeDir -ItemType Directory -Force | Out-Null
        }
        
        $files = Get-ChildItem $localChromeDir -File
        foreach ($file in $files) {
            $destPath = Join-Path $targetChromeDir $file.Name
            Copy-Item $file.FullName $destPath -Force
            Write-Log "Copied $($file.Name) to Firefox profile"
        }
        
        # Update Firefox preferences
        Update-FirefoxPreferences $profileDir
        
        Write-Log "Local deployment completed successfully!" -Level "Success"
        Write-Log "Please restart Firefox to apply the changes."
    }
    catch {
        Write-Log "Local deployment failed: $($_.Exception.Message)" -Level "Error"
        exit 1
    }
}

# Main deployment function
function Deploy-Release {
    try {
        Write-Log "Starting deployment of firefox-extras $Version"
        
        # Get release information
        Write-Log "Fetching release information..."
        $release = Get-GitHubRelease $Version
        
        # Find the chrome zip asset
        $asset = $release.assets | Where-Object { $_.name -eq $ReleaseAssetName }
        if (-not $asset) {
            throw "Asset $ReleaseAssetName not found in release $($release.tag_name)"
        }
        
        Write-Log "Found release $($release.tag_name) with asset $($asset.name)"
        
        # Find Firefox profile
        Write-Log "Finding Firefox profile..."
        $profileDir = Find-ActiveFirefoxProfile
        Write-Log "Using Firefox profile: $profileDir"
        
        # Create temporary directory for download
        $tempDir = Join-Path $env:TEMP "firefox-extras-$(Get-Random)"
        New-Item $tempDir -ItemType Directory -Force | Out-Null
        $zipPath = Join-Path $tempDir $ReleaseAssetName
        
        try {
            # Download the release
            Write-Log "Downloading $($asset.name)..."
            Download-File $asset.browser_download_url $zipPath
            
            # Extract to profile directory
            Write-Log "Extracting files to Firefox profile..."
            Expand-Archive $zipPath $profileDir -Force
            Write-Log "Files extracted successfully"
            
            # Update Firefox preferences
            Update-FirefoxPreferences $profileDir
            
            Write-Log "Deployment completed successfully!" -Level "Success"
            Write-Log "Please restart Firefox to apply the changes."
        }
        finally {
            # Cleanup
            if (Test-Path $tempDir) {
                Remove-Item $tempDir -Recurse -Force
            }
        }
    }
    catch {
        Write-Log "Deployment failed: $($_.Exception.Message)" -Level "Error"
        exit 1
    }
}

# Main execution
if ($Local) {
    Deploy-Local
} else {
    Deploy-Release
}