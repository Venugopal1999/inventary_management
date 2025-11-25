# Troubleshooting 422 Error

## What is a 422 Error?

**422 Unprocessable Content** means your request reached the server, but the data you sent failed validation.

---

## Common Causes & Solutions

### 1. Missing Required Fields

**Login requires:**
- `email` (must be valid email format)
- `password`

**Wrong ❌:**
```json
{
  "username": "admin@example.com",
  "pass": "password"
}
```

**Correct ✅:**
```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

---

### 2. Missing Content-Type Header

**Wrong ❌:**
```
Headers: (none)
```

**Correct ✅:**
```
Content-Type: application/json
Accept: application/json
```

---

### 3. Invalid JSON Format

**Wrong ❌:**
```
email=admin@example.com&password=password
```

**Correct ✅:**
```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

---

### 4. Invalid Email Format

**Wrong ❌:**
```json
{
  "email": "admin",
  "password": "password"
}
```

**Correct ✅:**
```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

---

## How to Fix

### Option 1: Use the Test Page (Easiest!)

I've created a test page for you:

1. Open in browser: `C:\Users\Venugopal Katragadda\Desktop\Inventory_management_website\test-api.html`
2. Click "Login" button
3. It will automatically test all endpoints!

---

### Option 2: Using Postman

**Login Request:**

1. **Method**: POST
2. **URL**: `http://localhost:8000/api/login`
3. **Headers** tab:
   ```
   Content-Type: application/json
   Accept: application/json
   ```
4. **Body** tab:
   - Select: `raw`
   - Format: `JSON`
   - Content:
     ```json
     {
       "email": "admin@example.com",
       "password": "password"
     }
     ```
5. Click **Send**

---

### Option 3: Using cURL

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"password\"}"
```

---

## Expected Successful Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@example.com",
      "created_at": "2025-11-05T...",
      "updated_at": "2025-11-05T..."
    },
    "token": "1|abc123def456..."
  }
}
```

---

## Still Getting 422?

Check the response body - it will tell you what's wrong:

### Example 422 Response:
```json
{
  "message": "The email field is required.",
  "errors": {
    "email": [
      "The email field is required."
    ]
  }
}
```

This tells you exactly what's missing!

---

## Quick Checklist

Before making a request, verify:

- [ ] Method is correct (POST for login)
- [ ] URL is correct (`http://localhost:8000/api/login`)
- [ ] Content-Type header is `application/json`
- [ ] Accept header is `application/json`
- [ ] Body is valid JSON (not form data or URL encoded)
- [ ] Email field exists and is valid email format
- [ ] Password field exists
- [ ] Backend server is running

---

## Test Right Now

**Easiest way to test:**

1. Open `test-api.html` in your browser
2. Click the "Login" button
3. It will show you exactly what the request and response look like

**File location:**
```
C:\Users\Venugopal Katragadda\Desktop\Inventory_management_website\test-api.html
```

Just double-click it to open in your browser!

---

## Need More Help?

If you're still stuck, tell me:
1. What tool you're using (browser, Postman, cURL)
2. The exact request you're sending
3. The exact error response you're getting

I'll help you fix it!
