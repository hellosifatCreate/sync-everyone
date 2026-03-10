# 🚀 Deploy Sync Everyone to Railway — Windows Guide
# ════════════════════════════════════════════════════

## BEFORE YOU START — Install These (one time only)

1. Node.js  → https://nodejs.org  → click "LTS" → install
2. Git      → https://git-scm.com → install (click Next through everything)
3. VS Code  → https://code.visualstudio.com (optional but helpful)

---

## STEP 1 — Create Free Accounts

1. Go to → https://github.com  → Sign Up (free)
   - Remember your username and password

2. Go to → https://railway.app → click "Login with GitHub"
   - Approve the connection

---

## STEP 2 — Set Up Git on Your Laptop

Open **Command Prompt** (press Windows key, type "cmd", press Enter)

Type these commands:
```
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

---

## STEP 3 — Put Project Files on Your Laptop

1. Extract the ZIP file you downloaded: sync-everyone-railway.zip
2. Put the folder on your Desktop
   - You should see: C:\Users\YOU\Desktop\sync-everyone\

---

## STEP 4 — Upload to GitHub

Open Command Prompt and type:

```
cd Desktop\sync-everyone
git init
git add .
git commit -m "Sync Everyone first upload"
```

Now go to https://github.com/new and:
- Repository name: sync-everyone
- Set to PUBLIC
- Click "Create repository"

Copy the commands GitHub shows you that look like:
```
git remote add origin https://github.com/YOURNAME/sync-everyone.git
git branch -M main
git push -u origin main
```

Paste them in Command Prompt one by one and press Enter.
When asked for password → use a GitHub "Personal Access Token":
- Go to GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
- Click Generate new token → check "repo" → Generate
- Copy and paste that as your password

✅ Your code is now on GitHub!

---

## STEP 5 — Deploy on Railway

1. Go to → https://railway.app
2. Click → "New Project"
3. Click → "Deploy from GitHub repo"
4. Select → "sync-everyone"
5. Click → "Deploy Now"

Railway will start building — wait about 2 minutes ⏳

---

## STEP 6 — Add Free MySQL Database

Inside your Railway project:

1. Click → "+ New" button
2. Click → "Database"
3. Click → "Add MySQL"

Wait for it to start (green dot = ready ✅)

Click on the MySQL service → go to "Variables" tab
Copy these values (you'll need them next):
- MYSQLHOST
- MYSQLPORT
- MYSQLUSER
- MYSQLPASSWORD
- MYSQLDATABASE

---

## STEP 7 — Set Environment Variables

Click on your "sync-everyone" service → go to "Variables" tab
Click "New Variable" and add each one:

```
DB_HOST         = (paste MYSQLHOST value)
DB_PORT         = (paste MYSQLPORT value)
DB_USER         = (paste MYSQLUSER value)
DB_PASSWORD     = (paste MYSQLPASSWORD value)
DB_NAME         = (paste MYSQLDATABASE value)
JWT_SECRET      = SyncEveryone_SuperSecret_2024!xYz789
NODE_ENV        = production
UPLOAD_DIR      = uploads
MAX_FILE_SIZE_MB = 5
```

Click "Deploy" to restart with new settings.

---

## STEP 8 — Create Database Tables

1. Click on your MySQL service
2. Click "Connect" tab
3. Click "MySQL Client" (opens in browser)
4. Paste the entire contents of schema.sql and press Run

OR use any MySQL client like TablePlus or DBeaver with the connection details from Step 6.

---

## STEP 9 — Get Your Live URL! 🎉

1. Click on your "sync-everyone" service
2. Click "Settings" tab
3. Under "Domains" → click "Generate Domain"
4. You'll get a URL like:

   ✅  https://sync-everyone-production.up.railway.app

Share this link with anyone — your app is LIVE! 🌍

---

## UPDATING THE APP LATER

When you change something in the app:

```
cd Desktop\sync-everyone
git add .
git commit -m "update"
git push
```

Railway automatically redeploys in ~2 minutes! ⚡

---

## TROUBLESHOOTING

App not loading?
→ Railway dashboard → click your service → "Logs" tab → read the error

Database error?
→ Double-check all DB_ variables match exactly what MySQL showed

Build failed?
→ Check Node.js version — must be 18+

Need help? → https://docs.railway.app
