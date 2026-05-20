# Private Cloud - Complete Setup Guide

## Overview
Panduan lengkap untuk mengkonfigurasi semua layanan yang diperlukan untuk menjalankan aplikasi Private Cloud.

**Persyaratan:**
- Node.js ≥ 18.0.0
- pnpm 9.1.0 (atau `npm install -g pnpm@9.1.0`)
- Akun Supabase (gratis)
- Akun Cloudflare (gratis)

---

## 1️⃣ Setup Supabase (Database & Auth)

### 1.1 Create Supabase Project
1. Kunjungi https://supabase.com/dashboard
2. Click "New Project"
3. Pilih Organization → Database name: `private-cloud`
4. Password: Simpan di tempat aman
5. Region: Pilih terdekat dengan user
6. Tunggu project siap (±2 menit)

### 1.2 Get API Credentials
1. Buka project → Settings → API
2. Salin kedua URL ke `.env.local`:
   - **`NEXT_PUBLIC_SUPABASE_URL`** = Project URL (e.g., `https://xxxx.supabase.co`)
   - **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** = Anon key (e.g., `eyJhbGc...`)

### 1.3 Create Database Tables

Buka **SQL Editor** di Supabase dashboard dan jalankan script ini:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Files metadata table
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  mime_type TEXT DEFAULT 'application/octet-stream',
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Short links table
CREATE TABLE IF NOT EXISTS short_links (
  code TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_title ON notes USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_at ON files(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON calendar_events(event_date);

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE short_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view own notes" ON notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON notes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own files" ON files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own files" ON files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files" ON files
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own events" ON calendar_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own events" ON calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events" ON calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events" ON calendar_events
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anonymous can read short links" ON short_links
  FOR SELECT USING (true);

CREATE POLICY "Only backend can insert short links" ON short_links
  FOR INSERT WITH CHECK (true);

-- Enable authentication
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
```

### 1.4 Enable Magic Link Auth (Optional but Recommended)
1. Supabase Dashboard → Authentication → Providers
2. Email: Toggle "Enable Email Provider"
3. Confirm email (optional): Leave disabled untuk magic link langsung
4. Set redirect URL: **Settings → Auth → Redirect URLs**
   - Add: `http://localhost:3000/auth/callback`
   - Add: `https://yourdomain.com/auth/callback` (production)
5. Save

---

## 2️⃣ Setup Cloudflare R2 (File Storage)

### 2.1 Create R2 Bucket
1. Dashboard → R2 → Create bucket
2. Bucket name: `private-cloud-files`
3. Region: Recommended region for your users
4. Click Create bucket

### 2.2 Create R2 API Token
1. R2 Dashboard → Settings → API Tokens
2. Click "Create API token"
3. Permissions: **Admin** (untuk create/delete buckets jika diperlukan)
4. TTL: Leave as default (1 year)
5. Copy credentials ke `.env.local`:

```
CLOUDFLARE_ACCOUNT_ID=         # From Account details in R2 page
R2_ACCESS_KEY_ID=              # Access Key ID dari token
R2_SECRET_ACCESS_KEY=          # Secret Access Key dari token
R2_BUCKET_NAME=private-cloud-files
```

Untuk menemukan **CLOUDFLARE_ACCOUNT_ID**:
- Buka R2 dashboard → Copy account ID dari URL atau Settings

### 2.3 Configure CORS (untuk public download)
1. R2 → Bucket → Settings
2. CORS rules:
   ```json
   {
     "AllowedOrigins": ["https://yourdomain.com", "http://localhost:3000"],
     "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
     "AllowedHeaders": ["*"]
   }
   ```

---

## 3️⃣ Setup Cloudflare Workers (Optional - URL Shortener)

### 3.1 Deploy Shortener Worker
```bash
# Navigate to worker directory
cd apps/workers/shortener

# Install dependencies
pnpm install

# Create Wrangler project
wrangler deploy

# Set authentication secret
wrangler secret put AUTH_SECRET
# Paste: (pilih random string, e.g., `super-secret-key-123`)
```

### 3.2 Get Worker URL
1. Wrangler output menampilkan deployment URL
2. Salin ke `.env.local`:
   ```
   SHORTENER_WORKER_URL=https://shortener-xxx.your-domain.workers.dev
   SHORTENER_PUBLIC_URL=https://s.yourdomain.com  # (opsional, custom domain)
   SHORTENER_SECRET=super-secret-key-123          # (sama dengan AUTH_SECRET di atas)
   ```

### 3.3 Deploy Telegraph Proxy Worker (Optional)
```bash
cd apps/workers/telegraph-proxy
pnpm install
wrangler deploy
```

Update `.env.local`:
```
TELEGRAPH_WORKER_URL=https://telegraph-proxy-xxx.your-domain.workers.dev
```

---

## 4️⃣ Setup Environment Variables

### 4.1 Copy Template
```bash
cd apps/web
cp .env.local.example .env.local
```

### 4.2 Fill in Values
Edit `apps/web/.env.local`:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=private-cloud-files

# Cloudflare Workers (optional)
SHORTENER_WORKER_URL=https://shortener-xxx.workers.dev
SHORTENER_PUBLIC_URL=https://shortener-xxx.workers.dev
SHORTENER_SECRET=your-secret-key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000  # (development)
```

### 4.3 Verify Environment Variables
```bash
# Check if all required variables are set
grep "process.env" apps/web/src/**/*.ts | grep -v "SKIP_ENV_VALIDATION"
```

---

## 5️⃣ Setup Local Development

### 5.1 Install Dependencies
```bash
# From project root
pnpm install
```

### 5.2 Run Development Server
```bash
pnpm dev

# Output should show:
# - web: http://localhost:3000
# - workers: (if running locally)
```

### 5.3 Test Supabase Connection
Open browser console at http://localhost:3000/login:
```javascript
// Test auth
const { data } = await supabase.auth.getSession()
console.log(data)  // Should show session if logged in
```

### 5.4 Test File Upload
1. Navigate to http://localhost:3000/login → Magic link login
2. Go to /drive
3. Drag & drop a file
4. Check Cloudflare R2 dashboard → Files should appear

### 5.5 Test Notes CRUD
1. Go to /notes
2. Click "Buat Catatan"
3. Create, edit, delete notes
4. Check Supabase SQL Editor → notes table should have data

---

## 6️⃣ Build & Deploy (Production)

### 6.1 Environment for Production
Create `apps/web/.env.production.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-key-here
NEXT_PUBLIC_APP_URL=https://yourdomain.com
R2_ACCESS_KEY_ID=prod-r2-key
R2_SECRET_ACCESS_KEY=prod-r2-secret
CLOUDFLARE_ACCOUNT_ID=prod-account-id
R2_BUCKET_NAME=prod-bucket-name
SHORTENER_WORKER_URL=https://prod-shortener-url.workers.dev
```

### 6.2 Build All Packages
```bash
pnpm build

# Verify no errors
pnpm type-check
```

### 6.3 Deploy Web App
Options:
- **Vercel** (recommended for Next.js):
  ```bash
  npm install -g vercel
  vercel --prod
  ```
- **Netlify**, **AWS Amplify**, or **Docker**

### 6.4 Production Checklist
- [ ] Supabase project in production region
- [ ] R2 bucket with regional endpoint
- [ ] Cloudflare Workers deployed
- [ ] Environment variables set in platform (Vercel, etc.)
- [ ] Update Supabase redirect URLs for production domain
- [ ] Update R2 CORS for production domain
- [ ] Enable HTTPS everywhere

---

## 7️⃣ Troubleshooting

### "Cannot find module '@private-cloud/shared'"
```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### "Supabase connection failed"
1. Check API credentials in `.env.local`
2. Verify `NEXT_PUBLIC_SUPABASE_URL` starts with `https://`
3. Restart dev server

### "R2 upload fails with 403"
1. Verify R2 API credentials are correct
2. Check token has admin permissions
3. Verify bucket name matches

### "Magic link email not received"
1. Check Supabase → Authentication → Email Templates
2. Configure SMTP in Supabase (for production)
3. Add email to whitelist in development

### "Build fails with type errors"
```bash
pnpm type-check
# Fix errors, then:
pnpm build
```

---

## 8️⃣ Useful Commands

```bash
# Development
pnpm dev              # Start all dev servers

# Building
pnpm build            # Build all packages
pnpm type-check       # TypeScript check
pnpm lint             # Run ESLint

# Code quality
pnpm format           # Auto-format code
pnpm lint --fix       # Fix linting issues

# Database
# Supabase migrations:
# (Handled via SQL Editor for now,
#  can add `drizzle-orm` later for migration management)

# Workers deployment
cd apps/workers/shortener && wrangler deploy
cd apps/workers/telegraph-proxy && wrangler deploy
```

---

## 📋 Setup Checklist

- [ ] Supabase project created
- [ ] API credentials copied to `.env.local`
- [ ] Database tables created (SQL script run)
- [ ] RLS policies enabled
- [ ] Magic link auth enabled (optional)
- [ ] R2 bucket created
- [ ] R2 API token generated
- [ ] Cloudflare account ID found
- [ ] R2 credentials in `.env.local`
- [ ] Workers deployed (optional)
- [ ] Worker URLs in `.env.local`
- [ ] `pnpm install` completed
- [ ] `pnpm dev` runs without errors
- [ ] Test login with magic link
- [ ] Test file upload to R2
- [ ] Test note creation in Supabase
- [ ] `pnpm build` completes successfully
- [ ] Ready for production deployment

---

## 📚 Documentation Links

- Supabase: https://supabase.com/docs
- Cloudflare R2: https://developers.cloudflare.com/r2/
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Next.js: https://nextjs.org/docs
- pnpm: https://pnpm.io/

---

**Last Updated:** 2024
**Setup Time:** ~30 minutes for all services
