# Vercel KV Setup Guide

This app uses a hybrid storage approach:
- **localStorage** - Fast, immediate access (client-side)
- **Vercel KV (Redis)** - Cloud backup and cross-device sync (server-side)

## Setup Instructions

### 1. Create a Vercel KV Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project (or create one)
3. Go to **Storage** → **Create Database** → **KV**
4. Choose a name for your KV database
5. Select a region (closest to you)

### 2. Get Your KV Credentials

After creating the database, you'll get:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN` (optional)

### 3. Add Environment Variables

#### For Local Development (`.env.local`):

```bash
# Vercel KV Credentials
KV_REST_API_URL=your_kv_rest_api_url_here
KV_REST_API_TOKEN=your_kv_rest_api_token_here

# Optional: Authentication
NEXT_PUBLIC_AUTH_USERNAME=hannie
NEXT_PUBLIC_AUTH_PASSWORD=wishlist2026
```

#### For Vercel Deployment:

1. Go to your project settings in Vercel Dashboard
2. Navigate to **Environment Variables**
3. Add the same variables:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

### 4. How It Works

1. **On Page Load:**
   - Loads from localStorage first (instant)
   - Syncs with Vercel KV in the background
   - Merges data if there are differences

2. **On Data Changes:**
   - Saves to localStorage immediately (fast)
   - Syncs to Vercel KV after 1 second (debounced)

3. **Cross-Device Sync:**
   - When you open the app on a new device, it loads from KV
   - Your local changes sync to KV automatically

### 5. Testing

1. Add some items to your wishlist
2. Wait a few seconds for sync
3. Open the app in a different browser/device
4. Your items should appear!

## Troubleshooting

- **Sync not working?** Check that your KV credentials are correct
- **Data not appearing?** Check browser console for errors
- **Slow sync?** This is normal - localStorage is instant, KV sync happens in background
