# Tenant Onboarding App

Comprehensive tenant onboarding management system for Hornbeam Park with compliance tracking, meter reading OCR, email notifications, and PDF export.

## Features

- **Onboarding Records**: Create and manage tenant onboarding from lease signing through handover
- **Compliance Documents**: Upload EICR, gas certificates, air-con service docs with flexible categorization
- **Meter Management**: Track electricity, gas, water meters with automated OCR reading extraction
- **Meter Reading OCR**: Upload photos of meter displays—Claude Vision API automatically extracts readings
- **Workflow Checklist**: Pre-defined compliance steps + custom one-off steps for unusual tenancies
- **Email Templates**: Send compliance docs and utilities info to tenants with one click
- **Contact Management**: Store principal, accounts, facilities, and out-of-hours contacts
- **Progress Tracking**: Visual progress indicator showing completion percentage
- **PDF Export**: Export onboarding summaries as PDF for document storage
- **Multi-user**: Simple username/password auth for your team

## Quick Start

### 1. Prerequisites
- Node.js 16+ installed
- GitHub account
- Supabase account (free tier works)
- EmailJS account (free tier works)
- Anthropic Claude API key (for meter OCR)

### 2. Setup

See **SETUP_GUIDE.md** for detailed step-by-step instructions:

1. Create Supabase project
2. Run SQL schema
3. Create GitHub repository
4. Clone and configure locally
5. Deploy to Netlify

### 3. Environment Variables

Create `.env.local` in the root directory:

```
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_EMAILJS_SERVICE_ID=service_xxxxx
REACT_APP_EMAILJS_TEMPLATE_ID=template_xxxxx
REACT_APP_EMAILJS_PUBLIC_KEY=your-public-key
REACT_APP_CLAUDE_API_KEY=sk-ant-xxxxx
```

### 4. Local Development

```bash
npm install
npm start
```

App runs on `http://localhost:3000`

### 5. Deploy to Netlify

```bash
git push origin main
```

Netlify auto-deploys from GitHub.

## Workflow Overview

### For each new tenant:

1. **Create Onboarding Record**
   - Property, unit reference, tenant names, start date
   - Dashboard shows all records with progress

2. **Handover Section**
   - Record handover date, keys/codes handed over
   - Track access control flags (tenant-only, gate access)

3. **Compliance Documents**
   - Add EICR, gas certificates, air-con service docs
   - Upload files and set dates
   - System defaults to EICR and Gas sections

4. **Utilities & Meters**
   - Add meters (electricity, gas, water) with supply refs and serial numbers
   - Upload meter photos—OCR extracts readings automatically
   - Or manually enter readings
   - Email utilities info to tenant with one click

5. **Signage**
   - Track directory updates, postbox labels, parking labels
   - Add custom signage requirements

6. **Workflow Checklist**
   - Mark off standard compliance steps: EICR, Gas CoT, Qube Updated, Rates Updated, etc.
   - Add custom steps as needed (e.g., "Deep clean", "Furniture inspection")

7. **Tenant Contacts**
   - Store principal, accounts, facilities, out-of-hours contacts
   - Email compliance docs to principal contact
   - Email request for contact info

8. **Export & Archive**
   - Download PDF summary for Qube document tab
   - All onboarding records persist in Supabase

## File Structure

```
tenant-onboarding-app/
├── src/
│   ├── components/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   └── OnboardingPage.jsx
│   ├── utils/
│   │   ├── supabaseClient.js
│   │   ├── ocrService.js
│   │   ├── emailService.js
│   │   └── pdfService.js
│   ├── App.jsx
│   ├── App.css
│   └── index.js
├── public/
│   └── index.html
├── .env.local.example
├── .gitignore
├── package.json
├── tenant_onboarding_schema.sql
├── SETUP_GUIDE.md
└── README.md
```

## Key Technologies

- **React 18**: Frontend framework
- **Supabase**: PostgreSQL database + auth + file storage
- **Claude Vision API**: Meter reading OCR
- **EmailJS**: Email sending
- **jsPDF**: PDF generation
- **Lucide React**: Icons
- **date-fns**: Date utilities

## API Keys Needed

1. **Supabase** (free tier)
   - Go to https://supabase.com
   - Create project
   - Copy Project URL and Anon Key

2. **EmailJS** (free tier: 200 emails/month)
   - Go to https://emailjs.com
   - Connect email account (Gmail, Outlook, etc.)
   - Copy Service ID, Template ID, Public Key

3. **Anthropic Claude** (paid, $0.03/1M input tokens)
   - Go to https://console.anthropic.com
   - Create API key
   - Budget ~$5/month for typical usage

## Troubleshooting

### "Cannot connect to Supabase"
- Check `.env.local` has correct URL and Anon key (not service role key)
- Restart dev server after updating `.env.local`
- Verify Supabase project is active

### "Meter OCR not working"
- Verify `REACT_APP_CLAUDE_API_KEY` is valid
- Test with clear, well-lit meter photo
- Digital displays work best; dials are fallback

### "EmailJS not sending"
- Verify Service ID, Template ID, Public Key in `.env.local`
- Check EmailJS dashboard for email activity
- Ensure email template has merge fields: `{{tenant_name}}`, `{{property}}`, etc.

### "Storage upload failed"
- Check bucket exists: `onboarding-files`
- Verify bucket is public (not private)
- Check file size < 5MB

## Support & Questions

Refer to SETUP_GUIDE.md for detailed configuration.

---

**Built for Hornbeam Park Management**
