# Quickstart: Multi-Host Development Setup

**Feature**: 005-multi-host-accounts  
**Date**: 2026-02-03

## Prerequisites

- Node.js 20+
- Azure account with access to Microsoft Entra ID (Azure AD)

## Step 1: Register App in Microsoft Entra ID

### 1.1 Go to Azure Portal

1. Navigate to [Azure Portal](https://portal.azure.com)
2. Search for "Microsoft Entra ID" (or "Azure Active Directory")
3. Go to "App registrations" → "New registration"

### 1.2 Register the Application

- **Name**: `SnapQuiz (Development)`
- **Supported account types**: "Accounts in any organizational directory and personal Microsoft accounts"
- **Redirect URI**: 
  - Platform: `Web`
  - URI: `http://localhost:3000/api/auth/callback`

Click **Register**.

### 1.3 Note the Application IDs

After registration, copy:
- **Application (client) ID** → `AZURE_AD_CLIENT_ID`
- **Directory (tenant) ID** → Use `common` for multi-tenant

### 1.4 Create Client Secret

1. Go to "Certificates & secrets"
2. Click "New client secret"
3. Description: `dev-secret`
4. Expiration: 6 months (for dev)
5. Copy the **Value** immediately → `AZURE_AD_CLIENT_SECRET`

### 1.5 Configure API Permissions (Already default)

Ensure these permissions are present:
- `openid` (delegated)
- `profile` (delegated)
- `email` (delegated)

## Step 2: Configure Environment

### 2.1 Update `.env`

Add to your `.env` file:

```env
# Microsoft Entra ID (Azure AD)
AZURE_AD_CLIENT_ID=your-client-id-here
AZURE_AD_CLIENT_SECRET=your-client-secret-here
AZURE_AD_TENANT_ID=common
```

### 2.2 Update `.env.example`

Add template entries (no real values):

```env
# Microsoft Entra ID (Azure AD)
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_TENANT_ID=common
```

## Step 3: Install Dependencies

```bash
npm install @azure/msal-node
```

## Step 4: Run Database Migration

```bash
# Reset database with new schema
npx prisma db push --force-reset

# Generate Prisma client
npx prisma generate
```

## Step 5: Start Development Server

```bash
npm run dev
```

## Step 6: Test Login Flow

1. Open http://localhost:3000
2. Click "Se connecter avec Microsoft"
3. Sign in with your Microsoft account
4. You should be redirected to `/host/quizzes`

## Troubleshooting

### "AADSTS50011: Reply URL does not match"

Ensure the redirect URI in Azure matches exactly:
- `http://localhost:3000/api/auth/callback` (no trailing slash)

### "AADSTS7000218: Invalid client secret"

1. Client secret may have expired
2. Create a new secret in Azure Portal
3. Update `.env` with new value

### "Session cookie not being set"

For localhost development, ensure:
- `USE_HTTPS_COOKIES` is NOT set (or set to `false`)
- Browser allows third-party cookies (for OAuth flow)

## Production Setup

For production (e.g., Azure App Service):

1. Add production redirect URI in Azure:
   - `https://snapquiz.azurewebsites.net/api/auth/callback`

2. Set environment variables in Azure App Service:
   - `AZURE_AD_CLIENT_ID`
   - `AZURE_AD_CLIENT_SECRET`
   - `AZURE_AD_TENANT_ID=common`
   - `USE_HTTPS_COOKIES=true`

3. Ensure cookie settings use `secure: true` and `sameSite: "none"` for HTTPS.
