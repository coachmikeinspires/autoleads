# API Reference

## Base URL

```
http://localhost:3000/api
```

## Authentication

All endpoints require valid NextAuth session. Include `Cookie` header with session:

```
Authorization: Bearer <session-token>
```

Or let the browser handle cookies automatically.

---

## Verticals

### List Verticals

```http
GET /verticals
```

**Response:**
```json
[
  {
    "id": "vert-123",
    "orgId": "org-123",
    "label": "Technology",
    "keywordTags": ["cloud", "AI", "devops"],
    "personTitles": ["CTO", "VP Engineering"],
    "qKeywords": "cloud computing",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### Create Vertical

```http
POST /verticals
Content-Type: application/json

{
  "label": "Technology",
  "keywordTags": ["cloud", "AI"],
  "personTitles": ["CTO"],
  "qKeywords": "cloud computing"
}
```

**Response:** `201 Created`

### Get Vertical

```http
GET /verticals/:id
```

### Update Vertical

```http
PUT /verticals/:id
Content-Type: application/json

{
  "label": "Updated Label"
}
```

### Delete Vertical

```http
DELETE /verticals/:id
```

---

## Leads

### List Leads

```http
GET /leads?verticalId=vert-123
```

**Query Params:**
- `verticalId` (optional): Filter by vertical

**Response:**
```json
[
  {
    "id": "lead-123",
    "orgId": "org-123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1-555-1234",
    "title": "VP Sales",
    "companyName": "Acme Corp",
    "companySize": "500-1000",
    "location": "San Francisco, CA",
    "linkedinUrl": "https://linkedin.com/in/johndoe",
    "providerId": "hubspot-123",
    "providerSource": "hubspot",
    "status": "new",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### Create Lead

```http
POST /leads
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1-555-1234",
  "title": "VP Sales",
  "companyName": "Acme Corp"
}
```

**Response:** `201 Created`

### Get Lead

```http
GET /leads/:id
```

### Update Lead

```http
PUT /leads/:id
Content-Type: application/json

{
  "status": "contacted"
}
```

### Delete Lead

```http
DELETE /leads/:id
```

---

## Email Sequences

### List Sequences

```http
GET /email_sequences
```

**Response:**
```json
[
  {
    "id": "seq-123",
    "orgId": "org-123",
    "name": "Welcome Series",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### Create Sequence

```http
POST /email_sequences
Content-Type: application/json

{
  "name": "Welcome Series",
  "status": "draft"
}
```

### Get Sequence

```http
GET /email_sequences/:id
```

### Update Sequence

```http
PUT /email_sequences/:id
Content-Type: application/json

{
  "status": "active"
}
```

### Delete Sequence

```http
DELETE /email_sequences/:id
```

---

## Sequence Steps

### List Steps

```http
GET /sequence_steps?sequenceId=seq-123
```

**Response:**
```json
[
  {
    "id": "step-123",
    "sequenceId": "seq-123",
    "stepNumber": 1,
    "subject": "Welcome!",
    "body": "Hello {{firstName}}...",
    "delayDays": 0,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### Create Step

```http
POST /sequence_steps
Content-Type: application/json

{
  "sequenceId": "seq-123",
  "stepNumber": 1,
  "subject": "Welcome!",
  "body": "Hello {{firstName}}...",
  "delayDays": 0
}
```

---

## Sequence Enrollments

### List Enrollments

```http
GET /sequence_enrollments?leadId=lead-123
```

**Response:**
```json
[
  {
    "id": "enr-123",
    "leadId": "lead-123",
    "sequenceId": "seq-123",
    "currentStep": 1,
    "status": "active",
    "enrolledAt": "2024-01-01T00:00:00Z"
  }
]
```

### Create Enrollment

```http
POST /sequence_enrollments
Content-Type: application/json

{
  "leadId": "lead-123",
  "sequenceId": "seq-123"
}
```

### Get Enrollment

```http
GET /sequence_enrollments/:id
```

### Update Enrollment

```http
PATCH /sequence_enrollments/:id
Content-Type: application/json

{
  "status": "completed",
  "currentStep": 2
}
```

### Delete Enrollment

```http
DELETE /sequence_enrollments/:id
```

---

## Email Sends

### List Email Sends

```http
GET /email_sends?enrollmentId=enr-123
```

**Response:**
```json
[
  {
    "id": "send-123",
    "enrollmentId": "enr-123",
    "stepId": "step-123",
    "sentAt": "2024-01-01T10:00:00Z",
    "openedAt": "2024-01-01T11:00:00Z",
    "clickedAt": null,
    "repliedAt": null,
    "bouncedAt": null
  }
]
```

### Create Email Send

```http
POST /email_sends
Content-Type: application/json

{
  "enrollmentId": "enr-123",
  "stepId": "step-123"
}
```

---

## Sync Runs

### List Sync Runs

```http
GET /sync_runs
```

**Response:**
```json
[
  {
    "id": "run-123",
    "orgId": "org-123",
    "verticalId": "vert-123",
    "requestedCount": 50,
    "insertedCount": 45,
    "skippedCount": 5,
    "status": "completed",
    "errorMessage": null,
    "startedAt": "2024-01-01T10:00:00Z",
    "completedAt": "2024-01-01T10:15:00Z"
  }
]
```

### Start Sync Run

```http
POST /sync_runs
Content-Type: application/json

{
  "verticalId": "vert-123",
  "requestedCount": 50
}
```

### Get Sync Run

```http
GET /sync_runs/:id
```

### Update Sync Run

```http
PATCH /sync_runs/:id
Content-Type: application/json

{
  "status": "completed",
  "insertedCount": 45,
  "skippedCount": 5
}
```

---

## CRM Connections

### List Connections

```http
GET /crm_connections
```

**Response:**
```json
[
  {
    "id": "crm-123",
    "orgId": "org-123",
    "provider": "hubspot",
    "tokenExpiresAt": "2024-02-01T00:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### Create Connection

```http
POST /crm_connections
Content-Type: application/json

{
  "provider": "hubspot",
  "accessToken": "...",
  "refreshToken": "...",
  "tokenExpiresAt": "2024-02-01T00:00:00Z"
}
```

### Initiate OAuth

```http
GET /crm_connections/connect?provider=hubspot
```

Redirects to provider's OAuth authorization URL.

### OAuth Callback

```http
GET /crm_connections/callback?code=xxx&provider=hubspot
```

Handled automatically after OAuth flow.

---

## Billing

### Create Checkout Session

```http
POST /billing/checkout
Content-Type: application/json

{
  "planId": "starter|growth|pro"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/pay/cs_xxx"
}
```

### Webhook

```http
POST /billing/webhook
```

Receives events from Stripe. No request body needed (Stripe sends via webhook).

---

## Stats

### Get Dashboard Stats

```http
GET /stats
```

**Response:**
```json
{
  "summary": {
    "leads": 150,
    "sequences": 5,
    "enrollments": 200,
    "emailsSent": 450,
    "verticals": 3
  },
  "leadsByStatus": [
    { "status": "new", "_count": 100 },
    { "status": "contacted", "_count": 50 }
  ],
  "enrollmentsByStatus": [
    { "status": "active", "_count": 150 },
    { "status": "completed", "_count": 50 }
  ],
  "recentEnrollments": [...]
}
```

---

## Auth

### Get Session

```http
GET /auth/session
```

**Response:**
```json
{
  "session": {
    "user": {
      "id": "user-123",
      "email": "admin@example.com",
      "role": "admin",
      "orgId": "org-123"
    },
    "expires": "2024-02-01T00:00:00Z"
  }
}
```

### Sign In

```http
POST /auth/signin
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

### Sign Out

```http
POST /auth/signout
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Invalid request body"
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found

```json
{
  "error": "Not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

- Email sending: **100 emails/minute** (token bucket)
- API endpoints: No explicit rate limit (recommended: add via middleware)

---

## Testing with cURL

```bash
# List verticals
curl -X GET http://localhost:3000/api/verticals \
  -H "Cookie: sessionToken=..."

# Create lead
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  }'

# Get stats
curl -X GET http://localhost:3000/api/stats
```

---

**For more details, see [DEVELOPMENT.md](./DEVELOPMENT.md)**
