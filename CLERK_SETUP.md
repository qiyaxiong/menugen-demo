# 🔐 Clerk Authentication Setup Guide

This guide explains how to set up Clerk authentication for MenuGen.

## ✅ What's Already Implemented

### Authentication Features:
- ✅ **ClerkProvider** wrapper in `src/app/layout.tsx`
- ✅ **Protected Homepage** - Shows sign-in screen for unauthenticated users
- ✅ **Protected API** - `/api/genimg` requires authentication 
- ✅ **User Management** - UserButton in top-right corner with avatar
- ✅ **Usage Tracking** - Daily limits (20 images per user)
- ✅ **Middleware Protection** - Additional API route security
- ✅ **Dedicated Sign-in/Sign-up Pages** - Better UX

### Files Modified:
```
src/app/layout.tsx          # ClerkProvider wrapper
src/app/page.tsx           # Auth-protected main UI
src/app/api/genimg/route.ts # Protected API endpoint
src/app/sign-in/[[...sign-in]]/page.tsx # Sign-in page
src/app/sign-up/[[...sign-up]]/page.tsx # Sign-up page
src/components/DishCard.tsx # Updated for usage tracking
src/utils/genImage.ts      # Updated API response handling
middleware.ts              # API route protection
env.example                # Added Clerk environment variables
```

## 🚀 Setup Instructions

### Step 1: Create Clerk Account
1. Go to [https://clerk.com](https://clerk.com)
2. Sign up for a free account
3. Create a new application

### Step 2: Get Your API Keys
1. In your Clerk dashboard, go to **API Keys**
2. Copy your keys:
   - `Publishable key` (starts with `pk_test_` or `pk_live_`)
   - `Secret key` (starts with `sk_test_` or `sk_live_`)

### Step 3: Configure Environment Variables
Create a `.env.local` file in your project root:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Your existing API keys
ARK_API_KEY=your_existing_ark_api_key
REPLICATE_API_TOKEN=your_replicate_token
OPENAI_API_KEY=your_openai_key
```

### Step 4: Configure Clerk Dashboard
1. **Application Name**: MenuGen
2. **Allowed Origins**: Add your domain (e.g., `http://localhost:3000`)
3. **Social Logins** (optional): Enable Google, GitHub, etc.
4. **Email/Password**: Enable if you want traditional signup

### Step 5: Test the Integration
```bash
npm run dev
```

Visit `http://localhost:3000` - you should see:
- Sign-in prompt for unauthenticated users
- Full app access after authentication
- User avatar in top-right corner
- Protected API endpoints

## 🔧 Authentication Flow

### User Journey:
1. **Unauthenticated** → Sign-in screen with modal
2. **Authenticated** → Full app access with user avatar
3. **Image Generation** → Protected API with usage tracking
4. **Daily Limits** → 20 images per user per day

### API Protection:
```typescript
// All /api/genimg requests require authentication
const { userId } = await auth();
if (!userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Usage Tracking:
```typescript
// Simple in-memory tracking (20 images/day per user)
const DAILY_LIMIT = 20;
// Response includes usage info:
{
  imageUrl: "...",
  usage: { count: 5, limit: 20, remaining: 15 }
}
```

## 🎨 UI Components

### Sign-In Experience:
- **Modal Sign-In**: Overlay modal (default)
- **Dedicated Pages**: `/sign-in` and `/sign-up` routes
- **Welcome Message**: "Hi, [username]!" 
- **User Avatar**: Dropdown with profile/sign-out

### Protected UI:
- Loading spinner during auth check
- Graceful fallback if Clerk keys missing
- Setup instructions for developers

## 🔒 Security Features

### Middleware Protection:
```typescript
// middleware.ts protects all /api/genimg routes
const isProtectedRoute = createRouteMatcher(['/api/genimg(.*)']);
export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});
```

### API-Level Checks:
- Double authentication check in API routes
- User ID logging for audit trails  
- Usage limit enforcement per user
- Proper error responses (401, 429)

## 📊 Usage Tracking (Bonus Features)

### Current Implementation:
- **In-Memory Storage**: Simple Map-based tracking
- **Daily Limits**: 20 images per user per day
- **Usage Response**: API returns current usage stats
- **Automatic Reset**: Resets at midnight (UTC)

### Production Considerations:
```typescript
// For production, replace with database:
// const userUsage = new Map(); // ❌ In-memory (current)
// const userUsage = await db.getUserUsage(userId); // ✅ Database
```

## 🚨 Troubleshooting

### Build Errors:
- **Missing Keys**: App shows setup instructions instead of crashing
- **Invalid Keys**: Check format (`pk_test_...` / `sk_test_...`)
- **Environment**: Ensure `.env.local` is in project root

### Runtime Issues:
- **401 Errors**: Check if user is signed in
- **429 Errors**: User hit daily limit (20 images)
- **Clerk Loading**: Check `isLoaded` state

### Development:
```bash
# Test without auth (should show setup screen)
rm .env.local
npm run dev

# Test with auth (should show sign-in)
# Add your keys to .env.local
npm run dev
```

## 🔄 Next Steps

### Optional Enhancements:
1. **Database Storage**: Replace in-memory usage tracking
2. **Premium Tiers**: Different limits for different users
3. **Admin Dashboard**: View user usage analytics
4. **Email Notifications**: Welcome emails, usage alerts
5. **Social Logins**: Google, GitHub, Discord integration

### Production Deployment:
1. **Environment Variables**: Set Clerk keys in production environment
2. **Domain Configuration**: Update Clerk dashboard with production URL
3. **HTTPS Required**: Clerk requires HTTPS in production
4. **Database Migration**: Move usage tracking to persistent storage

---

🎉 **You're all set!** Your MenuGen app now has enterprise-grade authentication with user management, API protection, and usage tracking. 