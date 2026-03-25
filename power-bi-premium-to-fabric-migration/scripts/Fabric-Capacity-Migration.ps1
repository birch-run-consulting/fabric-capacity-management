<# 
.SYNOPSIS
Moves all workspaces from a Premium capacity to a Fabric capacity.

.DESCRIPTION
Enumerates workspaces assigned to a source capacity, optionally performs a dry run,
exports the current assignment state, reassigns each workspace to a target capacity,
and exports a post-migration validation file.

.NOTES
Requires: MicrosoftPowerBIMgmt module
Run as Fabric Admin or Power BI Service Admin
Workspace reassignment can cancel in-flight jobs; schedule execution accordingly.
For Fabric capacity moves, the executing identity may also need workspace admin rights.

.EXAMPLE
.\Fabric-Capacity-Migration.ps1 -SourceCapacityId "PREMIUM_ID" -TargetCapacityId "FABRIC_ID" -DryRun

.EXAMPLE
.\Fabric-Capacity-Migration.ps1 -SourceCapacityId "PREMIUM_ID" -TargetCapacityId "FABRIC_ID"
#>

param (
    [Parameter(Mandatory=$true)]
    [string]$SourceCapacityId,

    [Parameter(Mandatory=$true)]
    [string]$TargetCapacityId,

    [Parameter(Mandatory=$false)]
    [switch]$DryRun
)

Write-Host "Connecting to Power BI Service..."
Connect-PowerBIServiceAccount

Write-Host "Fetching workspaces assigned to source capacity..."

$workspaces = Get-PowerBIWorkspace -All | Where-Object {
    $_.CapacityId -eq $SourceCapacityId
}

if ($workspaces.Count -eq 0) {
    Write-Host "No workspaces found on source capacity."
    exit
}

Write-Host "$($workspaces.Count) workspaces found."

# Export before-state
$workspaces | Select Name, Id, CapacityId |
    Export-Csv "Workspace-Before-Migration.csv" -NoTypeInformation

if ($DryRun) {
    Write-Host "Dry run enabled. No changes will be made."
    $workspaces | Select Name, Id
    exit
}

$confirmation = Read-Host "Proceed with migration? Type YES to continue"

if ($confirmation -ne "YES") {
    Write-Host "Migration cancelled."
    exit
}

foreach ($workspace in $workspaces) {
    try {
        Write-Host "Moving workspace: $($workspace.Name)"
        Set-PowerBIWorkspace -Id $workspace.Id -CapacityId $TargetCapacityId
    }
    catch {
        Write-Host "Failed to move workspace: $($workspace.Name)"
        Write-Host $_
    }
}

Write-Host "Migration complete."

# Export after-state
Get-PowerBIWorkspace -All | Where-Object {
    $_.CapacityId -eq $TargetCapacityId
} | Select Name, Id, CapacityId |
Export-Csv "Workspace-After-Migration.csv" -NoTypeInformation

Write-Host "Validation export complete."
