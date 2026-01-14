# WebSocket & Navigation Badges Troubleshooting Guide

## 🚨 Current Issues

### 1. **WebSocket Shows "Reconnecting"**
- **Symptom**: Notification bell shows "Reconnecting..." status
- **Symptom**: No real-time notifications received
- **Symptom**: Backend logs show: `WARN [AdminNotificationsService] No active staff found`

### 2. **Navigation Badges Not Showing**
- **Symptom**: Sidebar navigation items don't show badge counts
- **Symptom**: No numbers displayed next to Disputes, Reports, Memos

---

## 🔧 Fixes Applied

### **Backend Fix: JwtModule Configuration**

**Problem**: `AdminModule` was using static JwtModule configuration, which might not properly load the `JWT_SECRET` from environment variables.

**Fix Applied**: Changed from static to async configuration:

```typescript
// Before (WRONG):
JwtModule.register({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  signOptions: { expiresIn: '7d' },
})

// After (CORRECT):
JwtModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    signOptions: { expiresIn: '7d' },
  }),
  inject: [ConfigService],
})
```

**Action Required**: Restart the backend server for this fix to take effect.

---

## ✅ Verification Steps

### **Step 1: Restart Backend**

```bash
cd fretiko-backend
# Kill the existing process (Ctrl+C)
npm run start:dev
```

**Expected Output**:
```
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [AdminNotificationsGateway] Gateway initialized
```

### **Step 2: Check Frontend Console**

Open browser DevTools (F12) → Console tab

**Expected Logs**:
```
🔌 Connecting to admin notifications WebSocket: http://localhost:3000/admin-notifications
✅ Admin notifications WebSocket connected
✅ Connection confirmed: { staffId: "...", role: "super_admin", ... }
```

**If you see errors**:
```
🔴 WebSocket connection error: [error message]
```
→ Continue to troubleshooting section below

### **Step 3: Test Badge Counts**

1. Navigate to admin panel sidebar
2. Check for red badges with numbers next to:
   - **Disputes** (if any unresolved)
   - **Reports** (if any pending)
   - **Memos** (if any unread)

### **Step 4: Test Real-Time Notifications**

1. Open admin panel in 2 browser tabs
2. **Tab 1**: Send a memo to yourself
3. **Tab 2**: Check notification bell → Should show new notification immediately

---

## 🐛 Common Issues & Solutions

### Issue 1: "No token provided"

**Backend Log**:
```
⚠️ No token provided for admin client abc123
```

**Cause**: Frontend not sending JWT token with WebSocket connection

**Solution**:
1. Verify you're logged in to the admin panel
2. Check browser console for token errors
3. Clear browser cache and cookies, then log in again

---

### Issue 2: "JWT verification failed"

**Backend Log**:
```
❌ JWT verification failed for admin client abc123: invalid signature
```

**Cause**: JWT secret mismatch between staff login and WebSocket gateway

**Diagnosis**:
1. Check if `JWT_SECRET` in `.env` matches across all modules
2. Verify staff token is valid

**Solution**:
```bash
# In fretiko-backend/.env
JWT_SECRET=your-actual-secret-key-here

# Restart backend
npm run start:dev
```

---

### Issue 3: WebSocket Connects But No Notifications

**Backend Log**:
```
✅ Staff abc123 (super_admin) connected via socket def456
WARN [AdminNotificationsService] No active staff found
```

**Cause**: `connectedStaff` map not being populated or gateway not tracking connections

**Solution**:
1. Check if `handleConnection` completes successfully
2. Add debug logs to verify `connectedStaff.set()` is called
3. Restart backend to clear any stale state

---

### Issue 4: Badge Counts Not Updating

**Symptom**: Sidebar shows no badges despite having unresolved disputes/reports

**Diagnosis**:
1. Check browser console for API errors:
   ```
   GET http://localhost:3000/api/admin/nav-badges - 401 Unauthorized
   ```

2. Check if `/admin/nav-badges` endpoint is working:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:3000/api/admin/nav-badges
   ```

**Expected Response**:
```json
{
  "disputes": 5,
  "reports": 12,
  "memos": 3,
  "orders": 0,
  "notifications": 8
}
```

**Solution**:
- If 401: Token invalid → Log out and log back in
- If 500: Check backend logs for database errors
- If no response: Check if backend is running

---

### Issue 5: Environment Variables Not Loaded

**Symptom**: Backend logs show `undefined` for `JWT_SECRET` or other env vars

**Solution**:

1. **Check `.env` file exists** in `fretiko-backend/`:
   ```bash
   ls -la fretiko-backend/.env
   ```

2. **Verify variables are set**:
   ```env
   # fretiko-backend/.env
   JWT_SECRET=your-secret-key-here
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   ```

3. **Restart backend**:
   ```bash
   cd fretiko-backend
   npm run start:dev
   ```

---

## 🔍 Debug Checklist

Run through this checklist to diagnose issues:

- [ ] Backend is running (`npm run start:dev` in `fretiko-backend/`)
- [ ] Frontend is running (`npm run dev` in `fretiko-admin/`)
- [ ] `.env` file exists and has `JWT_SECRET`
- [ ] Browser console shows WebSocket connection attempt
- [ ] Backend logs show gateway initialization
- [ ] Backend logs show client connection attempts
- [ ] Staff is logged in with valid token
- [ ] `GET /admin/nav-badges` returns valid JSON
- [ ] Database has `admin_notifications` table (migration 139)
- [ ] Database has `disputes`, `content_reports`, `memos` tables

---

## 📊 Expected Backend Logs (Healthy System)

When everything works correctly, you should see:

```
[Nest] LOG [AdminNotificationsGateway] Gateway initialized
[Nest] LOG [NestApplication] Nest application successfully started

# When client connects:
🔌 Admin client attempting connection: abc123
🔑 Token extracted successfully for client abc123
✅ Token verified - Payload: {"sub":"staff-id","role":"super_admin",...}
✅ Staff staff-id (super_admin) connected via socket abc123
Admin client abc123 joined super_admin room

# When notification is sent:
[Nest] LOG [AdminNotificationsService] Notifying super admins: New Dispute Escalated
[Nest] LOG [AdminNotificationsService] Emitted notification to 1 super admins
```

---

## 🎯 Quick Fix Summary

If you're still having issues after applying the fixes:

1. **Restart Backend** (most important!):
   ```bash
   cd fretiko-backend
   # Kill process
   npm run start:dev
   ```

2. **Clear Browser Cache**:
   - Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
   - Clear cache and cookies
   - Reload page

3. **Re-login to Admin Panel**:
   - Log out completely
   - Clear browser storage (F12 → Application → Local Storage → Clear)
   - Log back in

4. **Check Console Logs**:
   - Backend terminal for connection logs
   - Browser console (F12) for WebSocket logs

5. **Test with curl**:
   ```bash
   # Get your token from browser (F12 → Application → Local Storage → look for 'token')
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:3000/api/admin/nav-badges
   ```

---

## 🆘 Still Not Working?

If you've tried all the above and it's still not working:

1. **Check if port 3000 is in use**:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # Linux/Mac
   lsof -i :3000
   ```

2. **Try different ports**:
   - Backend: `PORT=3001 npm run start:dev`
   - Frontend: Update `NEXT_PUBLIC_API_URL` to `http://localhost:3001/api`

3. **Enable verbose logging**:
   ```typescript
   // In admin-notifications.gateway.ts
   this.logger = new Logger(AdminNotificationsGateway.name, { timestamp: true });
   ```

4. **Check Firewall/Antivirus**:
   - Ensure WebSocket connections aren't blocked
   - Try disabling firewall temporarily to test

---

## ✨ Success Indicators

You'll know it's working when you see:

✅ **Frontend Console**:
```
🔌 Connecting to admin notifications WebSocket: ...
✅ Admin notifications WebSocket connected
✅ Connection confirmed: { staffId: ..., role: ... }
📊 Notification count updated: 3 unread / 15 total
```

✅ **Backend Logs**:
```
✅ Staff abc123 (super_admin) connected via socket def456
🔔 Notifying super admins: New content report
```

✅ **UI**:
- Notification bell shows green "Connected" indicator
- Sidebar shows red badges with counts: **Disputes [5]**, **Reports [12]**
- Clicking notification bell shows list of notifications

---

Need more help? Check the main `NOTIFICATIONS_SETUP.md` guide or create an issue with:
- Backend logs (last 50 lines)
- Browser console logs
- Network tab showing WebSocket connection attempt

