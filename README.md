# 🤖 Zero-Cost Virtual Try-On System

An automated virtual try-on system that uses free-tier cloud services to bypass Gemini API costs. Users submit photos via a simple form, and within ~2 minutes receive AI-generated images showing how clothing items look on them.

## 🎯 Overview

This system cleverly exploits free-tier services to provide zero-cost AI virtual try-on:

- **Frontend**: Simple HTML form for user submissions
- **Backend**: Firebase Cloud Functions (125K free calls/month)
- **Automation**: GitHub Actions (2000 free minutes/month) runs a Playwright bot
- **Storage**: Firebase Storage (5GB free) for images
- **Database**: Firestore for request tracking

## 🏗️ Architecture

```
┌─────────────────┐
│   User Form     │ (Firebase Hosting)
│   (HTML/JS)     │
└────────┬────────┘
         │ POST /api/submit
         ▼
┌─────────────────────────┐
│  Firebase Function      │
│  - Parse form data      │
│  - Upload to Storage    │
│  - Create Firestore doc │
│  - Trigger GitHub       │
└────────┬────────────────┘
         │ repository_dispatch webhook
         ▼
┌──────────────────────────────────────┐
│     GitHub Actions Runner            │
│  ┌────────────────────────────────┐  │
│  │  1. Start React dev server     │  │
│  │     (localhost:3000)           │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  2. Launch Playwright bot      │  │
│  │     - Navigate to localhost    │  │
│  │     - Upload user photo        │  │
│  │     - Wait for AI model gen    │  │
│  │     - Upload garment photo     │  │
│  │     - Wait for AI try-on       │  │
│  │     - Capture result image     │  │
│  └────────────────────────────────┘  │
└──────────────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────┐
        │ Firebase Storage │ (result image)
        │   & Firestore    │ (status: completed)
        └──────────────────┘
```

## 📁 Project Structure

```
fit-check-1/
├── frontend/              # Production user interface
│   └── index.html         # Simple form for submissions
│
├── react-dev-app/         # Development app (bot's target)
│   ├── components/        # React components
│   ├── services/          # Gemini API integration
│   ├── App.tsx           # Main React app
│   └── package.json      # React dependencies
│
├── firebase-functions/    # Backend logic
│   ├── index.js          # Cloud Functions code
│   ├── package.json      # Node.js dependencies
│   └── firebase.json     # Firebase config
│
├── github-bot/           # Automation script
│   ├── vto_script.js     # Playwright bot
│   └── package.json      # Bot dependencies
│
└── .github/workflows/    # CI/CD
    └── vto_bot.yml       # GitHub Actions workflow
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- GitHub account
- Firebase account (free Spark plan)

### Deployment

Follow the comprehensive guide in [DEPLOYMENT.md](./DEPLOYMENT.md)

**TL;DR:**
1. Set up Firebase project (Firestore + Storage + Functions)
2. Configure GitHub secrets (Firebase service account)
3. Deploy Firebase Functions: `cd firebase-functions && firebase deploy`
4. Push code to GitHub
5. Test with form submission

## 💡 How It Works

### The "Locked Room" Hack

The key insight: Your development environment API key (normally restricted to localhost) becomes accessible to a headless browser running in GitHub Actions. The bot:

1. **Starts a local React server** in the GitHub Actions runner
2. **Opens it with Playwright** (headless Chromium)
3. **Automates the UI** to upload images and trigger AI generation
4. **Captures the result** from the canvas

### Cost Breakdown

| Service | Free Tier | Usage per Request | Monthly Capacity |
|---------|-----------|-------------------|------------------|
| **GitHub Actions** | 2000 min/month | ~2.5 min | ~800 requests |
| **Firebase Functions** | 125K calls/month | 1 call | 125K requests |
| **Firebase Storage** | 5GB | ~2MB | ~2500 requests |
| **Firestore** | 50K reads, 20K writes/day | 3 writes | ~6600 requests/day |

**Bottleneck**: GitHub Actions (800 requests/month)

### Response Time

- User submits form: **Instant**
- Firebase Function processes: **~2-5 seconds**
- GitHub Actions starts: **~30-45 seconds**
- React server starts: **~15-20 seconds**
- AI model generation: **~30-45 seconds**
- AI virtual try-on: **~40-60 seconds**
- Result upload: **~5-10 seconds**

**Total: ~1.75-2.5 minutes**

## 🛠️ Technical Details

### Key Technologies

- **React 19** + TypeScript + Vite (dev app)
- **Gemini 2.5 Flash Image** (AI model)
- **Playwright** (browser automation)
- **Firebase** (hosting, functions, storage, Firestore)
- **GitHub Actions** (automation runner)
- **Busboy** (multipart form parsing)

### Critical Implementation Points

1. **Data-testid Selectors**: Ensures bot stability
   - `[data-testid="upload-user-image-label"]`
   - `[data-testid="continue-to-styling-button"]`
   - `[data-testid="upload-custom-garment-label"]`
   - `[data-testid="main-canvas-image"]`

2. **Direct Data Injection**: Eliminates Firestore polling
   ```yaml
   env:
     REQUEST_ID: ${{ github.event.client_payload.request_id }}
     USER_PHOTO_URL: ${{ github.event.client_payload.user_photo_url }}
   ```

3. **Smart Waiting**: Uses `waitForSelector` with timeouts instead of fixed delays
   ```javascript
   await page.waitForSelector('[data-testid="main-canvas-image"]', {
     timeout: 180000
   });
   ```

4. **Localhost Execution**: No external URL dependency
   ```javascript
   await page.goto('http://localhost:3000');
   ```

## 📊 Monitoring

### Check Request Status

**Via Firestore Console:**
- Status: `pending` → `processing` → `completed` (or `failed`)

**Via API:**
```bash
curl "https://YOUR_PROJECT_ID.web.app/api/result?id=REQUEST_ID"
```

### View Logs

**Firebase Functions:**
```bash
firebase functions:log
```

**GitHub Actions:**
- Go to repository → Actions tab → Select workflow run

## 🔒 Security

- **API Key Protection**: Gemini key only in GitHub Actions environment variables
- **Service Account**: Firebase access via GitHub Secrets
- **CORS**: Configured for your domain only (update in production)
- **Input Validation**: File type and size checks

## 📈 Scaling Considerations

**Current Capacity**: ~800 requests/month (GitHub Actions limit)

**To Scale Beyond Free Tier:**
1. Upgrade GitHub Actions (pay per minute)
2. Use multiple GitHub accounts (2000 min each)
3. Deploy React app to cloud (remove localhost dependency)
4. Implement queue system for peak traffic

## 🐛 Troubleshooting

### Bot Times Out

- Increase timeout values in `github-bot/vto_script.js`
- Check React server logs in GitHub Actions

### Function Fails

```bash
# Check configuration
firebase functions:config:get

# View logs
firebase functions:log --limit 50
```

### Images Not Uploading

- Verify Storage CORS rules
- Check service account permissions
- Ensure bucket name is correct

## 📝 Development

### Local Testing

**Firebase Functions:**
```bash
cd firebase-functions
npm run serve
```

**React App:**
```bash
cd react-dev-app
npm run dev
```

**Bot (requires running React app):**
```bash
cd github-bot
export REQUEST_ID=test_123
export USER_PHOTO_URL=https://...
export GARMENT_PHOTO_URL=https://...
export USER_EMAIL=test@example.com
node vto_script.js
```

## 🤝 Contributing

This is a proof-of-concept for educational purposes. Feel free to:
- Report issues
- Suggest improvements
- Fork and extend

## 📄 License

Apache 2.0 - See individual files for license headers

## 🙏 Acknowledgments

- Built with Google Gemini AI
- Automated with Playwright
- Hosted on Firebase free tier
- Runs on GitHub Actions free tier

---

**⚠️ Disclaimer**: This system exploits free tiers for educational/MVP purposes. For production use with significant traffic, consider upgrading to paid tiers or using official API access patterns.
