# Trikart Demand Capture System

Customer demand capture web app for Trikart Kuwait — 10 branches.

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Create `.env.local` in the root folder:
```
NEXT_PUBLIC_SUPABASE_URL=https://sdicysswjyrbtxjvknxc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Run locally
```bash
npm run dev
```
Open http://localhost:3000

### 4. Deploy to Vercel
1. Push this code to GitHub
2. Go to vercel.com → New Project → Import your repo
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click Deploy

## User Roles
- **Admin**: See all branches, dashboard, manage everything
- **Manager**: See own branch + dashboard
- **Salesman**: Add requests, see own branch
- **Vendor**: See product demand only (no customer details)
