-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY, -- Room number like "001", "002"
    status TEXT NOT NULL DEFAULT 'before-cleaning',
    checked_items TEXT[] DEFAULT '{}', -- Array of completed checklist item IDs
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access for simplicity in this demo/internal tool
CREATE POLICY "Allow public select" ON rooms FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON rooms FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON rooms FOR DELETE USING (true);

-- Initial data for rooms (to match what was in useRoomStore)
INSERT INTO rooms (id, status)
VALUES 
    ('001', 'occupied'),
    ('002', 'cleaning'),
    ('005', 'before-cleaning')
ON CONFLICT (id) DO NOTHING;
