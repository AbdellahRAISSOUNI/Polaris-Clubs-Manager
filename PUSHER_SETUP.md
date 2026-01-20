# Pusher Setup Instructions

## Environment Variables Required

You need to add the following environment variables to your `.env.local` and `.env.production` files:

### Server-side (already configured):
- `PUSHER_APP_ID` - Your Pusher app ID
- `PUSHER_KEY` - Your Pusher key
- `PUSHER_SECRET` - Your Pusher secret
- `PUSHER_CLUSTER` - Your Pusher cluster (e.g., 'eu')
- `PUSHER_USE_TLS` - Set to 'true'

### Client-side (REQUIRED - add these now):
- `NEXT_PUBLIC_PUSHER_KEY` - Same as `PUSHER_KEY` (needed for client-side code)
- `NEXT_PUBLIC_PUSHER_CLUSTER` - Same as `PUSHER_CLUSTER` (needed for client-side code)

## Add to .env.local

Add these two lines to your `.env.local` file:

```bash
NEXT_PUBLIC_PUSHER_KEY=70ed0dc6ff92e27ccb3a
NEXT_PUBLIC_PUSHER_CLUSTER=eu
```

## How It Works

1. **Server-side**: API routes use `lib/pusher-server.ts` to broadcast events when data changes.
2. **Client-side**: React contexts use `lib/pusher-client.ts` to subscribe to channels and receive realtime updates.

## Channels Used

- **Notifications**: `notifications-{userType}-{userId}` (e.g., `notifications-admin-123`)
- **Messages**: `messages-{userType}-{userId}` (e.g., `messages-club-456`)
- **Online Status**: `online-status` (global channel)

## Events

### Notifications:
- `new-notification` - When a new notification is created
- `notification-updated` - When a notification is updated (e.g., marked as read)
- `notification-deleted` - When a notification is deleted
- `notifications-read-all` - When all notifications are marked as read
- `notifications-deleted-all` - When all notifications are deleted

### Messages:
- `new-message` - When a new message is sent
- `message-updated` - When a message is updated (read status, reactions, deletion)
- `messages-read-all` - When all messages in a conversation are marked as read

### Online Status:
- `status-updated` - When a user's online status changes
