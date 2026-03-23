/**
 * Feature Gating System
 * Controls access to features based on subscription tiers and usage limits
 */

import { toast } from 'sonner';

export interface FeatureLimits {
  templates: number;
  exports: number;
  storage: string;
  customFonts: boolean;
  pdfExport: boolean;
  highResExport: boolean;
  bulkGeneration: boolean;
  whiteLabel: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

export interface FeatureGate {
  feature: string;
  requiredTier: string;
  message: string;
  upgradeUrl?: string;
}

export const FEATURE_GATES: Record<string, FeatureGate> = {
  create_template: {
    feature: 'Create Template',
    requiredTier: 'free',
    message: 'You can create templates with your current plan.',
  },
  export_template: {
    feature: 'Export Template',
    requiredTier: 'free',
    message: 'You can export templates with your current plan.',
  },
  upload_font: {
    feature: 'Upload Custom Font',
    requiredTier: 'student_pro',
    message: 'Custom font uploads require Student Pro or higher.',
    upgradeUrl: '/dashboard/subscription',
  },
  pdf_export: {
    feature: 'PDF Export',
    requiredTier: 'creator_pro',
    message: 'PDF export requires Creator Pro or higher.',
    upgradeUrl: '/dashboard/subscription',
  },
  high_res_export: {
    feature: 'High-Resolution Export',
    requiredTier: 'student_pro',
    message: 'High-resolution exports require Student Pro or higher.',
    upgradeUrl: '/dashboard/subscription',
  },
  bulk_generation: {
    feature: 'Bulk Generation',
    requiredTier: 'department',
    message: 'Bulk generation requires Department plan or higher.',
    upgradeUrl: '/dashboard/subscription',
  },
  white_label: {
    feature: 'White Label',
    requiredTier: 'church',
    message: 'White label features require Church plan or higher.',
    upgradeUrl: '/dashboard/subscription',
  },
  api_access: {
    feature: 'API Access',
    requiredTier: 'faculty',
    message: 'API access requires Faculty plan or higher.',
    upgradeUrl: '/dashboard/subscription',
  },
  priority_support: {
    feature: 'Priority Support',
    requiredTier: 'student_pro',
    message: 'Priority support requires Student Pro or higher.',
    upgradeUrl: '/dashboard/subscription',
  },
};

export const SUBSCRIPTION_FEATURES: Record<string, FeatureLimits> = {
  free: {
    templates: 3,
    exports: 10,
    storage: '100MB',
    customFonts: false,
    pdfExport: false,
    highResExport: false,
    bulkGeneration: false,
    whiteLabel: false,
    apiAccess: false,
    prioritySupport: false,
  },
  student_pro: {
    templates: 30,
    exports: 150,
    storage: '1GB',
    customFonts: true,
    pdfExport: false,
    highResExport: true,
    bulkGeneration: false,
    whiteLabel: false,
    apiAccess: false,
    prioritySupport: true,
  },
  creator_pro: {
    templates: -1, // Unlimited
    exports: 600,
    storage: '5GB',
    customFonts: true,
    pdfExport: true,
    highResExport: true,
    bulkGeneration: false,
    whiteLabel: false,
    apiAccess: false,
    prioritySupport: true,
  },
  department: {
    templates: -1,
    exports: 1200,
    storage: '10GB',
    customFonts: true,
    pdfExport: true,
    highResExport: true,
    bulkGeneration: true,
    whiteLabel: false,
    apiAccess: false,
    prioritySupport: true,
  },
  church: {
    templates: -1,
    exports: 2500,
    storage: '20GB',
    customFonts: true,
    pdfExport: true,
    highResExport: true,
    bulkGeneration: true,
    whiteLabel: true,
    apiAccess: false,
    prioritySupport: true,
  },
  faculty: {
    templates: -1,
    exports: 6000,
    storage: '50GB',
    customFonts: true,
    pdfExport: true,
    highResExport: true,
    bulkGeneration: true,
    whiteLabel: true,
    apiAccess: true,
    prioritySupport: true,
  },
};

/**
 * Check if user can access a feature
 */
export function canAccessFeature(
  feature: string,
  currentTier: string,
  usageStats?: {
    templates_created: number;
    monthly_exports: number;
  }
): boolean {
  const gate = FEATURE_GATES[feature];
  if (!gate) return true; // No gate defined, allow access

  const currentTierIndex = getTierIndex(currentTier);
  const requiredTierIndex = getTierIndex(gate.requiredTier);

  if (currentTierIndex < requiredTierIndex) {
    return false;
  }

  // Check usage limits for specific features
  if (feature === 'create_template' && usageStats) {
    const limits = SUBSCRIPTION_FEATURES[currentTier];
    if (limits.templates !== -1 && usageStats.templates_created >= limits.templates) {
      return false;
    }
  }

  if (feature === 'export_template' && usageStats) {
    const limits = SUBSCRIPTION_FEATURES[currentTier];
    if (limits.exports !== -1 && usageStats.monthly_exports >= limits.exports) {
      return false;
    }
  }

  return true;
}

/**
 * Get tier index for comparison
 */
function getTierIndex(tier: string): number {
  const tierOrder = ['free', 'student_pro', 'creator_pro', 'department', 'church', 'faculty'];
  return tierOrder.indexOf(tier);
}

/**
 * Check feature access and show upgrade prompt if needed
 */
export function checkFeatureAccess(
  feature: string,
  currentTier: string,
  usageStats?: {
    templates_created: number;
    monthly_exports: number;
  }
): boolean {
  const hasAccess = canAccessFeature(feature, currentTier, usageStats);
  
  if (!hasAccess) {
    const gate = FEATURE_GATES[feature];
    if (gate) {
      showUpgradePrompt(gate);
    }
  }
  
  return hasAccess;
}

/**
 * Show upgrade prompt
 */
function showUpgradePrompt(gate: FeatureGate): void {
  toast.error(
    `${gate.feature}: ${gate.message}`,
    {
      duration: 5000,
      action: gate.upgradeUrl ? {
        label: 'Upgrade',
        onClick: () => window.location.href = gate.upgradeUrl!,
      } : undefined,
    }
  );
}

/**
 * Get feature limits for current tier
 */
export function getFeatureLimits(tier: string): FeatureLimits {
  return SUBSCRIPTION_FEATURES[tier] || SUBSCRIPTION_FEATURES.free;
}

/**
 * Check if user has reached template limit
 */
export function hasReachedTemplateLimit(
  currentTier: string,
  templatesCreated: number
): boolean {
  const limits = SUBSCRIPTION_FEATURES[currentTier];
  if (!limits || limits.templates === -1) return false;
  return templatesCreated >= limits.templates;
}

/**
 * Check if user has reached export limit
 */
export function hasReachedExportLimit(
  currentTier: string,
  monthlyExports: number
): boolean {
  const limits = SUBSCRIPTION_FEATURES[currentTier];
  if (!limits || limits.exports === -1) return false;
  return monthlyExports >= limits.exports;
}

/**
 * Get remaining templates count
 */
export function getRemainingTemplates(
  currentTier: string,
  templatesCreated: number
): number {
  const limits = SUBSCRIPTION_FEATURES[currentTier];
  if (!limits || limits.templates === -1) return -1; // Unlimited
  return Math.max(0, limits.templates - templatesCreated);
}

/**
 * Get remaining exports count
 */
export function getRemainingExports(
  currentTier: string,
  monthlyExports: number
): number {
  const limits = SUBSCRIPTION_FEATURES[currentTier];
  if (!limits || limits.exports === -1) return -1; // Unlimited
  return Math.max(0, limits.exports - monthlyExports);
}

/**
 * Log feature usage
 */
export async function logFeatureUsage(
  feature: string,
  userId: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    // This would typically call your Supabase API
    // For now, we'll just log to console
    console.log('Feature usage logged:', { feature, userId, metadata, timestamp: new Date() });
  } catch (error) {
    console.error('Failed to log feature usage:', error);
  }
}

/**
 * Get upgrade recommendation based on current usage
 */
export function getUpgradeRecommendation(
  currentTier: string,
  usageStats: {
    templates_created: number;
    monthly_exports: number;
  }
): string | null {
  const limits = SUBSCRIPTION_FEATURES[currentTier];
  if (!limits) return null;

  // Check if user is hitting limits
  if (limits.templates !== -1 && usageStats.templates_created >= limits.templates * 0.8) {
    return 'You\'re approaching your template limit. Consider upgrading to create more templates.';
  }

  if (limits.exports !== -1 && usageStats.monthly_exports >= limits.exports * 0.8) {
    return 'You\'re approaching your export limit. Consider upgrading for more exports.';
  }

  return null;
}
