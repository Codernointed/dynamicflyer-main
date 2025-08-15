/**
 * Upgrade Prompt Component
 * Shows when users hit limits or try to access premium features
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Zap, Star, Users, Building2, Award, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { SUBSCRIPTION_PLANS, EVENT_PACKAGES } from '@/integrations/paystack/client';
import { toast } from 'sonner';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  currentTier: string;
  requiredTier?: string;
  message?: string;
  showPlans?: boolean;
}

export default function UpgradePrompt({
  isOpen,
  onClose,
  feature,
  currentTier,
  requiredTier,
  message,
  showPlans = true,
}: UpgradePromptProps) {
  const { upgradeSubscription, processingPayment } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    try {
      await upgradeSubscription(planId);
      onClose();
    } catch (error) {
      console.error('Upgrade failed:', error);
    }
  };

  const getFeatureIcon = (tier: string) => {
    switch (tier) {
      case 'free': return <Star className="h-5 w-5" />;
      case 'student_pro': return <Zap className="h-5 w-5" />;
      case 'creator_pro': return <Crown className="h-5 w-5" />;
      case 'department': return <Users className="h-5 w-5" />;
      case 'church': return <Building2 className="h-5 w-5" />;
      case 'faculty': return <Award className="h-5 w-5" />;
      default: return <Star className="h-5 w-5" />;
    }
  };

  const getFeatureColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'from-gray-100 to-gray-200';
      case 'student_pro': return 'from-blue-100 to-blue-200';
      case 'creator_pro': return 'from-purple-100 to-purple-200';
      case 'department': return 'from-green-100 to-green-200';
      case 'church': return 'from-amber-100 to-amber-200';
      case 'faculty': return 'from-red-100 to-red-200';
      default: return 'from-gray-100 to-gray-200';
    }
  };

  const getUpgradeRecommendation = () => {
    if (currentTier === 'free') return 'student_pro';
    if (currentTier === 'student_pro') return 'creator_pro';
    if (currentTier === 'creator_pro') return 'department';
    if (currentTier === 'department') return 'church';
    if (currentTier === 'church') return 'faculty';
    return 'creator_pro';
  };

  const recommendedPlan = getUpgradeRecommendation();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="relative">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 z-10"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>

              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500">
                    <Crown className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <CardTitle className="text-3xl font-bold text-gray-900">
                  Unlock {feature}
                </CardTitle>
                
                <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
                  {message || `Upgrade your plan to access ${feature} and unlock unlimited possibilities.`}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-8">
                {/* Current Plan Status */}
                <div className="text-center">
                  <Badge variant="outline" className="text-sm">
                    Current: {SUBSCRIPTION_PLANS[currentTier as keyof typeof SUBSCRIPTION_PLANS]?.name || 'Free'}
                  </Badge>
                </div>

                {/* Recommended Upgrade */}
                {showPlans && (
                  <div>
                    <h3 className="text-xl font-semibold text-center mb-6">
                      Recommended Upgrade
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Object.entries(SUBSCRIPTION_PLANS)
                        .filter(([planId]) => planId !== currentTier)
                        .map(([planId, plan]) => (
                          <Card
                            key={planId}
                            className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg ${
                              selectedPlan === planId ? 'ring-2 ring-amber-400' : ''
                            } ${planId === recommendedPlan ? 'ring-2 ring-green-400' : ''}`}
                            onClick={() => setSelectedPlan(planId)}
                          >
                            {planId === recommendedPlan && (
                              <Badge className="absolute top-2 right-2 bg-green-500 text-white">
                                Recommended
                              </Badge>
                            )}
                            
                            <CardHeader className={`bg-gradient-to-br ${getFeatureColor(planId)} pb-6`}>
                              <div className="flex items-center justify-between mb-4">
                                <div className={`p-2 rounded-lg bg-white/80`}>
                                  {getFeatureIcon(planId)}
                                </div>
                                {planId === 'creator_pro' && (
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                    Most Popular
                                  </Badge>
                                )}
                              </div>
                              
                              <CardTitle className="text-xl font-bold text-gray-900">
                                {plan.name}
                              </CardTitle>
                              
                              <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-gray-900">
                                  {plan.price === 0 ? 'Free' : `₵${plan.price}`}
                                </span>
                                {plan.price > 0 && (
                                  <span className="text-gray-600">/month</span>
                                )}
                              </div>
                            </CardHeader>

                            <CardContent className="pt-4">
                              <ul className="space-y-2 text-sm">
                                {plan.features.slice(0, 4).map((feature, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">{feature}</span>
                                  </li>
                                ))}
                                {plan.features.length > 4 && (
                                  <li className="text-xs text-gray-500">
                                    +{plan.features.length - 4} more features
                                  </li>
                                )}
                              </ul>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                )}

                {/* Event Packages */}
                <div>
                  <h3 className="text-xl font-semibold text-center mb-6">
                    Need Something Special?
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.entries(EVENT_PACKAGES).map(([packageId, eventPackage]) => (
                      <Card
                        key={packageId}
                        className="relative cursor-pointer transition-all duration-300 hover:shadow-lg"
                      >
                        <CardHeader className="bg-gradient-to-br from-blue-100 to-indigo-200 pb-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="p-2 rounded-lg bg-white/80">
                              <Award className="h-5 w-5 text-blue-600" />
                            </div>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              One-time
                            </Badge>
                          </div>
                          
                          <CardTitle className="text-lg font-bold text-gray-900">
                            {eventPackage.name}
                          </CardTitle>
                          
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                              ₵{eventPackage.price}
                            </span>
                            <span className="text-gray-600">one-time</span>
                          </div>
                        </CardHeader>

                        <CardContent className="pt-4">
                          <ul className="space-y-2 text-sm">
                            {eventPackage.includes.slice(0, 3).map((item, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="text-center space-y-4">
                  {selectedPlan && (
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white px-8"
                      onClick={() => handleUpgrade(selectedPlan)}
                      disabled={processingPayment}
                    >
                      {processingPayment ? 'Processing...' : `Upgrade to ${SUBSCRIPTION_PLANS[selectedPlan as keyof typeof SUBSCRIPTION_PLANS]?.name}`}
                    </Button>
                  )}
                  
                  <div className="text-sm text-gray-500">
                    <p>All plans include a 7-day money-back guarantee</p>
                    <p>Cancel anytime • No hidden fees</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
