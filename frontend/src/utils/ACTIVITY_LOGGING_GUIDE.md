# Activity Logging Implementation Guide

This guide explains how to implement comprehensive activity logging across all components of the Prison Management System.

## Purpose

Activity logging helps us:
- Track all user actions for auditing and security purposes
- Monitor system usage and identify patterns
- Troubleshoot issues by reviewing action history
- Provide accountability for all system users

## Getting Started

### 1. Import the utility

```javascript
import { logActivity, ACTIONS, RESOURCES, STATUS } from "../../utils/activityLogger";
```

### 2. Log activities in your component

```javascript
// Example: Log a successful action
try {
  await logActivity(
    ACTIONS.CREATE,                          // Action type 
    `Created new visitor schedule for ${visitorName}`,   // Description
    RESOURCES.SCHEDULE,                      // Resource type
    newScheduleId,                           // Resource ID
    STATUS.SUCCESS                           // Status
  );
} catch (error) {
  console.error('Failed to log activity:', error);
}
```

## When to Log Activities

### For CRUD Operations:
- **Create**: When a new record is created
- **Read/View**: When details are viewed/accessed
- **Update**: When existing records are modified
- **Delete**: When records are deleted

### For Authentication:
- Login attempts (successful and failed)
- Logout events
- Password changes
- Account lockouts

### For Admin Actions:
- User account management
- Role changes
- System configuration changes
- Backup and restore operations

## Important User Roles to Cover

Ensure activity logging is implemented for all user roles:
- Police Officers
- Security Staff
- Court Personnel
- Woreda Administrators
- Visitors
- System Administrators

## Implementation Checklist

Add activity logging to:

### Inmate Management
- [x] Inmate update
- [x] Inmate view
- [ ] Inmate creation
- [ ] Inmate deletion
- [ ] Inmate search

### Visitor Management
- [ ] Schedule creation
- [ ] Schedule approval/rejection
- [ ] Visit check-in/check-out
- [ ] Visitor search

### Security Staff Operations
- [ ] Incident reporting
- [ ] Transfer processing
- [ ] Cell assignments
- [ ] Security checks

### Court Operations
- [ ] Case management 
- [ ] Hearing scheduling
- [ ] Court order processing

### System Administration
- [ ] User management
- [ ] Permission changes
- [ ] System backups
- [ ] Restore operations
- [ ] Configuration changes

## Best Practices

1. **Be Descriptive**: Include relevant details in log descriptions (names, IDs, what changed)
2. **Handle Errors**: Never let logging failures break main functionality
3. **Be Consistent**: Use the predefined constants for actions, resources, and status
4. **Log Both Success and Failure**: Always log both outcomes

## Example Implementations

### Create Operation
```javascript
// When creating a new inmate
try {
  const response = await axiosInstance.post('/inmates/add-inmate', inmateData);
  if (response.data.success) {
    await logActivity(
      ACTIONS.CREATE,
      `Created new inmate record for ${inmateData.firstName} ${inmateData.lastName}`,
      RESOURCES.INMATE,
      response.data.inmateId,
      STATUS.SUCCESS
    );
    toast.success("Inmate added successfully!");
  }
} catch (error) {
  await logActivity(
    ACTIONS.CREATE,
    `Failed to create inmate: ${error.message}`,
    RESOURCES.INMATE,
    null,
    STATUS.FAILURE
  );
  toast.error("Failed to add inmate");
}
```

### Delete Operation
```javascript
// When deleting an inmate
try {
  await axiosInstance.delete(`/inmates/delete-inmate/${inmateId}`);
  await logActivity(
    ACTIONS.DELETE,
    `Deleted inmate record ${inmateName || inmateId}`,
    RESOURCES.INMATE,
    inmateId,
    STATUS.SUCCESS
  );
  toast.success("Inmate deleted successfully");
} catch (error) {
  await logActivity(
    ACTIONS.DELETE,
    `Failed to delete inmate: ${error.message}`,
    RESOURCES.INMATE,
    inmateId,
    STATUS.FAILURE
  );
  toast.error("Failed to delete inmate");
}
``` 