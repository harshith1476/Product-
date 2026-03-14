# Backend Deployment to Render.com

## Quick Setup Guide

### Step 1: Prepare Your Repository
Your backend is already configured with `render.yaml`. Make sure all changes are committed:

```bash
cd backend
git add -A
git commit -m "Add render.yaml configuration"
git push origin main
```

### Step 2: Create Render Account & New Web Service

1. Go to [Render.com](https://render.com)
2. Sign up / Sign in with GitHub
3. Click **"New +"** → **"Web Service"**
4. Select your GitHub repository (pms project)
5. Choose the `backend` directory as the root directory
6. Set the start command: `npm start`
7. Keep the free plan (or upgrade if needed)

### Step 3: Configure Environment Variables on Render

In the Render dashboard, go to **Environment** and add these variables:

**Required Variables:**
```
JWT_SECRET=<your_jwt_secret_key>
MONGODB_URI=<your_mongodb_connection_string>
CLOUDINARY_NAME=<your_cloudinary_name>
CLOUDINARY_API_KEY=<your_cloudinary_api_key>
CLOUDINARY_SECRET_KEY=<your_cloudinary_secret_key>
```

**Payment Integration:**
```
RAZORPAY_KEY_ID=<your_razorpay_key_id>
RAZORPAY_KEY_SECRET=<your_razorpay_key_secret>
STRIPE_SECRET_KEY=<your_stripe_secret_key>
```

**AI Services:**
```
GEMINI_API_KEY=<your_gemini_api_key>
OPENAI_API_KEY=<your_openai_api_key>
```

**WhatsApp (Optional):**
```
WHATSAPP_ACCESS_TOKEN=<your_token>
WHATSAPP_PHONE_NUMBER_ID=<your_phone_id>
WHATSAPP_BUSINESS_ACCOUNT_ID=<your_account_id>
WHATSAPP_VERIFY_TOKEN=<your_verify_token>
```

**Email Service:**
```
BERVO_API_KEY=<your_brevo_api_key>
BERVO_SENDER_EMAIL=<your_sender_email>
```

**Pre-configured Variables (Already Set):**
- `FRONTEND_URL=https://medichain-nine-theta.vercel.app`
- `ADMIN_URL=https://admin-ivory-eight-28.vercel.app`
- `CURRENCY=INR`
- `PLATFORM_FEE_PERCENTAGE=5`
- `GST_PERCENTAGE=18`
- `NODE_ENV=production`

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (usually 2-5 minutes)
3. Your backend will be live at: `https://<service-name>.onrender.com`

### Step 5: Get Your Backend URL

Once deployed successfully:
- Your backend URL: `https://<service-name>.onrender.com`
- Use this URL to update your frontend `.env` files

### Common Issues & Solutions

**Issue: Build fails**
- Solution: Make sure backend/package.json has correct dependencies
- Check: `npm install` works locally first

**Issue: Service goes to sleep**
- Solution: Render free tier services sleep after inactivity
- Workaround: Use cron jobs or upgrade to paid plan
- Or: Set up a ping service to keep it alive

**Issue: Port conflicts**
- Solution: Render automatically assigns port; use `process.env.PORT`
- Already configured in server.js: `port = process.env.PORT || 5000`

**Issue: Database connection fails**
- Solution: Verify MongoDB URI is correct and allows Render IP
- MongoDB Atlas: Add `0.0.0.0/0` to Network Access

### Monitoring

After deployment, monitor your backend:
1. Render Dashboard → Your Service → "Logs"
2. Check for errors and performance metrics
3. Set up alerts for failures

### Update Frontend URLs

After getting your Render backend URL, update:

**Frontend `.env`:**
```
VITE_BACKEND_URL=https://<your-render-backend>.onrender.com
```

**Admin `.env`:**
```
VITE_BACKEND_URL=https://<your-render-backend>.onrender.com
```

Then redeploy frontend and admin on Vercel.

## Your Deployment Links

- **Frontend:** https://medichain-nine-theta.vercel.app/
- **Admin Panel:** https://admin-ivory-eight-28.vercel.app/
- **Backend:** https://<your-service-name>.onrender.com (after deployment)

---

**Need Help?**
- Render Docs: https://docs.render.com
- Check backend logs on Render dashboard
- Verify all environment variables are set correctly
