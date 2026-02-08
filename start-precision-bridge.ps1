
Write-Host "Starting Spec Kit Precision Bridge (Node.js Mode)..." -ForegroundColor Cyan
Write-Host "Port: 3333" -ForegroundColor Gray

# Refresh PATH environment variable
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

# Run the Node.js bridge
node spec-kit-bridge.js
