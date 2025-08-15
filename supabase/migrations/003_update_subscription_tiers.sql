-- Update subscription tier constraint in profiles table
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

-- Add the new constraint with updated subscription tiers
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_subscription_tier_check 
CHECK (subscription_tier IN ('free', 'student_pro', 'creator_pro', 'department', 'church', 'faculty', 'enterprise'));

-- Update the subscription tier column to have 'free' as default
ALTER TABLE public.profiles 
ALTER COLUMN subscription_tier SET DEFAULT 'free';

-- Update any existing profiles with invalid subscription tiers
UPDATE public.profiles
SET subscription_tier = 'free'
WHERE subscription_tier NOT IN ('free', 'student_pro', 'creator_pro', 'department', 'church', 'faculty', 'enterprise');
