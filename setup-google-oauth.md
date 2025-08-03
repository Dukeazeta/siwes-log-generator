# Setting Up Google OAuth for SwiftLog

## Step 1: Google Cloud Console Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create or select a project** for SwiftLog
3. **Enable required APIs**:
   - Go to "APIs & Services" > "Library"
   - Search and enable "Google+ API" or "People API"

4. **Create OAuth 2.0 credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Set name: "SwiftLog"
   - Add authorized redirect URIs:
     ```
     https://qvpotrddyrqudpieymhg.supabase.co/auth/v1/callback
     http://localhost:3000/auth/callback
     ```

5. **Copy your credentials**:
   - Client ID: `your-client-id.apps.googleusercontent.com`
   - Client Secret: `your-client-secret`

## Step 2: Configure Supabase

Once you have the Google credentials, run this command to configure Supabase:

```bash
# Replace with your actual credentials
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

Then I can update the Supabase configuration with these credentials.

## Step 3: Test Authentication

After configuration:
1. Email/Password signup/login should work immediately
2. Google OAuth will work after Step 2 is completed
3. Users will be redirected to `/dashboard` after successful authentication

## Current Status

✅ Supabase project configured
✅ Email/Password authentication ready
✅ Google OAuth enabled (needs credentials)
✅ Authentication context implemented
✅ Login/Signup pages connected to Supabase
⏳ Google OAuth credentials needed

## Testing

You can test email/password authentication right now:
1. Go to `/signup` and create an account
2. Check your email for confirmation (if email confirmation is enabled)
3. Login with your credentials
4. You'll be redirected to the dashboard
