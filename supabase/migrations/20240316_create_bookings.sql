CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_number TEXT UNIQUE NOT NULL,
    room_id TEXT NOT NULL, -- e.g., "001", "005"
    check_in_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    check_out_datetime TIMESTAMP WITH TIME ZONE,
    guest_count INTEGER,
    total_nights INTEGER,
    status TEXT DEFAULT 'confirmed', -- 'confirmed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_reservation_number ON bookings(reservation_number);

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow read access only to authenticated users (Staff)
CREATE POLICY "Allow authenticated read" ON bookings
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Restrict public writes
CREATE POLICY "Restrict public writes" ON bookings
    FOR INSERT WITH CHECK (false);

-- Automatic data retention: Delete bookings older than 30 days
CREATE OR REPLACE FUNCTION delete_old_bookings()
RETURNS void AS $$
BEGIN
    DELETE FROM bookings
    WHERE check_out_datetime < NOW() - INTERVAL '30 days'
       OR (check_out_datetime IS NULL AND check_in_datetime < NOW() - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql;

-- Note: In a production Supabase environment, you would schedule this using pg_cron or an Edge Function.
-- Example: SELECT cron.schedule('delete-old-bookings', '0 0 * * *', 'SELECT delete_old_bookings()');


