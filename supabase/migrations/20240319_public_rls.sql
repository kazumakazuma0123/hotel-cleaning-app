-- ==========================================
-- Public Access RLS Policies 
-- (for internal/URL-only shared apps)
-- ==========================================

-- 1. Enable RLS on all tables (just in case)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies on bookings if they exist
DROP POLICY IF EXISTS "Allow authenticated read" ON bookings;
DROP POLICY IF EXISTS "Restrict public writes" ON bookings;

-- 3. Create Public Read/Write Policies for 'bookings' table
CREATE POLICY "Allow public select on bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on bookings" ON bookings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on bookings" ON bookings FOR DELETE USING (true);

-- 4. Re-apply Public Read/Write Policies for 'tasks' table
DROP POLICY IF EXISTS "Allow public select" ON tasks;
DROP POLICY IF EXISTS "Allow public insert" ON tasks;
DROP POLICY IF EXISTS "Allow public update" ON tasks;
DROP POLICY IF EXISTS "Allow public delete" ON tasks;

CREATE POLICY "Allow public select" ON tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON tasks FOR DELETE USING (true);

-- 5. Re-apply Public Read/Write Policies for 'rooms' table
DROP POLICY IF EXISTS "Allow public select" ON rooms;
DROP POLICY IF EXISTS "Allow public insert" ON rooms;
DROP POLICY IF EXISTS "Allow public update" ON rooms;
DROP POLICY IF EXISTS "Allow public delete" ON rooms;

CREATE POLICY "Allow public select" ON rooms FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON rooms FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON rooms FOR DELETE USING (true);
