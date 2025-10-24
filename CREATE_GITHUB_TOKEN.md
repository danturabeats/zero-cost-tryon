# 🔑 Create New GitHub Token for danturabeats

## Step 1: Create Personal Access Token

**Go to:** 👉 https://github.com/settings/tokens/new

### Token Configuration:

**Note (token name):**
```
zero-cost-tryon-deployment
```

**Expiration:**
```
No expiration (or choose your preference)
```

**Select scopes (permissions):**
- ✅ **repo** (Full control of private repositories)
  - [x] repo:status
  - [x] repo_deployment
  - [x] public_repo
  - [x] repo:invite
  - [x] security_events
- ✅ **workflow** (Update GitHub Action workflows)
- ✅ **write:packages** (Upload packages to GitHub Package Registry)
- ✅ **read:packages** (Download packages from GitHub Package Registry)

Click **"Generate token"**

---

## Step 2: Copy Your New Token

**IMPORTANT:** Copy the token immediately! It will look like:
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Save it here temporarily:**
```
YOUR_NEW_TOKEN: ___________________________________________
```

---

## Step 3: Update Repository Configuration

Once you have your new token, run these commands:

```bash
cd "F:/fit check 1"

# Remove old remote
git remote remove origin

# Add new remote with your danturabeats account and new token
git remote add origin https://YOUR_NEW_TOKEN@github.com/danturabeats/zero-cost-tryon.git

# Verify
git remote -v
```

**Replace `YOUR_NEW_TOKEN` with the actual token you just created!**

---

## Step 4: Create Repository on GitHub

**Go to:** 👉 https://github.com/new

**Repository settings:**
- **Owner:** danturabeats
- **Repository name:** `zero-cost-tryon`
- **Description:** `Zero-cost AI-powered virtual try-on system using Netlify, Cloudinary, and GitHub Actions`
- **Visibility:** Public (recommended - free GitHub Actions minutes)
- **Initialize:** Leave ALL unchecked (we already have code)

Click **"Create repository"**

---

## Step 5: Push Code

After creating the repository, run:

```bash
cd "F:/fit check 1"

git push -u origin main
```

---

## Step 6: Update Configuration Files

We need to update the GitHub repo reference in these files:

### A. Update Netlify Environment Variables

When you add Netlify environment variables (later), use:
```
GITHUB_REPO: danturabeats/zero-cost-tryon
GITHUB_TOKEN: YOUR_NEW_TOKEN
```

### B. Update GitHub Secrets

When you add GitHub secrets (later), the repository URL will be:
```
https://github.com/danturabeats/zero-cost-tryon/settings/secrets/actions
```

---

## ✅ Summary

**What to do:**
1. ⏭️ Create token at: https://github.com/settings/tokens/new
2. ⏭️ Copy the token
3. ⏭️ Create repository at: https://github.com/new
4. ⏭️ Update git remote with new token
5. ⏭️ Push code

**New repository will be:**
```
https://github.com/danturabeats/zero-cost-tryon
```

---

**Ready? Let's create the token!** 👉 https://github.com/settings/tokens/new

**Tell me when you have the token and I'll update all the configuration!**
