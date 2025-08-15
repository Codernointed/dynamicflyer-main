/**
 * Subscription Management Hook
 * Handles subscription plans, payments, and usage tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  SUBSCRIPTION_PLANS, 
  EVENT_PACKAGES,
  initializePayment,
  verifyPayment,
  generateReference,
  formatAmount
} from '@/integrations/paystack/client';
import { toast } from 'sonner';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  limits: {
    templates: number;
    exports: number;
    storage: string;
  };
}

export interface EventPackage {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  includes: string[];
}

export interface UserSubscription {
  id: string;
  plan_type: string;
  status: 'active' | 'inactive' | 'cancelled' | 'trial';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export interface UsageStats {
  templates_created: number;
  templates_limit: number;
  monthly_exports: number;
  monthly_exports_limit: number;
  storage_used: string;
  storage_limit: string;
}

export function useSubscription() {
  const { user, profile } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>(SUBSCRIPTION_PLANS.FREE);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  /**
   * Get available subscription plans
   */
  const getAvailablePlans = useCallback(() => {
    return Object.values(SUBSCRIPTION_PLANS);
  }, []);

  /**
   * Get available event packages
   */
  const getAvailablePackages = useCallback(() => {
    return Object.values(EVENT_PACKAGES);
  }, []);

  /**
   * Get current user's subscription
   */
  const getUserSubscription = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Subscription table query failed, table may not exist:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.warn('Error fetching user subscription, using free tier:', error);
      return null;
    }
  }, [user]);

  /**
   * Get user's usage statistics
   */
  const getUsageStats = useCallback(async (): Promise<UsageStats | null> => {
    if (!user || !profile) return null;

    try {
      // Get template count
      const { count: templatesCreated } = await supabase
        .from('templates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get export count for current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: monthlyExports } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('action', 'template_exported')
        .gte('created_at', startOfMonth.toISOString());

      // Calculate storage usage (simplified - you can implement actual storage calculation)
      const storageUsed = '50MB'; // Placeholder

      return {
        templates_created: templatesCreated || 0,
        templates_limit: profile.templates_limit,
        monthly_exports: monthlyExports || 0,
        monthly_exports_limit: profile.monthly_exports_limit,
        storage_used: storageUsed,
        storage_limit: currentPlan.limits.storage,
      };
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      return null;
    }
  }, [user, profile, currentPlan]);

  /**
   * Check if user can perform an action
   */
  const canPerformAction = useCallback((action: 'create_template' | 'export_template' | 'upload_font') => {
    if (!usageStats) return false;

    switch (action) {
      case 'create_template':
        return currentPlan.limits.templates === -1 || 
               usageStats.templates_created < usageStats.templates_limit;
      
      case 'export_template':
        return currentPlan.limits.exports === -1 || 
               usageStats.monthly_exports < usageStats.monthly_exports_limit;
      
      case 'upload_font':
        return currentPlan.id !== 'free';
      
      default:
        return false;
    }
  }, [usageStats, currentPlan]);

  /**
   * Upgrade subscription
   */
  const upgradeSubscription = useCallback(async (planId: string) => {
    if (!user) {
      toast.error('Please sign in to upgrade your subscription');
      return;
    }

    // Try to find plan by ID (handle both uppercase keys and lowercase IDs)
    let plan = SUBSCRIPTION_PLANS[planId.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS];
    
    // If not found by uppercase key, try to find by the internal id field
    if (!plan) {
      plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === planId);
    }
    
    if (!plan) {
      toast.error('Invalid plan selected');
      return;
    }

    setProcessingPayment(true);

    try {
      const reference = generateReference('SUB');
      const callbackUrl = `${window.location.origin}/dashboard/subscription/success?reference=${reference}`;

      // Initialize payment
      const paymentData = await initializePayment({
        email: user.email!,
        amount: plan.price,
        reference,
        callback_url: callbackUrl,
        metadata: {
          plan_id: planId.toUpperCase(), // Use uppercase plan ID to ensure consistency
          user_id: user.id,
          plan_name: plan.name,
        },
      });

      if (paymentData.status && paymentData.data?.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = paymentData.data.authorization_url;
      } else {
        throw new Error('Payment initialization failed');
      }
    } catch (error: any) {
      console.error('Subscription upgrade error:', error);
      toast.error(error.message || 'Failed to initialize payment');
    } finally {
      setProcessingPayment(false);
    }
  }, [user]);

  /**
   * Purchase event package
   */
  const purchaseEventPackage = useCallback(async (packageId: string) => {
    if (!user) {
      toast.error('Please sign in to purchase event packages');
      return;
    }

    const eventPackage = EVENT_PACKAGES[packageId as keyof typeof EVENT_PACKAGES];
    if (!eventPackage) {
      toast.error('Invalid package selected');
      return;
    }

    setProcessingPayment(true);

    try {
      const reference = generateReference('EVT');
      const callbackUrl = `${window.location.origin}/dashboard/subscription/success?reference=${reference}`;

      // Initialize payment
      const paymentData = await initializePayment({
        email: user.email!,
        amount: eventPackage.price,
        reference,
        callback_url: callbackUrl,
        metadata: {
          package_id: packageId,
          user_id: user.id,
          package_name: eventPackage.name,
        },
      });

      if (paymentData.status && paymentData.data?.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = paymentData.data.authorization_url;
      } else {
        throw new Error('Payment initialization failed');
      }
    } catch (error: any) {
      console.error('Event package purchase error:', error);
      toast.error(error.message || 'Failed to initialize payment');
    } finally {
      setProcessingPayment(false);
    }
  }, [user]);

  /**
   * Verify payment and update subscription
   */
  const verifyPaymentAndUpdate = useCallback(async (reference: string, options?: { silent?: boolean }) => {
    if (!user) return false;

    try {
      setLoading(true);

      // Verify payment with Paystack
      const verificationResult = await verifyPayment(reference);
      
      if (verificationResult.status && verificationResult.data?.status === 'success') {
        const metadata = verificationResult.data.metadata;
        const planId = metadata?.plan_id;
        const packageId = metadata?.package_id;

        if (planId) {
          // Update subscription
          await updateUserSubscription(planId, reference);
          // Force refresh of subscription data
          await refreshSubscriptionData();
          // Optional success toast (disabled when called with silent)
          if (!options?.silent) {
            toast.success('Subscription upgraded successfully!');
          }
          return true;
        } else if (packageId) {
          // Process event package purchase
          await processEventPackagePurchase(packageId, reference);
          if (!options?.silent) {
            toast.success('Event package purchased successfully!');
          }
          return true;
        }
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      toast.error(error.message || 'Payment verification failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Update user subscription in database
   */
  const updateUserSubscription = useCallback(async (planId: string, reference: string) => {
    if (!user) return;

    try {
      // Convert planId to uppercase to match SUBSCRIPTION_PLANS keys
      const upperPlanId = planId.toUpperCase();
      const plan = SUBSCRIPTION_PLANS[upperPlanId as keyof typeof SUBSCRIPTION_PLANS];
      
      if (!plan) {
        console.error(`Plan not found: ${planId} (uppercase: ${upperPlanId})`);
        console.error('Available plans:', Object.keys(SUBSCRIPTION_PLANS));
        throw new Error('Invalid plan');
      }

      // Update profile with new limits - use lowercase plan.id for consistency
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_tier: plan.id.toLowerCase(),
          templates_limit: plan.limits.templates,
          monthly_exports_limit: plan.limits.exports,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Create subscription record - use lowercase plan.id for consistency
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_type: plan.id.toLowerCase(),
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false,
          paystack_reference: reference,
        });

      if (subscriptionError) throw subscriptionError;

      // Refresh data
      await refreshSubscriptionData();
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }, [user]);

  /**
   * Process event package purchase
   */
  const processEventPackagePurchase = useCallback(async (packageId: string, reference: string) => {
    if (!user) return;

    try {
      // Record payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          amount: EVENT_PACKAGES[packageId as keyof typeof EVENT_PACKAGES]?.price || 0,
          currency: 'GHS',
          status: 'successful',
          payment_method: 'card',
          paystack_reference: reference,
          description: `Event Package: ${EVENT_PACKAGES[packageId as keyof typeof EVENT_PACKAGES]?.name}`,
          metadata: { package_id: packageId },
        });

      if (paymentError) throw paymentError;

      // You can add additional logic here for event package benefits
      // For example, granting temporary access to premium features
    } catch (error) {
      console.error('Error processing event package:', error);
      throw error;
    }
  }, [user]);

  /**
   * Refresh subscription data
   */
  const refreshSubscriptionData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get current subscription
      const subscription = await getUserSubscription();
      setUserSubscription(subscription);

      // Get usage stats
      const stats = await getUsageStats();
      setUsageStats(stats);

      // Update current plan based on subscription or profile
      if (subscription) {
        const planKey = subscription.plan_type.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS;
        const plan = SUBSCRIPTION_PLANS[planKey];
        if (plan) setCurrentPlan(plan);
      } else if (profile) {
        const planKey = profile.subscription_tier.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS;
        const plan = SUBSCRIPTION_PLANS[planKey];
        if (plan) setCurrentPlan(plan);
      }
    } catch (error) {
      console.warn('Error refreshing subscription data, using defaults:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.subscription_tier, getUserSubscription, getUsageStats]);

  /**
   * Cancel subscription
   */
  const cancelSubscription = useCallback(async () => {
    if (!user || !userSubscription) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          status: 'cancelled',
        })
        .eq('id', userSubscription.id);

      if (error) throw error;

      toast.success('Subscription will be cancelled at the end of the current period');
      await refreshSubscriptionData();
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast.error(error.message || 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  }, [user, userSubscription, refreshSubscriptionData]);

  /**
   * Reactivate subscription
   */
  const reactivateSubscription = useCallback(async () => {
    if (!user || !userSubscription) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: false,
          status: 'active',
        })
        .eq('id', userSubscription.id);

      if (error) throw error;

      toast.success('Subscription reactivated successfully!');
      await refreshSubscriptionData();
    } catch (error: any) {
      console.error('Error reactivating subscription:', error);
      toast.error(error.message || 'Failed to reactivate subscription');
    } finally {
      setLoading(false);
    }
  }, [user, userSubscription, refreshSubscriptionData]);

  // Load subscription data on mount - prevent infinite loops
  useEffect(() => {
    if (user?.id && profile?.id && !loading) {
      refreshSubscriptionData();
    }
  }, [user?.id, profile?.id]); // Only depend on IDs to prevent infinite loops

  return {
    // State
    currentPlan,
    userSubscription,
    usageStats,
    loading,
    processingPayment,

    // Plans and packages
    getAvailablePlans,
    getAvailablePackages,

    // Actions
    upgradeSubscription,
    purchaseEventPackage,
    verifyPaymentAndUpdate,
    cancelSubscription,
    reactivateSubscription,
    canPerformAction,

    // Utilities
    formatAmount,
    refreshSubscriptionData,
  };
}
