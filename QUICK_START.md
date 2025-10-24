# ⚡ Quick Start Guide

This is a condensed guide for developers already familiar with Firebase and GitHub Actions.

## 🎬 30-Second Overview

This system uses GitHub Actions to run a Playwright bot that automates your React app (with exposed Gemini API key) to perform virtual try-ons, completely bypassing API costs through free-tier services.

## 🔥 Firebase Setup (5 minutes)

```bash
# 1. Create Firebase project at console.firebase.google.com
#    Enable: Firestore, Storage, Functions, Hosting

# 2. Install Firebase CLI
npm install -g firebase-tools

# 3. Login and initialize
firebase login
cd firebase-functions
firebase init  # Select: Functions, Hosting

# 4. Install dependencies
npm install

# 5. Configure GitHub integration
firebase functions:config:set github.token="YOUR_GITHUB_TOKEN"
firebase functions:config:set github.repo="username/repo-name"

# 6. Deploy
firebase deploy
```

**Get GitHub Token**: Settings → Developer settings → Personal access tokens → Generate (scope: `repo`)

## 🐙 GitHub Setup (3 minutes)

```bash
# 1. Initialize git in project root
git init
git add .
git commit -m "Initial commit"

# 2. Create repo on GitHub and push
git remote add origin https://github.com/username/repo-name.git
git push -u origin main

# 3. Add GitHub Secret
# Go to: Settings → Secrets → Actions → New secret
# Name: FIREBASE_SERVICE_ACCOUNT
# Value: [Paste entire service account JSON from Firebase]
```

**Get Service Account**: Firebase Console → Project Settings → Service Accounts → Generate new private key

## 🎨 Configuration Updates

### 1. Update HTML Form URL

Edit `frontend/index.html` line ~235:

```javascript
const FIREBASE_FUNCTION_URL = 'https://YOUR_PROJECT_ID.web.app/api/submit';
```

Then redeploy:
```bash
firebase deploy --only hosting
```

### 2. Add Gemini API Key

Edit `react-dev-app/.env.local`:

```
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

## 🧪 Test the System

1. **Visit your site**: `https://YOUR_PROJECT_ID.web.app`
2. **Upload images** and submit
3. **Check GitHub Actions**: Repository → Actions tab
4. **Monitor Firestore**: Firebase Console → Firestore Database
5. **Get result**: Check `resultUrl` field in Firestore document

## 📊 Verify Components

### Firebase Function
```bash
firebase functions:log
```

### GitHub Actions
- Go to repository → Actions → View workflow run

### Firestore
- Firebase Console → Firestore Database
- Check `requests` collection
- Document status: `pending` → `processing` → `completed`

## 🚨 Common Issues & Quick Fixes

| Issue | Fix |
|-------|-----|
| **Function fails to trigger GitHub** | Check `github.token` and `github.repo` config |
| **Bot times out** | Increase timeouts in `github-bot/vto_script.js` |
| **React server not starting** | Increase sleep time in workflow (line ~60) |
| **Images not loading** | Verify Storage permissions and public access |
| **Service account error** | Re-check JSON formatting in GitHub Secret |

## 📈 Monitor Usage

### GitHub Actions Usage
```
Repository → Settings → Billing → Usage
```
Limit: 2000 minutes/month = ~800 requests

### Firebase Usage
```
Firebase Console → Usage and billing
```
- Functions: 125K calls/month
- Storage: 5GB
- Firestore: 50K reads, 20K writes/day

## 🔄 Development Workflow

### Local Testing

**Test Firebase Functions locally:**
```bash
cd firebase-functions
npm run serve
# Use http://localhost:5001/YOUR_PROJECT_ID/us-central1/submitTryOn
```

**Test React app:**
```bash
cd react-dev-app
npm install
npm run dev
# Opens http://localhost:3000
```

**Test Bot (manual):**
```bash
cd github-bot
npm install
export REQUEST_ID=test_123
export USER_PHOTO_URL=https://path/to/user.jpg
export GARMENT_PHOTO_URL=https://path/to/garment.jpg
export USER_EMAIL=test@example.com
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
node vto_script.js
```

## 🎯 Next Steps

1. **Add email notifications**: Install SendGrid in Functions
2. **Create status page**: Build `frontend/status.html` using `getResult` endpoint
3. **Add retry logic**: Implement automatic retries in bot
4. **Monitor analytics**: Track success rate and processing time

## 📝 File Locations

| Component | Location | Purpose |
|-----------|----------|---------|
| **User form** | `frontend/index.html` | Production interface |
| **React app** | `react-dev-app/` | Bot's automation target |
| **Backend** | `firebase-functions/index.js` | Request handler |
| **Bot** | `github-bot/vto_script.js` | Automation script |
| **Workflow** | `.github/workflows/vto_bot.yml` | CI/CD pipeline |

## 🔗 Important URLs

After deployment, save these:

- **Form URL**: `https://YOUR_PROJECT_ID.web.app`
- **Submit API**: `https://YOUR_PROJECT_ID.web.app/api/submit`
- **Result API**: `https://YOUR_PROJECT_ID.web.app/api/result?id=REQUEST_ID`
- **Function URL**: `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/submitTryOn`
- **Storage**: `https://console.firebase.google.com/project/YOUR_PROJECT_ID/storage`
- **Firestore**: `https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore`

## 💻 Commands Cheatsheet

```bash
# Deploy everything
cd firebase-functions && firebase deploy

# Deploy functions only
firebase deploy --only functions

# Deploy hosting only
firebase deploy --only hosting

# View function logs
firebase functions:log --limit 100

# Test function locally
firebase emulators:start --only functions

# Update Firebase config
firebase functions:config:get  # View current config
firebase functions:config:set key="value"  # Set config
firebase functions:config:unset key  # Remove config

# Install dependencies
cd react-dev-app && npm install
cd firebase-functions && npm install
cd github-bot && npm install
```

## 🎓 Learn More

- Full deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Architecture details: [README.md](./README.md)
- Claude Code guidance: [CLAUDE.md](./CLAUDE.md)

---

**Ready to ship?** Follow these steps in order:
1. ✅ Firebase setup + deploy
2. ✅ GitHub setup + secrets
3. ✅ Update URLs in frontend
4. ✅ Test with real submission
5. 🚀 Share your zero-cost virtual try-on!
