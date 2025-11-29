# Debugging Logout Issue on User Management Page

## Changes Made

### 1. Fixed StaffJwtAuthGuard
**File:** `fretiko-backend/src/staff/guards/staff-jwt-auth.guard.ts`

**Changes:**
- Changed from extending `AuthGuard('jwt')` to implementing `CanActivate` directly
- Added proper staff account verification in database
- Added better error logging
- Verifies staff account is active before allowing access

### 2. Improved API Client Error Handling
**File:** `fretiko-admin/src/lib/api/client.ts`

**Changes:**
- Added detailed error logging
- Distinguishes between authentication errors (401) and permission errors
- Only redirects on clear authentication failures, not permission issues
- Added delay before redirect to allow error logging

### 3. Better Error Display
**File:** `fretiko-admin/src/app/dashboard/users/page.tsx`

**Changes:**
- Handles 401 errors specifically
- Shows error message instead of immediately redirecting
- Better error messages for debugging

---

## How to Debug

### Step 1: Check Browser Console

When you click "User Management", open the browser console (F12) and look for:

1. **401 Unauthorized Error** - Check the error details:
   ```javascript
   {
     url: "/admin/users",
     method: "GET",
     message: "...",
     hasToken: true/false
   }
   ```

2. **Network Tab** - Check the actual request:
   - Is the `Authorization: Bearer <token>` header present?
   - What's the response status code?
   - What's the response body?

### Step 2: Check Backend Logs

Look for these log messages in the backend terminal:

1. **StaffJwtAuthGuard error** - Shows authentication failures
2. **Staff lookup error** - Shows database query issues
3. **Authentication failed** - Shows token verification issues

### Step 3: Verify Token

Check if the token is valid:

1. Open browser DevTools → Application → Local Storage
2. Check if `accessToken` exists
3. Copy the token and verify it at [jwt.io](https://jwt.io)
4. Check if:
   - Token is expired
   - Token payload has `sub` field
   - Token was signed with correct secret

### Step 4: Check Staff Account

Verify your staff account exists and is active:

```sql
SELECT id, staff_id, email, role, is_active 
FROM staff_accounts 
WHERE email = 'your-email@fretiko.com';
```

Make sure:
- `is_active = true`
- Account exists in database
- `id` matches the `sub` in your JWT token

---

## Common Issues & Solutions

### Issue 1: Token Not Being Sent

**Symptoms:** `hasToken: false` in console

**Solution:**
- Check if token is stored in localStorage
- Verify API client is adding Authorization header
- Check if token was cleared somehow

### Issue 2: Token Invalid/Expired

**Symptoms:** `Invalid or expired token` error

**Solution:**
- Token might be expired (8 hour expiry)
- Token might be signed with wrong secret
- Log out and log back in to get new token

### Issue 3: Staff Account Not Found

**Symptoms:** `Staff account not found or inactive` error

**Solution:**
- Verify staff account exists in database
- Check if `is_active = true`
- Verify staff `id` matches token `sub`

### Issue 4: Permission Error

**Symptoms:** `Permission denied` or `Access denied` error

**Solution:**
- Check if staff has `view_users` permission
- Verify department permissions
- Super admin should bypass all checks

---

## Quick Fixes to Try

### 1. Restart Backend Server
```bash
cd fretiko-backend
npm run start:dev
```

### 2. Clear Browser Storage
- Open DevTools → Application → Clear Storage
- Clear localStorage
- Log out and log back in

### 3. Check Environment Variables
Make sure backend has:
```env
JWT_SECRET=your-secret-key
```

### 4. Verify Database Connection
Check if backend can connect to Supabase:
- Look for connection errors in backend logs
- Verify Supabase credentials in `.env`

---

## Expected Behavior After Fix

1. **Click "User Management"** → Should load users page
2. **If 401 error** → Should show error message (not redirect immediately)
3. **If permission error** → Should show "Access Denied" message
4. **If successful** → Should show users list

---

## Next Steps

1. **Check browser console** for the actual error
2. **Check backend logs** for authentication errors
3. **Share the error message** you see
4. **Try the quick fixes** above

The improved error handling should now show you the actual error instead of immediately redirecting, which will help us identify the root cause.

---

**Last Updated:** 2025-01-28

