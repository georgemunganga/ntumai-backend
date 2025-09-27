# Run-Tests-Batch.ps1
# Script to run e2e tests in batches

# Configuration
$testFolders = @(
    "auth",
    "users",
    "marketplace",
    "drivers",
    "errands",
    "integration"
)

# Colors for console output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

# Display banner
Write-ColorOutput Blue "==================================="
Write-ColorOutput Blue "   NTU MAI Backend Test Runner"
Write-ColorOutput Blue "==================================="
Write-Output ""

# Check if Jest is installed
try {
    $jestVersion = npx jest --version
    Write-ColorOutput Green "Jest version: $jestVersion"
} catch {
    Write-ColorOutput Red "Jest not found. Please make sure Jest is installed."
    Write-ColorOutput Yellow "Run 'npm install --save-dev jest' to install Jest."
    exit 1
}

# Ensure test directories exist
foreach ($folder in $testFolders) {
    $folderPath = Join-Path -Path "$PWD\test" -ChildPath $folder
    if (-not (Test-Path -Path $folderPath)) {
        New-Item -ItemType Directory -Path $folderPath -Force | Out-Null
        Write-ColorOutput Yellow "Created missing test directory: $folder"
    }
}

# Run tests
$results = @()
$allPassed = $true
$batchMode = $true

# Check if a specific module was requested
param(
    [Parameter(Position=0)]
    [string]$specificModule,
    
    [Parameter()]
    [switch]$interactive
)

if ($specificModule) {
    if ($testFolders -contains $specificModule) {
        $testFolders = @($specificModule)
        Write-ColorOutput Magenta "Running tests only for module: $specificModule"
    } else {
        Write-ColorOutput Red "Module '$specificModule' not found in test folders."
        Write-ColorOutput Yellow "Available modules: $($testFolders -join ', ')"
        exit 1
    }
}

# Interactive mode
if ($interactive) {
    $batchMode = $false
    Write-ColorOutput Cyan "Interactive mode enabled. You will be prompted before each test module."
}

foreach ($folder in $testFolders) {
    $testPath = Join-Path -Path "$PWD\test" -ChildPath $folder
    $testFiles = Get-ChildItem -Path $testPath -Filter "*.e2e-spec.ts" -ErrorAction SilentlyContinue
    
    if ($testFiles.Count -eq 0) {
        Write-ColorOutput Yellow "No test files found in $folder"
        continue
    }
    
    if (-not $batchMode) {
        $response = Read-Host "Run tests for $folder module? (y/n/skip)"
        if ($response -eq "n") {
            exit 0
        }
        if ($response -eq "skip") {
            Write-ColorOutput Yellow "Skipping $folder module tests"
            continue
        }
    }
    
    Write-ColorOutput Magenta "Running tests for $folder module..."
    
    foreach ($file in $testFiles) {
        $relativePath = "$folder/$($file.Name)"
        Write-ColorOutput Blue "Testing: $relativePath"
        
        try {
            $output = npx jest --config ./test/jest-e2e.json $relativePath 2>&1
            $results += @{ module = $folder; file = $file.Name; passed = $true }
            Write-ColorOutput Green "✓ Passed: $relativePath"
            Write-Output ""
        } catch {
            $results += @{ module = $folder; file = $file.Name; passed = $false }
            Write-ColorOutput Red "✗ Failed: $relativePath"
            Write-Output $_.Exception.Message
            Write-Output ""
            $allPassed = $false
        }
    }
}

# Report summary
Write-ColorOutput Blue "=== Test Summary ==="

$passedTests = ($results | Where-Object { $_.passed -eq $true }).Count
$totalTests = $results.Count

if ($totalTests -gt 0) {
    $passRate = [Math]::Round(($passedTests / $totalTests) * 100)
    
    Write-Output "Tests: $totalTests, Passed: $passedTests, Failed: $($totalTests - $passedTests), Pass Rate: $passRate%"
    
    if ($allPassed) {
        Write-ColorOutput Green "All tests passed successfully!"
    } else {
        Write-ColorOutput Red "Some tests failed. Check the output above for details."
        
        # List failed tests
        Write-ColorOutput Red "Failed tests:"
        $failedTests = $results | Where-Object { $_.passed -eq $false }
        foreach ($test in $failedTests) {
            Write-ColorOutput Red "- $($test.module)/$($test.file)"
        }
    }
} else {
    Write-ColorOutput Yellow "No tests were executed."
}

# Return exit code based on test results
if (-not $allPassed) {
    exit 1
}