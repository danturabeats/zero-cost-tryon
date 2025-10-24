# 🏗️ System Architecture Documentation

## Overview

This document provides a deep dive into the zero-cost virtual try-on system architecture, explaining how each component works and communicates.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                         │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ 1. Submit form
                               │    (user_photo, garment_photo, email)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FIREBASE HOSTING                            │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  frontend/index.html                                   │     │
│  │  • Simple HTML form with file inputs                   │     │
│  │  • JavaScript for form submission                      │     │
│  │  • Posts multipart/form-data to Function               │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ 2. POST /api/submit
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FIREBASE CLOUD FUNCTION                       │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  firebase-functions/index.js → submitTryOn()           │     │
│  │                                                         │     │
│  │  Step 1: Parse multipart/form-data with Busboy         │     │
│  │  Step 2: Upload images to Firebase Storage             │     │
│  │          → requests/{requestId}/user_photo.jpg          │     │
│  │          → requests/{requestId}/garment_photo.jpg       │     │
│  │  Step 3: Create Firestore document                     │     │
│  │          → Collection: requests                         │     │
│  │          → Doc ID: req_{timestamp}_{random}             │     │
│  │          → Fields: { email, userPhotoUrl,               │     │
│  │                      garmentPhotoUrl, status: pending } │     │
│  │  Step 4: Trigger GitHub Actions via webhook            │     │
│  │          → POST to GitHub API repository_dispatch      │     │
│  │          → Payload: { request_id, user_photo_url,       │     │
│  │                       garment_photo_url, email }        │     │
│  │  Step 5: Return success response                       │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ 3. repository_dispatch event
                               │    (with client_payload)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GITHUB ACTIONS RUNNER                       │
│                      (Ubuntu, 2 vCPU, 7GB RAM)                   │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃  Workflow: .github/workflows/vto_bot.yml                 ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  STEP 1: Environment Setup                              │   │
│  │  • Checkout code from repository                        │   │
│  │  • Setup Node.js 18                                     │   │
│  │  • Create Firebase credentials file from secret         │   │
│  │    → $HOME/firebase-key.json                            │   │
│  │  • Set GOOGLE_APPLICATION_CREDENTIALS env var           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                               │                                  │
│                               ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  STEP 2: Start React Dev Server (localhost:3000)       │   │
│  │  • cd react-dev-app                                     │   │
│  │  • npm ci (install dependencies)                        │   │
│  │  • npm run dev & (start Vite dev server in background) │   │
│  │  • Wait 20 seconds + health check with curl            │   │
│  │  • React app now accessible at http://localhost:3000   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                               │                                  │
│                               ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  STEP 3: Install & Launch Playwright Bot               │   │
│  │  • cd github-bot                                        │   │
│  │  • npm ci (install dependencies)                        │   │
│  │  • npx playwright install chromium                      │   │
│  │  • Export environment variables from webhook payload:  │   │
│  │    - REQUEST_ID                                         │   │
│  │    - USER_PHOTO_URL                                     │   │
│  │    - GARMENT_PHOTO_URL                                  │   │
│  │    - USER_EMAIL                                         │   │
│  │  • node vto_script.js                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃  Bot Execution: github-bot/vto_script.js                 ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  BOT STEP 1: Preparation                                │   │
│  │  • Update Firestore: status → "processing"              │   │
│  │  • Download user photo from Storage URL                 │   │
│  │  • Download garment photo from Storage URL              │   │
│  │  • Launch Chromium (headless)                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                               │                                  │
│                               ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  BOT STEP 2: Navigate & Upload User Photo              │   │
│  │  • page.goto('http://localhost:3000')                   │   │
│  │  • Locate: [data-testid="upload-user-image-label"]      │   │
│  │  • setInputFiles(userPhotoPath)                         │   │
│  │  • Wait for AI model generation (timeout: 150s)         │   │
│  │  • Wait for: [data-testid="continue-to-styling-button"] │   │
│  │  • Click continue button                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                               │                                  │
│                               ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  BOT STEP 3: Upload Garment & Wait for Try-On          │   │
│  │  • Locate: [data-testid="upload-custom-garment-label"]  │   │
│  │  • setInputFiles(garmentPhotoPath)                      │   │
│  │  • Wait for AI virtual try-on (timeout: 180s)           │   │
│  │  • Wait for: [data-testid="main-canvas-image"]          │   │
│  │  • Additional 5s buffer for complete render             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                               │                                  │
│                               ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  BOT STEP 4: Capture & Upload Result                   │   │
│  │  • Take screenshot of canvas element                    │   │
│  │  • Upload to Firebase Storage:                         │   │
│  │    → requests/{requestId}/result_{timestamp}.png        │   │
│  │  • Make file publicly accessible                        │   │
│  │  • Get public URL                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                               │                                  │
│                               ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  BOT STEP 5: Finalization                               │   │
│  │  • Update Firestore:                                    │   │
│  │    - status → "completed"                               │   │
│  │    - resultUrl → public Storage URL                     │   │
│  │    - completedAt → timestamp                            │   │
│  │  • Close browser                                        │   │
│  │  • Clean up temporary files                             │   │
│  │  • Exit with code 0 (success)                           │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ 4. Result available
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FIREBASE SERVICES                             │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  FIRESTORE (Database)                                  │     │
│  │  Collection: requests                                  │     │
│  │  Document: req_1234567890_abc123                       │     │
│  │  {                                                     │     │
│  │    userId: "req_1234567890_abc123",                    │     │
│  │    email: "user@example.com",                          │     │
│  │    userPhotoUrl: "https://storage...user_photo.jpg",   │     │
│  │    garmentPhotoUrl: "https://storage...garment.jpg",   │     │
│  │    status: "completed", ✅                              │     │
│  │    resultUrl: "https://storage...result.png", ✅        │     │
│  │    createdAt: Timestamp,                               │     │
│  │    completedAt: Timestamp ✅                            │     │
│  │  }                                                     │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  STORAGE (Images)                                      │     │
│  │  /requests/{requestId}/                                │     │
│  │    ├── user_photo_{filename}.jpg                       │     │
│  │    ├── garment_photo_{filename}.jpg                    │     │
│  │    └── result_{timestamp}.png ✅ (PUBLIC)               │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ 5. User can retrieve result
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         USER RETRIEVAL                           │
│  Option 1: Email with link (if implemented)                     │
│  Option 2: Query API with request ID                            │
│            GET /api/result?id=req_1234567890_abc123              │
│  Option 3: Check Firestore directly (admin)                     │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Sequence

### Timeline of a Single Request

| Time | Component | Action |
|------|-----------|--------|
| 0:00 | User | Submits form with photos |
| 0:01 | Firebase Function | Parses, uploads, creates Firestore doc |
| 0:02 | Firebase Function | Triggers GitHub webhook |
| 0:05 | GitHub Actions | Workflow starts |
| 0:25 | GitHub Actions | React server ready |
| 0:30 | Playwright Bot | Starts automation |
| 0:35 | Playwright Bot | User photo uploaded |
| 1:15 | Gemini AI | Model generation complete |
| 1:20 | Playwright Bot | Garment photo uploaded |
| 2:40 | Gemini AI | Virtual try-on complete |
| 2:45 | Playwright Bot | Captures result |
| 2:50 | Firebase Storage | Result uploaded |
| 2:50 | Firestore | Status updated to "completed" |

**Total: ~2.5 minutes**

## Component Dependencies

```
frontend/index.html
  ├─ depends on: Firebase Hosting
  └─ calls: Firebase Function (submitTryOn)

firebase-functions/index.js
  ├─ depends on: Firestore, Storage, GitHub API
  ├─ triggers: GitHub Actions via repository_dispatch
  └─ reads: Firebase config (github.token, github.repo)

.github/workflows/vto_bot.yml
  ├─ depends on: GitHub Secrets (FIREBASE_SERVICE_ACCOUNT)
  ├─ runs: react-dev-app (localhost:3000)
  └─ executes: github-bot/vto_script.js

github-bot/vto_script.js
  ├─ depends on: Playwright, Firebase Admin SDK
  ├─ connects to: localhost:3000 (React app)
  ├─ reads from: Firestore, Storage
  └─ writes to: Firestore, Storage

react-dev-app/
  ├─ depends on: Gemini API (via .env.local)
  ├─ accessed by: Playwright bot
  └─ generates: AI try-on images
```

## Security Architecture

### Secrets Management

```
┌─────────────────────────────────────────────────────────────┐
│  SECRET                    │  STORED IN      │  ACCESSED BY  │
├────────────────────────────┼─────────────────┼───────────────┤
│  Gemini API Key            │  react-dev-app/ │  Bot (GitHub  │
│  (GEMINI_API_KEY)          │  .env.local     │  Actions)     │
├────────────────────────────┼─────────────────┼───────────────┤
│  Firebase Service Account  │  GitHub Secrets │  Bot (GitHub  │
│  (JSON)                    │                 │  Actions)     │
├────────────────────────────┼─────────────────┼───────────────┤
│  GitHub Personal Token     │  Firebase       │  Cloud        │
│                            │  Functions      │  Function     │
│                            │  Config         │               │
└─────────────────────────────────────────────────────────────┘
```

### Access Control

- **Frontend**: No secrets, completely public
- **Firebase Function**: Has access to GitHub token (stored in config)
- **GitHub Actions**: Has access to Firebase service account (from secrets)
- **Playwright Bot**: Has access to both Firebase (via service account) and Gemini API (via .env.local in repo)

## Failure Handling

### Error States & Recovery

```
User Submission
    │
    ├─ Firebase Function Fails
    │  └─ User sees error immediately
    │     No Firestore doc created
    │     Manual retry needed
    │
    ├─ GitHub Actions Fails to Start
    │  └─ Firestore: status = "pending"
    │     Manual trigger needed
    │     OR Function can retry webhook
    │
    ├─ React Server Fails to Start
    │  └─ Bot throws error
    │     GitHub Actions fails
    │     Firestore: status = "pending"
    │     Auto-retry possible
    │
    ├─ Bot Execution Fails (timeout/error)
    │  └─ Catch block updates Firestore
    │     Firestore: status = "failed"
    │     Error message stored
    │     Manual inspection needed
    │
    └─ Success
       └─ Firestore: status = "completed"
          Result URL available
          User can retrieve
```

## Scaling Architecture

### Current Bottlenecks

1. **Primary**: GitHub Actions minutes (2000/month)
   - ~2.5 min per request = 800 requests/month max

2. **Secondary**: Firebase Functions free tier
   - 125K calls/month = essentially unlimited for this use case

3. **Tertiary**: Storage (5GB)
   - ~2MB per request = 2500 requests capacity

### Scaling Options

**Horizontal Scaling (Multiple GitHub Accounts)**
```
Request Router (Firebase Function)
    │
    ├─ GitHub Account A (2000 min) ─► 800 requests/month
    ├─ GitHub Account B (2000 min) ─► 800 requests/month
    └─ GitHub Account C (2000 min) ─► 800 requests/month

Total: 2400 requests/month (still free)
```

**Vertical Scaling (Paid GitHub Actions)**
```
GitHub Pro ($4/month): 3000 minutes
Additional minutes: $0.008/minute

Cost for 1000 requests/month:
= 1000 requests × 2.5 min × $0.008
= $20/month (still cheaper than Gemini API direct access)
```

## Technology Stack

### Frontend Layer
- HTML5 + CSS3 + Vanilla JavaScript
- No framework (minimal complexity)
- Firebase Hosting (CDN)

### Backend Layer
- Node.js 18
- Firebase Cloud Functions (serverless)
- Busboy (multipart parsing)
- Axios (HTTP client)

### Automation Layer
- Ubuntu runner (GitHub Actions)
- Playwright (browser automation)
- Chromium (headless browser)
- Firebase Admin SDK

### Data Layer
- Firestore (NoSQL database)
- Firebase Storage (object storage)

### AI Layer
- Google Gemini 2.5 Flash Image
- React + TypeScript + Vite (wrapper)

## Performance Characteristics

### Resource Usage per Request

| Resource | Usage | Cost |
|----------|-------|------|
| **CPU** | ~2.5 min (2 vCPU) | $0 (free tier) |
| **Memory** | ~500MB peak | $0 (included) |
| **Network** | ~10MB (uploads + downloads) | $0 (included) |
| **Storage** | ~2MB (3 images) | $0 (5GB free) |
| **Database** | 3 writes, 2 reads | $0 (within free tier) |
| **Functions** | 1 invocation | $0 (125K free) |

**Total Cost per Request: $0**

## Monitoring Points

### Key Metrics to Track

1. **Request Success Rate**
   - Query Firestore: `status == "completed"` / total requests
   - Target: >95%

2. **Average Processing Time**
   - Measure: `completedAt - createdAt`
   - Target: <3 minutes

3. **Failure Reasons**
   - Track error messages in failed documents
   - Most common: AI timeouts, browser crashes

4. **Resource Utilization**
   - GitHub Actions minutes used
   - Firebase Storage capacity
   - Firestore reads/writes per day

### Logging Strategy

- **Firebase Functions**: Use `firebase functions:log`
- **GitHub Actions**: Built-in workflow logs
- **Playwright Bot**: Console output captured in workflow
- **Firestore**: Status field tracks state machine

---

## Summary

This architecture achieves zero-cost operation by:
1. Using free-tier services for all components
2. Automating expensive AI operations through a "locked room" hack
3. Minimizing data transfer and storage
4. Leveraging serverless architecture for efficiency

The system is designed for MVP validation with ~800 requests/month capacity, sufficient for early product testing and market validation.
