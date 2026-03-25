# Fabric Capacity Management

This repository will contain tips, tricks, and practical guidance to help users optimize a Microsoft Fabric capacity.

It will grow over time to include automation patterns, operational runbooks, and hands-on examples.

## Migration Guide

This repo now includes a public-facing migration guide for moving Power BI workspaces from Premium capacity to Microsoft Fabric, including prerequisites, scripts, and common migration gotchas:

- [`power-bi-premium-to-fabric-migration/`](power-bi-premium-to-fabric-migration/)
- [`power-bi-premium-to-fabric-migration/README.md`](power-bi-premium-to-fabric-migration/README.md)
- [`power-bi-premium-to-fabric-migration/sources.md`](power-bi-premium-to-fabric-migration/sources.md)
- [`power-bi-premium-to-fabric-migration/scripts/`](power-bi-premium-to-fabric-migration/scripts/)

## Automation

- [`automation/logic-apps-managed-identity-suspend-resume.md`](automation/logic-apps-managed-identity-suspend-resume.md): Logic App automation for suspending and resuming a Fabric capacity with managed identity

## Live Tool

Open the Fabric Cost Analysis calculator:

[https://birch-run-consulting.github.io/fabric-capacity-management/](https://birch-run-consulting.github.io/fabric-capacity-management/)

## Included Artifact

- [`fabric-cost-analysis/`](fabric-cost-analysis/): static HTML version of the Fabric cost analysis workbook
