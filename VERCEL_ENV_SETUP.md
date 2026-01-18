# 🌸 Setting Environment Variables on Vercel 🌸

## 🔒 Setting Auth Credentials Securely

### Step 1: Go to Your Project Settings

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your **Hannie's Wishlist** project
3. Click on **Settings** (in the top navigation)
4. Click on **Environment Variables** (in the left sidebar)

### Step 2: Add Your Auth Variables

Click **Add New** and add these two variables:

#### Variable 1:
- **Name:** `AUTH_USERNAME` (⚠️ No NEXT_PUBLIC_ prefix - server-side only!)
- **Value:** `hannie` (or your preferred username)
- **Environment:** Select all (Production, Preview, Development)

#### Variable 2:
- **Name:** `AUTH_PASSWORD` (⚠️ No NEXT_PUBLIC_ prefix - server-side only!)
- **Value:** `wishlist2026` (or your preferred password)
- **Environment:** Select all (Production, Preview, Development)

### Step 3: Save and Redeploy

1. Click **Save** for each variable
2. Go to **Deployments** tab
3. Click the **⋯** (three dots) on your latest deployment
4. Click **Redeploy** to apply the new environment variables

## 🔒 Security Features

✅ **Server-Side Authentication** - Credentials are stored securely on the server and never exposed to the browser!

- **HTTP-Only Cookies** - Authentication tokens are stored in secure, HTTP-only cookies
- **Server-Side Validation** - All authentication happens on the server
- **No Client Exposure** - Credentials are never visible in the browser's JavaScript bundle

This is much more secure than client-side authentication! 💕

## 🌸 Setting KV Variables (For Cloud Sync)

While you're in Environment Variables, also add:

- **Name:** `KV_REST_API_URL`
- **Value:** Your KV REST API URL from Vercel KV dashboard
- **Environment:** All

- **Name:** `KV_REST_API_TOKEN`
- **Value:** Your KV REST API Token from Vercel KV dashboard
- **Environment:** All

See `KV_SETUP.md` for more details on setting up KV! ☁️✨

---

💕 Your wishlist will be protected and synced across all your devices! ✨
