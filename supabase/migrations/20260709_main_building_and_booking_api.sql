-- 本館5室を追加（既存はヴィラ3室: 001, 002, 005）
INSERT INTO rooms (id, status)
VALUES
    ('101', 'before-cleaning'),
    ('102', 'before-cleaning'),
    ('201', 'before-cleaning'),
    ('202', 'before-cleaning'),
    ('203', 'before-cleaning')
ON CONFLICT (id) DO NOTHING;

-- bookings: room_id を nullable化（外部GAS連携で部屋未割当の予約を先に保存できるようにする）
ALTER TABLE bookings ALTER COLUMN room_id DROP NOT NULL;

-- bookings: 外部GAS連携用の列を追加
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS channel TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS room_type TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_name TEXT;

-- Note: 20240319_public_rls.sql の public select/insert/update/delete ポリシーは
-- テーブル単位の権限であり、列追加・NULL制約変更の影響を受けないため変更不要。
