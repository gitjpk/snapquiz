# Quickstart: Host Password Protection

## Prerequisites

- Node.js 20 LTS
- Existing SnapQuiz setup from feature 001

## Setup

```bash
# 1. Install new dependencies
npm install bcrypt jose
npm install -D @types/bcrypt

# 2. Run database migration (adds HostCredential, HostSession tables)
npm run db:migrate

# 3. Start development server
npm run dev
```

## First-Run Setup

1. Navigate to http://localhost:3000/host/quizzes
2. System detects no password exists → redirects to `/host/setup`
3. Enter a password (minimum 8 characters)
4. Click "Create Password"
5. You're now authenticated and redirected to the host dashboard

## Development Workflow

### Test Login Flow

1. Open http://localhost:3000/host/quizzes in incognito window
2. You should see the login form
3. Enter the password you created during setup
4. Verify access to host dashboard

### Test Protected API Endpoints

```bash
# Without auth (should return 401)
curl http://localhost:3000/api/quizzes -X POST \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Quiz", "questions": []}'

# With auth (use browser cookies or get token from login)
# Login first, then copy the host_session cookie
curl http://localhost:3000/api/quizzes -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: host_session=<your-token>" \
  -d '{"title": "Test Quiz", "questions": [...]}'
```

### Test Rate Limiting

```bash
# Attempt 6 rapid failed logins - 6th should be blocked
for i in {1..6}; do
  curl http://localhost:3000/api/auth/login -X POST \
    -H "Content-Type: application/json" \
    -d '{"password": "wrongpassword"}'
  echo ""
done
```

### Test Password Change

1. Log in as host
2. Navigate to `/host/settings`
3. Enter current password and new password
4. Submit and verify new password works

### Test Logout

1. Log in as host
2. Click "Logout" button in header
3. Verify redirect to login page
4. Verify protected pages require re-authentication

## Reset Password (CLI)

If you forget the host password:

```bash
npm run reset-password
```

This will:
1. Prompt for a new password
2. Update the password hash in the database
3. Invalidate all existing sessions

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/auth/password.ts` | bcrypt hash/verify functions |
| `src/lib/auth/session.ts` | JWT create/validate functions |
| `src/lib/auth/middleware.ts` | API route protection |
| `src/middleware.ts` | Next.js page route protection |
| `src/app/api/auth/login/route.ts` | Login endpoint |
| `src/app/api/auth/logout/route.ts` | Logout endpoint |
| `src/app/api/auth/setup/route.ts` | First-run setup endpoint |
| `src/app/(host)/login/page.tsx` | Login page UI |
| `src/app/(host)/host/settings/page.tsx` | Password change UI |

## Testing

```bash
# Unit tests for auth logic
npm run test -- --grep "auth"

# E2E test for login flow
npm run test:e2e -- --grep "host-auth"
```

## Troubleshooting

### "Password too short" error

Password must be at least 8 characters. This is enforced on both client and server.

### Can't access host area after setup

1. Check browser cookies - should have `host_session` cookie
2. Cookie might be expired (24h TTL) - log in again
3. Check console for JWT validation errors

### Rate limited unexpectedly

Rate limit is per-IP. If testing from same machine, wait 1 minute or restart server to clear in-memory rate limit store.

### Database issues

```bash
# Reset database and re-run migrations
rm prisma/dev.db
npm run db:migrate
npm run db:seed  # Optional: re-seed quiz data
```
