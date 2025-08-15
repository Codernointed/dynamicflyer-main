# 🚀 Payment System Setup Guide

## 🎯 Overview
This guide will help you set up the complete payment system for GenEdit using Paystack. The system includes subscription plans, event packages, and usage tracking.

## 📋 Prerequisites
- Paystack account (sign up at [paystack.com](https://paystack.com))
- Supabase project with the updated database schema
- Node.js and npm installed

## 🔑 Environment Configuration

Create a `.env` file in your project root with the following variables:

```bash
# Paystack Configuration
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
VITE_PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here

# For production, use live keys:
# VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_live_public_key_here
# VITE_PAYSTACK_SECRET_KEY=sk_live_your_live_secret_key_here
```

## 🗄️ Database Setup

### 1. Run the following SQL migrations in your Supabase project:

```sql
-- Create organizations table
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  subscription_plan TEXT CHECK (subscription_plan IN ('department', 'church', 'faculty', 'enterprise')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'trial')),
  subscription_start TIMESTAMP WITH TIME ZONE,
  subscription_end TIMESTAMP WITH TIME ZONE,
  monthly_export_limit INTEGER DEFAULT 1000,
  custom_branding BOOLEAN DEFAULT false,
  white_label BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'student_pro', 'creator_pro', 'department', 'church', 'faculty', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'trial')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  paystack_subscription_id TEXT,
  paystack_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'GHS',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'successful', 'failed', 'cancelled')),
  payment_method TEXT CHECK (payment_method IN ('mobile_money', 'card', 'bank_transfer')),
  paystack_reference TEXT NOT NULL UNIQUE,
  paystack_transaction_id TEXT,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usage_logs table
CREATE TABLE usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('template_created', 'template_exported', 'font_uploaded', 'api_call')),
  resource_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS is_organization_admin BOOLEAN DEFAULT false;

-- Update templates table
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS price INTEGER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action ON usage_logs(action);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
```

### 2. Set up Row Level Security (RLS) policies:

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view organizations they belong to" ON organizations
  FOR SELECT USING (id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Organization admins can update their organization" ON organizations
  FOR UPDATE USING (id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid() AND is_organization_admin = true
  ));

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
  FOR UPDATE USING (user_id = auth.uid());

-- Payments policies
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own payments" ON payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Usage logs policies
CREATE POLICY "Users can view their own usage logs" ON usage_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own usage logs" ON usage_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Paystack Webhooks
In your Paystack dashboard, configure webhooks to point to:
```
https://your-domain.com/api/paystack/webhook
```

### 3. Test the System
1. Start your development server: `npm run dev`
2. Navigate to `/dashboard/subscription`
3. Try upgrading to a paid plan
4. Complete the payment flow

## 💰 Subscription Plans

### Individual Plans
- **Free**: 3 templates/month, watermarked exports
- **Student Pro (₵30/month)**: 20 templates/month, high-res exports
- **Creator Pro (₵60/month)**: Unlimited templates, custom fonts, PDF export

### Organization Plans
- **Department (₵150/month)**: Team collaboration, custom branding
- **Church (₵200/month)**: Event packages, bulk generation
- **Faculty (₵500/month)**: Multi-department, API access

### Event Packages
- **Graduation (₵300)**: 500 certificates, invitations, program booklets
- **Conference (₵500)**: 200 certificates, badges, flyers
- **Semester (₵800)**: Full semester coverage, unlimited personalization

## 🔧 Customization

### Modifying Plans
Edit `src/integrations/paystack/client.ts` to modify:
- Plan pricing
- Feature lists
- Usage limits
- Payment channels

### Adding New Features
1. Update the database schema
2. Modify the subscription hook
3. Update the UI components
4. Add feature gating logic

## 🧪 Testing

### Test Cards (Paystack Test Mode)
- **Visa**: 4084 0840 8408 4081
- **Mastercard**: 5105 1051 0510 5100
- **Expiry**: Any future date
- **CVV**: Any 3 digits
- **PIN**: Any 4 digits

### Test Mobile Money
Use any Ghanaian phone number for testing mobile money payments.

## 🚨 Production Checklist

Before going live:
- [ ] Switch to Paystack live keys
- [ ] Update webhook URLs to production domain
- [ ] Test payment flow with real amounts
- [ ] Set up monitoring and error tracking
- [ ] Configure backup payment methods
- [ ] Set up customer support system

## 📞 Support

For issues with:
- **Paystack**: Contact Paystack support
- **GenEdit**: Check the GitHub issues or contact the development team
- **Database**: Check Supabase logs and documentation

## 🎯 Next Steps

After setting up the payment system:
1. **Feature Gating**: Implement usage limits and premium features
2. **Analytics**: Track subscription metrics and revenue
3. **Customer Portal**: Allow users to manage their subscriptions
4. **Bulk Operations**: Implement organization-wide template management
5. **API Access**: Create developer APIs for enterprise customers

---

**Happy monetizing! 🚀💰**
