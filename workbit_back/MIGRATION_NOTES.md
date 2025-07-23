# WorkBit Backend - Supabase Auth Migration

## Overview
This document outlines the changes made to migrate the WorkBit backend from a local authentication system to Supabase Auth, following the new database schema.

## Database Schema Changes

### Old Schema (Removed)
- `users.email` - Now handled by Supabase Auth
- `users.password` - Now handled by Supabase Auth

### New Schema (Added)
- `users.user_id` (UUID) - Foreign key to `auth.users(id)` in Supabase Auth
- Users table now focuses on profile data only

## Code Changes Made

### 1. routes/auth.js
**Major Changes:**
- **Login**: Now uses `email` instead of `username` for authentication
- **Authentication**: Uses `supabase.auth.signInWithPassword()` instead of local password validation
- **Registration**: Creates user in Supabase Auth first, then creates profile in users table
- **User Response**: Email now comes from `authData.user.email` (Supabase Auth)
- **JWT Token**: Now includes `supabaseUserId` for linking

**API Changes:**
- `POST /login` now expects `{ email, password }` instead of `{ username, password }`
- Registration creates both Supabase Auth user and profile record
- Cleanup: Removes auth user if profile creation fails

### 2. routes/users.js
**Changes:**
- Removed `email` from all SELECT queries
- Removed email validation from update endpoints
- Added `user_id` field to queries for Supabase Auth linking
- Fixed `/profile` endpoint to require authentication
- Added username uniqueness validation on updates
- Enhanced delete to also remove Supabase Auth user

### 3. routes/cards.js
**Changes:**
- Removed `email` field from user data in card assignment responses
- Simplified user data structure

### 4. middleware/auth.js
**Changes:**
- Updated user query to include `user_id` field
- Removed `email` from user data selection
- Authentication still uses JWT but now links to Supabase users

### 5. models/Cache.js
**Changes:**
- Removed `email` field from `user_data` schema in cache models
- Maintains consistency with new user data structure

## API Endpoint Changes

### Authentication Endpoints
```bash
# OLD
POST /login
{
  "username": "johndoe",
  "password": "password123"
}

# NEW  
POST /login
{
  "email": "john@example.com", 
  "password": "password123"
}
```

### User Data Response Format
```javascript
// OLD
{
  id: 1,
  name: "John",
  lastname: "Doe", 
  username: "johndoe",
  email: "john@example.com",  // From users table
  role: "user"
}

// NEW
{
  id: 1,
  name: "John",
  lastname: "Doe",
  username: "johndoe", 
  email: "john@example.com",  // From Supabase Auth
  role: "user"
}
```

## Environment Variables
Ensure these are set in your `.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Required for user deletion
JWT_SECRET=your-jwt-secret
```

## Migration Checklist

### Database
- [ ] Run the new SQL schema in Supabase
- [ ] Ensure `auth.users` table exists (automatic in Supabase)
- [ ] Update existing user records to link with Supabase Auth users

### Backend
- [x] Update auth routes to use Supabase Auth
- [x] Remove email/password from users table queries
- [x] Update middleware for new schema
- [x] Update cache models
- [x] Update card management routes

### Frontend (Requires separate updates)
- [ ] Update login forms to use email instead of username
- [ ] Update API calls to match new endpoints
- [ ] Handle new authentication flow

## Testing

### Test Authentication
```bash
# Test login with email
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test",
    "lastname":"User",
    "username":"testuser",
    "email":"test@example.com",
    "password":"password123"
  }'
```

### Test User Endpoints
```bash
# Get user profile (requires auth token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/users/profile
```

## Breaking Changes

1. **Login API**: Now requires `email` instead of `username`
2. **User Data**: `email` field in responses now comes from Supabase Auth
3. **Registration**: Must provide valid email for Supabase Auth
4. **Dependencies**: Requires Supabase to be properly configured

## Migration for Existing Data

If you have existing users, you'll need to:
1. Create corresponding Supabase Auth users for existing profiles
2. Update user records with the `user_id` from Supabase Auth
3. Test authentication flow with existing users

## Rollback Plan

If needed to rollback:
1. Restore `email` and `password` fields to users table
2. Revert auth.js to use local authentication
3. Update other files to include email in queries
4. Remove `user_id` field dependency 