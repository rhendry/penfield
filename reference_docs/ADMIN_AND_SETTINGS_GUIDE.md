# Admin & User Settings - Implementation Guide

## ✅ What Was Built

### 1. User Settings Page (`/settings`)
**Features:**
- View profile information (username, role)
- Change password functionality
- Validates current password before allowing change
- Minimum 6 character requirement
- Confirmation field to prevent typos

**Security:**
- Requires authentication
- Verifies current password with scrypt hashing
- All users can access their own settings

**Frontend:** `client/src/pages/user-settings.tsx`
**Backend:** `POST /api/auth/change-password` in `server/auth.ts`

---

### 2. Admin Page (`/admin`)
**Features:**
- Create new users with default passwords
- View all users in the system
- Delete users (except yourself)
- Toggle admin privileges when creating users
- Shows user roles (Admin badge)

**Security:**
- **Requires admin privileges** - enforced with `requireAdmin` middleware
- Non-admins get 403 Forbidden and redirected
- Cannot delete your own account (prevents lockout)
- Admin middleware checks `isAdmin` flag in session

**Frontend:** `client/src/pages/admin.tsx`
**Backend:** `server/admin-routes.ts`

---

## 🔒 Security Implementation

### Backend Security

**1. Admin Middleware (`requireAdmin`)**
```typescript
// server/auth.ts
export function requireAdmin(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.sendStatus(401); // Not logged in
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" }); // Not admin
  }
  next();
}
```

**2. Protected Routes**
All admin endpoints in `server/admin-routes.ts` use `requireAdmin`:
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `DELETE /api/admin/users/:id` - Delete user

**3. Password Security**
- Passwords hashed with `scrypt` (OWASP recommended)
- 6 character minimum
- Current password verified before change
- Never send password hashes to frontend

**4. Session-Based Auth**
- Passport.js with PostgreSQL session store
- Sessions persist in database
- Secure cookies (httpOnly, sameSite)

---

### Frontend Security

**1. Admin Page Access Control**
```typescript
// client/src/pages/admin.tsx
if (user && !user.isAdmin) {
  return <Redirect to="/" />; // Redirect non-admins
}
```

**2. Conditional UI Elements**
```typescript
// client/src/components/layout.tsx
{user.isAdmin && (
  <Link href="/admin">
    <Button>Admin</Button>
  </Link>
)}
```

Admin button only shows for admin users.

---

## 📋 API Endpoints

### User Settings

**Change Password**
```
POST /api/auth/change-password
Authorization: Session cookie
Body: {
  "currentPassword": "old123",
  "newPassword": "newpassword456"
}
Response: 200 OK or 401 Unauthorized
```

### Admin Endpoints (Admin Only)

**List All Users**
```
GET /api/admin/users
Authorization: Admin session required
Response: [
  {
    "id": "uuid",
    "username": "admin",
    "isAdmin": true,
    "createdAt": "2025-11-03T..."
  }
]
```

**Create User**
```
POST /api/admin/users
Authorization: Admin session required
Body: {
  "username": "newuser",
  "password": "temp123",
  "isAdmin": false
}
Response: 201 Created
```

**Delete User**
```
DELETE /api/admin/users/:id
Authorization: Admin session required
Response: 204 No Content
```

---

## 🧪 Testing Locally

### Test User Settings

1. Start dev server: `npm run dev`
2. Login at http://localhost:5000/auth
3. Click "Settings" in header
4. Try changing password:
   - Current: `admin123`
   - New: `newpassword`
   - Confirm: `newpassword`
5. Logout and login with new password

### Test Admin Features

1. Login as admin (`admin` / `admin123`)
2. Click "Admin" in header (only visible to admins)
3. **Create a test user:**
   - Username: `testuser`
   - Password: `test123`
   - Admin: unchecked
4. **View user list** - should see both users
5. **Try deleting yourself** - should fail with error
6. **Delete test user** - should succeed

### Test Security

**Test non-admin access:**
1. Create a regular user (isAdmin = false)
2. Logout and login as regular user
3. Try visiting `/admin` directly - should redirect to `/`
4. "Admin" button should NOT appear in header

**Test API security:**
```bash
# Try accessing admin endpoint without auth
curl http://localhost:5000/api/admin/users
# Should return 401 Unauthorized

# Try accessing admin endpoint as regular user
# (Login as regular user first, get session cookie)
curl -b cookies.txt http://localhost:5000/api/admin/users
# Should return 403 Forbidden
```

---

## 🔐 Railway Deployment Security

### Environment Variables Required
```env
DATABASE_URL=<railway-postgres-url>
SESSION_SECRET=<64-char-random-string>
NODE_ENV=production
```

### Security Checklist for Production

- [x] Admin endpoints protected with `requireAdmin` middleware
- [x] Passwords hashed with scrypt
- [x] Sessions stored in PostgreSQL (not memory)
- [x] Secure cookies (httpOnly, sameSite: lax)
- [x] Cannot delete your own admin account
- [x] Frontend redirects non-admins from admin pages
- [x] API returns 403 for non-admin access attempts
- [x] No passwords sent to frontend
- [x] Session secret is environment variable

### Additional Security Recommendations

1. **Change default admin password immediately:**
   ```
   Login → Settings → Change Password
   ```

2. **Rotate SESSION_SECRET periodically** (invalidates all sessions)

3. **Monitor admin actions** (future: add audit logging)

4. **Use strong default passwords** when creating users

5. **Consider adding rate limiting** to prevent brute force

---

## 🚀 Ready to Deploy

**All changes are local - not pushed to GitHub yet!**

When you're ready:
```bash
git add -A
git commit -m "Add user settings and admin panel with proper security"
git push origin main
```

Railway will auto-deploy in ~30 seconds.

---

## 📝 Future Enhancements

- [ ] Force password change on first login
- [ ] Password reset via email
- [ ] Audit log for admin actions
- [ ] User activity tracking
- [ ] Two-factor authentication
- [ ] Role-based permissions (beyond admin/user)
- [ ] Bulk user import
- [ ] User suspension/deactivation

---

## 🆘 Troubleshooting

**"Admin access required" when you ARE admin:**
- Check database: `SELECT * FROM users WHERE username = 'admin';`
- Verify `is_admin = true`
- Try logging out and back in

**Can't see Admin button:**
- Verify `user.isAdmin` in browser console
- Check `/api/user` endpoint returns `isAdmin: true`

**Password change fails:**
- Verify current password is correct
- Check minimum 6 characters for new password
- Check passwords match in confirm field

**Can't delete user:**
- Verify you're not trying to delete yourself
- Check admin privileges
- Look for foreign key constraints (user has data)


