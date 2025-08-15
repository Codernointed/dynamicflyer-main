/**
 * Subscription Dashboard Page
 * Comprehensive subscription management and billing overview
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, CreditCard, TrendingUp, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SubscriptionManager from '@/components/dashboard/SubscriptionManager';
import { useSubscription } from '@/hooks/useSubscription';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { toast } from 'sonner';

export default function SubscriptionDashboard() {
  const { currentPlan, userSubscription, usageStats } = useSubscription();
  const { getUsageSummary } = useUsageTracking();

  const handleUpgrade = () => {
    window.location.href = '/dashboard/subscription';
  };

  const handleManageBilling = () => {
    // This would typically open a billing portal
    toast.info('Billing portal integration coming soon');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Subscription <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">Dashboard</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Manage your subscription, track usage, and access premium features
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
              <Crown className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentPlan.name}</div>
              <p className="text-xs text-muted-foreground">
                {currentPlan.price === 0 ? 'Free' : `₵${currentPlan.price}/month`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Templates Used</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usageStats?.templates_created || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                of {currentPlan.limits.templates === -1 ? '∞' : currentPlan.limits.templates} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exports Used</CardTitle>
              <CreditCard className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usageStats?.monthly_exports || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                of {currentPlan.limits.exports === -1 ? '∞' : currentPlan.limits.exports} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userSubscription?.status || 'Free'}
              </div>
              <p className="text-xs text-muted-foreground">
                {userSubscription?.cancel_at_period_end ? 'Cancelling' : 'Active'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <SubscriptionManager />
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Billing & Payment History
                  </CardTitle>
                  <CardDescription>
                    View your payment history and manage billing preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {userSubscription ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-semibold text-gray-900">Next Billing Date</h4>
                          <p className="text-gray-600">
                            {new Date(userSubscription.current_period_end).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Amount</h4>
                          <p className="text-gray-600">
                            ₵{currentPlan.price}/month
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-4">
                        <Button
                          onClick={handleManageBilling}
                          variant="outline"
                          className="flex-1"
                        >
                          Manage Billing
                        </Button>
                        <Button
                          onClick={handleUpgrade}
                          className="flex-1 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white"
                        >
                          Change Plan
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No Active Subscription
                      </h3>
                      <p className="text-gray-600 mb-4">
                        You're currently on the free plan. Upgrade to access premium features.
                      </p>
                      <Button
                        onClick={handleUpgrade}
                        size="lg"
                        className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white"
                      >
                        View Plans
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Detailed Usage Analytics
                  </CardTitle>
                  <CardDescription>
                    Monitor your feature usage and plan limits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Template Usage */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Template Creation</h4>
                        <span className="text-sm text-gray-600">
                          {usageStats?.templates_created || 0} / {currentPlan.limits.templates === -1 ? '∞' : currentPlan.limits.templates}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, ((usageStats?.templates_created || 0) / (currentPlan.limits.templates === -1 ? 100 : currentPlan.limits.templates)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Export Usage */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Monthly Exports</h4>
                        <span className="text-sm text-gray-600">
                          {usageStats?.monthly_exports || 0} / {currentPlan.limits.exports === -1 ? '∞' : currentPlan.limits.exports}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, ((usageStats?.monthly_exports || 0) / (currentPlan.limits.exports === -1 ? 100 : currentPlan.limits.exports)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Storage Usage */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Storage Used</h4>
                        <span className="text-sm text-gray-600">
                          {usageStats?.storage_used || '50MB'} / {currentPlan.limits.storage}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: '25%' }} // Placeholder - you can implement actual storage calculation
                        ></div>
                      </div>
                    </div>

                    {/* Usage Tips */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Usage Tips</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Templates are counted monthly and reset each month</li>
                        <li>• Export limits reset on the 1st of each month</li>
                        <li>• Upgrade your plan to increase limits</li>
                        <li>• Contact support if you need temporary limit increases</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold text-amber-800">
                Need Help with Your Subscription?
              </CardTitle>
              <CardDescription className="text-amber-700">
                Our support team is here to help you get the most out of your plan
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
                <Button
                  onClick={handleUpgrade}
                  className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

