# Start-Server.ps1
# Script to start the NestJS server for testing

# Configuration
$serverPort = 3000
$serverStartTimeout = 10 # seconds

# Display banner
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "   NTU MAI Backend Server Starter" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

# Check if the server is already running on the port
try {
    $connections = Get-NetTCPConnection -LocalPort $serverPort -ErrorAction SilentlyContinue
    if ($connections) {
        Write-Host "[WARNING] Port $serverPort is already in use!" -ForegroundColor Yellow
        Write-Host "The server might already be running or another application is using this port." -ForegroundColor Yellow
        
        $response = Read-Host "Do you want to force close the application using port $serverPort? (y/n)"
        if ($response -eq "y") {
            foreach ($conn in $connections) {
                $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "Stopping process: $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor Yellow
                    Stop-Process -Id $process.Id -Force
                    Write-Host "Process stopped." -ForegroundColor Green
                }
            }
        } else {
            Write-Host "Server start aborted. Please free up port $serverPort and try again." -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host "[INFO] Unable to check port status. Continuing..." -ForegroundColor Gray
}

# Start the server in development mode
Write-Host "[INFO] Starting NestJS server in development mode..." -ForegroundColor Cyan

# Start the server in a new job
$job = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run start:dev
}

# Wait for the server to start
Write-Host "[INFO] Waiting for server to initialize (timeout: $serverStartTimeout seconds)..." -ForegroundColor Cyan

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

if ($serverStarted) {
    Write-Host "[SUCCESS] Server started successfully!" -ForegroundColor Green
    Write-Host "Server is running at http://localhost:$serverPort" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop the server when finished." -ForegroundColor Cyan
    
    # Keep the script running and display server output
    try {
        while ($true) {
            $output = Receive-Job -Job $job
            if ($output) {
                Write-Host $output
            }
            Start-Sleep -Seconds 1
        }
    } finally {
        # Clean up when script is interrupted
        Stop-Job -Job $job
        Remove-Job -Job $job
        Write-Host "\n[INFO] Server stopped." -ForegroundColor Cyan
    }
} else {
    Write-Host "[ERROR] Server failed to start within the timeout period." -ForegroundColor Red
    Stop-Job -Job $job
    Remove-Job -Job $job
    exit 1
}