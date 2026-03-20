-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed'
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster sorting and filtering
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks(sort_order);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access (for testing/cleaning app simplicity, 
-- or you can restrict to authenticated users if you have login implemented)
-- NOTE: In a production app with login, use (auth.role() = 'authenticated')

CREATE POLICY "Allow public select" ON tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON tasks FOR DELETE USING (true);
