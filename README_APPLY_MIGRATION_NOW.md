# ⚠️ IMPORTANT: Apply Database Migration

## You MUST run this SQL script before using the new admin features!

---

## 🚀 Quick Start (Copy & Paste)

### Step 1: Open Supabase Dashboard
Go to: https://supabase.com/dashboard/project/yvnfhsipyfxdmulajbgl/sql/new

### Step 2: Copy the SQL File
Open this file: `supabase/APPLY_THIS_IN_SUPABASE_DASHBOARD.sql`

### Step 3: Paste & Run
1. Copy **all contents** of the SQL file
2. Paste into the SQL Editor
3. Click the **"Run"** button
4. Wait for: "Tables created successfully!"

---

## ✅ What This Migration Does

1. Adds `category` column to existing `events` table
2. Creates 5 new tables:
   - `lounges`
   - `pubs`
   - `arcade_centers`
   - `beaches`
   - `live_shows`
3. Creates indexes for performance
4. Enables Row Level Security (RLS)
5. Creates admin and public access policies

---

## 🔍 Verify Migration Success

Run this query in Supabase SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('lounges', 'pubs', 'arcade_centers', 'beaches', 'live_shows')
ORDER BY table_name;
```

**Expected Result:** You should see all 5 table names listed.

---

## ❌ If Migration Fails

### Error: "relation already exists"
**Solution:** Tables were already created. You're good to go!

### Error: "permission denied"
**Solution:** Make sure you're the project owner or have database admin access.

### Error: "column already exists" (for events.category)
**Solution:** The category column was already added. No problem!

---

## 🎯 After Migration

1. Restart your dev server: `npm run dev`
2. Log in to admin panel
3. Navigate to any new section (Lounges, Pubs, etc.)
4. Start creating entries!

---

## 📞 Need Help?

Check `CRUD_IMPLEMENTATION_COMPLETE.md` for full documentation.
