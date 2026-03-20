# Use Azure Logic Apps + Managed Identity to Resume or Suspend a Microsoft Fabric Capacity

This guide walks through how to create an Azure Logic App that uses a system-assigned managed identity to authenticate to Azure Resource Manager and call the Microsoft Fabric capacity API. The managed identity is granted Contributor access at the resource group level so the Logic App can resume or suspend the Fabric capacity without storing credentials or secrets.

One important correction up front: the Fabric capacity API uses the subscription ID, resource group name, and capacity name in the URI. It does not use a resource group GUID in the path. The official REST endpoints for Fabric capacity operations are `resume` and `suspend` under the Azure Resource Manager endpoint.

## What this solution does

You will create a Logic App that:

- uses a system-assigned managed identity
- has Contributor role assignment on the resource group that contains the Fabric capacity
- sends an HTTP `POST` request to Azure Resource Manager
- calls either the `resume` or `suspend` operation for a Fabric capacity

## Before you begin

You should have:

- an Azure subscription
- an existing Microsoft Fabric capacity
- the name of the Azure resource group that contains that capacity
- permission to create a Logic App
- permission to assign Azure RBAC roles, such as Owner or User Access Administrator on the target scope

## Values you will need

Have these values ready:

- **Subscription ID**: `<SUBSCRIPTION_GUID>`
- **Resource Group Name**: `<RESOURCE_GROUP_NAME>`
- **Fabric Capacity Name**: `<FABRIC_CAPACITY_NAME>`

Use the actual resource group name, not a GUID. The Fabric REST API path parameter is `resourceGroups/{resourceGroupName}`.

## Step 1: Create the Logic App

In the Azure portal:

1. Create a new Logic App.
2. Choose either Consumption or Standard.
3. Give it a name, subscription, resource group, and region.
4. Create the app.

Both Consumption and Standard Logic Apps support managed identities. Standard Logic Apps automatically enable a system-assigned identity by default, while Consumption Logic Apps require you to enable it explicitly.

## Step 2: Enable the system-assigned managed identity

Open the Logic App in the Azure portal and:

1. Go to **Identity**.
2. Under **System assigned**, switch **Status** to **On**.
3. Save the change.

This creates a Microsoft Entra identity tied to that Logic App resource. Azure manages the credential lifecycle for this identity, which removes the need to store secrets or service principal credentials.

## Step 3: Grant the Logic App access to the resource group

Assign the Logic App's managed identity the Contributor role on the resource group that contains the Fabric capacity.

1. Open the target **Resource Group**.
2. Go to **Access control (IAM)**.
3. Select **Add role assignment**.
4. Choose the **Contributor** role.
5. Assign access to **Managed identity**.
6. Select your Logic App.
7. Save.

Contributor at the resource group scope is a practical way to allow these operations for the contained Fabric capacity resource.

## Step 4: Build the workflow

Create a new workflow with the trigger of your choice. The simplest starting point is usually:

- Manual trigger for testing
- Optional Recurrence trigger later if a schedule is needed

After the trigger, add an HTTP action.

## Step 5: Configure the HTTP action

Use these settings:

- **Method**: `POST`
- **URI**: use one of the API URLs below
- **Authentication**: Managed identity
- **Managed identity**: System-assigned managed identity
- **Audience / Resource**: `https://management.azure.com/`

## API Call 1: Resume Fabric Capacity

Use this URI in the HTTP action:

```text
https://management.azure.com/subscriptions/<SUBSCRIPTION_GUID>/resourceGroups/<RESOURCE_GROUP_NAME>/providers/Microsoft.Fabric/capacities/<FABRIC_CAPACITY_NAME>/resume?api-version=2023-11-01
```

Example HTTP configuration:

```http
POST https://management.azure.com/subscriptions/<SUBSCRIPTION_GUID>/resourceGroups/<RESOURCE_GROUP_NAME>/providers/Microsoft.Fabric/capacities/<FABRIC_CAPACITY_NAME>/resume?api-version=2023-11-01
Authorization: Bearer <managed-identity-token>
Content-Type: application/json
```

No request body is required.

The official Fabric REST API defines the resume operation as:

```http
POST /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Fabric/capacities/{capacityName}/resume?api-version=2023-11-01
```

## API Call 2: Suspend Fabric Capacity

Use this URI in the HTTP action:

```text
https://management.azure.com/subscriptions/<SUBSCRIPTION_GUID>/resourceGroups/<RESOURCE_GROUP_NAME>/providers/Microsoft.Fabric/capacities/<FABRIC_CAPACITY_NAME>/suspend?api-version=2023-11-01
```

Example HTTP configuration:

```http
POST https://management.azure.com/subscriptions/<SUBSCRIPTION_GUID>/resourceGroups/<RESOURCE_GROUP_NAME>/providers/Microsoft.Fabric/capacities/<FABRIC_CAPACITY_NAME>/suspend?api-version=2023-11-01
Authorization: Bearer <managed-identity-token>
Content-Type: application/json
```

No request body is required.

The official Fabric REST API defines the suspend operation as:

```http
POST /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Fabric/capacities/{capacityName}/suspend?api-version=2023-11-01
```

## Recommended Logic App pattern

For a simple attendee-friendly pattern, create two separate Logic Apps.

### Logic App A: Resume capacity

- Trigger: Manual or scheduled
- Action: HTTP `POST` to the `resume` endpoint
- Authentication: System-assigned managed identity

### Logic App B: Suspend capacity

- Trigger: Manual or scheduled
- Action: HTTP `POST` to the `suspend` endpoint
- Authentication: System-assigned managed identity

That keeps the guide easy to follow and makes troubleshooting simpler during setup.

## Optional: Add a response check

The Fabric REST operations can return `200 OK` or `202 Accepted`, which means Azure accepted the operation and may complete it asynchronously. If you want, add a follow-up step in the Logic App to log the status code or response headers for troubleshooting.

## Operational note

Pausing a Fabric capacity can make Fabric content unavailable while the capacity is stopped. It should only be done when the environment is not needed.

## Troubleshooting tips

1. **Managed identity is not enabled**

   Confirm the system-assigned identity is turned on for the Logic App.

2. **RBAC is missing**

   Confirm the Logic App identity has Contributor access on the correct resource group.

3. **Wrong resource group value**

   The URI needs the resource group name, not the resource group GUID.

4. **Wrong audience**

   For an ARM call, the audience/resource should be `https://management.azure.com/`.

5. **Incorrect capacity name**

   Check the exact Azure resource name of the Fabric capacity.

## Copy/paste summary

**Resume endpoint**

```text
POST https://management.azure.com/subscriptions/<SUBSCRIPTION_GUID>/resourceGroups/<RESOURCE_GROUP_NAME>/providers/Microsoft.Fabric/capacities/<FABRIC_CAPACITY_NAME>/resume?api-version=2023-11-01
```

**Suspend endpoint**

```text
POST https://management.azure.com/subscriptions/<SUBSCRIPTION_GUID>/resourceGroups/<RESOURCE_GROUP_NAME>/providers/Microsoft.Fabric/capacities/<FABRIC_CAPACITY_NAME>/suspend?api-version=2023-11-01
```

**Authentication**

```text
Managed identity: System-assigned
Audience / Resource: https://management.azure.com/
```

**RBAC**

```text
Grant the Logic App managed identity Contributor access on the resource group that contains the Fabric capacity.
```
