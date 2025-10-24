# 🚀 Zero-Cost Virtual Try-On System - Deployment Guide

This guide walks you through deploying the complete zero-cost virtual try-on system. The architecture uses free tiers of Firebase, GitHub Actions, and your development environment to bypass Gemini API costs.

## 📋 Prerequisites

1. **Firebase Account** - Free Spark plan
2. **GitHub Account** - With access to Actions (2000 free minutes/month)
3. **Node.js 18+** installed locally
4. **Firebase CLI** installed: `npm install -g firebase-tools`
5. **Git** installed

## 🏗️ Architecture Overview

```
User Form (HTML)
    ↓
Firebase Function (trigger)
    ↓
GitHub Actions (starts localhost React server + Playwright bot)
    ↓
Firebase Storage (result image) + Firestore (status tracking)
    ↓
User receives result
```

## 📁 Step 1: Prepare Project Structure

Your current directory should have this structure:

```
fit check 1/
├── frontend/              # Simple HTML form
├── react-dev-app/         # Original React app (bot's target)
├── firebase-functions/    # Cloud Functions
├── github-bot/            # Playwright automation
└── .github/workflows/     # GitHub Actions
```

### 1.1 Move React App Files

You need to move all existing React files to `react-dev-app/` folder:

```bash
# Create react-dev-app directory
mkdir react-dev-app

# Move all React files (everything except the new folders)
# On Windows (PowerShell):
Get-ChildItem -Exclude frontend,firebase-functions,github-bot,.github,react-dev-app,DEPLOYMENT.md,CLAUDE.md | Move-Item -Destination react-dev-app/

# On Linux/Mac:
# mv $(ls -A | grep -v -E 'frontend|firebase-functions|github-bot|.github|react-dev-app|DEPLOYMENT.md|CLAUDE.md') react-dev-app/
```

Alternatively, manually move these files/folders to `react-dev-app/`:
- `components/`
- `services/`
- `lib/`
- `App.tsx`
- `index.tsx`
- `index.html`
- `index.css`
- `types.ts`
- `wardrobe.ts`
- `metadata.json`
- `package.json`
- `package-lock.json` (if exists)
- `tsconfig.json`
- `vite.config.ts`
- `node_modules/` (optional, can be regenerated)

## 📦 Step 2: Firebase Setup

### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it (e.g., "zero-cost-tryon")
4. Disable Google Analytics (not needed)
5. Create project

### 2.2 Enable Services

In your Firebase project:

1. **Firestore Database**:
   - Go to Build → Firestore Database
   - Click "Create database"
   - Start in **production mode**
   - Choose location closest to you
   - Click "Enable"

2. **Storage**:
   - Go to Build → Storage
   - Click "Get started"
   - Start in **production mode**
   - Click "Done"

3. **Functions**:
   - Go to Build → Functions
   - Click "Get started"
   - Click "Continue" (no setup needed yet)

### 2.3 Initialize Firebase in Your Project

```bash
# Login to Firebase
firebase login

# Navigate to firebase-functions folder
cd firebase-functions

# Initialize Firebase
firebase init

# Select the following options:
# ? Which Firebase features?
#   [x] Functions
#   [x] Hosting
# ? Use an existing project? Yes
# ? Select your project: [choose your project]
# ? What language? JavaScript
# ? Use ESLint? No
# ? Install dependencies? Yes
# ? Public directory? ../frontend
# ? Configure as single-page app? No
# ? Set up automatic builds? No
```

### 2.4 Install Function Dependencies

```bash
cd firebase-functions
npm install
```

### 2.5 Create Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click the gear icon → Project settings
3. Go to "Service accounts" tab
4. Click "Generate new private key"
5. Save the JSON file securely (you'll need this for GitHub Secrets)

### 2.6 Set Firebase Configuration

```bash
# Set GitHub token and repo (replace with your values)
firebase functions:config:set github.token="YOUR_GITHUB_PERSONAL_ACCESS_TOKEN"
firebase functions:config:set github.repo="YOUR_USERNAME/YOUR_REPO_NAME"

# Example:
# firebase functions:config:set github.token="ghp_xxxxxxxxxxxxxxxxxxxx"
# firebase functions:config:set github.repo="johndoe/zero-cost-tryon"
```

**To get GitHub Personal Access Token:**
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Name it "Firebase Function Trigger"
4. Select scope: `repo` (full control of private repositories)
5. Generate and copy the token

## 🐙 Step 3: GitHub Setup

### 3.1 Create GitHub Repository

```bash
# Initialize git in your project root
cd ..  # Go back to project root
git init

# Create .gitignore
cat > .gitignore << EOF
# Dependencies
node_modules/
react-dev-app/node_modules/
firebase-functions/node_modules/
github-bot/node_modules/

# Environment
.env
.env.local
firebase-functions/.runtimeconfig.json

# Build outputs
react-dev-app/dist/
react-dev-app/build/

# Logs
*.log

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Firebase
.firebase/
firebase-debug.log
EOF

# Add all files
git add .
git commit -m "Initial commit: Zero-cost virtual try-on system"

# Create repo on GitHub and push
# Follow GitHub instructions to push to your new repository
```

### 3.2 Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add the following secret:

**Secret name:** `FIREBASE_SERVICE_ACCOUNT`
**Value:** Paste the entire content of the service account JSON file you downloaded in step 2.5

## 🔧 Step 4: Update Configuration Files

### 4.1 Update HTML Form

Edit `frontend/index.html`:

Find this line:
```javascript
const FIREBASE_FUNCTION_URL = 'YOUR_FIREBASE_FUNCTION_URL';
```

After deployment, you'll update this to:
```javascript
const FIREBASE_FUNCTION_URL = 'https://YOUR_PROJECT_ID.web.app/api/submit';
```

### 4.2 Update React App API Key

Edit `react-dev-app/.env.local`:

```bash
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**Important:** This key will be accessible to the bot running in GitHub Actions. Keep it in `.env.local` which is gitignored.

## 🚀 Step 5: Deploy

### 5.1 Deploy Firebase Functions & Hosting

```bash
cd firebase-functions
firebase deploy
```

This will:
- Deploy Cloud Functions (`submitTryOn` and `getResult`)
- Deploy the HTML form to Firebase Hosting

After deployment, you'll see output like:
```
✔ Deploy complete!

Hosting URL: https://your-project-id.web.app
Function URL (submitTryOn): https://us-central1-your-project-id.cloudfunctions.net/submitTryOn
```

### 5.2 Update HTML Form with Function URL

Edit `frontend/index.html` and replace:
```javascript
const FIREBASE_FUNCTION_URL = 'YOUR_FIREBASE_FUNCTION_URL';
```

With:
```javascript
const FIREBASE_FUNCTION_URL = 'https://YOUR_PROJECT_ID.web.app/api/submit';
```

Then redeploy:
```bash
firebase deploy --only hosting
```

### 5.3 Push to GitHub

```bash
git add .
git commit -m "Configure Firebase URLs"
git push origin main
```

GitHub Actions workflow is now ready and will trigger when Firebase sends the webhook.

## ✅ Step 6: Test the System

### 6.1 Test Form Submission

1. Visit your Firebase Hosting URL: `https://YOUR_PROJECT_ID.web.app`
2. Upload a user photo and garment photo
3. Enter your email
4. Click "Submit"

### 6.2 Monitor Execution

**Check Firebase Function logs:**
```bash
firebase functions:log
```

**Check GitHub Actions:**
1. Go to your GitHub repository
2. Click "Actions" tab
3. You should see a "Virtual Try-On Bot" workflow running

**Check Firestore:**
1. Go to Firebase Console → Firestore Database
2. You should see a document in the `requests` collection
3. Status should change: `pending` → `processing` → `completed`

**Check result:**
After ~2 minutes, check:
- Firestore document should have `status: completed` and `resultUrl`
- Visit the `resultUrl` to see the generated image

## 🔍 Step 7: Troubleshooting

### Function Deploy Issues

```bash
# Check Firebase configuration
firebase functions:config:get

# View function logs
firebase functions:log --limit 50

# Test locally
cd firebase-functions
npm run serve
```

### GitHub Actions Issues

1. **Check Secrets**: Ensure `FIREBASE_SERVICE_ACCOUNT` is correctly set
2. **Check Logs**: Go to Actions tab → Click failed workflow → View logs
3. **Common issues**:
   - Service account JSON not properly formatted
   - React dev server not starting (check port 3000 availability)
   - Playwright timeout (increase timeout values in `vto_script.js`)

### Bot Execution Issues

**View detailed logs:**
```bash
# In GitHub Actions, download "bot-failure-logs" artifact if workflow fails
```

**Common fixes:**
- Increase timeouts in `github-bot/vto_script.js`
- Verify `data-testid` selectors match your React components
- Check that React dev server is serving on `localhost:3000`

### React App Not Loading in Bot

```bash
# In .github/workflows/vto_bot.yml, increase sleep time:
sleep 30  # Instead of sleep 20
```

## 📊 Monitoring & Limits

### Free Tier Limits

- **GitHub Actions**: 2000 minutes/month
  - Each request takes ~2-3 minutes
  - ~600-1000 requests/month possible

- **Firebase Functions**: 125K invocations/month
  - Essentially unlimited for this use case

- **Firebase Storage**: 5GB free
  - ~5000 images at 1MB each

- **Firestore**: 50K reads, 20K writes per day
  - More than enough for this use case

### Cost Tracking

Monitor usage:
1. GitHub Actions: Settings → Billing → Usage
2. Firebase: Console → Usage and billing

## 🎯 Next Steps (Optional Enhancements)

### 1. Email Notifications

Add SendGrid integration to send result emails:
```bash
cd firebase-functions
npm install @sendgrid/mail
```

Update `index.js` to send emails when status becomes `completed`.

### 2. Status Page

Create a simple status page where users can check their request by ID:
```html
<!-- frontend/status.html -->
<!-- Use the getResult function endpoint -->
```

### 3. Retry Logic

Add automatic retry for failed requests in the bot script.

### 4. Analytics

Track success rates, average processing time, etc. using Firebase Analytics.

## 🔐 Security Considerations

1. **API Key Protection**: The Gemini API key is only accessible in the GitHub Actions environment, not in the frontend
2. **Rate Limiting**: Consider adding rate limiting to prevent abuse of the form
3. **Input Validation**: The bot validates image types; consider adding size limits
4. **CORS**: Currently wide open (`*`); restrict to your domain in production

## 📝 Maintenance

### Update Dependencies

```bash
# React app
cd react-dev-app && npm update

# Firebase Functions
cd firebase-functions && npm update

# Bot
cd github-bot && npm update
```

### Monitor Costs

- Set up Firebase budget alerts
- Monitor GitHub Actions minutes usage
- Review Storage usage monthly

## 🆘 Support

If you encounter issues:
1. Check Firebase Functions logs: `firebase functions:log`
2. Check GitHub Actions logs in your repository
3. Review Firestore documents for error messages
4. Check browser console when testing the HTML form

---

**Congratulations!** 🎉 You now have a fully automated, zero-cost virtual try-on system running on free tiers!
