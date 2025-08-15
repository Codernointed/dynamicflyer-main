-- Add your subscription manually (run this AFTER fix_subscriptions_manual.sql)
-- Replace 'YOUR_EMAIL_HERE' with your actual email address

-- Step 1: Find your user ID
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'botchweypaul01@gmail.com';

-- Step 2: Update your profile with the paid subscription tier
-- Replace 'YOUR_USER_ID_HERE' with the ID from Step 1
UPDATE profiles 
SET 
  subscription_tier = 'creator_pro',  -- or whatever plan you paid for
  templates_limit = 100,              -- creator_pro limits
  monthly_exports_limit = 2000,       -- creator_pro limits
  updated_at = NOW()
WHERE id = 'YOUR_USER_ID_HERE';  -- Replace with actual user ID from Step 1

-- Step 3: Create your subscription record
-- Replace 'YOUR_USER_ID_HERE' with the ID from Step 1
INSERT INTO subscriptions (
  user_id,
  plan_type,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end
) VALUES (
  'YOUR_USER_ID_HERE',  -- Replace with actual user ID from Step 1
  'creator_pro',        -- or whatever plan you paid for
  'active',
  NOW(),
  NOW() + INTERVAL '1 month',
  false
);

-- Step 4: Verify everything worked
SELECT 
  p.email,
  p.subscription_tier,
  p.templates_limit,
  p.monthly_exports_limit,
  s.plan_type,
  s.status,
  s.current_period_end
FROM profiles p
LEFT JOIN subscriptions s ON p.id = s.user_id
WHERE p.email = 'botchweypaul01@gmail.com';

-- Step 5: Check subscription count
SELECT COUNT(*) as total_subscriptions FROM subscriptions;
