/**
 * Subscription Manager Component
 * Displays current subscription status and provides subscription management options
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Zap, Users, Building2, Award, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/hooks/useSubscription';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { SUBSCRIPTION_PLANS } from '@/integrations/paystack/client';
import { toast } from 'sonner';

export default function SubscriptionManager() {
  const { 
    currentPlan, 
    userSubscription, 
    usageStats,
    cancelSubscription,
    reactivateSubscription,
    loading 
  } = useSubscription();

  const { getUsageSummary, showUsageWarning } = useUsageTracking();
  const [usageSummary, setUsageSummary] = useState<any>(null);

  useEffect(() => {
    const loadUsageSummary = async () => {
      const summary = await getUsageSummary();
      setUsageSummary(summary);
    };

    if (usageStats) {
      loadUsageSummary();
    }
  }, [usageStats, getUsageSummary]);

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free': return <Star className="h-6 w-6" />;
      case 'student_pro': return <Zap className="h-6 w-6" />;
      case 'creator_pro': return <Crown className="h-6 w-6" />;
      case 'department': return <Users className="h-6 w-6" />;
      case 'church': return <Building2 className="h-6 w-6" />;
      case 'faculty': return <Award className="h-6 w-6" />;
      default: return <Star className="h-6 w-6" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'free': return 'from-gray-100 to-gray-200';
      case 'student_pro': return 'from-blue-100 to-blue-200';
      case 'creator_pro': return 'from-purple-100 to-purple-200';
      case 'department': return 'from-green-100 to-green-200';
      case 'church': return 'from-amber-100 to-amber-200';
      case 'faculty': return 'from-red-100 to-red-200';
      default: return 'from-gray-100 to-gray-200';
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscription();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      await reactivateSubscription();
    } catch (error) {
      console.error('Failed to reactivate subscription:', error);
    }
  };

  const handleUpgrade = () => {
    window.location.href = '/dashboard/subscription';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className={`p-4 rounded-lg bg-white/80 ${getPlanColor(currentPlan.id)}`}>
                {getPlanIcon(currentPlan.id)}
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-amber-800">
              Current Plan: {currentPlan.name}
            </CardTitle>
            <CardDescription className="text-amber-700">
              {userSubscription ? (
                userSubscription.cancel_at_period_end 
                  ? 'Your subscription will end on ' + new Date(userSubscription.current_period_end).toLocaleDateString()
                  : 'Active until ' + new Date(userSubscription.current_period_end).toLocaleDateString()
              ) : (
                'Free plan - no active subscription'
              )}
            </CardDescription>
          </CardHeader>
          
          {userSubscription && (
            <CardContent className="text-center space-y-4">
              <div className="flex justify-center space-x-4">
                {userSubscription.cancel_at_period_end ? (
                  <Button
                    onClick={handleReactivateSubscription}
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-100"
                  >
                    Reactivate Subscription
                  </Button>
                ) : (
                  <Button
                    onClick={handleCancelSubscription}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* Usage Statistics */}
      {usageSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Usage This Month
              </CardTitle>
              <CardDescription>
                Track your monthly usage and limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Templates */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Templates Created</span>
                  <span className="text-sm text-gray-600">
                    {usageSummary.templates.used} / {usageSummary.templates.limit === -1 ? '∞' : usageSummary.templates.limit}
                  </span>
                </div>
                <Progress 
                  value={usageSummary.templates.percentage} 
                  className="h-2"
                />
                {usageSummary.templates.remaining <= 2 && usageSummary.templates.remaining > 0 && (
                  <div className="flex items-center gap-2 text-amber-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Only {usageSummary.templates.remaining} templates remaining
                  </div>
                )}
              </div>

              {/* Exports */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Exports</span>
                  <span className="text-sm text-gray-600">
                    {usageSummary.exports.used} / {usageSummary.exports.limit === -1 ? '∞' : usageSummary.exports.limit}
                  </span>
                </div>
                <Progress 
                  value={usageSummary.exports.percentage} 
                  className="h-2"
                />
                {usageSummary.exports.remaining <= 2 && usageSummary.exports.remaining > 0 && (
                  <div className="flex items-center gap-2 text-amber-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Only {usageSummary.exports.remaining} exports remaining
                  </div>
                )}
              </div>

              {/* Fonts */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Custom Fonts</span>
                  <span className="text-sm text-gray-600">
                    {usageSummary.fonts.used} / {usageSummary.fonts.limit === -1 ? '∞' : usageSummary.fonts.limit}
                  </span>
                </div>
                <Progress 
                  value={usageSummary.fonts.percentage} 
                  className="h-2"
                />
                {currentPlan.id === 'free' && (
                  <div className="flex items-center gap-2 text-blue-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Upgrade to upload custom fonts
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Plan Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Your Plan Features
            </CardTitle>
            <CardDescription>
              Features available with your current plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upgrade CTA */}
      {currentPlan.id === 'free' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold text-amber-800">
                Ready to Upgrade?
              </CardTitle>
              <CardDescription className="text-amber-700">
                Unlock unlimited templates, high-resolution exports, and premium features
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={handleUpgrade}
                size="lg"
                className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white"
              >
                View Plans & Pricing
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Billing Information */}
      {userSubscription && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Billing Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Plan Type:</span>
                  <span className="ml-2 text-gray-900">{currentPlan.name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Status:</span>
                  <Badge 
                    variant={userSubscription.status === 'active' ? 'default' : 'secondary'}
                    className="ml-2"
                  >
                    {userSubscription.status}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Current Period:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(userSubscription.current_period_start).toLocaleDateString()} - {new Date(userSubscription.current_period_end).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Auto-Renew:</span>
                  <span className="ml-2 text-gray-900">
                    {userSubscription.cancel_at_period_end ? 'No' : 'Yes'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

