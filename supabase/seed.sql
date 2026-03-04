-- ============================================
-- Collabo Connect シードデータ（拡張版 × 10）
-- schema.sql を実行した後に投入してください
-- ============================================

-- ============================================
-- 1. ai_questions を挿入（30件）
-- ============================================
INSERT INTO public.ai_questions (id, question, options, date) VALUES
  ('00000000-0000-0000-0000-000000000001', '最近、現場で一番よく使っている技術は何ですか？', array['React / Vue などフロントエンド', 'Java / Python などバックエンド', 'AWS / GCP などクラウド', 'その他'], '2026-03-01'),
  ('00000000-0000-0000-0000-000000000002', '週末の過ごし方で一番多いのは？', array['家でゆっくり', 'カフェや外出', 'スポーツ・アウトドア', '勉強・スキルアップ'], '2026-02-28'),
  ('00000000-0000-0000-0000-000000000003', '社内の人ともっと話してみたいテーマは？', array['技術・キャリア相談', '趣味・プライベート', 'おすすめのお店・スポット', '業界ニュース・トレンド'], '2026-02-27'),
  ('00000000-0000-0000-0000-000000000004', '朝型ですか？夜型ですか？', array['完全に朝型', 'どちらかと言えば朝型', 'どちらかと言えば夜型', '完全に夜型'], '2026-02-26'),
  ('00000000-0000-0000-0000-000000000005', 'リモートワークと出社、どちらが好きですか？', array['完全リモート派', 'リモート多め', '出社多め', '完全出社派'], '2026-02-25'),
  ('00000000-0000-0000-0000-000000000006', '好きなプログラミング言語は？', array['TypeScript / JavaScript', 'Python', 'Go / Rust', 'Java / Kotlin'], '2026-02-24'),
  ('00000000-0000-0000-0000-000000000007', 'お昼ご飯はどうしていますか？', array['お弁当派', 'コンビニ派', '外食派', '食べない派'], '2026-02-23'),
  ('00000000-0000-0000-0000-000000000008', '今一番学びたい技術は？', array['AI / 機械学習', 'クラウド / インフラ', 'モバイル開発', 'Web3 / ブロックチェーン'], '2026-02-22'),
  ('00000000-0000-0000-0000-000000000009', '仕事中に聴く音楽は？', array['J-POP / K-POP', '洋楽', 'クラシック / Jazz', '聴かない'], '2026-02-21'),
  ('00000000-0000-0000-0000-000000000010', 'チーム開発で大切にしていることは？', array['コミュニケーション', 'コードレビュー', 'ドキュメント整備', 'テスト自動化'], '2026-02-20'),
  ('00000000-0000-0000-0000-000000000011', '好きなエディタ / IDE は？', array['VS Code', 'IntelliJ / WebStorm', 'Vim / Neovim', 'その他'], '2026-02-19'),
  ('00000000-0000-0000-0000-000000000012', '最近ハマっている趣味は？', array['ゲーム', '読書', '料理', '運動・フィットネス'], '2026-02-18'),
  ('00000000-0000-0000-0000-000000000013', 'コーヒー派？お茶派？', array['コーヒーブラック', 'コーヒー（ミルク・砂糖あり）', '緑茶・紅茶', 'その他の飲み物'], '2026-02-17'),
  ('00000000-0000-0000-0000-000000000014', '技術カンファレンスに参加したことは？', array['登壇経験あり', '参加のみ経験あり', 'オンラインのみ参加', '参加したことがない'], '2026-02-16'),
  ('00000000-0000-0000-0000-000000000015', '開発環境の OS は？', array['macOS', 'Windows', 'Linux', '複数使い分け'], '2026-02-15'),
  ('00000000-0000-0000-0000-000000000016', '一番好きな季節は？', array['春', '夏', '秋', '冬'], '2026-02-14'),
  ('00000000-0000-0000-0000-000000000017', 'ペットを飼っていますか？', array['犬', '猫', 'その他の動物', '飼っていない'], '2026-02-13'),
  ('00000000-0000-0000-0000-000000000018', '技術ブログを書いていますか？', array['定期的に書いている', 'たまに書く', '読む専門', 'あまり読まない'], '2026-02-12'),
  ('00000000-0000-0000-0000-000000000019', '休日のランチはどこで？', array['自炊', 'カフェ', 'ファミレス・チェーン店', '個人経営のお店'], '2026-02-11'),
  ('00000000-0000-0000-0000-000000000020', '海外旅行で行きたい場所は？', array['アジア', 'ヨーロッパ', 'アメリカ', 'オセアニア'], '2026-02-10'),
  ('00000000-0000-0000-0000-000000000021', '副業・個人開発をしていますか？', array['副業している', '個人開発している', '興味はある', 'していない'], '2026-02-09'),
  ('00000000-0000-0000-0000-000000000022', 'オンライン会議のカメラは ON 派？OFF 派？', array['常にON', '基本ON', '基本OFF', '常にOFF'], '2026-02-08'),
  ('00000000-0000-0000-0000-000000000023', '好きな本のジャンルは？', array['技術書', 'ビジネス書', '小説・文学', '漫画'], '2026-02-07'),
  ('00000000-0000-0000-0000-000000000024', '運動はしていますか？', array['毎日している', '週に数回', '月に数回', 'ほとんどしない'], '2026-02-06'),
  ('00000000-0000-0000-0000-000000000025', 'キャリアで大切にしていることは？', array['技術力の向上', 'ワークライフバランス', '年収・待遇', 'チームとの関係'], '2026-02-05'),
  ('00000000-0000-0000-0000-000000000026', '社内イベントで参加したいのは？', array['勉強会・LT会', 'ランチ・飲み会', 'スポーツ大会', 'ハッカソン'], '2026-02-04'),
  ('00000000-0000-0000-0000-000000000027', '最近見た映画・ドラマのジャンルは？', array['アクション・SF', 'コメディ', 'ドキュメンタリー', 'アニメ'], '2026-02-03'),
  ('00000000-0000-0000-0000-000000000028', 'Git のブランチ戦略はどれ派？', array['Git Flow', 'GitHub Flow', 'トランクベース', 'よくわからない'], '2026-02-02'),
  ('00000000-0000-0000-0000-000000000029', '理想のチーム人数は？', array['2〜3人', '4〜6人', '7〜10人', '10人以上'], '2026-02-01'),
  ('00000000-0000-0000-0000-000000000030', '新しい技術のキャッチアップ方法は？', array['公式ドキュメント', 'YouTube / Udemy', 'ハンズオン・写経', 'SNS / ブログ'], '2026-01-31');

-- ============================================
-- 2. テスト用ユーザー・プロフィール・投稿データ一括作成
--    ユーザー 50人 / 投稿 70件 / 参加者・回答データ付き
-- ============================================

DO $$
DECLARE
  -- ユーザー UUID (50人)
  u1  uuid := '11111111-1111-1111-1111-111111111111';
  u2  uuid := '22222222-2222-2222-2222-222222222222';
  u3  uuid := '33333333-3333-3333-3333-333333333333';
  u4  uuid := '44444444-4444-4444-4444-444444444444';
  u5  uuid := '55555555-5555-5555-5555-555555555555';
  u6  uuid := '66666666-6666-6666-6666-666666666666';
  u7  uuid := '77777777-7777-7777-7777-777777777777';
  u8  uuid := '88888888-8888-8888-8888-888888888888';
  u9  uuid := '99999999-9999-9999-9999-999999999999';
  u10 uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  u11 uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  u12 uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  u13 uuid := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  u14 uuid := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  u15 uuid := 'ffffffff-ffff-ffff-ffff-ffffffffffff';
  u16 uuid := 'abcdef01-0000-0000-0000-000000000016';
  u17 uuid := 'abcdef01-0000-0000-0000-000000000017';
  u18 uuid := 'abcdef01-0000-0000-0000-000000000018';
  u19 uuid := 'abcdef01-0000-0000-0000-000000000019';
  u20 uuid := 'abcdef01-0000-0000-0000-000000000020';
  u21 uuid := 'abcdef01-0000-0000-0000-000000000021';
  u22 uuid := 'abcdef01-0000-0000-0000-000000000022';
  u23 uuid := 'abcdef01-0000-0000-0000-000000000023';
  u24 uuid := 'abcdef01-0000-0000-0000-000000000024';
  u25 uuid := 'abcdef01-0000-0000-0000-000000000025';
  u26 uuid := 'abcdef01-0000-0000-0000-000000000026';
  u27 uuid := 'abcdef01-0000-0000-0000-000000000027';
  u28 uuid := 'abcdef01-0000-0000-0000-000000000028';
  u29 uuid := 'abcdef01-0000-0000-0000-000000000029';
  u30 uuid := 'abcdef01-0000-0000-0000-000000000030';
  u31 uuid := 'abcdef01-0000-0000-0000-000000000031';
  u32 uuid := 'abcdef01-0000-0000-0000-000000000032';
  u33 uuid := 'abcdef01-0000-0000-0000-000000000033';
  u34 uuid := 'abcdef01-0000-0000-0000-000000000034';
  u35 uuid := 'abcdef01-0000-0000-0000-000000000035';
  u36 uuid := 'abcdef01-0000-0000-0000-000000000036';
  u37 uuid := 'abcdef01-0000-0000-0000-000000000037';
  u38 uuid := 'abcdef01-0000-0000-0000-000000000038';
  u39 uuid := 'abcdef01-0000-0000-0000-000000000039';
  u40 uuid := 'abcdef01-0000-0000-0000-000000000040';
  u41 uuid := 'abcdef01-0000-0000-0000-000000000041';
  u42 uuid := 'abcdef01-0000-0000-0000-000000000042';
  u43 uuid := 'abcdef01-0000-0000-0000-000000000043';
  u44 uuid := 'abcdef01-0000-0000-0000-000000000044';
  u45 uuid := 'abcdef01-0000-0000-0000-000000000045';
  u46 uuid := 'abcdef01-0000-0000-0000-000000000046';
  u47 uuid := 'abcdef01-0000-0000-0000-000000000047';
  u48 uuid := 'abcdef01-0000-0000-0000-000000000048';
  u49 uuid := 'abcdef01-0000-0000-0000-000000000049';
  u50 uuid := 'abcdef01-0000-0000-0000-000000000050';
BEGIN

  -- ============================================
  -- 2-1) auth.users にテストユーザーを登録 (パスワードはすべて password123)
  -- ============================================
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change_token_new, recovery_token)
  VALUES
    (u1,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'taro@example.com',      crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"田中 太郎"}',     now(), now(), '', '', ''),
    (u2,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'hanako@example.com',    crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"鈴木 花子"}',     now(), now(), '', '', ''),
    (u3,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jiro@example.com',      crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"佐藤 次郎"}',     now(), now(), '', '', ''),
    (u4,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'yuki@example.com',      crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"伊藤 由紀"}',     now(), now(), '', '', ''),
    (u5,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ken@example.com',       crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"渡辺 健"}',       now(), now(), '', '', ''),
    (u6,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'misaki@example.com',    crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"山田 美咲"}',     now(), now(), '', '', ''),
    (u7,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'shota@example.com',     crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"中村 翔太"}',     now(), now(), '', '', ''),
    (u8,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'akari@example.com',     crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"小林 あかり"}',   now(), now(), '', '', ''),
    (u9,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'daisuke@example.com',   crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"加藤 大輔"}',     now(), now(), '', '', ''),
    (u10, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sakura@example.com',    crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"吉田 さくら"}',   now(), now(), '', '', ''),
    (u11, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'hayato@example.com',    crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"山本 隼人"}',     now(), now(), '', '', ''),
    (u12, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mari@example.com',      crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"松本 真理"}',     now(), now(), '', '', ''),
    (u13, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ren@example.com',       crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"井上 蓮"}',       now(), now(), '', '', ''),
    (u14, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ai_k@example.com',      crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"木村 愛"}',       now(), now(), '', '', ''),
    (u15, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'takuya@example.com',    crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"林 拓也"}',       now(), now(), '', '', ''),
    (u16, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'aoi@example.com',       crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"清水 葵"}',       now(), now(), '', '', ''),
    (u17, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'riku@example.com',      crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"森 陸"}',         now(), now(), '', '', ''),
    (u18, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'aya@example.com',       crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"阿部 彩"}',       now(), now(), '', '', ''),
    (u19, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'yuto@example.com',      crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"池田 悠人"}',     now(), now(), '', '', ''),
    (u20, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'yui@example.com',       crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"橋本 結衣"}',     now(), now(), '', '', ''),
    (u21, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sota@example.com',      crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"石川 颯太"}',     now(), now(), '', '', ''),
    (u22, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nanami@example.com',    crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"前田 七海"}',     now(), now(), '', '', ''),
    (u23, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'minato@example.com',    crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"藤田 湊"}',       now(), now(), '', '', ''),
    (u24, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'hina@example.com',      crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"後藤 陽菜"}',     now(), now(), '', '', ''),
    (u25, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rui@example.com',       crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"岡田 琉生"}',     now(), now(), '', '', ''),
    (u26, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rin@example.com',       crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"長谷川 凛"}',     now(), now(), '', '', ''),
    (u27, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'asahi@example.com',     crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"村上 朝陽"}',     now(), now(), '', '', ''),
    (u28, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kaede@example.com',     crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"近藤 楓"}',       now(), now(), '', '', ''),
    (u29, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'itsuki@example.com',    crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"坂本 樹"}',       now(), now(), '', '', ''),
    (u30, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mei@example.com',       crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"遠藤 芽依"}',     now(), now(), '', '', ''),
    (u31, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dan@example.com',       crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"青木 暖"}',       now(), now(), '', '', ''),
    (u32, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'uta@example.com',       crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"藤井 詩"}',       now(), now(), '', '', ''),
    (u33, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'yamato@example.com',    crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"西村 大和"}',     now(), now(), '', '', ''),
    (u34, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'himari@example.com',    crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"福田 ひまり"}',   now(), now(), '', '', ''),
    (u35, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kaito@example.com',     crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"太田 海斗"}',     now(), now(), '', '', ''),
    (u36, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'riko@example.com',      crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"三浦 莉子"}',     now(), now(), '', '', ''),
    (u37, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kanade@example.com',    crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"岩崎 奏"}',       now(), now(), '', '', ''),
    (u38, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'chihiro@example.com',   crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"原田 千尋"}',     now(), now(), '', '', ''),
    (u39, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'yuma@example.com',      crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"中島 悠真"}',     now(), now(), '', '', ''),
    (u40, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sakurako@example.com',  crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"松田 咲良"}',     now(), now(), '', '', ''),
    (u41, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ritsu@example.com',     crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"竹内 律"}',       now(), now(), '', '', ''),
    (u42, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ann@example.com',       crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"金子 杏"}',       now(), now(), '', '', ''),
    (u43, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'haru@example.com',      crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"和田 晴"}',       now(), now(), '', '', ''),
    (u44, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tsumugi@example.com',   crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"高田 紬"}',       now(), now(), '', '', ''),
    (u45, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'soma@example.com',      crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"中川 壮真"}',     now(), now(), '', '', ''),
    (u46, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mio@example.com',       crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"上田 澪"}',       now(), now(), '', '', ''),
    (u47, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'haruto@example.com',    crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"小川 春翔"}',     now(), now(), '', '', ''),
    (u48, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kotone@example.com',    crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"杉本 琴音"}',     now(), now(), '', '', ''),
    (u49, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'hinata@example.com',    crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"平野 陽翔"}',     now(), now(), '', '', ''),
    (u50, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kanon@example.com',     crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"野村 花音"}',     now(), now(), '', '', '')
  ON CONFLICT (id) DO NOTHING;

  -- ============================================
  -- 2-2) auth.identities プロバイダー情報を登録
  -- ============================================
  INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES
    (u1,  u1,  format('{"sub":"%s","email":"%s"}', u1::text,  'taro@example.com')::jsonb,      'email', now(), now(), now()),
    (u2,  u2,  format('{"sub":"%s","email":"%s"}', u2::text,  'hanako@example.com')::jsonb,    'email', now(), now(), now()),
    (u3,  u3,  format('{"sub":"%s","email":"%s"}', u3::text,  'jiro@example.com')::jsonb,      'email', now(), now(), now()),
    (u4,  u4,  format('{"sub":"%s","email":"%s"}', u4::text,  'yuki@example.com')::jsonb,      'email', now(), now(), now()),
    (u5,  u5,  format('{"sub":"%s","email":"%s"}', u5::text,  'ken@example.com')::jsonb,       'email', now(), now(), now()),
    (u6,  u6,  format('{"sub":"%s","email":"%s"}', u6::text,  'misaki@example.com')::jsonb,    'email', now(), now(), now()),
    (u7,  u7,  format('{"sub":"%s","email":"%s"}', u7::text,  'shota@example.com')::jsonb,     'email', now(), now(), now()),
    (u8,  u8,  format('{"sub":"%s","email":"%s"}', u8::text,  'akari@example.com')::jsonb,     'email', now(), now(), now()),
    (u9,  u9,  format('{"sub":"%s","email":"%s"}', u9::text,  'daisuke@example.com')::jsonb,   'email', now(), now(), now()),
    (u10, u10, format('{"sub":"%s","email":"%s"}', u10::text, 'sakura@example.com')::jsonb,    'email', now(), now(), now()),
    (u11, u11, format('{"sub":"%s","email":"%s"}', u11::text, 'hayato@example.com')::jsonb,    'email', now(), now(), now()),
    (u12, u12, format('{"sub":"%s","email":"%s"}', u12::text, 'mari@example.com')::jsonb,      'email', now(), now(), now()),
    (u13, u13, format('{"sub":"%s","email":"%s"}', u13::text, 'ren@example.com')::jsonb,       'email', now(), now(), now()),
    (u14, u14, format('{"sub":"%s","email":"%s"}', u14::text, 'ai_k@example.com')::jsonb,      'email', now(), now(), now()),
    (u15, u15, format('{"sub":"%s","email":"%s"}', u15::text, 'takuya@example.com')::jsonb,    'email', now(), now(), now()),
    (u16, u16, format('{"sub":"%s","email":"%s"}', u16::text, 'aoi@example.com')::jsonb,       'email', now(), now(), now()),
    (u17, u17, format('{"sub":"%s","email":"%s"}', u17::text, 'riku@example.com')::jsonb,      'email', now(), now(), now()),
    (u18, u18, format('{"sub":"%s","email":"%s"}', u18::text, 'aya@example.com')::jsonb,       'email', now(), now(), now()),
    (u19, u19, format('{"sub":"%s","email":"%s"}', u19::text, 'yuto@example.com')::jsonb,      'email', now(), now(), now()),
    (u20, u20, format('{"sub":"%s","email":"%s"}', u20::text, 'yui@example.com')::jsonb,       'email', now(), now(), now()),
    (u21, u21, format('{"sub":"%s","email":"%s"}', u21::text, 'sota@example.com')::jsonb,      'email', now(), now(), now()),
    (u22, u22, format('{"sub":"%s","email":"%s"}', u22::text, 'nanami@example.com')::jsonb,    'email', now(), now(), now()),
    (u23, u23, format('{"sub":"%s","email":"%s"}', u23::text, 'minato@example.com')::jsonb,    'email', now(), now(), now()),
    (u24, u24, format('{"sub":"%s","email":"%s"}', u24::text, 'hina@example.com')::jsonb,      'email', now(), now(), now()),
    (u25, u25, format('{"sub":"%s","email":"%s"}', u25::text, 'rui@example.com')::jsonb,       'email', now(), now(), now()),
    (u26, u26, format('{"sub":"%s","email":"%s"}', u26::text, 'rin@example.com')::jsonb,       'email', now(), now(), now()),
    (u27, u27, format('{"sub":"%s","email":"%s"}', u27::text, 'asahi@example.com')::jsonb,     'email', now(), now(), now()),
    (u28, u28, format('{"sub":"%s","email":"%s"}', u28::text, 'kaede@example.com')::jsonb,     'email', now(), now(), now()),
    (u29, u29, format('{"sub":"%s","email":"%s"}', u29::text, 'itsuki@example.com')::jsonb,    'email', now(), now(), now()),
    (u30, u30, format('{"sub":"%s","email":"%s"}', u30::text, 'mei@example.com')::jsonb,       'email', now(), now(), now()),
    (u31, u31, format('{"sub":"%s","email":"%s"}', u31::text, 'dan@example.com')::jsonb,       'email', now(), now(), now()),
    (u32, u32, format('{"sub":"%s","email":"%s"}', u32::text, 'uta@example.com')::jsonb,       'email', now(), now(), now()),
    (u33, u33, format('{"sub":"%s","email":"%s"}', u33::text, 'yamato@example.com')::jsonb,    'email', now(), now(), now()),
    (u34, u34, format('{"sub":"%s","email":"%s"}', u34::text, 'himari@example.com')::jsonb,    'email', now(), now(), now()),
    (u35, u35, format('{"sub":"%s","email":"%s"}', u35::text, 'kaito@example.com')::jsonb,     'email', now(), now(), now()),
    (u36, u36, format('{"sub":"%s","email":"%s"}', u36::text, 'riko@example.com')::jsonb,      'email', now(), now(), now()),
    (u37, u37, format('{"sub":"%s","email":"%s"}', u37::text, 'kanade@example.com')::jsonb,    'email', now(), now(), now()),
    (u38, u38, format('{"sub":"%s","email":"%s"}', u38::text, 'chihiro@example.com')::jsonb,   'email', now(), now(), now()),
    (u39, u39, format('{"sub":"%s","email":"%s"}', u39::text, 'yuma@example.com')::jsonb,      'email', now(), now(), now()),
    (u40, u40, format('{"sub":"%s","email":"%s"}', u40::text, 'sakurako@example.com')::jsonb,  'email', now(), now(), now()),
    (u41, u41, format('{"sub":"%s","email":"%s"}', u41::text, 'ritsu@example.com')::jsonb,     'email', now(), now(), now()),
    (u42, u42, format('{"sub":"%s","email":"%s"}', u42::text, 'ann@example.com')::jsonb,       'email', now(), now(), now()),
    (u43, u43, format('{"sub":"%s","email":"%s"}', u43::text, 'haru@example.com')::jsonb,      'email', now(), now(), now()),
    (u44, u44, format('{"sub":"%s","email":"%s"}', u44::text, 'tsumugi@example.com')::jsonb,   'email', now(), now(), now()),
    (u45, u45, format('{"sub":"%s","email":"%s"}', u45::text, 'soma@example.com')::jsonb,      'email', now(), now(), now()),
    (u46, u46, format('{"sub":"%s","email":"%s"}', u46::text, 'mio@example.com')::jsonb,       'email', now(), now(), now()),
    (u47, u47, format('{"sub":"%s","email":"%s"}', u47::text, 'haruto@example.com')::jsonb,    'email', now(), now(), now()),
    (u48, u48, format('{"sub":"%s","email":"%s"}', u48::text, 'kotone@example.com')::jsonb,    'email', now(), now(), now()),
    (u49, u49, format('{"sub":"%s","email":"%s"}', u49::text, 'hinata@example.com')::jsonb,    'email', now(), now(), now()),
    (u50, u50, format('{"sub":"%s","email":"%s"}', u50::text, 'kanon@example.com')::jsonb,     'email', now(), now(), now())
  ON CONFLICT (provider, id) DO NOTHING;

  -- ============================================
  -- 2-3) プロフィールデータを更新 (50人分)
  -- ============================================

  -- u1: 田中 太郎
  UPDATE public.profiles SET
    role = 'フロントエンドエンジニア', areas = array['新宿', '東京'], tags = array['#React', '#TypeScript', '#甘党', '#カメラ'],
    ai_intro = '田中さんはReactとTypeScriptを得意とするフロントエンドエンジニアです。週末はよくカメラを持って街歩きをしており、甘いものに目がありません。',
    joined_date = '2024-04-01'
  WHERE id = u1;

  -- u2: 鈴木 花子
  UPDATE public.profiles SET
    role = 'UI/UXデザイナー', areas = array['渋谷', 'リモート'], tags = array['#Figma', '#カフェ巡り', '#旅行'],
    ai_intro = '鈴木さんはユーザー体験を第一に考えるデザイナーです。リモートワークを活用し、色々なカフェで作業するのが好きです。',
    joined_date = '2023-10-01'
  WHERE id = u2;

  -- u3: 佐藤 次郎
  UPDATE public.profiles SET
    role = 'バックエンドエンジニア', areas = array['品川', '神奈川'], tags = array['#Go', '#Python', '#キャンプ'],
    ai_intro = '佐藤さんはデータ処理とバックエンドの最適化を得意としています。休日はよく山へキャンプに出かけてリフレッシュしています。',
    joined_date = '2022-01-01'
  WHERE id = u3;

  -- u4: 伊藤 由紀
  UPDATE public.profiles SET
    role = 'プロジェクトマネージャー', areas = array['丸の内', '東京'], tags = array['#アジャイル', '#スクラム', '#読書'],
    ai_intro = '伊藤さんは複数のプロジェクトを円滑に進めるマネージャーです。読書家で、技術書からビジネス書まで幅広く読んでいます。',
    joined_date = '2020-04-01'
  WHERE id = u4;

  -- u5: 渡辺 健
  UPDATE public.profiles SET
    role = 'インフラエンジニア', areas = array['秋葉原', 'リモート'], tags = array['#AWS', '#Terraform', '#サウナ'],
    ai_intro = '渡辺さんはAWSを中心としたクラウドインフラの構築が得意です。仕事終わりによくサウナに行って整っているそうです。',
    joined_date = '2021-08-01'
  WHERE id = u5;

  -- u6: 山田 美咲
  UPDATE public.profiles SET
    role = 'データサイエンティスト', areas = array['六本木', 'リモート'], tags = array['#Python', '#機械学習', '#ヨガ'],
    ai_intro = '山田さんはPythonを駆使してデータ分析と機械学習モデルの構築を行っています。朝のヨガが日課で、心身のバランスを大切にしています。',
    joined_date = '2023-04-01'
  WHERE id = u6;

  -- u7: 中村 翔太
  UPDATE public.profiles SET
    role = 'モバイルエンジニア', areas = array['渋谷', '横浜'], tags = array['#Flutter', '#Swift', '#ランニング'],
    ai_intro = '中村さんはFlutterとSwiftでモバイルアプリを開発しています。毎朝のランニングが習慣で、フルマラソンの経験もあります。',
    joined_date = '2022-07-01'
  WHERE id = u7;

  -- u8: 小林 あかり
  UPDATE public.profiles SET
    role = 'QAエンジニア', areas = array['新宿', '中野'], tags = array['#テスト自動化', '#Selenium', '#猫'],
    ai_intro = '小林さんはテスト自動化のスペシャリストで、品質向上に情熱を注いでいます。自宅では2匹の猫と暮らしています。',
    joined_date = '2023-01-01'
  WHERE id = u8;

  -- u9: 加藤 大輔
  UPDATE public.profiles SET
    role = 'SRE', areas = array['品川', 'リモート'], tags = array['#Kubernetes', '#Docker', '#登山'],
    ai_intro = '加藤さんはKubernetesとDockerを活用したインフラ運用のエキスパートです。週末は山に登り、自然の中でリフレッシュしています。',
    joined_date = '2021-04-01'
  WHERE id = u9;

  -- u10: 吉田 さくら
  UPDATE public.profiles SET
    role = 'フルスタックエンジニア', areas = array['恵比寿', '東京'], tags = array['#Next.js', '#Node.js', '#カフェ'],
    ai_intro = '吉田さんはNext.jsとNode.jsを使ったフルスタック開発が得意です。お気に入りのカフェでコードを書くのが至福の時間だそうです。',
    joined_date = '2022-10-01'
  WHERE id = u10;

  -- u11: 山本 隼人
  UPDATE public.profiles SET
    role = 'セキュリティエンジニア', areas = array['秋葉原', '千葉'], tags = array['#セキュリティ', '#CTF', '#ゲーム'],
    ai_intro = '山本さんはセキュリティ診断やペネトレーションテストを担当しています。CTF大会にも積極的に参加し、常に最新の脅威動向をチェックしています。',
    joined_date = '2021-11-01'
  WHERE id = u11;

  -- u12: 松本 真理
  UPDATE public.profiles SET
    role = 'プロダクトマネージャー', areas = array['丸の内', '品川'], tags = array['#プロダクト戦略', '#UXリサーチ', '#ワイン'],
    ai_intro = '松本さんはユーザーの声を大切にするプロダクトマネージャーです。週末はワインの勉強をしており、ソムリエ資格も持っています。',
    joined_date = '2020-10-01'
  WHERE id = u12;

  -- u13: 井上 蓮
  UPDATE public.profiles SET
    role = 'MLエンジニア', areas = array['六本木', 'リモート'], tags = array['#TensorFlow', '#PyTorch', '#将棋'],
    ai_intro = '井上さんはディープラーニングモデルの開発と運用を専門としています。将棋が趣味で、AIと将棋の融合にも興味を持っています。',
    joined_date = '2023-06-01'
  WHERE id = u13;

  -- u14: 木村 愛
  UPDATE public.profiles SET
    role = 'テックリード', areas = array['渋谷', '新宿'], tags = array['#アーキテクチャ', '#React', '#料理'],
    ai_intro = '木村さんはチームの技術的な方向性を導くテックリードです。週末は新しいレシピに挑戦するのが趣味で、社内の料理好き仲間と交流しています。',
    joined_date = '2019-04-01'
  WHERE id = u14;

  -- u15: 林 拓也
  UPDATE public.profiles SET
    role = 'DevOpsエンジニア', areas = array['品川', 'リモート'], tags = array['#CI/CD', '#GitHub Actions', '#サッカー'],
    ai_intro = '林さんはCI/CDパイプラインの構築と最適化を専門としています。社内のフットサルチームのキャプテンも務めています。',
    joined_date = '2022-04-01'
  WHERE id = u15;

  -- u16: 清水 葵
  UPDATE public.profiles SET
    role = 'フロントエンドエンジニア', areas = array['恵比寿', '目黒'], tags = array['#Vue.js', '#CSS', '#イラスト'],
    ai_intro = '清水さんはVue.jsとCSSアニメーションを得意とするフロントエンドエンジニアです。趣味のデジタルイラストはSNSでも人気があります。',
    joined_date = '2023-07-01'
  WHERE id = u16;

  -- u17: 森 陸
  UPDATE public.profiles SET
    role = 'バックエンドエンジニア', areas = array['池袋', '埼玉'], tags = array['#Java', '#Spring', '#釣り'],
    ai_intro = '森さんはJavaとSpring Bootでの大規模システム開発の経験が豊富です。休日は海釣りに出かけ、釣った魚で料理を振る舞います。',
    joined_date = '2020-07-01'
  WHERE id = u17;

  -- u18: 阿部 彩
  UPDATE public.profiles SET
    role = 'UIデザイナー', areas = array['表参道', '渋谷'], tags = array['#Figma', '#Adobe', '#写真'],
    ai_intro = '阿部さんは美しいUIデザインを追求するデザイナーです。フィルムカメラでの撮影が趣味で、作品は社内展示会でも好評でした。',
    joined_date = '2022-09-01'
  WHERE id = u18;

  -- u19: 池田 悠人
  UPDATE public.profiles SET
    role = 'データエンジニア', areas = array['新宿', 'リモート'], tags = array['#Spark', '#Airflow', '#映画鑑賞'],
    ai_intro = '池田さんはデータパイプラインの設計・構築を担当しています。映画マニアで、年間100本以上の映画を鑑賞するそうです。',
    joined_date = '2021-10-01'
  WHERE id = u19;

  -- u20: 橋本 結衣
  UPDATE public.profiles SET
    role = 'PMO', areas = array['丸の内', '東京'], tags = array['#プロジェクト管理', '#Notion', '#紅茶'],
    ai_intro = '橋本さんは複数プロジェクトの横断管理を担当するPMOです。紅茶の知識が豊富で、チームメンバーにおすすめの茶葉を紹介しています。',
    joined_date = '2021-04-01'
  WHERE id = u20;

  -- u21: 石川 颯太
  UPDATE public.profiles SET
    role = 'iOSエンジニア', areas = array['渋谷', '川崎'], tags = array['#Swift', '#SwiftUI', '#バスケ'],
    ai_intro = '石川さんはSwiftUIを使ったiOSアプリ開発のスペシャリストです。週末はバスケットボールのリーグ戦に参加しています。',
    joined_date = '2022-04-01'
  WHERE id = u21;

  -- u22: 前田 七海
  UPDATE public.profiles SET
    role = 'Androidエンジニア', areas = array['品川', '横浜'], tags = array['#Kotlin', '#Jetpack Compose', '#ダンス'],
    ai_intro = '前田さんはKotlinとJetpack Composeで洗練されたAndroidアプリを開発しています。ストリートダンスのチームにも所属しています。',
    joined_date = '2023-01-01'
  WHERE id = u22;

  -- u23: 藤田 湊
  UPDATE public.profiles SET
    role = 'クラウドアーキテクト', areas = array['六本木', 'リモート'], tags = array['#AWS', '#GCP', '#ボードゲーム'],
    ai_intro = '藤田さんはマルチクラウド環境の設計を専門とするアーキテクトです。ボードゲームの蒐集が趣味で、200個以上持っているそうです。',
    joined_date = '2020-01-01'
  WHERE id = u23;

  -- u24: 後藤 陽菜
  UPDATE public.profiles SET
    role = 'スクラムマスター', areas = array['池袋', '東京'], tags = array['#アジャイル', '#ファシリテーション', '#パン作り'],
    ai_intro = '後藤さんはチームの自律性を高めるスクラムマスターです。手作りパンを社内に差し入れることもあり、みんなに喜ばれています。',
    joined_date = '2021-07-01'
  WHERE id = u24;

  -- u25: 岡田 琉生
  UPDATE public.profiles SET
    role = 'フロントエンドエンジニア', areas = array['秋葉原', '千葉'], tags = array['#React', '#Three.js', '#音楽'],
    ai_intro = '岡田さんはReactとThree.jsで3Dビジュアライゼーションを実装するのが得意です。バンド活動もしており、ギターを担当しています。',
    joined_date = '2023-04-01'
  WHERE id = u25;

  -- u26: 長谷川 凛
  UPDATE public.profiles SET
    role = 'バックエンドエンジニア', areas = array['新宿', 'リモート'], tags = array['#Rust', '#Go', '#ボルダリング'],
    ai_intro = '長谷川さんはRustとGoでハイパフォーマンスなバックエンドを構築しています。ボルダリングにハマっており、週3回はジムに通っています。',
    joined_date = '2022-06-01'
  WHERE id = u26;

  -- u27: 村上 朝陽
  UPDATE public.profiles SET
    role = 'インフラエンジニア', areas = array['品川', '神奈川'], tags = array['#Azure', '#Ansible', '#サーフィン'],
    ai_intro = '村上さんはAzure環境のインフラ構築・運用を担当しています。湘南でのサーフィンが趣味で、夏は毎週海に通っています。',
    joined_date = '2021-01-01'
  WHERE id = u27;

  -- u28: 近藤 楓
  UPDATE public.profiles SET
    role = 'UXリサーチャー', areas = array['表参道', '渋谷'], tags = array['#ユーザーインタビュー', '#Figma', '#ハイキング'],
    ai_intro = '近藤さんはユーザーインタビューとユーザビリティテストを通じてプロダクト改善に貢献しています。週末はよくハイキングに出かけます。',
    joined_date = '2022-11-01'
  WHERE id = u28;

  -- u29: 坂本 樹
  UPDATE public.profiles SET
    role = 'テストエンジニア', areas = array['恵比寿', '東京'], tags = array['#Jest', '#Playwright', '#漫画'],
    ai_intro = '坂本さんはJestとPlaywrightでの自動テスト戦略の策定が得意です。漫画好きで、自宅の本棚には2000冊以上の漫画があります。',
    joined_date = '2023-02-01'
  WHERE id = u29;

  -- u30: 遠藤 芽依
  UPDATE public.profiles SET
    role = 'フルスタックエンジニア', areas = array['中野', '新宿'], tags = array['#TypeScript', '#Prisma', '#お菓子作り'],
    ai_intro = '遠藤さんはTypeScriptとPrismaを使ったフルスタック開発が得意です。お菓子作りが趣味で、チームの誕生日にはケーキを焼いてくれます。',
    joined_date = '2022-08-01'
  WHERE id = u30;

  -- u31: 青木 暖
  UPDATE public.profiles SET
    role = 'プロジェクトマネージャー', areas = array['丸の内', '品川'], tags = array['#ウォーターフォール', '#PMP', '#ゴルフ'],
    ai_intro = '青木さんはPMP資格を持つベテランのプロジェクトマネージャーです。接待ゴルフが趣味になり、今ではスコア80台で回るほどの腕前です。',
    joined_date = '2018-04-01'
  WHERE id = u31;

  -- u32: 藤井 詩
  UPDATE public.profiles SET
    role = 'データアナリスト', areas = array['六本木', 'リモート'], tags = array['#SQL', '#Tableau', '#ピアノ'],
    ai_intro = '藤井さんはSQLとTableauを駆使してビジネスインサイトを導き出すデータアナリストです。幼少期から続けているピアノは今でも週末の楽しみです。',
    joined_date = '2023-03-01'
  WHERE id = u32;

  -- u33: 西村 大和
  UPDATE public.profiles SET
    role = 'SRE', areas = array['秋葉原', 'リモート'], tags = array['#Prometheus', '#Grafana', '#キャンプ'],
    ai_intro = '西村さんはPrometheusとGrafanaを活用した監視基盤の構築を担当しています。キャンプ好きで、ソロキャンプの動画も配信しています。',
    joined_date = '2021-06-01'
  WHERE id = u33;

  -- u34: 福田 ひまり
  UPDATE public.profiles SET
    role = 'テックリード', areas = array['渋谷', '恵比寿'], tags = array['#Scala', '#Akka', '#ヨガ'],
    ai_intro = '福田さんはScalaとAkkaを使った分散システムの設計を得意とするテックリードです。朝ヨガで心をリセットしてから仕事に臨んでいます。',
    joined_date = '2019-10-01'
  WHERE id = u34;

  -- u35: 太田 海斗
  UPDATE public.profiles SET
    role = 'セキュリティエンジニア', areas = array['新宿', 'リモート'], tags = array['#ペネトレーションテスト', '#OSCP', '#筋トレ'],
    ai_intro = '太田さんはOSCP資格を持つセキュリティエンジニアで、脆弱性診断のエキスパートです。毎日のジム通いで体力作りも欠かしません。',
    joined_date = '2022-01-01'
  WHERE id = u35;

  -- u36: 三浦 莉子
  UPDATE public.profiles SET
    role = 'モバイルエンジニア', areas = array['品川', '横浜'], tags = array['#React Native', '#Expo', '#カフェ'],
    ai_intro = '三浦さんはReact NativeとExpoでクロスプラットフォームアプリを開発しています。横浜のカフェ巡りが趣味で、おすすめリストを作成中です。',
    joined_date = '2023-05-01'
  WHERE id = u36;

  -- u37: 岩崎 奏
  UPDATE public.profiles SET
    role = 'フロントエンドエンジニア', areas = array['池袋', '埼玉'], tags = array['#Svelte', '#Tailwind', '#ギター'],
    ai_intro = '岩崎さんはSvelteとTailwind CSSで軽量なWebアプリを構築しています。アコースティックギターの弾き語りが得意で、社内ライブも経験あります。',
    joined_date = '2023-08-01'
  WHERE id = u37;

  -- u38: 原田 千尋
  UPDATE public.profiles SET
    role = 'バックエンドエンジニア', areas = array['六本木', '東京'], tags = array['#Ruby', '#Rails', '#温泉'],
    ai_intro = '原田さんはRuby on Railsでの開発経験が豊富なバックエンドエンジニアです。温泉ソムリエの資格を持ち、全国の名湯を巡っています。',
    joined_date = '2020-04-01'
  WHERE id = u38;

  -- u39: 中島 悠真
  UPDATE public.profiles SET
    role = 'DevOpsエンジニア', areas = array['渋谷', 'リモート'], tags = array['#ArgoCD', '#Terraform', '#スノーボード'],
    ai_intro = '中島さんはArgoCDとTerraformでGitOps環境を構築しています。冬はスノーボード、夏はサーフィンとアクティブに過ごしています。',
    joined_date = '2022-03-01'
  WHERE id = u39;

  -- u40: 松田 咲良
  UPDATE public.profiles SET
    role = 'プロダクトデザイナー', areas = array['表参道', '目黒'], tags = array['#Sketch', '#プロトタイピング', '#フラワーアレンジメント'],
    ai_intro = '松田さんはプロトタイピングを活用したデザインプロセスを得意としています。フラワーアレンジメントが趣味で、オフィスにも花を飾っています。',
    joined_date = '2021-09-01'
  WHERE id = u40;

  -- u41: 竹内 律
  UPDATE public.profiles SET
    role = 'MLエンジニア', areas = array['秋葉原', 'リモート'], tags = array['#NLP', '#Transformers', '#チェス'],
    ai_intro = '竹内さんは自然言語処理とTransformerモデルの研究開発を行っています。チェスの腕前はオンラインレーティング2000を超えます。',
    joined_date = '2023-01-01'
  WHERE id = u41;

  -- u42: 金子 杏
  UPDATE public.profiles SET
    role = 'QAエンジニア', areas = array['新宿', '中野'], tags = array['#Cypress', '#品質管理', '#ランニング'],
    ai_intro = '金子さんはCypressでのE2Eテスト自動化と品質管理プロセスの改善を担当しています。朝のランニングが日課で、ハーフマラソンにも挑戦中です。',
    joined_date = '2022-05-01'
  WHERE id = u42;

  -- u43: 和田 晴
  UPDATE public.profiles SET
    role = 'クラウドエンジニア', areas = array['品川', 'リモート'], tags = array['#GCP', '#Cloud Run', '#ドライブ'],
    ai_intro = '和田さんはGCPのCloud RunやBigQueryを活用したクラウドネイティブ開発が得意です。休日は愛車でドライブに出かけるのが楽しみです。',
    joined_date = '2021-12-01'
  WHERE id = u43;

  -- u44: 高田 紬
  UPDATE public.profiles SET
    role = 'スクラムマスター', areas = array['丸の内', '東京'], tags = array['#SAFe', '#チームビルディング', '#茶道'],
    ai_intro = '高田さんはSAFeフレームワークでの大規模アジャイル開発をリードしています。茶道を嗜んでおり、その所作の丁寧さはファシリテーションにも活きています。',
    joined_date = '2020-07-01'
  WHERE id = u44;

  -- u45: 中川 壮真
  UPDATE public.profiles SET
    role = 'バックエンドエンジニア', areas = array['恵比寿', '渋谷'], tags = array['#PHP', '#Laravel', '#フットサル'],
    ai_intro = '中川さんはPHPとLaravelでの開発を長年続けているベテランエンジニアです。社内フットサルチームの中心メンバーとして活躍しています。',
    joined_date = '2019-01-01'
  WHERE id = u45;

  -- u46: 上田 澪
  UPDATE public.profiles SET
    role = 'フロントエンドエンジニア', areas = array['池袋', 'リモート'], tags = array['#Angular', '#RxJS', '#映画'],
    ai_intro = '上田さんはAngularとRxJSでリアクティブなWebアプリを開発しています。映画好きで、ミニシアター系の作品を好んで観ています。',
    joined_date = '2022-02-01'
  WHERE id = u46;

  -- u47: 小川 春翔
  UPDATE public.profiles SET
    role = 'データサイエンティスト', areas = array['六本木', '千葉'], tags = array['#R', '#統計', '#テニス'],
    ai_intro = '小川さんはR言語と統計手法を用いたデータ分析のスペシャリストです。テニスが趣味で、社内テニスサークルの代表を務めています。',
    joined_date = '2021-05-01'
  WHERE id = u47;

  -- u48: 杉本 琴音
  UPDATE public.profiles SET
    role = 'UIデザイナー', areas = array['渋谷', '恵比寿'], tags = array['#Adobe XD', '#モーションデザイン', '#書道'],
    ai_intro = '杉本さんはAdobe XDでのUIデザインとモーションデザインを専門としています。書道歴15年で、社内年賀状のデザインも手掛けています。',
    joined_date = '2023-09-01'
  WHERE id = u48;

  -- u49: 平野 陽翔
  UPDATE public.profiles SET
    role = 'インフラエンジニア', areas = array['秋葉原', 'リモート'], tags = array['#Linux', '#Nginx', '#バイク'],
    ai_intro = '平野さんはLinuxサーバーの運用とチューニングを得意とするインフラエンジニアです。大型バイクでのツーリングが休日の楽しみです。',
    joined_date = '2020-11-01'
  WHERE id = u49;

  -- u50: 野村 花音
  UPDATE public.profiles SET
    role = 'フルスタックエンジニア', areas = array['新宿', '東京'], tags = array['#Remix', '#Deno', '#水泳'],
    ai_intro = '野村さんはRemixとDenoを使った最新のWeb開発に挑戦しているフルスタックエンジニアです。元水泳部で、今でも週2回プールに通っています。',
    joined_date = '2024-01-01'
  WHERE id = u50;

  -- ============================================
  -- 2-4) 募集（Postings）データ (70件)
  -- ============================================
  INSERT INTO public.postings (id, title, category, date, date_undecided, area, is_online, description, creator_id) VALUES
    -- food (23件)
    ('f0000000-0000-0000-0000-000000000001', '新宿でランチ行きませんか？🍜', 'food', '2026-03-05', false, '新宿', false, '新宿駅周辺でおすすめのラーメン屋さんを開拓したいです！気軽に参加してください。', u1),
    ('f0000000-0000-0000-0000-000000000002', '美味しいコーヒーを飲む会☕', 'food', '2026-03-20', false, '表参道', false, '美味しいコーヒーを飲みながら、デザインについて語りましょう！', u2),
    ('f0000000-0000-0000-0000-000000000003', '恵比寿でイタリアン🍕', 'food', '2026-03-12', false, '恵比寿', false, '恵比寿で見つけた隠れ家イタリアンに一緒に行きませんか？ピザが絶品です！', u10),
    ('f0000000-0000-0000-0000-000000000004', '六本木ランチ探索隊🍛', 'food', '2026-03-07', false, '六本木', false, '六本木のカレー激戦区を巡りましょう！スパイスカレー好き集まれ！', u6),
    ('f0000000-0000-0000-0000-000000000005', '品川で焼肉ランチ🥩', 'food', '2026-03-14', false, '品川', false, '品川駅近くの焼肉ランチが格安で美味しいお店を発見しました。一緒にどうですか？', u3),
    ('f0000000-0000-0000-0000-000000000006', '秋葉原でつけ麺巡り🍜', 'food', '2026-03-19', false, '秋葉原', false, '秋葉原周辺のつけ麺屋さんを制覇しましょう！今回は3軒目です。', u11),
    ('f0000000-0000-0000-0000-000000000007', '渋谷でタイ料理🌶️', 'food', '2026-03-21', false, '渋谷', false, '本格タイ料理のお店を見つけました！辛いもの好き集合！', u7),
    ('f0000000-0000-0000-0000-000000000008', 'お弁当交換会🍱', 'food', '2026-03-25', false, '丸の内', false, '手作りお弁当を持ち寄って交換しませんか？料理上手な方もそうでない方も大歓迎！', u14),
    ('f0000000-0000-0000-0000-000000000009', '横浜中華街で食べ歩き🥟', 'food', '2026-03-29', false, '横浜', false, '横浜中華街で小籠包から杏仁豆腐まで食べ尽くしましょう！', u22),
    ('f0000000-0000-0000-0000-000000000010', 'スイーツ巡りの会🍰', 'food', '2026-04-02', false, '銀座', false, '銀座の有名パティスリーを3軒はしごします！甘党集まれ！', u1),
    ('f0000000-0000-0000-0000-000000000011', '池袋でラーメン制覇🍜', 'food', '2026-04-05', false, '池袋', false, '池袋駅周辺のラーメン屋全制覇プロジェクト。今回は味噌ラーメン特集です！', u17),
    ('f0000000-0000-0000-0000-000000000012', '朝カフェモーニング☀️', 'food', '2026-03-08', false, '目黒', false, '目黒のおしゃれカフェで朝食を一緒にどうですか？出勤前の素敵な朝を！', u16),
    ('f0000000-0000-0000-0000-000000000013', 'ワイン会🍷', 'food', '2026-04-11', false, '恵比寿', false, 'ワイン初心者歓迎！ソムリエ資格持ちのメンバーが選ぶワインを楽しみましょう。', u12),
    ('f0000000-0000-0000-0000-000000000014', '吉祥寺カフェランチ🥪', 'food', '2026-03-15', false, '吉祥寺', false, '吉祥寺のおしゃれカフェでゆったりランチしませんか？テラス席があるお店です。', u36),
    ('f0000000-0000-0000-0000-000000000015', 'お寿司ランチ🍣', 'food', '2026-03-22', false, '銀座', false, '銀座でリーズナブルな本格寿司ランチを見つけました！ネタが新鮮で最高です。', u20),
    ('f0000000-0000-0000-0000-000000000016', 'クラフトビール飲み比べ🍺', 'food', '2026-04-08', false, '中野', false, '中野のクラフトビール専門店で色々な種類を飲み比べましょう！', u30),
    ('f0000000-0000-0000-0000-000000000017', '紅茶アフタヌーンティー🫖', 'food', '2026-04-15', false, '丸の内', false, '丸の内のホテルでアフタヌーンティーを楽しみませんか？紅茶の選び方もお伝えします。', u20),
    ('f0000000-0000-0000-0000-000000000018', '手作りパン持ち寄り会🍞', 'food', '2026-04-12', false, '池袋', false, '自慢の手作りパンを持ち寄って試食会をしましょう！レシピ交換も歓迎です。', u24),
    ('f0000000-0000-0000-0000-000000000019', '韓国料理ランチ🌶️', 'food', '2026-03-26', false, '新大久保', false, '新大久保で本場の韓国料理を食べましょう！サムギョプサルがおすすめです。', u8),
    ('f0000000-0000-0000-0000-000000000020', 'うどん食べ比べ🍜', 'food', null, true, '東京', false, '都内の讃岐うどん名店巡り。日程はメンバーが集まってから調整しましょう！', u38),
    ('f0000000-0000-0000-0000-000000000021', 'スパイスカレー作り🍛', 'food', '2026-04-19', false, '中野', false, 'スパイスからカレーを手作りするイベントです！材料費は割り勘で。', u26),
    ('f0000000-0000-0000-0000-000000000022', '早朝フィッシュマーケット朝ごはん🐟', 'food', '2026-04-06', false, '豊洲', false, '豊洲市場の場外で新鮮な海鮮朝ごはんを食べに行きましょう！早起き必須です。', u17),
    ('f0000000-0000-0000-0000-000000000023', 'ベトナム料理ディナー🍜', 'food', '2026-03-28', false, '渋谷', false, '渋谷のベトナム料理店でフォーやバインミーを楽しみましょう！', u18),

    -- study (24件)
    ('f0000000-0000-0000-0000-000000000024', 'React最新動向シェア会⚛️', 'study', '2026-03-10', false, '品川', false, 'React 19の新機能について情報交換しませんか？オンライン参加も可能です。', u1),
    ('f0000000-0000-0000-0000-000000000025', 'プロジェクト管理の悩み相談会', 'study', null, true, 'オンライン', true, 'アジャイル開発での悩みや意見を共有しましょう！気軽な雑談ベースで考えています。', u4),
    ('f0000000-0000-0000-0000-000000000026', 'AWSインフラ構築ハンズオン', 'study', '2026-03-15', false, '秋葉原', false, 'Terraformを使ってAWS環境を構築するハンズオンをやります。初心者歓迎！', u5),
    ('f0000000-0000-0000-0000-000000000027', 'Python機械学習入門📊', 'study', '2026-03-17', false, '六本木', false, 'scikit-learnを使った機械学習の基礎をハンズオン形式で学びましょう。PC持参で！', u6),
    ('f0000000-0000-0000-0000-000000000028', 'Flutter勉強会📱', 'study', '2026-03-24', false, '渋谷', false, 'Flutterでのモバイルアプリ開発をみんなで学びます。実際にアプリを作りながら進めます。', u7),
    ('f0000000-0000-0000-0000-000000000029', 'Kubernetes入門講座🐳', 'study', '2026-03-31', false, '品川', false, 'Kubernetesの基礎から実践まで。minikubeを使ったハンズオン形式です。', u9),
    ('f0000000-0000-0000-0000-000000000030', 'セキュリティ勉強会🔐', 'study', '2026-04-07', false, '秋葉原', false, 'Webアプリケーションのセキュリティ対策について実践的に学びましょう。OWASP Top 10を解説します。', u11),
    ('f0000000-0000-0000-0000-000000000031', 'TypeScript もくもく会💻', 'study', '2026-03-09', false, 'オンライン', true, 'TypeScriptの型パズルをみんなで解きましょう！初心者から上級者まで楽しめます。', u30),
    ('f0000000-0000-0000-0000-000000000032', 'デザインシステム構築LT会🎨', 'study', '2026-04-14', false, '渋谷', false, '各社のデザインシステム事例をLT形式で共有しましょう。登壇者も募集中！', u18),
    ('f0000000-0000-0000-0000-000000000033', 'データ分析もくもく会📈', 'study', '2026-03-16', false, 'オンライン', true, 'Kaggleのコンペに一緒に取り組みませんか？データ分析のスキルアップを目指しましょう。', u47),
    ('f0000000-0000-0000-0000-000000000034', 'GraphQL ハンズオン', 'study', '2026-04-21', false, '新宿', false, 'GraphQLの基礎からApollo Clientの使い方まで。RESTとの違いも解説します。', u14),
    ('f0000000-0000-0000-0000-000000000035', 'CI/CD パイプライン構築講座', 'study', '2026-03-23', false, 'オンライン', true, 'GitHub Actionsを使ったCI/CDパイプラインをゼロから構築する講座です。', u15),
    ('f0000000-0000-0000-0000-000000000036', 'Rust入門勉強会🦀', 'study', '2026-04-03', false, '新宿', false, 'Rustの所有権システムからWebアプリ開発まで。一緒にRustを始めましょう！', u26),
    ('f0000000-0000-0000-0000-000000000037', 'LLM活用アイデアソン🤖', 'study', null, true, 'オンライン', true, 'ChatGPT APIやClaude APIを使った業務改善アイデアをみんなで考えましょう！', u13),
    ('f0000000-0000-0000-0000-000000000038', 'テスト戦略ディスカッション🧪', 'study', '2026-04-09', false, '品川', false, 'ユニットテスト、E2Eテスト、統合テストの使い分けについてディスカッションしましょう。', u29),
    ('f0000000-0000-0000-0000-000000000039', 'Figma プラグイン開発ハンズオン', 'study', '2026-04-16', false, '渋谷', false, 'Figmaプラグインの開発方法を実践形式で学びます。TypeScriptの基礎知識があればOK！', u40),
    ('f0000000-0000-0000-0000-000000000040', 'GCP Cloud Run もくもく会☁️', 'study', '2026-03-30', false, 'オンライン', true, 'Cloud Runにアプリをデプロイしてみる会です。GCPアカウントの準備をお願いします。', u43),
    ('f0000000-0000-0000-0000-000000000041', 'NLP最新論文読み会📄', 'study', '2026-04-13', false, '秋葉原', false, '最新のNLP論文を読んでディスカッションする会です。今回はAttention系の論文を扱います。', u41),
    ('f0000000-0000-0000-0000-000000000042', 'SwiftUI 勉強会', 'study', '2026-04-17', false, '渋谷', false, 'SwiftUIの最新機能とパフォーマンス最適化について学びましょう。iOS開発者向けです。', u21),
    ('f0000000-0000-0000-0000-000000000043', 'アジャイルコーチング読書会📚', 'study', '2026-03-13', false, 'オンライン', true, '「アジャイルコーチング」の輪読会です。毎週1章ずつ進めていきます。', u44),
    ('f0000000-0000-0000-0000-000000000044', 'Deno & Fresh ハンズオン🦕', 'study', '2026-04-20', false, '新宿', false, 'DenoとFreshフレームワークでWebアプリを作ってみましょう！Node.js経験者向けです。', u50),
    ('f0000000-0000-0000-0000-000000000045', 'SQL チューニング道場⚡', 'study', '2026-04-06', false, '品川', false, '遅いSQLクエリをどこまで高速化できるか挑戦しましょう。実践的なチューニングテクニックを共有します。', u32),
    ('f0000000-0000-0000-0000-000000000046', 'SvelteKit でブログを作ろう', 'study', '2026-04-23', false, 'オンライン', true, 'SvelteKitを使ってブログサイトをゼロから作るもくもく会です。', u37),
    ('f0000000-0000-0000-0000-000000000047', 'Laravel API 設計レビュー会', 'study', '2026-03-27', false, '恵比寿', false, 'LaravelでのRESTful API設計をレビューし合いましょう。コード持ち込み歓迎です。', u45),

    -- event (23件)
    ('f0000000-0000-0000-0000-000000000048', '週末ボードゲーム会🎲', 'event', '2026-03-08', false, '渋谷', false, '渋谷のボードゲームカフェで遊びましょう！初心者大歓迎です。', u2),
    ('f0000000-0000-0000-0000-000000000049', '週末キャンプ⛺', 'event', '2026-04-10', false, '奥多摩', false, '春の奥多摩でキャンプ仲間を募集しています！車出せます🚗', u3),
    ('f0000000-0000-0000-0000-000000000050', 'フットサル大会⚽', 'event', '2026-03-22', false, '品川', false, '社内フットサル大会を開催します！チーム分けは当日行いますので、お気軽に。', u15),
    ('f0000000-0000-0000-0000-000000000051', 'ボルダリング体験🧗', 'event', '2026-03-29', false, '新宿', false, '新宿のボルダリングジムで一緒に登りませんか？レンタルシューズあり、初心者OK！', u26),
    ('f0000000-0000-0000-0000-000000000052', 'お花見ピクニック🌸', 'event', '2026-03-28', false, '上野', false, '上野公園でお花見しましょう！各自食べ物・飲み物持参で。レジャーシートは用意します。', u24),
    ('f0000000-0000-0000-0000-000000000053', '写真撮影散歩📸', 'event', '2026-04-05', false, '浅草', false, '浅草周辺をカメラ片手にお散歩しましょう。スマホ撮影でもOKです！', u18),
    ('f0000000-0000-0000-0000-000000000054', 'バスケットボール🏀', 'event', '2026-04-12', false, '川崎', false, '体育館を借りてバスケをします！経験不問、楽しく運動しましょう。', u21),
    ('f0000000-0000-0000-0000-000000000055', 'テニス初心者会🎾', 'event', '2026-03-15', false, '品川', false, 'テニスコートを予約しました！初心者中心なので気軽に参加してください。ラケット貸出あり。', u47),
    ('f0000000-0000-0000-0000-000000000056', 'オンラインゲーム大会🎮', 'event', '2026-03-14', false, 'オンライン', true, 'オンラインでゲーム大会を開催！今回はApex Legendsです。初心者チームもあります。', u11),
    ('f0000000-0000-0000-0000-000000000057', 'ハイキング in 高尾山🥾', 'event', '2026-04-19', false, '八王子', false, '高尾山ハイキングに行きましょう！初心者コースなので体力に自信がなくても大丈夫です。', u28),
    ('f0000000-0000-0000-0000-000000000058', 'ヨガ体験会🧘', 'event', '2026-03-16', false, '六本木', false, 'ヨガ初心者向けの体験会です。マットはレンタルできます。動きやすい服装で来てください。', u6),
    ('f0000000-0000-0000-0000-000000000059', '謎解きイベント🔍', 'event', '2026-04-26', false, '池袋', false, '池袋の謎解き施設でチーム戦！頭脳派もアクション派も楽しめます。', u25),
    ('f0000000-0000-0000-0000-000000000060', 'サウナ部活動♨️', 'event', '2026-03-18', false, '秋葉原', false, '仕事終わりにサウナで整いましょう！おすすめのサウナ施設に行きます。', u5),
    ('f0000000-0000-0000-0000-000000000061', '映画鑑賞会🎬', 'event', '2026-04-04', false, '新宿', false, '新宿の映画館で話題の新作を一緒に観ましょう！鑑賞後にカフェで感想会もします。', u19),
    ('f0000000-0000-0000-0000-000000000062', 'ランニング部🏃', 'event', '2026-03-09', false, '皇居', false, '皇居ランを一緒にしませんか？5kmコースでゆっくりペースです。着替え場所も確保済み。', u42),
    ('f0000000-0000-0000-0000-000000000063', 'カラオケ大会🎤', 'event', null, true, '渋谷', false, '渋谷でカラオケ大会！ジャンル不問、歌が好きな人集まりましょう。', u37),
    ('f0000000-0000-0000-0000-000000000064', 'ゴルフコンペ⛳', 'event', '2026-04-26', false, '千葉', false, '千葉のゴルフ場でコンペを開催します。初心者から上級者までハンデ戦で楽しめます。', u31),
    ('f0000000-0000-0000-0000-000000000065', 'ボードゲームカフェ新規開拓🎲', 'event', '2026-04-18', false, '秋葉原', false, '秋葉原に新しくオープンしたボードゲームカフェに行ってみましょう！', u23),
    ('f0000000-0000-0000-0000-000000000066', '温泉日帰り旅行♨️', 'event', '2026-04-27', false, '箱根', false, '箱根の日帰り温泉ツアーです！ランチ付きプランで予約します。', u38),
    ('f0000000-0000-0000-0000-000000000067', 'バイクツーリング🏍️', 'event', '2026-04-20', false, '湘南', false, '湘南方面へバイクツーリングに行きましょう！バイク持ちの方、一緒に走りませんか？', u49),
    ('f0000000-0000-0000-0000-000000000068', 'スノーボード旅行🏂', 'event', '2026-03-21', false, '越後湯沢', false, '越後湯沢でスノーボード！日帰りでも宿泊でもOK。レンタルもあります。', u39),
    ('f0000000-0000-0000-0000-000000000069', '水泳練習会🏊', 'event', '2026-04-13', false, '品川', false, '品川区民プールで一緒に泳ぎませんか？泳法指導もできますよ。', u50),
    ('f0000000-0000-0000-0000-000000000070', 'フリーマーケット出店🛍️', 'event', '2026-04-29', false, '代々木公園', false, '代々木公園のフリマに出店します！不用品の出品や一緒に買い物を楽しみましょう。', u40)
  ON CONFLICT DO NOTHING;

  -- ============================================
  -- 2-5) 投稿への参加者データ (posting_participants)
  -- ============================================
  INSERT INTO public.posting_participants (posting_id, user_id, action) VALUES
    -- 新宿ランチ (u1作成)
    ('f0000000-0000-0000-0000-000000000001', u2, 'join'),
    ('f0000000-0000-0000-0000-000000000001', u8, 'join'),
    ('f0000000-0000-0000-0000-000000000001', u14, 'interested'),
    ('f0000000-0000-0000-0000-000000000001', u30, 'join'),
    -- コーヒー会 (u2作成)
    ('f0000000-0000-0000-0000-000000000002', u16, 'join'),
    ('f0000000-0000-0000-0000-000000000002', u18, 'join'),
    ('f0000000-0000-0000-0000-000000000002', u28, 'interested'),
    ('f0000000-0000-0000-0000-000000000002', u40, 'join'),
    ('f0000000-0000-0000-0000-000000000002', u48, 'interested'),
    -- 恵比寿イタリアン (u10作成)
    ('f0000000-0000-0000-0000-000000000003', u1, 'join'),
    ('f0000000-0000-0000-0000-000000000003', u16, 'join'),
    ('f0000000-0000-0000-0000-000000000003', u29, 'interested'),
    -- 六本木カレー (u6作成)
    ('f0000000-0000-0000-0000-000000000004', u13, 'join'),
    ('f0000000-0000-0000-0000-000000000004', u32, 'join'),
    ('f0000000-0000-0000-0000-000000000004', u47, 'interested'),
    -- 品川焼肉 (u3作成)
    ('f0000000-0000-0000-0000-000000000005', u9, 'join'),
    ('f0000000-0000-0000-0000-000000000005', u15, 'join'),
    ('f0000000-0000-0000-0000-000000000005', u27, 'join'),
    ('f0000000-0000-0000-0000-000000000005', u45, 'interested'),
    -- React勉強会 (u1作成)
    ('f0000000-0000-0000-0000-000000000024', u14, 'join'),
    ('f0000000-0000-0000-0000-000000000024', u16, 'join'),
    ('f0000000-0000-0000-0000-000000000024', u25, 'join'),
    ('f0000000-0000-0000-0000-000000000024', u30, 'join'),
    ('f0000000-0000-0000-0000-000000000024', u37, 'interested'),
    ('f0000000-0000-0000-0000-000000000024', u46, 'online'),
    ('f0000000-0000-0000-0000-000000000024', u50, 'online'),
    -- PM悩み相談 (u4作成)
    ('f0000000-0000-0000-0000-000000000025', u12, 'join'),
    ('f0000000-0000-0000-0000-000000000025', u20, 'join'),
    ('f0000000-0000-0000-0000-000000000025', u24, 'join'),
    ('f0000000-0000-0000-0000-000000000025', u31, 'join'),
    ('f0000000-0000-0000-0000-000000000025', u44, 'join'),
    -- AWSハンズオン (u5作成)
    ('f0000000-0000-0000-0000-000000000026', u9, 'join'),
    ('f0000000-0000-0000-0000-000000000026', u23, 'join'),
    ('f0000000-0000-0000-0000-000000000026', u27, 'join'),
    ('f0000000-0000-0000-0000-000000000026', u33, 'join'),
    ('f0000000-0000-0000-0000-000000000026', u43, 'interested'),
    ('f0000000-0000-0000-0000-000000000026', u49, 'join'),
    -- Python ML (u6作成)
    ('f0000000-0000-0000-0000-000000000027', u13, 'join'),
    ('f0000000-0000-0000-0000-000000000027', u19, 'join'),
    ('f0000000-0000-0000-0000-000000000027', u32, 'interested'),
    ('f0000000-0000-0000-0000-000000000027', u41, 'join'),
    ('f0000000-0000-0000-0000-000000000027', u47, 'join'),
    -- Flutter勉強会 (u7作成)
    ('f0000000-0000-0000-0000-000000000028', u21, 'join'),
    ('f0000000-0000-0000-0000-000000000028', u22, 'join'),
    ('f0000000-0000-0000-0000-000000000028', u36, 'join'),
    -- Kubernetes (u9作成)
    ('f0000000-0000-0000-0000-000000000029', u5, 'join'),
    ('f0000000-0000-0000-0000-000000000029', u15, 'join'),
    ('f0000000-0000-0000-0000-000000000029', u33, 'join'),
    ('f0000000-0000-0000-0000-000000000029', u39, 'join'),
    ('f0000000-0000-0000-0000-000000000029', u43, 'interested'),
    -- ボードゲーム会 (u2作成)
    ('f0000000-0000-0000-0000-000000000048', u1, 'join'),
    ('f0000000-0000-0000-0000-000000000048', u10, 'join'),
    ('f0000000-0000-0000-0000-000000000048', u23, 'join'),
    ('f0000000-0000-0000-0000-000000000048', u25, 'join'),
    ('f0000000-0000-0000-0000-000000000048', u30, 'interested'),
    ('f0000000-0000-0000-0000-000000000048', u37, 'join'),
    -- キャンプ (u3作成)
    ('f0000000-0000-0000-0000-000000000049', u9, 'join'),
    ('f0000000-0000-0000-0000-000000000049', u27, 'join'),
    ('f0000000-0000-0000-0000-000000000049', u33, 'join'),
    ('f0000000-0000-0000-0000-000000000049', u28, 'interested'),
    -- フットサル (u15作成)
    ('f0000000-0000-0000-0000-000000000050', u7, 'join'),
    ('f0000000-0000-0000-0000-000000000050', u21, 'join'),
    ('f0000000-0000-0000-0000-000000000050', u35, 'join'),
    ('f0000000-0000-0000-0000-000000000050', u42, 'join'),
    ('f0000000-0000-0000-0000-000000000050', u45, 'join'),
    -- ボルダリング (u26作成)
    ('f0000000-0000-0000-0000-000000000051', u3, 'join'),
    ('f0000000-0000-0000-0000-000000000051', u9, 'interested'),
    ('f0000000-0000-0000-0000-000000000051', u35, 'join'),
    -- お花見 (u24作成)
    ('f0000000-0000-0000-0000-000000000052', u1, 'join'),
    ('f0000000-0000-0000-0000-000000000052', u2, 'join'),
    ('f0000000-0000-0000-0000-000000000052', u6, 'join'),
    ('f0000000-0000-0000-0000-000000000052', u10, 'join'),
    ('f0000000-0000-0000-0000-000000000052', u14, 'join'),
    ('f0000000-0000-0000-0000-000000000052', u18, 'join'),
    ('f0000000-0000-0000-0000-000000000052', u20, 'interested'),
    ('f0000000-0000-0000-0000-000000000052', u28, 'join'),
    ('f0000000-0000-0000-0000-000000000052', u30, 'join'),
    ('f0000000-0000-0000-0000-000000000052', u40, 'join'),
    -- サウナ (u5作成)
    ('f0000000-0000-0000-0000-000000000060', u3, 'join'),
    ('f0000000-0000-0000-0000-000000000060', u11, 'join'),
    ('f0000000-0000-0000-0000-000000000060', u33, 'join'),
    ('f0000000-0000-0000-0000-000000000060', u35, 'interested'),
    ('f0000000-0000-0000-0000-000000000060', u49, 'join'),
    -- 映画鑑賞会 (u19作成)
    ('f0000000-0000-0000-0000-000000000061', u8, 'join'),
    ('f0000000-0000-0000-0000-000000000061', u18, 'join'),
    ('f0000000-0000-0000-0000-000000000061', u29, 'join'),
    ('f0000000-0000-0000-0000-000000000061', u46, 'join'),
    -- ランニング部 (u42作成)
    ('f0000000-0000-0000-0000-000000000062', u7, 'join'),
    ('f0000000-0000-0000-0000-000000000062', u35, 'join'),
    ('f0000000-0000-0000-0000-000000000062', u50, 'interested'),
    -- スノーボード (u39作成)
    ('f0000000-0000-0000-0000-000000000068', u9, 'join'),
    ('f0000000-0000-0000-0000-000000000068', u25, 'join'),
    ('f0000000-0000-0000-0000-000000000068', u27, 'interested'),
    ('f0000000-0000-0000-0000-000000000068', u37, 'join'),
    -- 温泉旅行 (u38作成)
    ('f0000000-0000-0000-0000-000000000066', u3, 'join'),
    ('f0000000-0000-0000-0000-000000000066', u17, 'join'),
    ('f0000000-0000-0000-0000-000000000066', u24, 'join'),
    ('f0000000-0000-0000-0000-000000000066', u33, 'interested'),
    ('f0000000-0000-0000-0000-000000000066', u45, 'join'),
    ('f0000000-0000-0000-0000-000000000066', u49, 'join'),
    -- セキュリティ勉強会 (u11作成)
    ('f0000000-0000-0000-0000-000000000030', u5, 'join'),
    ('f0000000-0000-0000-0000-000000000030', u35, 'join'),
    ('f0000000-0000-0000-0000-000000000030', u14, 'interested'),
    ('f0000000-0000-0000-0000-000000000030', u26, 'join'),
    -- TypeScript もくもく会 (u30作成)
    ('f0000000-0000-0000-0000-000000000031', u1, 'join'),
    ('f0000000-0000-0000-0000-000000000031', u10, 'join'),
    ('f0000000-0000-0000-0000-000000000031', u16, 'join'),
    ('f0000000-0000-0000-0000-000000000031', u25, 'join'),
    ('f0000000-0000-0000-0000-000000000031', u46, 'join'),
    ('f0000000-0000-0000-0000-000000000031', u50, 'join'),
    -- LLM活用 (u13作成)
    ('f0000000-0000-0000-0000-000000000037', u6, 'join'),
    ('f0000000-0000-0000-0000-000000000037', u14, 'join'),
    ('f0000000-0000-0000-0000-000000000037', u19, 'join'),
    ('f0000000-0000-0000-0000-000000000037', u32, 'join'),
    ('f0000000-0000-0000-0000-000000000037', u41, 'join'),
    ('f0000000-0000-0000-0000-000000000037', u47, 'interested'),
    -- SQLチューニング (u32作成)
    ('f0000000-0000-0000-0000-000000000045', u17, 'join'),
    ('f0000000-0000-0000-0000-000000000045', u19, 'join'),
    ('f0000000-0000-0000-0000-000000000045', u38, 'join'),
    ('f0000000-0000-0000-0000-000000000045', u45, 'interested')
  ON CONFLICT DO NOTHING;

  -- ============================================
  -- 2-6) AI質問への回答データ (ai_question_responses)
  -- ============================================
  INSERT INTO public.ai_question_responses (question_id, user_id, answer) VALUES
    -- Q1: 最近よく使っている技術
    ('00000000-0000-0000-0000-000000000001', u1, 'React / Vue などフロントエンド'),
    ('00000000-0000-0000-0000-000000000001', u2, 'その他'),
    ('00000000-0000-0000-0000-000000000001', u3, 'Java / Python などバックエンド'),
    ('00000000-0000-0000-0000-000000000001', u4, 'その他'),
    ('00000000-0000-0000-0000-000000000001', u5, 'AWS / GCP などクラウド'),
    ('00000000-0000-0000-0000-000000000001', u6, 'Java / Python などバックエンド'),
    ('00000000-0000-0000-0000-000000000001', u7, 'React / Vue などフロントエンド'),
    ('00000000-0000-0000-0000-000000000001', u9, 'AWS / GCP などクラウド'),
    ('00000000-0000-0000-0000-000000000001', u10, 'React / Vue などフロントエンド'),
    ('00000000-0000-0000-0000-000000000001', u14, 'React / Vue などフロントエンド'),
    ('00000000-0000-0000-0000-000000000001', u16, 'React / Vue などフロントエンド'),
    ('00000000-0000-0000-0000-000000000001', u17, 'Java / Python などバックエンド'),
    ('00000000-0000-0000-0000-000000000001', u23, 'AWS / GCP などクラウド'),
    ('00000000-0000-0000-0000-000000000001', u25, 'React / Vue などフロントエンド'),
    ('00000000-0000-0000-0000-000000000001', u26, 'Java / Python などバックエンド'),
    ('00000000-0000-0000-0000-000000000001', u30, 'React / Vue などフロントエンド'),
    ('00000000-0000-0000-0000-000000000001', u33, 'AWS / GCP などクラウド'),
    ('00000000-0000-0000-0000-000000000001', u37, 'React / Vue などフロントエンド'),
    ('00000000-0000-0000-0000-000000000001', u41, 'Java / Python などバックエンド'),
    ('00000000-0000-0000-0000-000000000001', u45, 'Java / Python などバックエンド'),
    ('00000000-0000-0000-0000-000000000001', u46, 'React / Vue などフロントエンド'),
    ('00000000-0000-0000-0000-000000000001', u49, 'AWS / GCP などクラウド'),
    ('00000000-0000-0000-0000-000000000001', u50, 'React / Vue などフロントエンド'),
    -- Q2: 週末の過ごし方
    ('00000000-0000-0000-0000-000000000002', u1, 'カフェや外出'),
    ('00000000-0000-0000-0000-000000000002', u2, 'カフェや外出'),
    ('00000000-0000-0000-0000-000000000002', u3, 'スポーツ・アウトドア'),
    ('00000000-0000-0000-0000-000000000002', u4, '勉強・スキルアップ'),
    ('00000000-0000-0000-0000-000000000002', u5, '家でゆっくり'),
    ('00000000-0000-0000-0000-000000000002', u6, 'スポーツ・アウトドア'),
    ('00000000-0000-0000-0000-000000000002', u7, 'スポーツ・アウトドア'),
    ('00000000-0000-0000-0000-000000000002', u8, '家でゆっくり'),
    ('00000000-0000-0000-0000-000000000002', u10, 'カフェや外出'),
    ('00000000-0000-0000-0000-000000000002', u11, '家でゆっくり'),
    ('00000000-0000-0000-0000-000000000002', u12, 'カフェや外出'),
    ('00000000-0000-0000-0000-000000000002', u15, 'スポーツ・アウトドア'),
    ('00000000-0000-0000-0000-000000000002', u18, 'カフェや外出'),
    ('00000000-0000-0000-0000-000000000002', u19, '家でゆっくり'),
    ('00000000-0000-0000-0000-000000000002', u21, 'スポーツ・アウトドア'),
    ('00000000-0000-0000-0000-000000000002', u24, '家でゆっくり'),
    ('00000000-0000-0000-0000-000000000002', u26, 'スポーツ・アウトドア'),
    ('00000000-0000-0000-0000-000000000002', u28, 'スポーツ・アウトドア'),
    ('00000000-0000-0000-0000-000000000002', u30, '家でゆっくり'),
    ('00000000-0000-0000-0000-000000000002', u33, 'スポーツ・アウトドア'),
    ('00000000-0000-0000-0000-000000000002', u35, 'スポーツ・アウトドア'),
    ('00000000-0000-0000-0000-000000000002', u38, 'カフェや外出'),
    ('00000000-0000-0000-0000-000000000002', u40, 'カフェや外出'),
    ('00000000-0000-0000-0000-000000000002', u42, 'スポーツ・アウトドア'),
    ('00000000-0000-0000-0000-000000000002', u44, '勉強・スキルアップ'),
    ('00000000-0000-0000-0000-000000000002', u47, 'スポーツ・アウトドア'),
    ('00000000-0000-0000-0000-000000000002', u50, 'スポーツ・アウトドア'),
    -- Q3: 話したいテーマ
    ('00000000-0000-0000-0000-000000000003', u1, '技術・キャリア相談'),
    ('00000000-0000-0000-0000-000000000003', u2, '趣味・プライベート'),
    ('00000000-0000-0000-0000-000000000003', u3, 'おすすめのお店・スポット'),
    ('00000000-0000-0000-0000-000000000003', u5, '技術・キャリア相談'),
    ('00000000-0000-0000-0000-000000000003', u6, '業界ニュース・トレンド'),
    ('00000000-0000-0000-0000-000000000003', u8, '技術・キャリア相談'),
    ('00000000-0000-0000-0000-000000000003', u9, '技術・キャリア相談'),
    ('00000000-0000-0000-0000-000000000003', u11, '業界ニュース・トレンド'),
    ('00000000-0000-0000-0000-000000000003', u13, '業界ニュース・トレンド'),
    ('00000000-0000-0000-0000-000000000003', u14, '技術・キャリア相談'),
    ('00000000-0000-0000-0000-000000000003', u16, '趣味・プライベート'),
    ('00000000-0000-0000-0000-000000000003', u20, 'おすすめのお店・スポット'),
    ('00000000-0000-0000-0000-000000000003', u22, '趣味・プライベート'),
    ('00000000-0000-0000-0000-000000000003', u25, '技術・キャリア相談'),
    ('00000000-0000-0000-0000-000000000003', u27, '技術・キャリア相談'),
    ('00000000-0000-0000-0000-000000000003', u29, '趣味・プライベート'),
    ('00000000-0000-0000-0000-000000000003', u31, '業界ニュース・トレンド'),
    ('00000000-0000-0000-0000-000000000003', u34, '技術・キャリア相談'),
    ('00000000-0000-0000-0000-000000000003', u36, 'おすすめのお店・スポット'),
    ('00000000-0000-0000-0000-000000000003', u39, '技術・キャリア相談'),
    ('00000000-0000-0000-0000-000000000003', u41, '業界ニュース・トレンド'),
    ('00000000-0000-0000-0000-000000000003', u43, '技術・キャリア相談'),
    ('00000000-0000-0000-0000-000000000003', u48, '趣味・プライベート'),
    -- Q4: 朝型 / 夜型
    ('00000000-0000-0000-0000-000000000004', u1, 'どちらかと言えば夜型'),
    ('00000000-0000-0000-0000-000000000004', u3, '完全に朝型'),
    ('00000000-0000-0000-0000-000000000004', u5, 'どちらかと言えば夜型'),
    ('00000000-0000-0000-0000-000000000004', u6, '完全に朝型'),
    ('00000000-0000-0000-0000-000000000004', u7, 'どちらかと言えば朝型'),
    ('00000000-0000-0000-0000-000000000004', u9, 'どちらかと言えば夜型'),
    ('00000000-0000-0000-0000-000000000004', u10, 'どちらかと言えば朝型'),
    ('00000000-0000-0000-0000-000000000004', u11, '完全に夜型'),
    ('00000000-0000-0000-0000-000000000004', u13, '完全に夜型'),
    ('00000000-0000-0000-0000-000000000004', u15, 'どちらかと言えば朝型'),
    ('00000000-0000-0000-0000-000000000004', u17, '完全に朝型'),
    ('00000000-0000-0000-0000-000000000004', u19, 'どちらかと言えば夜型'),
    ('00000000-0000-0000-0000-000000000004', u21, 'どちらかと言えば朝型'),
    ('00000000-0000-0000-0000-000000000004', u24, '完全に朝型'),
    ('00000000-0000-0000-0000-000000000004', u26, 'どちらかと言えば夜型'),
    ('00000000-0000-0000-0000-000000000004', u28, 'どちらかと言えば朝型'),
    ('00000000-0000-0000-0000-000000000004', u30, 'どちらかと言えば夜型'),
    ('00000000-0000-0000-0000-000000000004', u34, '完全に朝型'),
    ('00000000-0000-0000-0000-000000000004', u35, 'どちらかと言えば朝型'),
    ('00000000-0000-0000-0000-000000000004', u38, 'どちらかと言えば夜型'),
    ('00000000-0000-0000-0000-000000000004', u42, '完全に朝型'),
    ('00000000-0000-0000-0000-000000000004', u44, 'どちらかと言えば朝型'),
    ('00000000-0000-0000-0000-000000000004', u47, 'どちらかと言えば朝型'),
    ('00000000-0000-0000-0000-000000000004', u49, '完全に夜型'),
    ('00000000-0000-0000-0000-000000000004', u50, 'どちらかと言えば夜型'),
    -- Q5: リモート vs 出社
    ('00000000-0000-0000-0000-000000000005', u1, '出社多め'),
    ('00000000-0000-0000-0000-000000000005', u2, '完全リモート派'),
    ('00000000-0000-0000-0000-000000000005', u4, '出社多め'),
    ('00000000-0000-0000-0000-000000000005', u5, 'リモート多め'),
    ('00000000-0000-0000-0000-000000000005', u6, 'リモート多め'),
    ('00000000-0000-0000-0000-000000000005', u8, '出社多め'),
    ('00000000-0000-0000-0000-000000000005', u10, '出社多め'),
    ('00000000-0000-0000-0000-000000000005', u12, '出社多め'),
    ('00000000-0000-0000-0000-000000000005', u13, '完全リモート派'),
    ('00000000-0000-0000-0000-000000000005', u15, 'リモート多め'),
    ('00000000-0000-0000-0000-000000000005', u16, '出社多め'),
    ('00000000-0000-0000-0000-000000000005', u19, 'リモート多め'),
    ('00000000-0000-0000-0000-000000000005', u20, '出社多め'),
    ('00000000-0000-0000-0000-000000000005', u23, '完全リモート派'),
    ('00000000-0000-0000-0000-000000000005', u26, 'リモート多め'),
    ('00000000-0000-0000-0000-000000000005', u29, '出社多め'),
    ('00000000-0000-0000-0000-000000000005', u31, '完全出社派'),
    ('00000000-0000-0000-0000-000000000005', u33, 'リモート多め'),
    ('00000000-0000-0000-0000-000000000005', u36, '出社多め'),
    ('00000000-0000-0000-0000-000000000005', u39, '完全リモート派'),
    ('00000000-0000-0000-0000-000000000005', u41, 'リモート多め'),
    ('00000000-0000-0000-0000-000000000005', u43, 'リモート多め'),
    ('00000000-0000-0000-0000-000000000005', u46, '完全リモート派'),
    ('00000000-0000-0000-0000-000000000005', u48, '出社多め'),
    -- Q6: 好きなプログラミング言語
    ('00000000-0000-0000-0000-000000000006', u1, 'TypeScript / JavaScript'),
    ('00000000-0000-0000-0000-000000000006', u3, 'Go / Rust'),
    ('00000000-0000-0000-0000-000000000006', u6, 'Python'),
    ('00000000-0000-0000-0000-000000000006', u7, 'TypeScript / JavaScript'),
    ('00000000-0000-0000-0000-000000000006', u9, 'Go / Rust'),
    ('00000000-0000-0000-0000-000000000006', u10, 'TypeScript / JavaScript'),
    ('00000000-0000-0000-0000-000000000006', u13, 'Python'),
    ('00000000-0000-0000-0000-000000000006', u14, 'TypeScript / JavaScript'),
    ('00000000-0000-0000-0000-000000000006', u17, 'Java / Kotlin'),
    ('00000000-0000-0000-0000-000000000006', u21, 'TypeScript / JavaScript'),
    ('00000000-0000-0000-0000-000000000006', u22, 'Java / Kotlin'),
    ('00000000-0000-0000-0000-000000000006', u25, 'TypeScript / JavaScript'),
    ('00000000-0000-0000-0000-000000000006', u26, 'Go / Rust'),
    ('00000000-0000-0000-0000-000000000006', u30, 'TypeScript / JavaScript'),
    ('00000000-0000-0000-0000-000000000006', u34, 'Java / Kotlin'),
    ('00000000-0000-0000-0000-000000000006', u37, 'TypeScript / JavaScript'),
    ('00000000-0000-0000-0000-000000000006', u38, 'Go / Rust'),
    ('00000000-0000-0000-0000-000000000006', u41, 'Python'),
    ('00000000-0000-0000-0000-000000000006', u45, 'TypeScript / JavaScript'),
    ('00000000-0000-0000-0000-000000000006', u46, 'TypeScript / JavaScript'),
    ('00000000-0000-0000-0000-000000000006', u47, 'Python'),
    ('00000000-0000-0000-0000-000000000006', u50, 'TypeScript / JavaScript'),
    -- Q7: お昼ご飯
    ('00000000-0000-0000-0000-000000000007', u1, '外食派'),
    ('00000000-0000-0000-0000-000000000007', u2, 'コンビニ派'),
    ('00000000-0000-0000-0000-000000000007', u4, '外食派'),
    ('00000000-0000-0000-0000-000000000007', u8, 'お弁当派'),
    ('00000000-0000-0000-0000-000000000007', u12, '外食派'),
    ('00000000-0000-0000-0000-000000000007', u14, 'お弁当派'),
    ('00000000-0000-0000-0000-000000000007', u16, 'コンビニ派'),
    ('00000000-0000-0000-0000-000000000007', u20, '外食派'),
    ('00000000-0000-0000-0000-000000000007', u24, 'お弁当派'),
    ('00000000-0000-0000-0000-000000000007', u28, 'コンビニ派'),
    ('00000000-0000-0000-0000-000000000007', u30, 'お弁当派'),
    ('00000000-0000-0000-0000-000000000007', u32, '外食派'),
    ('00000000-0000-0000-0000-000000000007', u36, 'コンビニ派'),
    ('00000000-0000-0000-0000-000000000007', u40, '外食派'),
    ('00000000-0000-0000-0000-000000000007', u44, 'お弁当派'),
    ('00000000-0000-0000-0000-000000000007', u48, 'コンビニ派'),
    -- Q8: 学びたい技術
    ('00000000-0000-0000-0000-000000000008', u1, 'AI / 機械学習'),
    ('00000000-0000-0000-0000-000000000008', u2, 'AI / 機械学習'),
    ('00000000-0000-0000-0000-000000000008', u3, 'クラウド / インフラ'),
    ('00000000-0000-0000-0000-000000000008', u5, 'AI / 機械学習'),
    ('00000000-0000-0000-0000-000000000008', u7, 'AI / 機械学習'),
    ('00000000-0000-0000-0000-000000000008', u10, 'AI / 機械学習'),
    ('00000000-0000-0000-0000-000000000008', u11, 'Web3 / ブロックチェーン'),
    ('00000000-0000-0000-0000-000000000008', u14, 'AI / 機械学習'),
    ('00000000-0000-0000-0000-000000000008', u16, 'モバイル開発'),
    ('00000000-0000-0000-0000-000000000008', u17, 'クラウド / インフラ'),
    ('00000000-0000-0000-0000-000000000008', u19, 'AI / 機械学習'),
    ('00000000-0000-0000-0000-000000000008', u22, 'AI / 機械学習'),
    ('00000000-0000-0000-0000-000000000008', u25, 'Web3 / ブロックチェーン'),
    ('00000000-0000-0000-0000-000000000008', u27, 'クラウド / インフラ'),
    ('00000000-0000-0000-0000-000000000008', u29, 'AI / 機械学習'),
    ('00000000-0000-0000-0000-000000000008', u31, 'AI / 機械学習'),
    ('00000000-0000-0000-0000-000000000008', u34, 'クラウド / インフラ'),
    ('00000000-0000-0000-0000-000000000008', u37, 'モバイル開発'),
    ('00000000-0000-0000-0000-000000000008', u39, 'AI / 機械学習'),
    ('00000000-0000-0000-0000-000000000008', u43, 'AI / 機械学習'),
    ('00000000-0000-0000-0000-000000000008', u46, 'モバイル開発'),
    ('00000000-0000-0000-0000-000000000008', u49, 'クラウド / インフラ'),
    -- Q9: 仕事中の音楽
    ('00000000-0000-0000-0000-000000000009', u1, 'J-POP / K-POP'),
    ('00000000-0000-0000-0000-000000000009', u2, '洋楽'),
    ('00000000-0000-0000-0000-000000000009', u4, '聴かない'),
    ('00000000-0000-0000-0000-000000000009', u6, 'クラシック / Jazz'),
    ('00000000-0000-0000-0000-000000000009', u8, 'J-POP / K-POP'),
    ('00000000-0000-0000-0000-000000000009', u10, '洋楽'),
    ('00000000-0000-0000-0000-000000000009', u12, 'クラシック / Jazz'),
    ('00000000-0000-0000-0000-000000000009', u15, '聴かない'),
    ('00000000-0000-0000-0000-000000000009', u18, '洋楽'),
    ('00000000-0000-0000-0000-000000000009', u20, 'クラシック / Jazz'),
    ('00000000-0000-0000-0000-000000000009', u22, 'J-POP / K-POP'),
    ('00000000-0000-0000-0000-000000000009', u25, '洋楽'),
    ('00000000-0000-0000-0000-000000000009', u29, 'J-POP / K-POP'),
    ('00000000-0000-0000-0000-000000000009', u32, 'クラシック / Jazz'),
    ('00000000-0000-0000-0000-000000000009', u35, '聴かない'),
    ('00000000-0000-0000-0000-000000000009', u37, '洋楽'),
    ('00000000-0000-0000-0000-000000000009', u40, 'クラシック / Jazz'),
    ('00000000-0000-0000-0000-000000000009', u44, '聴かない'),
    ('00000000-0000-0000-0000-000000000009', u48, 'J-POP / K-POP'),
    ('00000000-0000-0000-0000-000000000009', u50, '洋楽'),
    -- Q10: チーム開発で大切にしていること
    ('00000000-0000-0000-0000-000000000010', u1, 'コードレビュー'),
    ('00000000-0000-0000-0000-000000000010', u3, 'テスト自動化'),
    ('00000000-0000-0000-0000-000000000010', u4, 'コミュニケーション'),
    ('00000000-0000-0000-0000-000000000010', u5, 'テスト自動化'),
    ('00000000-0000-0000-0000-000000000010', u7, 'コードレビュー'),
    ('00000000-0000-0000-0000-000000000010', u8, 'テスト自動化'),
    ('00000000-0000-0000-0000-000000000010', u9, 'テスト自動化'),
    ('00000000-0000-0000-0000-000000000010', u12, 'コミュニケーション'),
    ('00000000-0000-0000-0000-000000000010', u14, 'コードレビュー'),
    ('00000000-0000-0000-0000-000000000010', u15, 'テスト自動化'),
    ('00000000-0000-0000-0000-000000000010', u18, 'コミュニケーション'),
    ('00000000-0000-0000-0000-000000000010', u20, 'ドキュメント整備'),
    ('00000000-0000-0000-0000-000000000010', u24, 'コミュニケーション'),
    ('00000000-0000-0000-0000-000000000010', u26, 'コードレビュー'),
    ('00000000-0000-0000-0000-000000000010', u29, 'テスト自動化'),
    ('00000000-0000-0000-0000-000000000010', u31, 'ドキュメント整備'),
    ('00000000-0000-0000-0000-000000000010', u33, 'テスト自動化'),
    ('00000000-0000-0000-0000-000000000010', u34, 'コードレビュー'),
    ('00000000-0000-0000-0000-000000000010', u39, 'テスト自動化'),
    ('00000000-0000-0000-0000-000000000010', u42, 'テスト自動化'),
    ('00000000-0000-0000-0000-000000000010', u44, 'コミュニケーション'),
    ('00000000-0000-0000-0000-000000000010', u50, 'コードレビュー')
  ON CONFLICT DO NOTHING;

END $$;
