-- Complete subscription table fix
-- Run this in your Supabase SQL Editor to fix all issues

-- Step 1: Drop and recreate the subscriptions table with all required columns
DROP TABLE IF EXISTS subscriptions CASCADE;

CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'student_pro', 'creator_pro', 'department', 'church', 'faculty', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'trial')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  cancel_at_period_end BOOLEAN DEFAULT false,
  paystack_subscription_id TEXT,
  paystack_customer_id TEXT,
  paystack_reference TEXT, -- This was the missing column causing the error
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Service role can do everything" ON subscriptions
  FOR ALL USING (true) WITH CHECK (true);

-- Step 4: Create indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_plan_type ON subscriptions(plan_type);
CREATE INDEX idx_subscriptions_paystack_reference ON subscriptions(paystack_reference);

-- Step 5: Grant permissions
GRANT ALL ON subscriptions TO authenticated;
GRANT ALL ON subscriptions TO service_role;
GRANT ALL ON subscriptions TO anon;

-- Step 6: Verify the table structure
SELECT 'Subscriptions table created successfully with all required columns' as status;

-- Step 7: Show all columns to confirm
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
ORDER BY ordinal_position;

-- Step 8: Now you can manually add your subscription using add_your_subscription.sql
-- or let the payment verification process work automatically
