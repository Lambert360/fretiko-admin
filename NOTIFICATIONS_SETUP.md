# Admin Notifications Setup

## Frontend Dependencies

The admin notifications system requires `socket.io-client` for WebSocket connections.

### Installation

```bash
cd fretiko-admin
npm install socket.io-client date-fns
```

### Required Packages

- `socket.io-client` - WebSocket client for real-time connections
- `date-fns` - Date formatting utilities (formatDistanceToNow)

## Backend Dependencies

Already included in the NestJS framework:
- `@nestjs/websockets`
- `@nestjs/platform-socket.io`
- `socket.io`

## Environment Variables

Make sure these are set in your `.env` files:

### Backend (`fretiko-backend/.env`)
```env
JWT_SECRET=your-jwt-secret-key
```

### Frontend (`fretiko-admin/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Database Migration

Run the admin_notifications table migration:

```bash
cd fretiko-backend
# Apply migration 139_create_admin_notifications.sql to your database
```

## Features

✅ Real-time WebSocket notifications
✅ Browser desktop notifications
✅ Unread count badge
✅ Mark as read / Mark all as read
✅ Connection status indicator
✅ Department-based targeting
✅ Role-based targeting (super admins, department heads)
✅ Priority levels (low, medium, high, urgent)
✅ Categories (info, warning, alert, success)
✅ Deep links to relevant pages
✅ Icon mapping for different notification types

## Usage

The `NotificationBell` component is automatically included in the Header. No additional setup required!

Staff members will automatically receive real-time notifications based on:
- Their role (super admin, department head, staff)
- Their department
- Direct staff-specific notifications

## Testing

1. Start the backend server
2. Start the frontend dev server
3. Login as a staff member
4. The notification bell should show a green dot (connected)
5. Trigger a notification event (e.g., create an order, open a dispute)
6. The notification should appear instantly in the bell dropdown

## Troubleshooting

### WebSocket Not Connecting

- Check that JWT_SECRET matches between frontend and backend
- Verify NEXT_PUBLIC_API_URL is correct
- Check browser console for connection errors
- Ensure backend WebSocket gateway is running

### Notifications Not Appearing

- Check backend logs for notification creation
- Verify staff has correct permissions
- Check WebSocket connection status (green dot)
- Open browser DevTools > Network > WS to inspect WebSocket traffic

### Browser Notifications Not Working

- Click "Allow" when prompted for notification permissions
- Check browser notification settings
- Some browsers require HTTPS for notifications in production

