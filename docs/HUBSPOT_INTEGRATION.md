# HubSpot CRM Integration Guide

## Setup

### 1. Create HubSpot App

1. Go to [developer.hubspot.com](https://developer.hubspot.com)
2. Create new private app
3. **Scopes needed**:
   - `contacts.write` - Create/update contacts
   - `contacts.read` - Fetch contacts
   - `crm.objects.contacts.read` - Read contact properties

### 2. Get Credentials

Private App Settings:

- **Client ID**: (shown in app details)
- **Client Secret**: (generate and copy)

Add to `.env`:

```env
HUBSPOT_CLIENT_ID=your-client-id
HUBSPOT_CLIENT_SECRET=your-client-secret
HUBSPOT_REDIRECT_URI=http://localhost:3000/api/crm_connections/callback
```

### 3. Test Account

HubSpot provides sandbox account with free tier for testing.

---

## Implementation

### OAuth Flow

**File**: `app/api/crm_connections/providers/hubspot.ts`

```typescript
import axios from 'axios';

export async function getAuthorizationUrl(redirectUri: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: process.env.HUBSPOT_CLIENT_ID!,
    scope: 'contacts.write contacts.read crm.objects.contacts.read',
    redirect_uri: redirectUri,
  });
  return `https://app.hubspot.com/oauth/authorize?${params}`;
}

export async function exchangeCodeForToken(code: string, redirectUri: string) {
  const response = await axios.post('https://api.hubapi.com/oauth/v1/token', {
    grant_type: 'authorization_code',
    client_id: process.env.HUBSPOT_CLIENT_ID,
    client_secret: process.env.HUBSPOT_CLIENT_SECRET,
    redirect_uri: redirectUri,
    code,
  });

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
    expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
  };
}

export async function fetchContacts(accessToken: string, limit: number = 100) {
  const response = await axios.get('https://api.hubapi.com/crm/v3/objects/contacts', {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: {
      limit,
      properties: ['firstname', 'lastname', 'email', 'phone', 'jobtitle', 'company'],
    },
  });

  return response.data.results.map((contact: any) => ({
    firstName: contact.properties.firstname,
    lastName: contact.properties.lastname,
    email: contact.properties.email,
    phone: contact.properties.phone,
    title: contact.properties.jobtitle,
    companyName: contact.properties.company,
    providerId: contact.id,
    providerSource: 'hubspot',
  }));
}

export async function createContact(accessToken: string, lead: any) {
  const response = await axios.post(
    'https://api.hubapi.com/crm/v3/objects/contacts',
    {
      properties: {
        firstname: lead.firstName,
        lastname: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        jobtitle: lead.title,
        company: lead.companyName,
      },
    },
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  return response.data.id;
}
```

### Connect OAuth Endpoint

**File**: `app/api/crm_connections/connect/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getAuthorizationUrl } from '../providers/hubspot';

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider') || 'hubspot';
  
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/crm_connections/callback?provider=${provider}`;
  
  if (provider === 'hubspot') {
    const authUrl = await getAuthorizationUrl(redirectUri);
    return NextResponse.redirect(authUrl);
  }

  return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
}
```

### OAuth Callback

**File**: `app/api/crm_connections/callback/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as crypto from 'crypto';
import { exchangeCodeForToken, fetchContacts } from './providers/hubspot';

function encryptToken(token: string): string {
  const key = Buffer.from(process.env.ENCRYPTION_KEY! || 'dev-key', 'utf8').slice(0, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.redirect('/auth/signin');

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const provider = searchParams.get('provider') || 'hubspot';
  const state = searchParams.get('state');

  if (!code) return NextResponse.json({ error: 'No code received' }, { status: 400 });

  try {
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/crm_connections/callback?provider=${provider}`;
    const tokens = await exchangeCodeForToken(code, redirectUri);

    // Encrypt tokens before storing
    const encryptedAccessToken = encryptToken(tokens.accessToken);
    const encryptedRefreshToken = tokens.refreshToken ? encryptToken(tokens.refreshToken) : null;

    // Save connection
    const connection = await prisma.crmConnection.create({
      data: {
        orgId: session.user.orgId,
        provider,
        accessTokenEncrypted: encryptedAccessToken,
        refreshTokenEncrypted: encryptedRefreshToken,
        tokenExpiresAt: tokens.expiresAt,
      },
    });

    // Fetch initial contacts
    const contacts = await fetchContacts(tokens.accessToken);

    // Import contacts as leads
    for (const contact of contacts) {
      const existingLead = await prisma.lead.findFirst({
        where: {
          orgId: session.user.orgId,
          email: contact.email,
        },
      });

      if (!existingLead) {
        await prisma.lead.create({
          data: {
            ...contact,
            orgId: session.user.orgId,
          },
        });
      }
    }

    return NextResponse.redirect(
      `/dashboard/crm?success=true&imported=${contacts.length}`
    );
  } catch (error: any) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(
      `/dashboard/crm?error=${encodeURIComponent(error.message)}`
    );
  }
}
```

### Sync Endpoint

**File**: `app/api/crm_connections/sync/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchContacts } from './providers/hubspot';

function decryptToken(encrypted: string): string {
  const key = Buffer.from(process.env.ENCRYPTION_KEY! || 'dev-key', 'utf8').slice(0, 32);
  const [ivHex, encryptedHex] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = require('crypto').createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { connectionId } = await request.json();

  const connection = await prisma.crmConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection || connection.orgId !== session.user.orgId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const accessToken = decryptToken(connection.accessTokenEncrypted);
    const contacts = await fetchContacts(accessToken, 500);

    let imported = 0;
    for (const contact of contacts) {
      const existing = await prisma.lead.findFirst({
        where: {
          orgId: session.user.orgId,
          email: contact.email,
        },
      });

      if (!existing) {
        await prisma.lead.create({
          data: { ...contact, orgId: session.user.orgId },
        });
        imported++;
      }
    }

    return NextResponse.json({ imported, total: contacts.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Update Worker for CRM Sync

**File**: `scripts/worker.js` (add to main loop)

```javascript
async function processCrmSyncs() {
  const runs = await prisma.syncRun.findMany({
    where: { status: 'running' },
    take: 5,
  });

  for (const run of runs) {
    try {
      const connection = await prisma.crmConnection.findFirst({
        where: { orgId: run.orgId, provider: 'hubspot' },
      });

      if (!connection) continue;

      const { fetchContacts } = require('./app/api/crm_connections/providers/hubspot');
      const token = decryptToken(connection.accessTokenEncrypted);
      const contacts = await fetchContacts(token);

      let inserted = 0;
      for (const contact of contacts) {
        const existing = await prisma.lead.findFirst({
          where: { orgId: run.orgId, email: contact.email },
        });
        if (!existing) {
          await prisma.lead.create({
            data: { ...contact, orgId: run.orgId, verticalId: run.verticalId },
          });
          inserted++;
        }
      }

      await prisma.syncRun.update({
        where: { id: run.id },
        data: {
          status: 'completed',
          insertedCount: inserted,
          skippedCount: contacts.length - inserted,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('CRM sync error:', error);
      await prisma.syncRun.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date(),
        },
      });
    }
  }
}

// In main loop:
await Promise.all([
  processSequenceEnrollments(),
  processSyncRuns(),
  processCrmSyncs(), // Add this
]);
```

---

## Testing

### 1. Local Testing

```bash
npm run dev
node scripts/worker.js
```

1. Go to `/dashboard/crm`
2. Click "Connect HubSpot"
3. Authorize in HubSpot
4. Check that contacts are imported

### 2. Verify Data

```bash
npx prisma studio
# Check Leads table and CrmConnection
```

### 3. Test Sync

POST to `/api/crm_connections/sync`:

```bash
curl -X POST http://localhost:3000/api/crm_connections/sync \
  -H "Content-Type: application/json" \
  -d '{"connectionId":"xxx"}'
```

---

## Production Checklist

- [ ] Use production HubSpot account
- [ ] Set ENCRYPTION_KEY in production .env
- [ ] Test token refresh flow
- [ ] Set up error alerting
- [ ] Rate limit HubSpot API calls
- [ ] Implement webhook from HubSpot for real-time sync
- [ ] Test with large contact lists (>10k)

---

**For more**: [HubSpot API docs](https://developers.hubspot.com/docs/api/overview)
