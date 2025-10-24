# 🔑 API Key Setup & Testing Guide

## What API Key You Need

**Gemini API Key** from Google AI Studio

---

## Get Your Free Gemini API Key

### Step-by-Step:

1. **Visit**: https://aistudio.google.com/apikey

2. **Sign In**: Use your Google account

3. **Create Key**:
   - Click "Get API key" button
   - Select "Create API key in new project"
   - Copy the generated key (starts with `AIza...`)

### Free Tier Benefits:
- ✅ 15 requests per minute
- ✅ 1,500 requests per day
- ✅ No credit card required
- ✅ Perfect for testing and MVP

---

## Add the API Key

### Location:
```
F:\fit check 1\react-dev-app\.env.local
```

### Current Content:
```bash
GEMINI_API_KEY=PLACEHOLDER_API_KEY
```

### Update To:
```bash
GEMINI_API_KEY=AIzaSyAbc123YourActualKeyHere456xyz
```
*(Replace with your actual key)*

### How to Edit:

**Option 1: Using VSCode**
```bash
code "F:\fit check 1\react-dev-app\.env.local"
```

**Option 2: Using Notepad**
```bash
notepad "F:\fit check 1\react-dev-app\.env.local"
```

**Option 3: Using any text editor**
- Open the file
- Replace `PLACEHOLDER_API_KEY` with your key
- Save and close

---

## Test the API Key

### Test 1: Start Dev Server

```bash
cd "F:/fit check 1/react-dev-app"
npm run dev
```

**Expected Output:**
```
VITE v6.4.1  ready in 247 ms

➜  Local:   http://localhost:3000/
```

### Test 2: Try the App

1. **Open browser**: http://localhost:3000
2. **Upload a photo**: Any photo of a person
3. **Click "Continue"**

**If API key is valid:**
- ✅ You'll see "AI is generating your model..."
- ✅ After 30-45 seconds, transformed image appears
- ✅ No error messages

**If API key is invalid:**
- ❌ Error: "API key not valid"
- ❌ Check the key was copied correctly
- ❌ Make sure no extra spaces

---

## Troubleshooting

### Problem: "API key not valid"

**Solution 1**: Check for spaces
```bash
# Wrong (has space):
GEMINI_API_KEY= AIzaSy...

# Correct (no space):
GEMINI_API_KEY=AIzaSy...
```

**Solution 2**: Regenerate key
- Go back to https://aistudio.google.com/apikey
- Delete old key
- Create new key
- Copy and paste again

**Solution 3**: Check file saved
- Make sure you saved the .env.local file
- Restart the dev server:
  ```bash
  # Stop server (Ctrl+C)
  # Start again
  npm run dev
  ```

### Problem: Server won't start

**Solution**: Make sure you're in the right directory
```bash
cd "F:/fit check 1/react-dev-app"
pwd  # Should show: F:/fit check 1/react-dev-app
npm run dev
```

### Problem: Can't find .env.local file

**Solution**: Create it if missing
```bash
cd "F:/fit check 1/react-dev-app"
echo "GEMINI_API_KEY=YourKeyHere" > .env.local
```

---

## Security Best Practices

### ✅ DO:
- Keep the key in `.env.local`
- Verify `.gitignore` includes `.env.local`
- Use different keys for dev/prod (optional)
- Delete unused keys from AI Studio

### ❌ DON'T:
- Never commit `.env.local` to Git
- Never share your key publicly
- Never hardcode key in source code
- Never post key in chat/forums

---

## Key Usage Limits (Free Tier)

| Limit | Value |
|-------|-------|
| **Requests per minute** | 15 |
| **Requests per day** | 1,500 |
| **Requests per month** | ~45,000 |

**For this project:**
- Each try-on = 2 requests (model + garment)
- Free tier = 750 try-ons per day
- More than enough for testing!

---

## Advanced: Multiple Keys

If you need more capacity later:

### Create Multiple Keys:
1. Go to AI Studio
2. Create Key A for Development
3. Create Key B for Production
4. Use different `.env.local` files

### Benefits:
- Separate usage tracking
- Easy to revoke one without affecting others
- Can hit combined limits (30 req/min with 2 keys)

---

## Verification Checklist

After adding your key, verify:

- [ ] File saved: `react-dev-app/.env.local`
- [ ] No spaces around `=` sign
- [ ] Key starts with `AIza`
- [ ] Key is ~39 characters long
- [ ] File is in `.gitignore`
- [ ] Dev server restarts successfully
- [ ] Can upload and transform images
- [ ] No API errors in console

---

## Quick Reference

### Get Key:
```
https://aistudio.google.com/apikey
```

### File Location:
```
F:\fit check 1\react-dev-app\.env.local
```

### Format:
```bash
GEMINI_API_KEY=AIzaSy...
```

### Test:
```bash
cd react-dev-app && npm run dev
```

### Check in Browser:
```
http://localhost:3000
```

---

## Next Steps After Adding Key

1. **Test locally** - Upload images and verify it works
2. **Commit to Git** - The key is safe (in .gitignore)
3. **Follow DEPLOYMENT.md** - Deploy to Firebase
4. **Add to GitHub** - System will use key from your repo

---

## Need Help?

### Common Issues:

**"Module not found"**
→ Run `npm install` in `react-dev-app/`

**"Port 3000 in use"**
→ Kill existing process: `pkill -f vite`

**"API quota exceeded"**
→ Wait for next day or create another key

**"Network error"**
→ Check internet connection

---

## Summary

1. Get key from: https://aistudio.google.com/apikey
2. Add to: `react-dev-app/.env.local`
3. Format: `GEMINI_API_KEY=YourKeyHere`
4. Test: `npm run dev` → http://localhost:3000
5. Deploy: Follow `DEPLOYMENT.md`

**That's it! Your API key is ready.** 🚀
