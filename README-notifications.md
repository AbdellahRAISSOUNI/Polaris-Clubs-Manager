# Notification System for Polaris Clubs Manager

This document outlines the notification system implemented in the Polaris Clubs Manager application.

## Overview

The application uses a dual notification system:
1. **Sonner Toast** - A lightweight, customizable toast notification library
2. **Shadcn UI Toast** - A more feature-rich toast component from the Shadcn UI library

Both systems are configured to work together to provide consistent notifications across the application.

## How to Use Notifications

We've created a utility library at `lib/notifications.ts` that provides a simple API for showing notifications. This ensures consistency across the application and makes it easy to modify the notification appearance in one place.

### Basic Usage

```typescript
import { 
  successNotification, 
  errorNotification, 
  warningNotification, 
  infoNotification 
} from "@/lib/notifications";

// Show a success notification
successNotification({
  title: "Success", // Optional
  description: "Operation completed successfully."
});

// Show an error notification
errorNotification({
  title: "Error", // Optional
  description: "Something went wrong."
});

// Show a warning notification
warningNotification({
  description: "This action might have consequences."
});

// Show an info notification
infoNotification({
  description: "Here's some information you might find useful."
});
```

### Advanced Usage

For more control, you can use the base `showNotification` function:

```typescript
import { showNotification } from "@/lib/notifications";

showNotification("success", {
  title: "Custom Success",
  description: "This is a custom success message.",
  duration: 10000, // 10 seconds
  action: <button>Undo</button>
});
```

## When to Use Notifications

Notifications should be used to inform users about:

1. **Success states** - When an operation completes successfully
   - Creating/updating/deleting a club
   - Creating/approving/rejecting a reservation
   - Saving settings

2. **Error states** - When an operation fails
   - API errors
   - Validation errors
   - Authentication/authorization errors

3. **Warning states** - When an action might have consequences
   - Deleting data
   - Making irreversible changes

4. **Info states** - For general information
   - Background processes starting/completing
   - System status updates

## Implementation Locations

Notifications have been added to the following components:

1. **Reservation Form** (`components/reservation-form.tsx`)
   - Success notification when a reservation is created
   - Error notifications for validation and API errors

2. **Club Dashboard** (`app/club/dashboard/page.tsx`)
   - Info notification when refreshing data
   - Success notification when data is refreshed successfully
   - Error notification when data fails to load

3. **Admin Clubs Page** (`app/admin/clubs/page.tsx`)
   - Success notifications for club creation, updates, and deletion
   - Error notifications for validation and API errors
   - Warning notifications for partial successes (e.g., logo upload failure)

4. **Reservation Details** (`components/reservation-details.tsx`)
   - Success notifications for approving reservations and saving changes
   - Error notifications for rejecting reservations and API errors

## Future Improvements

1. **Notification History** - Store notifications in a context to allow users to view past notifications
2. **Notification Preferences** - Allow users to customize notification duration and appearance
3. **Push Notifications** - Implement browser push notifications for important events
4. **Email Notifications** - Send email notifications for critical events

## Technical Details

The notification system is implemented in `lib/notifications.ts` and uses both Sonner and Shadcn UI toast libraries. The Toaster components are included in the application's providers in `app/providers.tsx`. 