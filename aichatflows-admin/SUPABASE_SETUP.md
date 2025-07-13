# 🔧 Supabase Setup & Network Error Fix Guide

## 🚨 **IMPORTANT: Update Your .env File**

The current `.env` file contains placeholder values that **WILL CAUSE NETWORK ERRORS**. You must replace them with your actual Supabase credentials.

## 📋 **Step-by-Step Setup**

### **1. Get Your Supabase Credentials**

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Open your project
3. Go to `Settings` → `API`
4. Copy these two values:

```bash
# Project URL (looks like this)
https://abcdefghijk.supabase.co

# Anon Key (starts with eyJ...)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **2. Update Your .env File**

Replace the placeholder values in `.env`:

```bash
# Replace these exact values:
EXPO_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-anon-key

# Keep debug mode enabled for troubleshooting
EXPO_PUBLIC_DEBUG_MODE=true
```

### **3. Restart the App**

```bash
# Stop the current server (Ctrl+C)
# Then restart with cleared cache
npx expo start --clear
```

## 🔍 **Troubleshooting**

### **Check if Environment Variables are Loading**

1. With `EXPO_PUBLIC_DEBUG_MODE=true`, check your Metro bundler terminal
2. Look for these debug messages:
   ```
   [Supabase Debug] Validating environment variables...
   [Supabase Debug] EXPO_PUBLIC_SUPABASE_URL: https://your-project.supabase.co
   [Supabase Debug] EXPO_PUBLIC_SUPABASE_ANON_KEY exists: true
   ```

### **Test Connection Button**

When debug mode is enabled, you'll see a "🔧 Test Supabase Connection" button on the signup screen. Use it to verify your connection.

### **Common Error Messages & Solutions**

| Error | Cause | Solution |
|-------|-------|----------|
| `Network request failed` | Wrong URL or placeholder values | Update .env with real Supabase URL |
| `Invalid API key` | Wrong anon key | Copy correct anon key from Supabase dashboard |
| `Project not found` | Wrong project ID in URL | Verify project URL format |
| `fetch failed` | Network/internet issue | Check internet connection |

## 🧪 **Testing Authentication**

### **1. Sign Up Test**
```bash
# Use these test credentials:
Email: test@example.com
Password: testpass123
```

### **2. Expected Behavior**
- **Success**: "Check Your Email" alert appears
- **Failure**: Specific error message with troubleshooting hints

### **3. Debug Output**
With debug mode enabled, check console for:
```
[Auth Debug] Attempting sign up... { email: "test@example.com" }
[Supabase Debug] Testing Supabase connection...
[Auth Debug] Sign up successful: true
```

## 🏗️ **Supabase Project Setup**

Make sure your Supabase project has:

### **1. Authentication Enabled**
- Go to `Authentication` → `Settings`
- Enable "Enable email confirmations" (recommended)
- Set "Site URL" to your app's URL

### **2. Row Level Security (Optional)**
- Create tables for your app data
- Set up RLS policies as needed

### **3. Email Templates (Optional)**
- Customize email confirmation templates in `Authentication` → `Email Templates`

## 🔧 **Development vs Production**

### **Development Mode**
```bash
EXPO_PUBLIC_DEBUG_MODE=true
```
- Enables detailed logging
- Shows debug buttons
- Connection testing
- Helpful error messages

### **Production Mode**
```bash
EXPO_PUBLIC_DEBUG_MODE=false
```
- Minimal logging
- No debug buttons
- Clean user experience

## 📱 **iOS Network Configuration**

The app includes proper iOS network security settings for Supabase:

```json
"NSAppTransportSecurity": {
  "NSAllowsArbitraryLoads": false,
  "NSExceptionDomains": {
    "supabase.co": {
      "NSExceptionAllowsInsecureHTTPLoads": false,
      "NSExceptionMinimumTLSVersion": "TLSv1.2",
      "NSIncludesSubdomains": true
    }
  }
}
```

## ✅ **Verification Checklist**

- [ ] Updated `.env` with real Supabase URL
- [ ] Updated `.env` with real anon key  
- [ ] Restarted Expo server with `--clear`
- [ ] Debug mode enabled (`EXPO_PUBLIC_DEBUG_MODE=true`)
- [ ] Tested connection using debug button
- [ ] Checked console for debug messages
- [ ] Attempted sign up with test credentials

## 🆘 **Still Having Issues?**

1. **Double-check your .env file** - most issues are caused by incorrect credentials
2. **Check the Metro bundler console** for debug messages
3. **Try the connection test button** on the signup screen
4. **Verify your Supabase project is active** and not paused
5. **Check your internet connection**

The enhanced error handling will provide specific guidance for most common issues!