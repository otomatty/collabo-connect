BEGIN;

-- ============================================
-- Collabo Connect test seed data
-- Insert order:
-- 1. better-auth user
-- 2. public.profiles
-- 3. public.postings
-- 4. public.posting_participants
-- 5. public.ai_questions
-- 6. public.ai_question_responses
-- ============================================

-- 1. better-auth users
INSERT INTO "user" (id, name, email, "emailVerified", image)
VALUES
  ('11111111-1111-4111-8111-111111111111', '田中 太郎', 'taro.tanaka@example.com', TRUE, 'https://api.dicebear.com/7.x/avataaars/svg?seed=TaroTanaka'),
  ('22222222-2222-4222-8222-222222222222', '佐藤 花子', 'hanako.sato@example.com', TRUE, 'https://api.dicebear.com/7.x/avataaars/svg?seed=HanakoSato'),
  ('33333333-3333-4333-8333-333333333333', '鈴木 一郎', 'ichiro.suzuki@example.com', TRUE, 'https://api.dicebear.com/7.x/avataaars/svg?seed=IchiroSuzuki'),
  ('44444444-4444-4444-8444-444444444444', '山田 美咲', 'misaki.yamada@example.com', TRUE, 'https://api.dicebear.com/7.x/avataaars/svg?seed=MisakiYamada'),
  ('55555555-5555-4555-8555-555555555555', '高橋 健太', 'kenta.takahashi@example.com', TRUE, 'https://api.dicebear.com/7.x/avataaars/svg?seed=KentaTakahashi'),
  ('66666666-6666-4666-8666-666666666666', '伊藤 さくら', 'sakura.ito@example.com', TRUE, 'https://api.dicebear.com/7.x/avataaars/svg?seed=SakuraIto')
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  "emailVerified" = EXCLUDED."emailVerified",
  image = EXCLUDED.image,
  "updatedAt" = NOW();

-- 2. app profiles
INSERT INTO public.profiles (id, name, avatar_url, role, areas, job_type, ai_intro, joined_date)
VALUES
  (
    '11111111-1111-4111-8111-111111111111',
    '田中 太郎',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=TaroTanaka',
    'フロントエンドエンジニア',
    ARRAY['新宿', '東京'],
    'フロントエンドエンジニア',
    'React と TypeScript を軸に UI 設計から実装まで担当しています。最近は AWS 認定に向けた学習を続けていて、技術相談や勉強会にも前向きです。',
    DATE '2024-04-01'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    '佐藤 花子',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=HanakoSato',
    'バックエンドエンジニア',
    ARRAY['渋谷', '世田谷'],
    'バックエンドエンジニア',
    'Java と Spring を使った API 開発が得意です。レビューでは堅実さを重視しており、若手メンバーの相談役になることも多いです。',
    DATE '2023-10-01'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    '鈴木 一郎',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=IchiroSuzuki',
    'インフラエンジニア',
    ARRAY['品川', '川崎'],
    'インフラエンジニア',
    'AWS と Docker を中心に、安定運用しやすい基盤設計を進めています。休日は登山とコーヒー巡りで気分転換することが多いです。',
    DATE '2024-01-01'
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    '山田 美咲',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=MisakiYamada',
    'フルスタックエンジニア',
    ARRAY['新宿', '中野'],
    'フルスタックエンジニア',
    'Next.js と Python をまたいで、素早く仮説検証する開発が得意です。社内勉強会の企画やファシリテーションにも積極的に関わっています。',
    DATE '2024-06-01'
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    '高橋 健太',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=KentaTakahashi',
    'モバイルエンジニア',
    ARRAY['横浜', 'みなとみらい'],
    'モバイルエンジニア',
    'Flutter と Swift によるモバイルアプリ開発を担当しています。個人でもアプリやゲームを作っていて、実験的なアイデアを形にするのが好きです。',
    DATE '2023-08-01'
  ),
  (
    '66666666-6666-4666-8666-666666666666',
    '伊藤 さくら',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=SakuraIto',
    'QAエンジニア',
    ARRAY['渋谷', '目黒'],
    'QAエンジニア',
    'テスト自動化の整備と品質改善の仕組みづくりを担当しています。ユーザー視点を大切にしながら、安心して出せるリリースを支えるのが役割です。',
    DATE '2024-03-01'
  )
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  avatar_url = EXCLUDED.avatar_url,
  role = EXCLUDED.role,
  areas = EXCLUDED.areas,
  job_type = EXCLUDED.job_type,
  ai_intro = EXCLUDED.ai_intro,
  joined_date = EXCLUDED.joined_date,
  updated_at = NOW();

-- 2-a. tags (辞書) と profile_tags (多対多)
INSERT INTO public.tags (name, category) VALUES
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
ON CONFLICT ((lower(name))) DO NOTHING;

INSERT INTO public.profile_tags (profile_id, tag_id, source)
SELECT p.profile_id, t.id, 'manual'
FROM (VALUES
  ('11111111-1111-4111-8111-111111111111'::uuid, unnest(ARRAY['React','TypeScript','甘党','AWS学習中'])),
  ('22222222-2222-4222-8222-222222222222'::uuid, unnest(ARRAY['Java','Spring','ラーメン好き','読書家'])),
  ('33333333-3333-4333-8333-333333333333'::uuid, unnest(ARRAY['AWS','Docker','登山','コーヒー'])),
  ('44444444-4444-4444-8444-444444444444'::uuid, unnest(ARRAY['Next.js','Python','猫好き','ヨガ'])),
  ('55555555-5555-4555-8555-555555555555'::uuid, unnest(ARRAY['Flutter','Swift','ゲーム好き','筋トレ'])),
  ('66666666-6666-4666-8666-666666666666'::uuid, unnest(ARRAY['テスト自動化','Selenium','カフェ巡り','写真']))
) AS p(profile_id, tag_name)
JOIN public.tags t ON lower(t.name) = lower(p.tag_name)
ON CONFLICT (profile_id, tag_id) DO NOTHING;

-- usage_count を現状から再計算
UPDATE public.tags t
   SET usage_count = sub.cnt
  FROM (
    SELECT tag_id, count(*)::int AS cnt
      FROM public.profile_tags
     GROUP BY tag_id
  ) sub
 WHERE t.id = sub.tag_id;

-- 3. postings
INSERT INTO public.postings (id, title, category, date, date_undecided, area, is_online, description, creator_id)
VALUES
  (
    'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '新宿でランチ行きませんか？',
    'food',
    DATE '2026-03-25',
    FALSE,
    '新宿',
    FALSE,
    '新宿駅周辺でおすすめのラーメン屋さんを開拓したいです。お昼休みに気軽に参加してください。',
    '22222222-2222-4222-8222-222222222222'
  ),
  (
    'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    'AWS勉強会をゆるく始めたい',
    'study',
    NULL,
    TRUE,
    'オンライン',
    TRUE,
    'AWS 認定や設計の相談をしながら、週 1 回ペースでオンライン勉強会をしたいです。',
    '33333333-3333-4333-8333-333333333333'
  ),
  (
    'aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    '週末ボードゲーム会',
    'event',
    DATE '2026-03-29',
    FALSE,
    '渋谷',
    FALSE,
    '渋谷のボードゲームカフェで軽めのゲームを中心に遊ぶ予定です。初心者歓迎です。',
    '55555555-5555-4555-8555-555555555555'
  ),
  (
    'aaaaaaa4-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
    'React 最新動向シェア会',
    'study',
    DATE '2026-03-27',
    FALSE,
    '品川',
    FALSE,
    'React 19 や周辺エコシステムのアップデートを持ち寄って情報交換したいです。',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    'aaaaaaa5-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
    '横浜で作業カフェ会',
    'food',
    DATE '2026-03-30',
    FALSE,
    '横浜',
    FALSE,
    '1 時間ほど各自作業しつつ、その後に近況共有できるメンバーを募集中です。',
    '66666666-6666-4666-8666-666666666666'
  )
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  date = EXCLUDED.date,
  date_undecided = EXCLUDED.date_undecided,
  area = EXCLUDED.area,
  is_online = EXCLUDED.is_online,
  description = EXCLUDED.description,
  creator_id = EXCLUDED.creator_id,
  updated_at = NOW();

-- 4. posting participants
INSERT INTO public.posting_participants (id, posting_id, user_id, action)
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
SET action = EXCLUDED.action;

-- 5. AI questions
INSERT INTO public.ai_questions (id, question, options, date)
VALUES
  (
    'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1',
    '最近、現場で一番よく使っている技術は何ですか？',
    ARRAY['React / Vue などフロントエンド', 'Java / Python などバックエンド', 'AWS / GCP などクラウド', 'その他'],
    CURRENT_DATE
  ),
  (
    'ccccccc2-cccc-4ccc-8ccc-ccccccccccc2',
    '週末の過ごし方で一番多いのは？',
    ARRAY['家でゆっくり', 'カフェや外出', 'スポーツ・アウトドア', '勉強・スキルアップ'],
    CURRENT_DATE - INTERVAL '1 day'
  ),
  (
    'ccccccc3-cccc-4ccc-8ccc-ccccccccccc3',
    '社内の人ともっと話してみたいテーマは？',
    ARRAY['技術・キャリア相談', '趣味・プライベート', 'おすすめのお店・スポット', '業界ニュース・トレンド'],
    CURRENT_DATE - INTERVAL '2 day'
  ),
  (
    'ccccccc4-cccc-4ccc-8ccc-ccccccccccc4',
    '今期、個人的に一番伸ばしたいスキルは？',
    ARRAY['設計力', '実装スピード', 'クラウド / インフラ', 'ファシリテーション'],
    CURRENT_DATE - INTERVAL '3 day'
  )
ON CONFLICT (id) DO UPDATE
SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  date = EXCLUDED.date;

-- 6. AI question responses
INSERT INTO public.ai_question_responses (id, question_id, user_id, answer)
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
SET answer = EXCLUDED.answer;

COMMIT;