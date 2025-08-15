/**
 * Usage Tracking System
 * Monitors user actions and enforces subscription limits
 */

import { supabase } from '@/integrations/supabase/client';
import { logFeatureUsage } from './featureGating';
import { toast } from 'sonner';

export interface UsageAction {
  action: 'template_created' | 'template_exported' | 'font_uploaded' | 'api_call' | 'storage_used';
  resource_id?: string;
  metadata?: Record<string, any>;
  cost?: number; // For actions that consume resources
}

export interface UsageMetrics {
  templates_created: number;
  monthly_exports: number;
  storage_used: string;
  api_calls: number;
  custom_fonts: number;
}

/**
 * Track user action and check limits
 */
export async function trackUsage(
  userId: string,
  action: UsageAction,
  currentTier: string,
  usageStats: UsageMetrics
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // Check if action is allowed based on current tier and usage
    const isAllowed = await checkUsageLimits(action, currentTier, usageStats);
    
    if (!isAllowed.allowed) {
      return isAllowed;
    }
    
    // Log the action
    await logUsageAction(userId, action);
    
    // Update usage stats in real-time
    await updateUsageStats(userId, action);
    
    return { allowed: true };
  } catch (error) {
    console.error('Usage tracking error:', error);
    return { allowed: false, reason: 'Failed to track usage' };
  }
}

/**
 * Check if action is allowed based on usage limits
 */
async function checkUsageLimits(
  action: UsageAction,
  currentTier: string,
  usageStats: UsageMetrics
): Promise<{ allowed: boolean; reason?: string }> {
  const limits = getTierLimits(currentTier);
  
  switch (action.action) {
    case 'template_created':
      if (limits.templates !== -1 && usageStats.templates_created >= limits.templates) {
        return {
          allowed: false,
          reason: `Template limit reached (${limits.templates}). Upgrade your plan to create more templates.`
        };
      }
      break;
      
    case 'template_exported':
      if (limits.exports !== -1 && usageStats.monthly_exports >= limits.exports) {
        return {
          allowed: false,
          reason: `Monthly export limit reached (${limits.exports}). Upgrade your plan for more exports.`
        };
      }
      break;
      
    case 'font_uploaded':
      if (!limits.customFonts) {
        return {
          allowed: false,
          reason: 'Custom font uploads require Student Pro or higher.'
        };
      }
      break;
      
    case 'storage_used':
      const currentStorage = parseStorageSize(usageStats.storage_used);
      const maxStorage = parseStorageSize(limits.storage);
      if (currentStorage >= maxStorage) {
        return {
          allowed: false,
          reason: `Storage limit reached (${limits.storage}). Upgrade your plan for more storage.`
        };
      }
      break;
  }
  
  return { allowed: true };
}

/**
 * Get tier limits
 */
function getTierLimits(tier: string) {
  const tierLimits = {
    free: { templates: 3, exports: 10, storage: '100MB', customFonts: false },
    student_pro: { templates: 20, exports: 100, storage: '1GB', customFonts: true },
    creator_pro: { templates: -1, exports: 500, storage: '5GB', customFonts: true },
    department: { templates: -1, exports: 1000, storage: '10GB', customFonts: true },
    church: { templates: -1, exports: 2000, storage: '20GB', customFonts: true },
    faculty: { templates: -1, exports: 5000, storage: '50GB', customFonts: true },
  };
  
  return tierLimits[tier as keyof typeof tierLimits] || tierLimits.free;
}

/**
 * Parse storage size string to bytes
 */
function parseStorageSize(size: string): number {
  const units: Record<string, number> = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
    'TB': 1024 * 1024 * 1024 * 1024,
  };
  
  const match = size.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?B)$/i);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  
  return value * (units[unit] || 1);
}

/**
 * Log usage action to database
 */
async function logUsageAction(userId: string, action: UsageAction): Promise<void> {
  try {
    const { error } = await supabase
      .from('usage_logs')
      .insert({
        user_id: userId,
        action: action.action,
        resource_id: action.resource_id,
        metadata: action.metadata || {},
      });
    
    if (error) throw error;
    
    // Also log to feature gating system
    await logFeatureUsage(action.action, userId, action.metadata);
  } catch (error) {
    console.error('Failed to log usage action:', error);
    throw error;
  }
}

/**
 * Update usage stats in real-time
 */
async function updateUsageStats(userId: string, action: UsageAction): Promise<void> {
  try {
    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('monthly_exports')
      .eq('id', userId)
      .single();
    
    if (profileError) throw profileError;
    
    // Update based on action
    const updates: Record<string, any> = {};
    
    if (action.action === 'template_exported') {
      updates.monthly_exports = (profile.monthly_exports || 0) + 1;
    }
    
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
      
      if (updateError) throw updateError;
    }
  } catch (error) {
    console.error('Failed to update usage stats:', error);
    throw error;
  }
}

/**
 * Get current usage statistics
 */
export async function getCurrentUsage(userId: string): Promise<UsageMetrics> {
  try {
    // Get template count
    const { count: templatesCreated } = await supabase
      .from('templates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    // Get monthly exports
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const { count: monthlyExports } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'template_exported')
      .gte('created_at', startOfMonth.toISOString());
    
    // Get custom fonts count
    const { count: customFonts } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'font_uploaded');
    
    // Get API calls count (this month)
    const { count: apiCalls } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'api_call')
      .gte('created_at', startOfMonth.toISOString());
    
    // Calculate storage usage (simplified - you can implement actual calculation)
    const storageUsed = await calculateStorageUsage(userId);
    
    return {
      templates_created: templatesCreated || 0,
      monthly_exports: monthlyExports || 0,
      storage_used: storageUsed,
      api_calls: apiCalls || 0,
      custom_fonts: customFonts || 0,
    };
  } catch (error) {
    console.error('Failed to get current usage:', error);
    return {
      templates_created: 0,
      monthly_exports: 0,
      storage_used: '0B',
      api_calls: 0,
      custom_fonts: 0,
    };
  }
}

/**
 * Calculate storage usage for user
 */
async function calculateStorageUsage(userId: string): Promise<string> {
  try {
    // Get all templates for user
    const { data: templates } = await supabase
      .from('templates')
      .select('background_url')
      .eq('user_id', userId);
    
    if (!templates) return '0B';
    
    // Calculate total size (simplified - you can implement actual file size calculation)
    let totalSize = 0;
    
    // Estimate size based on template count (assuming average 500KB per template)
    totalSize = templates.length * 500 * 1024;
    
    return formatStorageSize(totalSize);
  } catch (error) {
    console.error('Failed to calculate storage usage:', error);
    return '0B';
  }
}

/**
 * Format storage size in human readable format
 */
function formatStorageSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
}

/**
 * Reset monthly usage counters
 */
export async function resetMonthlyUsage(): Promise<void> {
  try {
    // This would typically be a cron job or scheduled function
    // For now, we'll just log that it should happen
    console.log('Monthly usage reset should happen here');
  } catch (error) {
    console.error('Failed to reset monthly usage:', error);
  }
}

/**
 * Show usage limit warning
 */
export function showUsageLimitWarning(
  action: string,
  current: number,
  limit: number,
  upgradeUrl?: string
): void {
  const percentage = (current / limit) * 100;
  
  if (percentage >= 90) {
    toast.warning(
      `Usage Limit Warning: You've used ${current} of ${limit} ${action}s (${percentage.toFixed(1)}%)`,
      { 
        duration: 8000,
        action: upgradeUrl ? {
          label: 'Upgrade Plan',
          onClick: () => window.location.href = upgradeUrl,
        } : undefined,
      }
    );
  }
}

/**
 * Check if user is approaching limits
 */
export function isApproachingLimit(current: number, limit: number, threshold: number = 0.8): boolean {
  if (limit === -1) return false; // Unlimited
  return current >= limit * threshold;
}
