# Backend & Frontend Integration - Fixed!

## Issues Resolved

### 1. Missing Database Table (`accounts_userprofile`)

**Problem:** The `accounts_userprofile` table didn't exist in the database.
**Solution:** Created and ran migrations for the `accounts` app.

### 2. Registration 400 Bad Request

**Problem:** Empty strings for optional fields (`phone_number`, `upi_id`) caused validation issues.
**Solution:**

- Updated `RegisterSerializer` to accept `allow_null=True` for optional fields
- Added logic to convert empty strings to `None`
- Added `save()` override in `UserProfile` model to handle empty strings

### 3. Better Error Handling

**Solution:** Added debug logging to `RegisterView` to show validation errors in console.

## Files Modified

1. **backend/accounts/models.py**

   - Added `save()` method to convert empty strings to `None`

2. **backend/accounts/serializers.py**

   - Added `allow_null=True` to optional fields
   - Convert empty strings to `None` in `create()` method

3. **backend/accounts/views.py**

   - Added error logging for debugging

4. **frontend/.env.local**
   - Already configured with `NEXT_PUBLIC_API_URL=http://localhost:8000`

## How to Run

### Backend (Terminal 1)

```powershell
cd D:\UPI-Fraud-Detection\backend
. .\venv\Scripts\Activate.ps1
python manage.py runserver 8000
```

### Frontend (Terminal 2)

```powershell
cd D:\UPI-Fraud-Detection\frontend
npm run dev
```

## Test the Integration

1. Open http://localhost:3000 in your browser
2. Click "Create Account" or go to http://localhost:3000/register
3. Fill in the registration form:
   - Username: `testuser`
   - Email: `test@example.com`
   - First Name: `Test`
   - Last Name: `User`
   - Password: `password123`
   - Confirm Password: `password123`
   - Phone Number: (optional, leave blank)
   - UPI ID: (optional, leave blank)
4. Click "Create Account"
5. You should be automatically redirected to `/dashboard` with a success toast

## Login Flow

1. Go to http://localhost:3000/login
2. Enter your username and password
3. Click "Sign In"
4. You should be redirected to `/dashboard` with a success toast

## API Endpoints

- **POST** `/api/auth/register/` - Register new user
- **POST** `/api/auth/login/` - Login (get JWT tokens)
- **POST** `/api/auth/token/refresh/` - Refresh access token
- **GET** `/api/auth/profile/` - Get current user profile
- **PATCH** `/api/auth/profile/` - Update user profile
- **POST** `/api/auth/logout/` - Logout

## Verification

Registration endpoint tested successfully:

```bash
✅ Direct serializer test: PASSED
✅ Python script test: PASSED
✅ HTTP POST request test: PASSED
✅ User created with tokens returned
```

## Next Steps

1. Start both backend and frontend servers
2. Test registration and login flows
3. If you encounter any issues, check:
   - Browser console for errors
   - Backend terminal for request logs
   - Network tab in DevTools to see API responses

## Troubleshooting

### If registration still fails:

- Check backend terminal for validation errors (now logged)
- Verify `NEXT_PUBLIC_API_URL` in frontend/.env.local
- Clear browser localStorage and try again
- Restart both servers

### CORS Issues:

Backend is configured to allow `http://localhost:3000` by default. If your frontend runs on a different port, update `CORS_ALLOWED_ORIGINS` in backend/.env or settings.py.
