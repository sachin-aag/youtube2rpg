-- Seed fake users and leaderboard data for featured games

-- Insert fake users (will skip if username already exists)
INSERT INTO public.users (id, username) VALUES
  ('00000000-0000-0000-0000-000000000001', 'NeuroscienceNerd'),
  ('00000000-0000-0000-0000-000000000002', 'BrainHacker'),
  ('00000000-0000-0000-0000-000000000003', 'SleepOptimizer'),
  ('00000000-0000-0000-0000-000000000004', 'DopamineKing'),
  ('00000000-0000-0000-0000-000000000005', 'ColdPlungeQueen'),
  ('00000000-0000-0000-0000-000000000006', 'SunlightChaser'),
  ('00000000-0000-0000-0000-000000000007', 'ProtocolMaster'),
  ('00000000-0000-0000-0000-000000000008', 'FocusFreak'),
  ('00000000-0000-0000-0000-000000000009', 'HabitBuilder'),
  ('00000000-0000-0000-0000-000000000010', 'MindsetGuru'),
  ('00000000-0000-0000-0000-000000000011', 'WealthWizard'),
  ('00000000-0000-0000-0000-000000000012', 'CompoundKing'),
  ('00000000-0000-0000-0000-000000000013', 'PatientInvestor'),
  ('00000000-0000-0000-0000-000000000014', 'LongTermLarry'),
  ('00000000-0000-0000-0000-000000000015', 'SaverSally'),
  ('00000000-0000-0000-0000-000000000016', 'CursorPro'),
  ('00000000-0000-0000-0000-000000000017', 'AICodeNinja'),
  ('00000000-0000-0000-0000-000000000018', 'VimToCursor'),
  ('00000000-0000-0000-0000-000000000019', 'TabComplete'),
  ('00000000-0000-0000-0000-000000000020', 'AgentMaster')
ON CONFLICT (username) DO NOTHING;

-- Seed leaderboard entries for Huberman Lab (game_id = '1')
INSERT INTO public.leaderboard_entries (user_id, game_id, score, current_level, total_npcs_defeated, is_completed, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001', '1', 100, 17, 64, true, NOW() - INTERVAL '2 hours'),
  ('00000000-0000-0000-0000-000000000002', '1', 100, 17, 64, true, NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000003', '1', 94, 16, 60, false, NOW() - INTERVAL '3 hours'),
  ('00000000-0000-0000-0000-000000000004', '1', 88, 15, 56, false, NOW() - INTERVAL '5 hours'),
  ('00000000-0000-0000-0000-000000000005', '1', 75, 13, 48, false, NOW() - INTERVAL '12 hours'),
  ('00000000-0000-0000-0000-000000000006', '1', 63, 11, 40, false, NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000007', '1', 50, 9, 32, false, NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000008', '1', 38, 7, 24, false, NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0000-000000000009', '1', 25, 5, 16, false, NOW() - INTERVAL '4 days'),
  ('00000000-0000-0000-0000-000000000010', '1', 13, 3, 8, false, NOW() - INTERVAL '5 days')
ON CONFLICT (user_id, game_id) DO UPDATE SET
  score = EXCLUDED.score,
  current_level = EXCLUDED.current_level,
  total_npcs_defeated = EXCLUDED.total_npcs_defeated,
  is_completed = EXCLUDED.is_completed,
  updated_at = EXCLUDED.updated_at;

-- Seed leaderboard entries for Psychology of Money (game_id = '2')
INSERT INTO public.leaderboard_entries (user_id, game_id, score, current_level, total_npcs_defeated, is_completed, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000011', '2', 100, 6, 22, true, NOW() - INTERVAL '1 hour'),
  ('00000000-0000-0000-0000-000000000012', '2', 100, 6, 22, true, NOW() - INTERVAL '6 hours'),
  ('00000000-0000-0000-0000-000000000013', '2', 91, 6, 20, false, NOW() - INTERVAL '2 hours'),
  ('00000000-0000-0000-0000-000000000014', '2', 73, 5, 16, false, NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000015', '2', 55, 4, 12, false, NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000001', '2', 45, 3, 10, false, NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0000-000000000002', '2', 36, 3, 8, false, NOW() - INTERVAL '4 days'),
  ('00000000-0000-0000-0000-000000000003', '2', 27, 2, 6, false, NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0000-000000000004', '2', 18, 2, 4, false, NOW() - INTERVAL '6 days'),
  ('00000000-0000-0000-0000-000000000005', '2', 9, 1, 2, false, NOW() - INTERVAL '7 days')
ON CONFLICT (user_id, game_id) DO UPDATE SET
  score = EXCLUDED.score,
  current_level = EXCLUDED.current_level,
  total_npcs_defeated = EXCLUDED.total_npcs_defeated,
  is_completed = EXCLUDED.is_completed,
  updated_at = EXCLUDED.updated_at;

-- Seed leaderboard entries for Learning Cursor (game_id = '3')
INSERT INTO public.leaderboard_entries (user_id, game_id, score, current_level, total_npcs_defeated, is_completed, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000016', '3', 100, 7, 26, true, NOW() - INTERVAL '30 minutes'),
  ('00000000-0000-0000-0000-000000000017', '3', 100, 7, 26, true, NOW() - INTERVAL '4 hours'),
  ('00000000-0000-0000-0000-000000000018', '3', 96, 7, 25, false, NOW() - INTERVAL '1 hour'),
  ('00000000-0000-0000-0000-000000000019', '3', 85, 6, 22, false, NOW() - INTERVAL '2 hours'),
  ('00000000-0000-0000-0000-000000000020', '3', 77, 6, 20, false, NOW() - INTERVAL '5 hours'),
  ('00000000-0000-0000-0000-000000000001', '3', 65, 5, 17, false, NOW() - INTERVAL '8 hours'),
  ('00000000-0000-0000-0000-000000000002', '3', 54, 4, 14, false, NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000003', '3', 42, 4, 11, false, NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000004', '3', 31, 3, 8, false, NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0000-000000000005', '3', 19, 2, 5, false, NOW() - INTERVAL '4 days'),
  ('00000000-0000-0000-0000-000000000006', '3', 12, 1, 3, false, NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0000-000000000007', '3', 8, 1, 2, false, NOW() - INTERVAL '6 days')
ON CONFLICT (user_id, game_id) DO UPDATE SET
  score = EXCLUDED.score,
  current_level = EXCLUDED.current_level,
  total_npcs_defeated = EXCLUDED.total_npcs_defeated,
  is_completed = EXCLUDED.is_completed,
  updated_at = EXCLUDED.updated_at;
