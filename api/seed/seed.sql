-- ============================================
-- Collabo Connect test seed data (SQLite / Cloudflare D1)
-- Ported from railway/seed.sql (Postgres).
-- D1 runs the file statement-by-statement, so there is no BEGIN/COMMIT.
-- Insert order:
-- 1. better-auth user
-- 2. profiles
-- 2-a. tags / profile_tags
-- 3. postings
-- 4. posting_participants
-- 5. ai_questions
-- 6. ai_question_responses
-- ============================================

-- 1. better-auth users
INSERT INTO "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
VALUES
  ('11111111-1111-4111-8111-111111111111', '田中 太郎', 'taro.tanaka@example.com', 1, 'https://api.dicebear.com/7.x/avataaars/svg?seed=TaroTanaka', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('22222222-2222-4222-8222-222222222222', '佐藤 花子', 'hanako.sato@example.com', 1, 'https://api.dicebear.com/7.x/avataaars/svg?seed=HanakoSato', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('33333333-3333-4333-8333-333333333333', '鈴木 一郎', 'ichiro.suzuki@example.com', 1, 'https://api.dicebear.com/7.x/avataaars/svg?seed=IchiroSuzuki', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('44444444-4444-4444-8444-444444444444', '山田 美咲', 'misaki.yamada@example.com', 1, 'https://api.dicebear.com/7.x/avataaars/svg?seed=MisakiYamada', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('55555555-5555-4555-8555-555555555555', '高橋 健太', 'kenta.takahashi@example.com', 1, 'https://api.dicebear.com/7.x/avataaars/svg?seed=KentaTakahashi', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('66666666-6666-4666-8666-666666666666', '伊藤 さくら', 'sakura.ito@example.com', 1, 'https://api.dicebear.com/7.x/avataaars/svg?seed=SakuraIto', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'))
ON CONFLICT (id) DO UPDATE
SET
  name = excluded.name,
  email = excluded.email,
  "emailVerified" = excluded."emailVerified",
  image = excluded.image,
  "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ','now');

-- 2. app profiles
INSERT INTO profiles (id, name, avatar_url, role, areas, job_type, ai_intro, joined_date)
VALUES
  (
    '11111111-1111-4111-8111-111111111111',
    '田中 太郎',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=TaroTanaka',
    'フロントエンドエンジニア',
    '["新宿", "東京"]',
    'フロントエンドエンジニア',
    'React と TypeScript を軸に UI 設計から実装まで担当しています。最近は AWS 認定に向けた学習を続けていて、技術相談や勉強会にも前向きです。',
    '2024-04-01'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    '佐藤 花子',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=HanakoSato',
    'バックエンドエンジニア',
    '["渋谷", "世田谷"]',
    'バックエンドエンジニア',
    'Java と Spring を使った API 開発が得意です。レビューでは堅実さを重視しており、若手メンバーの相談役になることも多いです。',
    '2023-10-01'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    '鈴木 一郎',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=IchiroSuzuki',
    'インフラエンジニア',
    '["品川", "川崎"]',
    'インフラエンジニア',
    'AWS と Docker を中心に、安定運用しやすい基盤設計を進めています。休日は登山とコーヒー巡りで気分転換することが多いです。',
    '2024-01-01'
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    '山田 美咲',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=MisakiYamada',
    'フルスタックエンジニア',
    '["新宿", "中野"]',
    'フルスタックエンジニア',
    'Next.js と Python をまたいで、素早く仮説検証する開発が得意です。社内勉強会の企画やファシリテーションにも積極的に関わっています。',
    '2024-06-01'
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    '高橋 健太',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=KentaTakahashi',
    'モバイルエンジニア',
    '["横浜", "みなとみらい"]',
    'モバイルエンジニア',
    'Flutter と Swift によるモバイルアプリ開発を担当しています。個人でもアプリやゲームを作っていて、実験的なアイデアを形にするのが好きです。',
    '2023-08-01'
  ),
  (
    '66666666-6666-4666-8666-666666666666',
    '伊藤 さくら',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=SakuraIto',
    'QAエンジニア',
    '["渋谷", "目黒"]',
    'QAエンジニア',
    'テスト自動化の整備と品質改善の仕組みづくりを担当しています。ユーザー視点を大切にしながら、安心して出せるリリースを支えるのが役割です。',
    '2024-03-01'
  )
ON CONFLICT (id) DO UPDATE
SET
  name = excluded.name,
  avatar_url = excluded.avatar_url,
  role = excluded.role,
  areas = excluded.areas,
  job_type = excluded.job_type,
  ai_intro = excluded.ai_intro,
  joined_date = excluded.joined_date,
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now');

-- 2-a. tags (辞書) と profile_tags (多対多)
INSERT INTO tags (name, category) VALUES
  ('React', 'skill'),
  ('TypeScript', 'skill'),
  ('AWS', 'skill'),
  ('Java', 'skill'),
  ('Spring', 'skill'),
  ('Docker', 'skill'),
  ('Next.js', 'skill'),
  ('Python', 'skill'),
  ('Flutter', 'skill'),
  ('Swift', 'skill'),
  ('テスト自動化', 'skill'),
  ('Selenium', 'skill'),
  ('AWS学習中', 'skill'),
  ('甘党', 'hobby'),
  ('ラーメン好き', 'hobby'),
  ('読書家', 'hobby'),
  ('登山', 'hobby'),
  ('コーヒー', 'hobby'),
  ('猫好き', 'hobby'),
  ('ヨガ', 'hobby'),
  ('ゲーム好き', 'hobby'),
  ('筋トレ', 'hobby'),
  ('カフェ巡り', 'hobby'),
  ('写真', 'hobby')
ON CONFLICT (lower(name)) DO NOTHING;

-- profile_tags: Postgres used unnest(ARRAY[...]) CROSS JOIN LATERAL.
-- SQLite equivalent: one INSERT...SELECT per profile, iterating that profile's
-- tag-name JSON array with json_each and joining to tags by case-insensitive
-- name. (A single UNION ALL'd form trips wrangler's local file executor.)
INSERT INTO profile_tags (profile_id, tag_id, source)
SELECT '11111111-1111-4111-8111-111111111111', t.id, 'manual'
FROM json_each('["React","TypeScript","甘党","AWS学習中"]') u
JOIN tags t ON lower(t.name) = lower(u.value)
WHERE true
ON CONFLICT (profile_id, tag_id) DO NOTHING;

INSERT INTO profile_tags (profile_id, tag_id, source)
SELECT '22222222-2222-4222-8222-222222222222', t.id, 'manual'
FROM json_each('["Java","Spring","ラーメン好き","読書家"]') u
JOIN tags t ON lower(t.name) = lower(u.value)
WHERE true
ON CONFLICT (profile_id, tag_id) DO NOTHING;

INSERT INTO profile_tags (profile_id, tag_id, source)
SELECT '33333333-3333-4333-8333-333333333333', t.id, 'manual'
FROM json_each('["AWS","Docker","登山","コーヒー"]') u
JOIN tags t ON lower(t.name) = lower(u.value)
WHERE true
ON CONFLICT (profile_id, tag_id) DO NOTHING;

INSERT INTO profile_tags (profile_id, tag_id, source)
SELECT '44444444-4444-4444-8444-444444444444', t.id, 'manual'
FROM json_each('["Next.js","Python","猫好き","ヨガ"]') u
JOIN tags t ON lower(t.name) = lower(u.value)
WHERE true
ON CONFLICT (profile_id, tag_id) DO NOTHING;

INSERT INTO profile_tags (profile_id, tag_id, source)
SELECT '55555555-5555-4555-8555-555555555555', t.id, 'manual'
FROM json_each('["Flutter","Swift","ゲーム好き","筋トレ"]') u
JOIN tags t ON lower(t.name) = lower(u.value)
WHERE true
ON CONFLICT (profile_id, tag_id) DO NOTHING;

INSERT INTO profile_tags (profile_id, tag_id, source)
SELECT '66666666-6666-4666-8666-666666666666', t.id, 'manual'
FROM json_each('["テスト自動化","Selenium","カフェ巡り","写真"]') u
JOIN tags t ON lower(t.name) = lower(u.value)
WHERE true
ON CONFLICT (profile_id, tag_id) DO NOTHING;

-- usage_count を全タグについて再計算（関連が無くなったタグは 0 に戻す）
UPDATE tags
   SET usage_count = (
     SELECT count(pt.tag_id)
       FROM profile_tags pt
      WHERE pt.tag_id = tags.id
   );

-- 3. postings
INSERT INTO postings (id, title, category, date, date_undecided, area, is_online, description, creator_id)
VALUES
  (
    'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '新宿でランチ行きませんか？',
    'food',
    '2026-03-25',
    0,
    '新宿',
    0,
    '新宿駅周辺でおすすめのラーメン屋さんを開拓したいです。お昼休みに気軽に参加してください。',
    '22222222-2222-4222-8222-222222222222'
  ),
  (
    'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    'AWS勉強会をゆるく始めたい',
    'study',
    NULL,
    1,
    'オンライン',
    1,
    'AWS 認定や設計の相談をしながら、週 1 回ペースでオンライン勉強会をしたいです。',
    '33333333-3333-4333-8333-333333333333'
  ),
  (
    'aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    '週末ボードゲーム会',
    'event',
    '2026-03-29',
    0,
    '渋谷',
    0,
    '渋谷のボードゲームカフェで軽めのゲームを中心に遊ぶ予定です。初心者歓迎です。',
    '55555555-5555-4555-8555-555555555555'
  ),
  (
    'aaaaaaa4-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
    'React 最新動向シェア会',
    'study',
    '2026-03-27',
    0,
    '品川',
    0,
    'React 19 や周辺エコシステムのアップデートを持ち寄って情報交換したいです。',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    'aaaaaaa5-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
    '横浜で作業カフェ会',
    'food',
    '2026-03-30',
    0,
    '横浜',
    0,
    '1 時間ほど各自作業しつつ、その後に近況共有できるメンバーを募集中です。',
    '66666666-6666-4666-8666-666666666666'
  )
ON CONFLICT (id) DO UPDATE
SET
  title = excluded.title,
  category = excluded.category,
  date = excluded.date,
  date_undecided = excluded.date_undecided,
  area = excluded.area,
  is_online = excluded.is_online,
  description = excluded.description,
  creator_id = excluded.creator_id,
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now');

-- 4. posting participants
INSERT INTO posting_participants (id, posting_id, user_id, action)
VALUES
  ('bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '11111111-1111-4111-8111-111111111111', 'join'),
  ('bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '44444444-4444-4444-8444-444444444444', 'interested'),
  ('bbbbbbb3-bbbb-4bbb-8bbb-bbbbbbbbbbb3', 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '11111111-1111-4111-8111-111111111111', 'online'),
  ('bbbbbbb4-bbbb-4bbb-8bbb-bbbbbbbbbbb4', 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '44444444-4444-4444-8444-444444444444', 'join'),
  ('bbbbbbb5-bbbb-4bbb-8bbb-bbbbbbbbbbb5', 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '66666666-6666-4666-8666-666666666666', 'interested'),
  ('bbbbbbb6-bbbb-4bbb-8bbb-bbbbbbbbbbb6', 'aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3', '22222222-2222-4222-8222-222222222222', 'join'),
  ('bbbbbbb7-bbbb-4bbb-8bbb-bbbbbbbbbbb7', 'aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3', '66666666-6666-4666-8666-666666666666', 'join'),
  ('bbbbbbb8-bbbb-4bbb-8bbb-bbbbbbbbbbb8', 'aaaaaaa4-aaaa-4aaa-8aaa-aaaaaaaaaaa4', '33333333-3333-4333-8333-333333333333', 'interested'),
  ('bbbbbbb9-bbbb-4bbb-8bbb-bbbbbbbbbbb9', 'aaaaaaa4-aaaa-4aaa-8aaa-aaaaaaaaaaa4', '44444444-4444-4444-8444-444444444444', 'join'),
  ('bbbbbb10-bbbb-4bbb-8bbb-bbbbbbbbb010', 'aaaaaaa5-aaaa-4aaa-8aaa-aaaaaaaaaaa5', '22222222-2222-4222-8222-222222222222', 'interested'),
  ('bbbbbb11-bbbb-4bbb-8bbb-bbbbbbbbb011', 'aaaaaaa5-aaaa-4aaa-8aaa-aaaaaaaaaaa5', '55555555-5555-4555-8555-555555555555', 'join')
ON CONFLICT (posting_id, user_id) DO UPDATE
SET action = excluded.action;

-- 5. AI questions
INSERT INTO ai_questions (id, question, options, date)
VALUES
  (
    'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1',
    '最近、現場で一番よく使っている技術は何ですか？',
    '["React / Vue などフロントエンド", "Java / Python などバックエンド", "AWS / GCP などクラウド", "その他"]',
    date('now')
  ),
  (
    'ccccccc2-cccc-4ccc-8ccc-ccccccccccc2',
    '週末の過ごし方で一番多いのは？',
    '["家でゆっくり", "カフェや外出", "スポーツ・アウトドア", "勉強・スキルアップ"]',
    date('now','-1 day')
  ),
  (
    'ccccccc3-cccc-4ccc-8ccc-ccccccccccc3',
    '社内の人ともっと話してみたいテーマは？',
    '["技術・キャリア相談", "趣味・プライベート", "おすすめのお店・スポット", "業界ニュース・トレンド"]',
    date('now','-2 day')
  ),
  (
    'ccccccc4-cccc-4ccc-8ccc-ccccccccccc4',
    '今期、個人的に一番伸ばしたいスキルは？',
    '["設計力", "実装スピード", "クラウド / インフラ", "ファシリテーション"]',
    date('now','-3 day')
  )
ON CONFLICT (id) DO UPDATE
SET
  question = excluded.question,
  options = excluded.options,
  date = excluded.date;

-- 6. AI question responses
INSERT INTO ai_question_responses (id, question_id, user_id, answer)
VALUES
  (
    'ddddddd1-dddd-4ddd-8ddd-ddddddddddd1',
    'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1',
    '11111111-1111-4111-8111-111111111111',
    '最近は React と TypeScript を使う時間が一番長いです。社内 UI の改善や管理画面の開発で触ることが多いです。'
  ),
  (
    'ddddddd2-dddd-4ddd-8ddd-ddddddddddd2',
    'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1',
    '33333333-3333-4333-8333-333333333333',
    'AWS を使うことが多く、最近は IaC と監視まわりの整備に時間を使っています。'
  ),
  (
    'ddddddd3-dddd-4ddd-8ddd-ddddddddddd3',
    'ccccccc2-cccc-4ccc-8ccc-ccccccccccc2',
    '22222222-2222-4222-8222-222222222222',
    '読書をしたり、気になるラーメン屋さんを開拓したりして過ごすことが多いです。'
  ),
  (
    'ddddddd4-dddd-4ddd-8ddd-ddddddddddd4',
    'ccccccc2-cccc-4ccc-8ccc-ccccccccccc2',
    '66666666-6666-4666-8666-666666666666',
    '新しいカフェを巡って写真を撮ることが多いです。気分転換しながらテスト観点を整理しています。'
  ),
  (
    'ddddddd5-dddd-4ddd-8ddd-ddddddddddd5',
    'ccccccc3-cccc-4ccc-8ccc-ccccccccccc3',
    '44444444-4444-4444-8444-444444444444',
    '技術とキャリアの両方です。特にフルスタック志向のキャリアの作り方をいろいろ聞いてみたいです。'
  ),
  (
    'ddddddd6-dddd-4ddd-8ddd-ddddddddddd6',
    'ccccccc4-cccc-4ccc-8ccc-ccccccccccc4',
    '55555555-5555-4555-8555-555555555555',
    '実装スピードを上げたいです。プロトタイプを短期間で出せる力をもっと伸ばしたいです。'
  )
ON CONFLICT (question_id, user_id) DO UPDATE
SET answer = excluded.answer;
