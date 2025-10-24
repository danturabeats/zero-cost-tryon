# 🚀 Netlify Deployment Guide

## ✅ What's Been Prepared

All code has been migrated to use Netlify instead of Firebase Functions:

1. **✅ Netlify Functions Created**:
   - `netlify/functions/submitTryOn.js` - Handles form submissions
   - `netlify/functions/getResult.js` - Retrieves request status
   - `netlify/functions/package.json` - Dependencies

2. **✅ Configuration Created**:
   - `netlify.toml` - Netlify configuration with redirects

3. **✅ Frontend Updated**:
   - `frontend/index.html` - Now uses `/api/submitTryOn` endpoint

---

## 🎯 Step 1: Sign Up for Netlify

**Go to:** 👉 https://app.netlify.com/signup

1. Click **"Sign up with GitHub"** (recommended - makes deployment easier!)
2. Authorize Netlify to access your GitHub account
3. ✅ Done! No credit card needed!

---

## 🎯 Step 2: Install Netlify CLI (Optional but Recommended)

```bash
npm install -g netlify-cli
```

Then login:

```bash
netlify login
```

This will open your browser to authorize the CLI.

---

## 🎯 Step 3: Prepare Firebase Service Account

You need a Firebase service account JSON for Firestore access.

**Method 1: Get from Firebase Console**
1. Go to: https://console.firebase.google.com/project/base44-9a83e/settings/serviceaccounts/adminsdk
2. Click "Generate new private key"
3. Download the JSON file
4. Convert to base64:

```bash
# On Windows (Git Bash):
base64 -w 0 path/to/your-service-account.json > service-account-base64.txt

# On macOS/Linux:
base64 -i path/to/your-service-account.json > service-account-base64.txt
```

5. Copy the contents of `service-account-base64.txt`

**Method 2: Use Firebase CLI**
```bash
firebase projects:list
firebase auth:export --project base44-9a83e
```

---

## 🎯 Step 4: Push Code to GitHub

First, let's prepare the repository:

```bash
cd "F:/fit check 1"

# Initialize git (if not already)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Zero-cost virtual try-on system with Netlify

- Netlify Functions for backend (submitTryOn, getResult)
- Cloudinary for image storage
- GitHub Actions for automation
- Playwright bot for virtual try-on
- React app for try-on interface
- Simple HTML form for user submissions

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/danturabeats/zero-cost-tryon.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## 🎯 Step 5: Deploy to Netlify

### Option A: Deploy via Netlify Dashboard (Easiest)

1. **Go to:** https://app.netlify.com/
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"Deploy with GitHub"**
4. Select repository: **danturabeats/zero-cost-tryon**
5. Configure build settings:
   - **Build command:** (leave empty)
   - **Publish directory:** `frontend`
   - **Functions directory:** `netlify/functions`
6. Click **"Deploy site"**

### Option B: Deploy via Netlify CLI

```bash
cd "F:/fit check 1"

# Link to Netlify (creates new site)
netlify init

# Follow prompts:
# - Create & configure a new site
# - Team: Your team
# - Site name: zero-cost-tryon (or any unique name)
# - Build command: (leave empty)
# - Directory to deploy: frontend
# - Functions directory: netlify/functions

# Deploy
netlify deploy --prod
```

---

## 🎯 Step 6: Configure Environment Variables

After deploying, you need to add environment variables in Netlify dashboard.

**Go to:** Site settings → Environment variables → Add a variable

Add these **6 variables**:

### 1. CLOUDINARY_CLOUD_NAME
```
Value: dkokxddxq
```

### 2. CLOUDINARY_API_KEY
```
Value: 617235364867513
```

### 3. CLOUDINARY_API_SECRET
```
Value: L2sVRwH-ncYJxIL7Kzd2Uy3c0B4
```

### 4. GITHUB_TOKEN
```
Value: YOUR_GITHUB_TOKEN
```

### 5. GITHUB_REPO
```
Value: danturabeats/zero-cost-tryon
```

### 6. GOOGLE_APPLICATION_CREDENTIALS

**IMPORTANT:** For Firebase Admin SDK, Netlify needs special handling.

Instead of GOOGLE_APPLICATION_CREDENTIALS (which is a file path), use:

**FIREBASE_SERVICE_ACCOUNT_KEY**
```
Value: <paste the base64-encoded service account JSON from Step 3>
```

Then update `netlify/functions/submitTryOn.js` and `netlify/functions/getResult.js`:

Change:
```javascript
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});
```

To:
```javascript
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
```

---

## 🎯 Step 7: Add GitHub Secrets

**Go to:** https://github.com/danturabeats/zero-cost-tryon/settings/secrets/actions

Click **"New repository secret"** and add these **4 secrets**:

### 1. FIREBASE_SERVICE_ACCOUNT
```
Name: FIREBASE_SERVICE_ACCOUNT
Value: <paste the entire Firebase service account JSON (NOT base64)>
```

### 2. CLOUDINARY_CLOUD_NAME
```
Name: CLOUDINARY_CLOUD_NAME
Value: dkokxddxq
```

### 3. CLOUDINARY_API_KEY
```
Name: CLOUDINARY_API_KEY
Value: 617235364867513
```

### 4. CLOUDINARY_API_SECRET
```
Name: CLOUDINARY_API_SECRET
Value: L2sVRwH-ncYJxIL7Kzd2Uy3c0B4
```

---

## 🎯 Step 8: Test the System

1. **Visit your Netlify site** (you'll get a URL like: `https://zero-cost-tryon.netlify.app`)

2. **Fill out the form**:
   - Upload a user photo
   - Upload a garment photo
   - Enter your email

3. **Submit and monitor**:
   - Form should show success message
   - Check GitHub Actions: https://github.com/danturabeats/zero-cost-tryon/actions
   - Bot should start running (~2-3 minutes)
   - Result should appear in Cloudinary

4. **Check result**:
   - Visit: `https://your-site.netlify.app/api/getResult?id=YOUR_REQUEST_ID`
   - Should show status and result URL when completed

---

## 📊 Free Tier Limits

**Netlify:**
- ✅ 100GB bandwidth/month
- ✅ 125K function invocations/month
- ✅ 100 hours build time/month
- ✅ NO credit card needed

**Cloudinary:**
- ✅ 25GB storage
- ✅ 25GB bandwidth/month
- ✅ NO credit card needed

**GitHub Actions:**
- ✅ 2000 minutes/month
- ✅ Unlimited public repos
- ✅ NO credit card needed

**Firebase (Firestore only):**
- ✅ 1GB storage
- ✅ 50K reads/day
- ✅ 20K writes/day
- ✅ NO credit card needed (Spark plan)

---

## 🐛 Troubleshooting

### Problem: "Function returned an error"

**Check Netlify function logs:**
1. Go to Netlify dashboard
2. Functions → submitTryOn → Logs
3. Look for error messages

### Problem: "GitHub Actions not triggering"

**Check:**
1. GitHub token has `repo` and `workflow` scopes
2. Token is correctly set in Netlify environment variables
3. Repository is public (or token has access to private repos)

### Problem: "Firestore access denied"

**Check:**
1. Firebase service account JSON is valid
2. Service account has Firestore permissions
3. FIREBASE_SERVICE_ACCOUNT_KEY is correctly base64-encoded

---

## ✅ Summary

**What you need to do:**
1. ⏭️ Sign up for Netlify (30 seconds)
2. ⏭️ Get Firebase service account JSON
3. ⏭️ Push code to GitHub
4. ⏭️ Deploy to Netlify
5. ⏭️ Configure 6 environment variables in Netlify
6. ⏭️ Add 4 secrets to GitHub
7. ⏭️ Test!

**Total time:** ~10 minutes

**Cost:** $0.00 forever! 🎉

---

**Ready? Let's start with Step 1: Sign up for Netlify!** 👉 https://app.netlify.com/signup
