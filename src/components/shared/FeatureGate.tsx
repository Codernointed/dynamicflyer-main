/**
 * Feature Gate Component
 * Controls access to features based on subscription tiers and usage limits
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Crown, Star, Zap, Building2, Users, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { canAccessFeature, getFeatureLimits, SUBSCRIPTION_FEATURES } from '@/lib/featureGating';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  className?: string;
}

interface UpgradePromptProps {
  feature: string;
  requiredTier: string;
  message: string;
  onUpgrade?: () => void;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ feature, requiredTier, message, onUpgrade }) => {
  const getTierIcon = (tier: string) => {
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

  const getTierColor = (tier: string) => {
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

  const getTierName = (tier: string) => {
    switch (tier) {
      case 'free': return 'Free';
      case 'student_pro': return 'Student Pro';
      case 'creator_pro': return 'Creator Pro';
      case 'department': return 'Department Plan';
      case 'church': return 'Church Plan';
      case 'faculty': return 'Faculty Plan';
      default: return 'Free';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className={`p-3 rounded-lg bg-white/80 ${getTierColor(requiredTier)}`}>
              {getTierIcon(requiredTier)}
            </div>
          </div>
          <CardTitle className="text-lg font-bold text-amber-800">
            {feature} Requires {getTierName(requiredTier)}
          </CardTitle>
          <CardDescription className="text-amber-700">
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {(() => {
              const limits = SUBSCRIPTION_FEATURES[requiredTier];
              if (!limits) return null;
              
              return (
                <>
                  <div className="text-center">
                    <p className="text-amber-600 font-medium">Templates</p>
                    <p className="text-amber-800 font-bold">
                      {limits.templates === -1 ? '∞' : limits.templates}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-amber-600 font-medium">Exports</p>
                    <p className="text-amber-800 font-bold">
                      {limits.exports === -1 ? '∞' : limits.exports}
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
          
          <Button
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white"
          >
            Upgrade to {getTierName(requiredTier)}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  className = ''
}) => {
  const { currentPlan, usageStats, canPerformAction } = useSubscription();

  // Check if user can access the feature
  const hasAccess = canPerformAction(feature as any);

  // If user has access, render children
  if (hasAccess) {
    return <div className={className}>{children}</div>;
  }

  // If no upgrade prompt requested, render fallback or nothing
  if (!showUpgradePrompt) {
    return fallback ? <div className={className}>{fallback}</div> : null;
  }

  // Get feature requirements
  const getRequiredTier = (feature: string): string => {
    switch (feature) {
      case 'create_template':
        return 'free';
      case 'export_template':
        return 'free';
      case 'upload_font':
        return 'student_pro';
      case 'pdf_export':
        return 'creator_pro';
      case 'high_res_export':
        return 'student_pro';
      case 'bulk_generation':
        return 'department';
      case 'white_label':
        return 'church';
      case 'api_access':
        return 'faculty';
      default:
        return 'free';
    }
  };

  const getFeatureMessage = (feature: string): string => {
    switch (feature) {
      case 'create_template':
        return 'You can create templates with your current plan.';
      case 'export_template':
        return 'You can export templates with your current plan.';
      case 'upload_font':
        return 'Custom font uploads require Student Pro or higher.';
      case 'pdf_export':
        return 'PDF export requires Creator Pro or higher.';
      case 'high_res_export':
        return 'High-resolution exports require Student Pro or higher.';
      case 'bulk_generation':
        return 'Bulk generation requires Department plan or higher.';
      case 'white_label':
        return 'White label features require Church plan or higher.';
      case 'api_access':
        return 'API access requires Faculty plan or higher.';
      default:
        return 'This feature requires a higher subscription tier.';
    }
  };

  const requiredTier = getRequiredTier(feature);
  const message = getFeatureMessage(feature);

  const handleUpgrade = () => {
    window.location.href = '/dashboard/subscription';
  };

  return (
    <UpgradePrompt
      feature={feature}
      requiredTier={requiredTier}
      message={message}
      onUpgrade={handleUpgrade}
    />
  );
};

// Higher-order component for feature gating
export function withFeatureGate<P extends object>(
  Component: React.ComponentType<P>,
  feature: string,
  fallback?: React.ReactNode
) {
  return function FeatureGatedComponent(props: P) {
    return (
      <FeatureGate feature={feature} fallback={fallback}>
        <Component {...props} />
      </FeatureGate>
    );
  };
}

// Hook for feature access checking
export function useFeatureGate(feature: string) {
  const { canPerformAction } = useSubscription();
  
  return {
    hasAccess: canPerformAction(feature as any),
    checkAccess: () => canPerformAction(feature as any),
  };
}

export default FeatureGate;

