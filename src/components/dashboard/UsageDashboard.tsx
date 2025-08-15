/**
 * Usage Dashboard Component
 * Shows current usage, limits, and upgrade recommendations
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  FileText, 
  Download, 
  HardDrive, 
  Zap, 
  Crown, 
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { getFeatureLimits, getUpgradeRecommendation } from '@/lib/featureGating';
import { getCurrentUsage, isApproachingLimit } from '@/lib/usageTracking';
import { SUBSCRIPTION_PLANS } from '@/integrations/paystack/client';
import UpgradePrompt from '@/components/shared/UpgradePrompt';

export default function UsageDashboard() {
  const { currentPlan, userSubscription, usageStats } = useSubscription();
  const [detailedUsage, setDetailedUsage] = useState<any>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');

  useEffect(() => {
    if (usageStats) {
      loadDetailedUsage();
    }
  }, [usageStats]);

  const loadDetailedUsage = async () => {
    // This would load detailed usage from your API
    // For now, we'll use the stats from the subscription hook
  };

  const getUsagePercentage = (current: number, limit: number): number => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-amber-600';
    return 'text-green-600';
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const handleUpgradeClick = (feature: string) => {
    setUpgradeFeature(feature);
    setShowUpgradePrompt(true);
  };

  const getUpgradeMessage = (feature: string): string => {
    switch (feature) {
      case 'templates':
        return 'You\'re approaching your template limit. Upgrade to create more templates.';
      case 'exports':
        return 'You\'re approaching your export limit. Upgrade for more exports.';
      case 'storage':
        return 'You\'re approaching your storage limit. Upgrade for more storage.';
      default:
        return 'Upgrade your plan to unlock more features.';
    }
  };

  if (!usageStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading usage statistics...</p>
        </div>
      </div>
    );
  }

  const featureLimits = getFeatureLimits(currentPlan.id);
  const upgradeRecommendation = getUpgradeRecommendation(currentPlan.id, usageStats);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Usage Dashboard</h2>
        <p className="text-gray-600">
          Monitor your usage and plan limits
        </p>
      </div>

      {/* Current Plan Status */}
      <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            {currentPlan.id === 'free' ? (
              <Zap className="h-6 w-6 text-amber-600" />
            ) : (
              <Crown className="h-6 w-6 text-amber-600" />
            )}
          </div>
          <CardTitle className="text-xl text-amber-800">
            {currentPlan.name} Plan
          </CardTitle>
          <CardDescription className="text-amber-700">
            {userSubscription ? 'Active subscription' : 'Free plan'}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Usage Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Templates */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats.templates_created}
              {featureLimits.templates !== -1 && (
                <span className="text-sm text-muted-foreground"> / {featureLimits.templates}</span>
              )}
            </div>
            {featureLimits.templates !== -1 && (
              <Progress 
                value={getUsagePercentage(usageStats.templates_created, featureLimits.templates)} 
                className="mt-2"
              />
            )}
            {isApproachingLimit(usageStats.templates_created, featureLimits.templates) && (
              <div className="flex items-center mt-2 text-amber-600 text-sm">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Approaching limit
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Exports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Exports</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats.monthly_exports}
              {featureLimits.exports !== -1 && (
                <span className="text-sm text-muted-foreground"> / {featureLimits.exports}</span>
              )}
            </div>
            {featureLimits.exports !== -1 && (
              <Progress 
                value={getUsagePercentage(usageStats.monthly_exports, featureLimits.exports)} 
                className="mt-2"
              />
            )}
            {isApproachingLimit(usageStats.monthly_exports, featureLimits.exports) && (
              <div className="flex items-center mt-2 text-amber-600 text-sm">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Approaching limit
              </div>
            )}
          </CardContent>
        </Card>

        {/* Storage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats.storage_used}
              <span className="text-sm text-muted-foreground"> / {featureLimits.storage}</span>
            </div>
            <Progress 
              value={getUsagePercentage(
                parseFloat(usageStats.storage_used), 
                parseFloat(featureLimits.storage)
              )} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* Custom Fonts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custom Fonts</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.custom_fonts || 0}</div>
            <div className="flex items-center mt-2">
              {featureLimits.customFonts ? (
                <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span className="text-sm text-muted-foreground">
                {featureLimits.customFonts ? 'Available' : 'Not available'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Availability */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Feature Availability
          </CardTitle>
          <CardDescription>
            Features available with your current plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">High-Resolution Export</span>
                <Badge variant={featureLimits.highResExport ? "default" : "secondary"}>
                  {featureLimits.highResExport ? "Available" : "Premium"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">PDF Export</span>
                <Badge variant={featureLimits.pdfExport ? "default" : "secondary"}>
                  {featureLimits.pdfExport ? "Available" : "Premium"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Bulk Generation</span>
                <Badge variant={featureLimits.bulkGeneration ? "default" : "secondary"}>
                  {featureLimits.bulkGeneration ? "Available" : "Premium"}
                </Badge>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">White Label</span>
                <Badge variant={featureLimits.whiteLabel ? "default" : "secondary"}>
                  {featureLimits.whiteLabel ? "Available" : "Premium"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Access</span>
                <Badge variant={featureLimits.apiAccess ? "default" : "secondary"}>
                  {featureLimits.apiAccess ? "Available" : "Premium"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Priority Support</span>
                <Badge variant={featureLimits.prioritySupport ? "default" : "secondary"}>
                  {featureLimits.prioritySupport ? "Available" : "Premium"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Recommendations */}
      {upgradeRecommendation && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Upgrade Recommendation
            </CardTitle>
            <CardDescription className="text-blue-700">
              {upgradeRecommendation}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => handleUpgradeClick('plan')}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
            >
              View Upgrade Options
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Usage Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Tips</CardTitle>
          <CardDescription>
            Make the most of your current plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Optimize Storage</p>
              <p className="text-sm text-gray-600">
                Use compressed images and remove unused templates to save storage space.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Batch Exports</p>
              <p className="text-sm text-gray-600">
                Export multiple templates at once to make the most of your monthly limit.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Template Reuse</p>
              <p className="text-sm text-gray-600">
                Duplicate and modify existing templates instead of creating new ones.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Prompt Modal */}
      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        feature={upgradeFeature}
        currentTier={currentPlan.id}
        message={getUpgradeMessage(upgradeFeature)}
        showPlans={true}
      />
    </div>
  );
}
