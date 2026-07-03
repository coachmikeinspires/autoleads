# Troubleshooting Guide

## Common Issues & Solutions

### Database Issues

#### "Error: connect ECONNREFUSED"

**Cause**: Database connection failed

**Solution**:
```bash
# Check if database file exists
ls -la prisma/dev.db

# Recreate database
rm prisma/dev.db
npx prisma migrate dev --name init
```

#### "Migration failed: relation does not exist"

**Cause**: Prisma client not generated after schema change

**Solution**:
```bash
npx prisma generate
npx prisma migrate dev
```

#### "PrismaClientInitializationError"

**Cause**: Prisma client not found or incorrect datasource

**Solution**:
```bash
rm -rf node_modules/.prisma
npx prisma generate
npm install
```

---

### Authentication Issues

#### "Session not found" / Redirect loop

**Cause**: `NEXTAUTH_SECRET` not set or incorrect

**Solution**:
```bash
# Generate secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
echo "NEXTAUTH_SECRET=<generated-secret>" >> .env
```

#### "Invalid credentials" on sign-in

**Cause**: User not seeded or password incorrect

**Solution**:
```bash
# Verify user exists
npx prisma studio
# Check Users table

# Reseed if missing
node prisma/seed_sqlite.js

# Default: admin@example.com / password123
```

#### "Session callback error"

**Cause**: Missing required fields in session callback

**Solution**: Ensure `lib/auth.ts` session callback includes:
```typescript
session.user.id = token.id;
session.user.role = token.role;
session.user.orgId = token.orgId;
```

---

### API Issues

#### "401 Unauthorized" on all API calls

**Cause**: No valid session

**Solution**:
1. Ensure user is signed in
2. Check cookies are being sent
3. Verify `NEXTAUTH_URL` matches `process.env.NEXTAUTH_URL`

#### "Failed to create resource" (400 error)

**Cause**: Missing required fields or invalid data

**Solution**: Check request body matches schema. Use Swagger/API reference.

#### "OrgId mismatch" error

**Cause**: Trying to access resource from another org

**Solution**: Verify session contains correct `orgId` and resource belongs to that org.

---

### Background Worker Issues

#### "Worker not processing emails"

**Cause**: Worker not running or database connection failed

**Solution**:
```bash
# Start worker with output
node scripts/worker.js

# Check logs
node scripts/worker.js 2>&1 | tee worker.log

# Check for errors in database
npx prisma studio
# Verify SequenceEnrollment records exist with status='active'
```

#### "Emails sent but not visible in database"

**Cause**: Worker processing but not committing

**Solution**:
```bash
# Check worker is calling prisma correctly
cat scripts/worker.js | grep "prisma.emailSend"

# Restart worker with SIGTERM to flush
kill -TERM $(pgrep -f "node scripts/worker.js")
```

#### "Worker consuming too much CPU"

**Cause**: Processing loop too fast or infinite loop

**Solution**:
```javascript
// Increase tick interval in scripts/worker.js
const TICK_INTERVAL = 10000; // 10 seconds instead of 5
```

---

### Email Issues

#### "nodemailer: connect ECONNREFUSED"

**Cause**: SMTP server not running or incorrect config

**Solution**:
```bash
# Use test email service (development)
npm install -g mailhog
mailhog

# Configure SMTP in .env:
# SMTP_HOST=localhost
# SMTP_PORT=1025
```

#### "SMTPAuthenticationError"

**Cause**: Incorrect SMTP credentials

**Solution**:
```bash
# For production, use SendGrid/AWS SES
# Get credentials from provider
# Add to .env and redeploy
```

#### "Email not sending in production"

**Cause**: SMTP not configured or credentials invalid

**Solution**:
1. Verify SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in production .env
2. Check SMTP provider's IP whitelist
3. Test with `telnet $SMTP_HOST $SMTP_PORT`

---

### Stripe Issues

#### "Stripe webhook validation failed"

**Cause**: Signature secret incorrect or webhook body modified

**Solution**:
```bash
# Get correct webhook secret
# Stripe Dashboard → Developers → Webhooks → Signing Secret

# Add to .env
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Restart app
npm run dev
```

#### "Checkout session creation failed"

**Cause**: Missing price ID or API key invalid

**Solution**:
```bash
# Verify price IDs exist in Stripe
# Stripe Dashboard → Products → Prices

# Check API key in .env
# Should start with sk_test_ (test) or sk_live_ (production)

# Test with curl
curl https://api.stripe.com/v1/checkout/sessions \
  -u sk_test_xxx: \
  -d mode=subscription \
  -d 'line_items[0][price]'=price_xxx \
  -d 'line_items[0][quantity]'=1 \
  -d success_url=https://localhost:3000/success
```

#### "Payment declined"

**Cause**: Test card not valid or expired

**Solution**: Use test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

---

### Build Issues

#### "Cannot find module '@/lib/...'"

**Cause**: Alias not resolved by build

**Solution**: Check `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

#### "TypeError: Cannot read property of undefined"

**Cause**: Circular dependency or missing initialization

**Solution**:
```bash
# Clear build cache
rm -rf .next node_modules/.cache

# Rebuild
npm run build

# Check for circular imports
npx depcheck
```

#### "Build succeeds but app crashes on start"

**Cause**: Runtime error in API route or middleware

**Solution**:
```bash
# Start with verbose logging
DEBUG=* npm run dev

# Check middleware.ts for errors
# Check layout.tsx for runtime issues
```

---

### Deployment Issues

#### "Vercel build fails"

**Cause**: Environment variables missing or version mismatch

**Solution**:
1. Verify all env vars in Vercel Dashboard
2. Check Node.js version matches local
3. Check for hardcoded paths

#### "Application crash on production"

**Cause**: Environment mismatch or missing dependencies

**Solution**:
```bash
# Check logs
vercel logs --tail

# Verify all env vars set
vercel env pull

# Test locally with production build
npm run build
npm start
```

#### "Database connection timeout in production"

**Cause**: PostgreSQL connection pool exhausted or network issue

**Solution**:
```bash
# Check connection string (use connection pooling)
# Railway/Supabase: Use pgBouncer for connection pooling

# Increase pool size in prisma.config.ts
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  # For migrations
}
```

---

### Performance Issues

#### "Page loading slowly"

**Cause**: Unoptimized queries or missing indexes

**Solution**:
```bash
# Check query performance
npx prisma studio
# Run queries and check execution time

# Add indexes to schema
model Lead {
  @@index([orgId])
  @@index([status])
  @@index([email])
}
```

#### "High memory usage"

**Cause**: Large dataset processing or memory leak

**Solution**:
```bash
# Check worker memory usage
top -p $(pgrep -f "node scripts/worker.js")

# Reduce batch size in worker
const BATCH_SIZE = 25; // Reduce from 50
```

---

## Debug Checklist

- [ ] Check `.env` file is set correctly
- [ ] Run `npx prisma migrate dev` to update schema
- [ ] Verify database connection: `npx prisma studio`
- [ ] Check session storage: NextAuth SessionToken cookie exists
- [ ] Review API endpoint org scoping (all queries filter by orgId)
- [ ] Verify Prisma client generated: `ls node_modules/.prisma/client/index.js`
- [ ] Check error logs: `npm run dev` terminal output
- [ ] Clear browser cache and cookies
- [ ] Test with Incognito/Private window
- [ ] Restart dev server: `npm run dev`

## Getting Help

1. **Check logs**: `npm run dev` output or `vercel logs --tail`
2. **Search docs**: `grep -r "error message" docs/`
3. **Ask AI**: Describe error and steps to reproduce
4. **GitHub Issues**: Search existing issues
5. **Community**: Ask on Reddit, Discord, etc.

---

**Still stuck? Create an issue on GitHub with:**
- Error message (full stack trace)
- Steps to reproduce
- Environment (Node version, OS, etc.)
- Logs from npm run dev
