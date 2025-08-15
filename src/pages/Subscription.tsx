/**
 * Subscription Pricing Page
 * Displays all available subscription plans and event packages
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Star, Zap, Building2, Users, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSubscription } from '@/hooks/useSubscription';
import { SUBSCRIPTION_PLANS, EVENT_PACKAGES, formatAmount } from '@/integrations/paystack/client';
import { toast } from 'sonner';

export default function Subscription() {
  const { 
    currentPlan, 
    userSubscription, 
    usageStats,
    upgradeSubscription, 
    purchaseEventPackage,
    processingPayment 
  } = useSubscription();

  const [selectedTab, setSelectedTab] = useState('plans');

  const handleUpgrade = async (planId: string) => {
    try {
      await upgradeSubscription(planId);
    } catch (error) {
      console.error('Upgrade failed:', error);
    }
  };

  const handlePackagePurchase = async (packageId: string) => {
    try {
      await purchaseEventPackage(packageId);
    } catch (error) {
      console.error('Package purchase failed:', error);
    }
  };

  const isCurrentPlan = (planId: string) => {
    return currentPlan.id === planId;
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">Plan</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlock the full potential of GenEdit with our flexible subscription plans. 
            Perfect for students, creators, and organizations.
          </p>
        </motion.div>

        {/* Current Plan Status */}
        {userSubscription && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <Card className="max-w-2xl mx-auto bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-amber-800">
                  Current Plan: {currentPlan.name}
                </CardTitle>
                <CardDescription className="text-amber-700">
                  {userSubscription.cancel_at_period_end 
                    ? 'Your subscription will end on ' + new Date(userSubscription.current_period_end).toLocaleDateString()
                    : 'Active until ' + new Date(userSubscription.current_period_end).toLocaleDateString()
                  }
                </CardDescription>
              </CardHeader>
              {usageStats && (
                <CardContent className="text-center">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-amber-600 font-medium">Templates</p>
                      <p className="text-amber-800 font-bold">
                        {usageStats.templates_created} / {usageStats.templates_limit === -1 ? '∞' : usageStats.templates_limit}
                      </p>
                    </div>
                    <div>
                      <p className="text-amber-600 font-medium">Exports</p>
                      <p className="text-amber-800 font-bold">
                        {usageStats.monthly_exports} / {usageStats.monthly_exports_limit === -1 ? '∞' : usageStats.monthly_exports_limit}
                      </p>
                    </div>
                    <div>
                      <p className="text-amber-600 font-medium">Storage</p>
                      <p className="text-amber-800 font-bold">
                        {usageStats.storage_used} / {usageStats.storage_limit}
                      </p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-12">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
            <TabsTrigger value="packages">Event Packages</TabsTrigger>
          </TabsList>

          {/* Subscription Plans */}
          <TabsContent value="plans" className="mt-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                    isCurrentPlan(plan.id) 
                      ? 'ring-2 ring-amber-400 scale-105' 
                      : 'hover:scale-105'
                  }`}
                >
                  {isCurrentPlan(plan.id) && (
                    <Badge className="absolute top-4 right-4 bg-amber-500 text-white">
                      Current Plan
                    </Badge>
                  )}
                  
                  <CardHeader className={`bg-gradient-to-br ${getPlanColor(plan.id)} pb-8`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-white/80 ${getPlanColor(plan.id)}`}>
                        {getPlanIcon(plan.id)}
                      </div>
                      {plan.id === 'creator_pro' && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          Most Popular
                        </Badge>
                      )}
                    </div>
                    
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      {plan.name}
                    </CardTitle>
                    
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gray-900">
                        {plan.price === 0 ? 'Free' : `₵${plan.price}`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-gray-600">/month</span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button 
                      className={`w-full ${
                        isCurrentPlan(plan.id)
                          ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                          : 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white'
                      }`}
                      onClick={() => !isCurrentPlan(plan.id) && handleUpgrade(plan.id)}
                      disabled={isCurrentPlan(plan.id) || processingPayment}
                    >
                      {isCurrentPlan(plan.id) 
                        ? 'Current Plan' 
                        : plan.price === 0 
                          ? 'Get Started' 
                          : 'Upgrade Now'
                      }
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </motion.div>
          </TabsContent>

          {/* Event Packages */}
          <TabsContent value="packages" className="mt-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {Object.values(EVENT_PACKAGES).map((eventPackage) => (
                <Card 
                  key={eventPackage.id} 
                  className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105"
                >
                  <CardHeader className="bg-gradient-to-br from-blue-100 to-indigo-200 pb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-lg bg-white/80">
                        <Award className="h-6 w-6 text-blue-600" />
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        One-time
                      </Badge>
                    </div>
                    
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      {eventPackage.name}
                    </CardTitle>
                    
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gray-900">
                        ₵{eventPackage.price}
                      </span>
                      <span className="text-gray-600">one-time</span>
                    </div>
                    
                    <CardDescription className="text-blue-700">
                      {eventPackage.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {eventPackage.includes.map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                      onClick={() => handlePackagePurchase(eventPackage.id)}
                      disabled={processingPayment}
                    >
                      Purchase Package
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* FAQ Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-20"
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Can I change my plan anytime?
                </h3>
                <p className="text-gray-600">
                  Yes! You can upgrade or downgrade your subscription at any time. 
                  Changes take effect immediately.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-600">
                  We accept Mobile Money, Credit/Debit cards, and Bank transfers 
                  through our secure Paystack integration.
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Is there a free trial?
                </h3>
                <p className="text-gray-600">
                  Yes! Start with our free plan and upgrade when you're ready. 
                  No credit card required to get started.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Can I cancel my subscription?
                </h3>
                <p className="text-gray-600">
                  Absolutely. You can cancel anytime and continue using your 
                  plan until the end of the billing period.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-20 text-center"
        >
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-amber-800">
                Ready to Get Started?
              </CardTitle>
              <CardDescription className="text-amber-700">
                Join thousands of users creating amazing templates with GenEdit
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white"
                onClick={() => setSelectedTab('plans')}
              >
                Choose Your Plan
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
