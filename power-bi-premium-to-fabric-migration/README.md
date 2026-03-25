# Power BI Premium to Fabric Capacity Migration Plan

This guide describes a practical, low-risk approach for migrating Power BI workspaces from a Premium capacity to a Microsoft Fabric F SKU capacity. It is intended for administrators and platform owners who need to plan, execute, validate, and, if necessary, roll back a capacity migration.

Related scripts:

- [`Fabric-Capacity-Migration.ps1`](./scripts/Fabric-Capacity-Migration.ps1)
- [`Rollback-Script.ps1`](./scripts/Rollback-Script.ps1)
- [`Sources`](./sources.md)

## Executive Summary

Moving from Power BI Premium to Fabric is primarily a capacity reassignment exercise rather than a content rebuild. Semantic models, paginated reports, scheduled refreshes, and deployment pipelines can continue to operate after reassignment, provided the target Fabric capacity is sized correctly and the surrounding tenant and governance settings are validated.

That simplicity is real, but there are still a few operational realities worth calling out:

- moving a workspace can cancel in-flight jobs, so migration windows should be quiet and post-move jobs may need to be rerun
- F capacity administration is not fully symmetric with P capacity administration, so reassignment permissions should be validated before cutover
- cross-region moves are materially more complex than same-region reassignments, especially when large models, Fabric items, or Dataflow Gen2 staging artifacts are present
- some capacity-level settings and delegated overrides do not automatically transfer and must be recreated manually on the target capacity

The safest rollout pattern is:

- prepare the target Fabric capacity and required settings
- pilot a small set of non-critical workspaces
- validate refresh, performance, and administrative tooling
- execute a staged production cutover
- retain the original Premium capacity until post-migration validation is complete

## Prerequisites

Before running the migration, confirm the following:

- A Fabric F SKU capacity has already been purchased and provisioned.
- The source Premium capacity remains available during the transition window.
- Fabric workloads are enabled at both the tenant and capacity level where required.
- You have sufficient administrative access to enumerate workspaces and reassign capacities.
- If the migration actor is only an F capacity admin, confirm they are also a workspace admin on every workspace being moved.
- Service principals, deployment pipelines, and XMLA endpoint usage have been reviewed for compatibility with the target capacity.
- A rollback path has been agreed on before production workspaces are moved.
- The migration is expected to remain in the same region unless cross-region restrictions have been explicitly assessed.

For the included PowerShell scripts:

- Install the `MicrosoftPowerBIMgmt` PowerShell module.
- Run the scripts in PowerShell with an account that has Fabric admin or Power BI service admin privileges.
- Capture the source and target capacity IDs before execution.
- Run the migration script in `-DryRun` mode before making changes.

## Current Architecture

### Premium Capacity (P SKU)

- Hosts semantic models
- Hosts paginated reports
- Scheduled refresh workloads
- XMLA endpoints enabled
- Deployment pipelines

All workloads are isolated to BI compute.

## Target Architecture

### Fabric Capacity (F SKU)

Fabric capacity introduces a shared compute model across multiple workloads:

- Shared Capacity Units (CUs)
- Power BI workload
- Data Engineering workload
- Data Science workload
- Lakehouse / Warehouse
- OneLake storage

Existing BI workloads can continue to function after migration. Additional Fabric workloads can be introduced gradually, but they will consume from the same shared capacity pool.

Fabric also introduces an operating model shift: pause and resume controls, on-demand resizing, staged throttling behavior, and separate storage cost visibility all become part of post-migration operations.

## Migration Approach

### Phase 1: Preparation

- Purchase and provision Fabric F SKU.
- Enable Fabric workloads at:
  - Tenant level
  - Capacity level
- Validate:
  - XMLA read/write
  - Deployment pipelines
  - Service principal permissions
- Record the source Premium capacity ID and target Fabric capacity ID.
- Confirm who owns go/no-go approval for the pilot and production cutover.
- Baseline target capacity settings such as delegated tenant overrides, notifications, and recovery-related configuration so they can be recreated if needed.

### Phase 2: Pilot Migration

- Move 2-3 non-critical workspaces.
- Schedule the pilot for a low-activity window because active jobs may be canceled during reassignment.
- Validate:
  - Dataset refresh
  - Paginated reports
  - DirectQuery models
  - Subscriptions
  - Performance

Monitor using:

- Capacity Metrics App
- CU utilization
- Interactive vs background operations
- Refresh duration and concurrency behavior
- Any canceled jobs that need to be rerun after reassignment

### Phase 3: Full Migration

- Execute the bulk reassignment script.
- Validate production workspaces immediately after reassignment.
- Monitor the target capacity for 7-14 days.
- Confirm all expected items are truly attached to the new capacity before pausing or deleting the source capacity.
- Decommission the Premium capacity only after the migration is considered stable.

## Performance Considerations

### Capacity Units (CUs)

Fabric does not map 1:1 to Premium vCores, so sizing should be validated empirically rather than assumed.

Key considerations:

- Background refresh concurrency
- Model memory footprint
- Incremental refresh partitions
- Dataflow Gen1 vs Gen2

If Fabric workloads such as Lakehouse, Pipelines, or Notebooks are introduced, they will share the same CU pool as BI workloads. That shared consumption model is one of the main reasons to validate sizing with a pilot before a full cutover.

### Cost and Operations Notes

- OneLake storage is billed separately from compute, so storage planning should be part of the migration conversation.
- Pausing compute does not eliminate all downstream operational considerations, especially if storage and governance expectations remain in place.
- Fabric throttling behavior is different from legacy Premium expectations, so monitoring and incident response should be updated after cutover.
- Customers moving from Premium autoscale expectations should understand that Fabric uses a different capacity management model centered on resizing and operational controls.

## Governance Review

Post-migration:

- Review workspace permissions
- Review Fabric item creation rights
- Validate service principals
- Validate external tool access such as Tabular Editor and SSMS
- Confirm that only intended users can create or scale Fabric-native items
- Recreate any required capacity-level delegated settings or overrides that were present on the source capacity

## Cross-Region and Advanced Constraints

Same-region reassignment is the standard and lowest-risk path. If the target Fabric capacity is in a different region, treat the migration as a more complex scenario and assess it separately before promising a simple workspace move.

Pay particular attention to:

- large semantic models
- Fabric-native items
- Dataflow Gen2 and any hidden staging artifacts
- private link or customer-managed key dependencies

If any of these are in scope, document the exception path before the production cutover.

## Rollback Strategy

Premium capacity should remain active during transition.

If performance degradation occurs:

- Execute rollback script.
- Reassign workspaces back to Premium.
- Analyze CU usage and resize the Fabric SKU.

Downtime is typically minimal because workspace capacity reassignment is near-instant, but downstream validation should still be planned and communicated.

Rollback planning should also assume that canceled refreshes, jobs, or pipelines may need manual review after workspaces are reassigned back to the source capacity.

## Risks

| Risk | Mitigation |
| --- | --- |
| Under-sizing Fabric | Pilot first, monitor CUs |
| Background refresh contention | Monitor capacity metrics |
| Unexpected Fabric workload usage | Lock down permissions initially |
| Deployment pipeline misalignment | Validate stage assignments |
| Reassignment permission gaps | Validate admin roles and workspace admin coverage before cutover |
| Cross-region migration blockers | Treat cross-region moves as a separate assessed scenario |
| Capacity setting drift | Baseline and manually recreate target capacity settings |

## Recommended Next Steps

- Confirm Fabric SKU sizing.
- Execute pilot migration.
- Monitor for 1 week.
- Perform staged full cutover.
- Decommission Premium capacity.

## Included Scripts

### Bulk Migration

Use the migration script to move workspaces from the source Premium capacity to the target Fabric capacity. The script exports a before-state CSV, prompts for confirmation, performs the reassignment, and then exports an after-state CSV for validation.

```powershell
.\power-bi-premium-to-fabric-migration\scripts\Fabric-Capacity-Migration.ps1 `
    -SourceCapacityId "PREMIUM_CAPACITY_ID" `
    -TargetCapacityId "FABRIC_CAPACITY_ID"
```

Run a dry run first to list impacted workspaces without making changes:

```powershell
.\power-bi-premium-to-fabric-migration\scripts\Fabric-Capacity-Migration.ps1 `
    -SourceCapacityId "PREMIUM_CAPACITY_ID" `
    -TargetCapacityId "FABRIC_CAPACITY_ID" `
    -DryRun
```

### Rollback

Use the rollback script to reverse the capacity assignment if validation, refresh behavior, or capacity performance checks fail:

```powershell
.\power-bi-premium-to-fabric-migration\scripts\Rollback-Script.ps1
```

## Script Output

The migration script generates the following files in the working directory:

- `Workspace-Before-Migration.csv`
- `Workspace-After-Migration.csv`

These exports provide a simple audit trail for which workspaces were targeted before the move and which workspaces are assigned to the target capacity after the move.

## Public Repo Notes

This repository focuses on the common migration path: reassignment of workspaces from a Premium capacity to a Fabric capacity in the same region, followed by validation and monitored stabilization.

Scenarios that usually require extra discovery, custom engineering, or explicit scope control include:

- cross-region migrations
- private link or customer-managed key remediation
- extensive security and RLS validation with real test users
- highly customized report rendering regression testing
- broader Day 2 cost, throttling, and governance operating model work

## Sources

For the official Microsoft documentation behind this guide, see [`sources.md`](./sources.md).
