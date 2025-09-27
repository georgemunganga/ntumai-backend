# Run-Server-And-Tests.ps1
# Script to start the server and run tests in sequence

# Configuration
$serverPort = 3000
$serverStartTimeout = 15 # seconds
$testBatches = @(
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
Write-ColorOutput Blue "==================================================="
Write-ColorOutput Blue "   NTU MAI Backend Server and Test Runner"
Write-ColorOutput Blue "==================================================="
Write-Output ""

# Parse command line parameters
param(
    [Parameter()]
    [switch]$skipServer,
    
    [Parameter()]
    [string]$testModule,
    
    [Parameter()]
    [switch]$interactive
)

# Check if a specific module was requested
if ($testModule) {
    if ($testBatches -contains $testModule) {
        $testBatches = @($testModule)
        Write-ColorOutput Magenta "Running tests only for module: $testModule"
    } else {
        Write-ColorOutput Red "Module '$testModule' not found in test folders."
        Write-ColorOutput Yellow "Available modules: $($testBatches -join ', ')"
        exit 1
    }
}

# Start the server if not skipped
if (-not $skipServer) {
    # Check if the server is already running on the port
    try {
        $connections = Get-NetTCPConnection -LocalPort $serverPort -ErrorAction SilentlyContinue
        if ($connections) {
            Write-ColorOutput Yellow "[WARNING] Port $serverPort is already in use!"
            Write-ColorOutput Yellow "The server might already be running or another application is using this port."
            
            $response = Read-Host "Do you want to force close the application using port $serverPort? (y/n)"
            if ($response -eq "y") {
                foreach ($conn in $connections) {
                    $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
                    if ($process) {
                        Write-ColorOutput Yellow "Stopping process: $($process.ProcessName) (PID: $($process.Id))"
                        Stop-Process -Id $process.Id -Force
                        Write-ColorOutput Green "Process stopped."
                    }
                }
            } else {
                Write-ColorOutput Red "Server start aborted. Please free up port $serverPort and try again."
                exit 1
            }
        }
    } catch {
        Write-ColorOutput Gray "[INFO] Unable to check port status. Continuing..."
    }

    # Start the server in development mode
    Write-ColorOutput Cyan "[INFO] Starting NestJS server in development mode..."

    # Start the server in a new job
    $job = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        npm run start:dev
    }

    # Wait for the server to start
    Write-ColorOutput Cyan "[INFO] Waiting for server to initialize (timeout: $serverStartTimeout seconds)..."

    $startTime = Get-Date
    $serverStarted = $false

    while ((Get-Date).Subtract($startTime).TotalSeconds -lt $serverStartTimeout) {
        Start-Sleep -Seconds 1
        
        # Check if the port is now in use
        try {
            $connections = Get-NetTCPConnection -LocalPort $serverPort -ErrorAction SilentlyContinue
            if ($connections) {
                $serverStarted = $true
                break
            }
        } catch {}
        
        # Check job status
        $jobStatus = Receive-Job -Job $job
        if ($jobStatus -match "Nest application successfully started") {
            $serverStarted = $true
            break
        }
    }

    if (-not $serverStarted) {
        Write-ColorOutput Red "[ERROR] Server failed to start within the timeout period."
        Stop-Job -Job $job
        Remove-Job -Job $job
        exit 1
    }

    Write-ColorOutput Green "[SUCCESS] Server started successfully!"
    Write-ColorOutput Green "Server is running at http://localhost:$serverPort"
    Write-Output ""
} else {
    Write-ColorOutput Yellow "[INFO] Skipping server start as requested."
    Write-ColorOutput Yellow "Make sure the server is already running at http://localhost:$serverPort"
    Write-Output ""
}

# Run tests
Write-ColorOutput Blue "=== Running Tests ==="

$results = @()
$allPassed = $true
$batchMode = -not $interactive

# Ensure test directories exist
foreach ($batch in $testBatches) {
    $folderPath = Join-Path -Path "$PWD\test" -ChildPath $batch
    if (-not (Test-Path -Path $folderPath)) {
        New-Item -ItemType Directory -Path $folderPath -Force | Out-Null
        Write-ColorOutput Yellow "Created missing test directory: $batch"
    }
}

foreach ($batch in $testBatches) {
    $testPath = Join-Path -Path "$PWD\test" -ChildPath $batch
    $testFiles = Get-ChildItem -Path $testPath -Filter "*.e2e-spec.ts" -ErrorAction SilentlyContinue
    
    if ($testFiles.Count -eq 0) {
        Write-ColorOutput Yellow "No test files found in $batch"
        continue
    }
    
    if (-not $batchMode) {
        $response = Read-Host "Run tests for $batch module? (y/n/skip)"
        if ($response -eq "n") {
            break
        }
        if ($response -eq "skip") {
            Write-ColorOutput Yellow "Skipping $batch module tests"
            continue
        }
    }
    
    Write-ColorOutput Magenta "Running tests for $batch module..."
    
    foreach ($file in $testFiles) {
        $relativePath = "$batch/$($file.Name)"
        Write-ColorOutput Blue "Testing: $relativePath"
        
        try {
            $output = npx jest --config ./test/jest-e2e.json $relativePath 2>&1
            $results += @{ module = $batch; file = $file.Name; passed = $true }
            Write-ColorOutput Green "✓ Passed: $relativePath"
            Write-Output ""
        } catch {
            $results += @{ module = $batch; file = $file.Name; passed = $false }
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

# Stop the server if we started it
if (-not $skipServer -and (Get-Variable -Name job -ErrorAction SilentlyContinue)) {
    Write-ColorOutput Cyan "[INFO] Stopping server..."
    Stop-Job -Job $job
    Remove-Job -Job $job
    Write-ColorOutput Cyan "[INFO] Server stopped."
}

# Return exit code based on test results
if (-not $allPassed) {
    exit 1
}