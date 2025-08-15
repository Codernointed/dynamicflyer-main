-- Add missing paystack_reference column to existing subscriptions table
-- Run this in your Supabase SQL Editor

-- Add the missing column
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS paystack_reference TEXT;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_subscriptions_paystack_reference 
ON subscriptions(paystack_reference);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
AND column_name = 'paystack_reference';

-- Show all columns in subscriptions table
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
ORDER BY ordinal_position;
