# Tenant Onboarding App - Setup Guide

## Overview
This guide walks you through setting up the Tenant Onboarding app with Supabase backend, React frontend, and deployment to Netlify.

---

## Part 1: Supabase Setup

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Name: `tenant-onboarding`
5. Password: Generate strong password (save it)
6. Region: UK (London) recommended
7. Click "Create new project" (wait 2-3 minutes for initialization)

### Step 2: Create Database Tables
1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Copy the entire contents of `tenant_onboarding_schema.sql`
4. Paste into the query editor
5. Click **"Run"** (bottom right)
6. You should see "Success" messages for each table creation

### Step 3: Set Up Authentication
1. Go to **Authentication** (left sidebar)
2. Click **"Providers"**
3. Under "Email", make sure it's **enabled** (should be by default)
4. Go to **Auth** → **Users** (empty for now, that's correct)
5. Copy your **Project URL** and **Anon Key**:
   - Click **"Settings"** (bottom left) → **"API"**
   - Copy **Project URL** (looks like `https://xxxxx.supabase.co`)
   - Copy **anon public** key
   - Save these — you'll need them in Step 4

### Step 4: Create Storage Bucket
1. Go to **Storage** (left sidebar)
2. Click **"Create a new bucket"**
3. Name: `onboarding-files`
4. Uncheck "Make it private" (leave public)
5. Click **"Create bucket"**

---

## Part 2: React App Setup

### Step 5: Create GitHub Repository
1. Go to https://github.com (create account if needed)
2. Click **"+"** (top right) → **"New repository"**
3. Name: `tenant-onboarding-app`
4. Description: Tenant onboarding management system
5. Choose **"Public"** (easier for Netlify)
6. Click **"Create repository"**
7. Copy the URL (e.g., `https://github.com/yourname/tenant-onboarding-app.git`)

### Step 6: Clone & Set Up Locally
```bash
# Clone the repo
git clone https://github.com/yourname/tenant-onboarding-app.git
cd tenant-onboarding-app

# Create the app structure (files provided in next section)
# - copy all React code files into this directory
# - copy .env.local.example → .env.local

# Install dependencies
npm install

# Start development server
npm start
```

### Step 7: Configure Environment Variables
1. In the repo root, create a file: `.env.local`
2. Copy contents from `.env.local.example` (provided)
3. Fill in your Supabase credentials:
   ```
   REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   REACT_APP_EMAILJS_SERVICE_ID=your-emailjs-service-id
   REACT_APP_EMAILJS_TEMPLATE_ID=your-emailjs-template-id
   REACT_APP_EMAILJS_PUBLIC_KEY=your-emailjs-public-key
   REACT_APP_CLAUDE_API_KEY=your-anthropic-api-key
   ```

### Step 8: Set Up EmailJS (for email templates)
1. Go to https://www.emailjs.com
2. Sign up with GitHub/email
3. Click **"Add Service"**
4. Choose Gmail (or your email provider)
5. Follow the setup steps
6. Go to **"Templates"** → **"Create Template"**
7. Name: `tenant_onboarding_email`
8. Set up merge fields:
   - `{{property}}`
   - `{{unit}}`
   - `{{tenant_name}}`
   - `{{document_list}}`
   - `{{meter_readings}}`
8. Design the template (see example below)
9. Copy your **Service ID**, **Template ID**, and **Public Key** from Dashboard
10. Add to `.env.local`

### Step 9: Set Up Claude API (for meter OCR)
1. Go to https://console.anthropic.com
2. Sign up or log in
3. Go to **"API Keys"**
4. Click **"Create Key"**
5. Copy the key and add to `.env.local` as `REACT_APP_CLAUDE_API_KEY`

---

## Part 3: Deploy to Netlify

### Step 10: Push Code to GitHub
```bash
git add .
git commit -m "Initial tenant onboarding app"
git push origin main
```

### Step 11: Deploy on Netlify
1. Go to https://netlify.com
2. Sign up with GitHub
3. Click **"Import an existing project"**
4. Select **GitHub** as your Git provider
5. Find `tenant-onboarding-app` repo
6. Netlify auto-detects React app
7. **Build command**: `npm run build`
8. **Publish directory**: `build`
9. Click **"Deploy"**
10. Go to **"Site settings"** → **"Build & deploy"** → **"Environment"**
11. Add environment variables (same as `.env.local`):
    - `REACT_APP_SUPABASE_URL`
    - `REACT_APP_SUPABASE_ANON_KEY`
    - `REACT_APP_EMAILJS_SERVICE_ID`
    - `REACT_APP_EMAILJS_TEMPLATE_ID`
    - `REACT_APP_EMAILJS_PUBLIC_KEY`
    - `REACT_APP_CLAUDE_API_KEY`

12. Netlify auto-deploys on each push to GitHub

---

## Part 4: First User Setup

### Step 12: Create Admin User
1. Go to your Netlify URL (e.g., `https://tenant-onboarding.netlify.app`)
2. You'll see a signup page
3. Create your admin account:
   - Username: (your choice, e.g., `ben`)
   - Email: your@email.com
   - Password: strong password
4. Click **"Sign up"**
5. After signup, you're logged in

### Step 13: Add Colleagues (Optional, for later)
Once signed up, you can invite Jackie and Pip:
- Click **"Manage Users"** (admin section)
- Click **"Invite User"**
- Enter their email
- They receive invite email and set their own password

---

## Email Template Example (EmailJS)

Use this template structure in EmailJS:

```html
<h2>Tenant Onboarding Documents</h2>

<p>Dear {{tenant_name}},</p>

<p>Welcome to {{property}}, Unit {{unit}}.</p>

<p><strong>Key Documents:</strong></p>
<ul>
  {{document_list}}
</ul>

<p><strong>Utility Information:</strong></p>
<ul>
  {{meter_readings}}
</ul>

<p>Please review the attached documents and contact us if you have any questions.</p>

<p>Best regards,<br>Hornbeam Park Management</p>
```

---

## Troubleshooting

### "Supabase connection failed"
- Check `.env.local` has correct URL and key
- Ensure you're not using your **service role** key (use **anon** key)
- Restart dev server after updating `.env.local`

### "Upload failed"
- Check storage bucket is public (not private)
- Verify Supabase Storage permissions

### "EmailJS not sending"
- Verify Service ID, Template ID, Public Key in `.env.local`
- Check EmailJS template has merge fields: `{{property}}`, `{{tenant_name}}`, etc.
- Test in EmailJS dashboard first

### "Meter OCR not working"
- Verify `REACT_APP_CLAUDE_API_KEY` is valid
- Image must be clear, well-lit photo of meter display
- Digital displays work best; dials are fallback

---

## File Structure

After setup, your repo should look like:

```
tenant-onboarding-app/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── OnboardingPage.jsx
│   │   └── ...other components
│   ├── utils/
│   │   ├── supabaseClient.js
│   │   ├── emailService.js
│   │   └── ocrService.js
│   ├── App.jsx
│   ├── App.css
│   └── index.js
├── .env.local (DO NOT COMMIT - add to .gitignore)
├── .env.local.example
├── .gitignore
├── package.json
├── tenant_onboarding_schema.sql
└── README.md
```

---

## Next Steps

1. Create Supabase project
2. Run SQL schema
3. Set up EmailJS and Claude API keys
4. Create GitHub repo
5. Copy React code into local folder
6. Configure `.env.local`
7. Test locally (`npm start`)
8. Push to GitHub
9. Deploy on Netlify

Once live, you're ready to create your first tenant onboarding!
