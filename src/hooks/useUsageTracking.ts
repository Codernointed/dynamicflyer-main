/**
 * Usage Tracking Hook
 * Tracks feature usage for analytics and subscription limits
 */

import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UsageAction {
  action: 'template_created' | 'template_exported' | 'font_uploaded' | 'api_call';
  resource_id?: string;
  metadata?: Record<string, any>;
}

export interface UsageStats {
  templates_created: number;
  monthly_exports: number;
  fonts_uploaded: number;
  api_calls: number;
  last_updated: string;
}

export function useUsageTracking() {
  const { user } = useAuth();

  /**
   * Log a feature usage action
   */
  const logUsage = useCallback(async (usageAction: UsageAction) => {
    if (!user) {
      console.warn('Cannot log usage: user not authenticated');
      return false;
    }

    try {
      const { error } = await supabase
        .from('usage_logs')
        .insert({
          user_id: user.id,
          action: usageAction.action,
          resource_id: usageAction.resource_id,
          metadata: usageAction.metadata || {},
        });

      if (error) {
        console.error('Failed to log usage:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error logging usage:', error);
      return false;
    }
  }, [user]);

  /**
   * Get current usage statistics for the user
   */
  const getUsageStats = useCallback(async (): Promise<UsageStats | null> => {
    if (!user) return null;

    try {
      // Get current month's start date
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Get template count for current month
      const { count: templatesCreated } = await supabase
        .from('templates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      // Get export count for current month
      const { count: monthlyExports } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('action', 'template_exported')
        .gte('created_at', startOfMonth.toISOString());

      // Get font upload count for current month
      const { count: fontsUploaded } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('action', 'font_uploaded')
        .gte('created_at', startOfMonth.toISOString());

      // Get API call count for current month
      const { count: apiCalls } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('action', 'api_call')
        .gte('created_at', startOfMonth.toISOString());

      return {
        templates_created: templatesCreated || 0,
        monthly_exports: monthlyExports || 0,
        fonts_uploaded: fontsUploaded || 0,
        api_calls: apiCalls || 0,
        last_updated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      return null;
    }
  }, [user]);

  /**
   * Check if user has reached a specific usage limit
   */
  const checkUsageLimit = useCallback(async (
    action: UsageAction['action'],
    limit: number
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('action', action)
        .gte('created_at', startOfMonth.toISOString());

      return (count || 0) < limit;
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return false;
    }
  }, [user]);

  /**
   * Get remaining usage for a specific action
   */
  const getRemainingUsage = useCallback(async (
    action: UsageAction['action'],
    limit: number
  ): Promise<number> => {
    if (!user) return 0;

    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('action', action)
        .gte('created_at', startOfMonth.toISOString());

      const used = count || 0;
      return Math.max(0, limit - used);
    } catch (error) {
      console.error('Error getting remaining usage:', error);
      return 0;
    }
  }, [user]);

  /**
   * Track template creation
   */
  const trackTemplateCreation = useCallback(async (templateId: string, metadata?: Record<string, any>) => {
    const success = await logUsage({
      action: 'template_created',
      resource_id: templateId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    });

    if (success) {
      console.log('Template creation usage logged successfully');
    }

    return success;
  }, [logUsage]);

  /**
   * Track template export
   */
  const trackTemplateExport = useCallback(async (templateId: string, format: string, metadata?: Record<string, any>) => {
    const success = await logUsage({
      action: 'template_exported',
      resource_id: templateId,
      metadata: {
        format,
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    });

    if (success) {
      console.log('Template export usage logged successfully');
    }

    return success;
  }, [logUsage]);

  /**
   * Track font upload
   */
  const trackFontUpload = useCallback(async (fontId: string, metadata?: Record<string, any>) => {
    const success = await logUsage({
      action: 'font_uploaded',
      resource_id: fontId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    });

    if (success) {
      console.log('Font upload usage logged successfully');
    }

    return success;
  }, [logUsage]);

  /**
   * Track API call
   */
  const trackApiCall = useCallback(async (endpoint: string, metadata?: Record<string, any>) => {
    const success = await logUsage({
      action: 'api_call',
      resource_id: endpoint,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    });

    if (success) {
      console.log('API call usage logged successfully');
    }

    return success;
  }, [logUsage]);

  /**
   * Get usage summary for display
   */
  const getUsageSummary = useCallback(async () => {
    const stats = await getUsageStats();
    if (!stats) return null;

    // Get actual limits from feature gating system
    const tier = user?.user_metadata?.subscription_tier || 'free';
    const { getFeatureLimits } = await import('@/lib/featureGating');
    const limits = getFeatureLimits(tier);

    return {
      templates: {
        used: stats.templates_created,
        limit: limits.templates,
        remaining: limits.templates === -1 ? -1 : Math.max(0, limits.templates - stats.templates_created),
        percentage: limits.templates === -1 ? 0 : Math.min(100, (stats.templates_created / limits.templates) * 100),
      },
      exports: {
        used: stats.monthly_exports,
        limit: limits.exports,
        remaining: limits.exports === -1 ? -1 : Math.max(0, limits.exports - stats.monthly_exports),
        percentage: limits.exports === -1 ? 0 : Math.min(100, (stats.monthly_exports / limits.exports) * 100),
      },
      fonts: {
        used: stats.fonts_uploaded,
        limit: limits.customFonts ? -1 : 0,
        remaining: limits.customFonts ? -1 : 0,
        percentage: limits.customFonts ? 0 : 100,
      },
    };
  }, [getUsageStats, user]);

  /**
   * Show usage limit warning
   */
  const showUsageWarning = useCallback((action: string, remaining: number) => {
    if (remaining <= 2) {
      toast.warning(
        `Usage Limit Warning: You have ${remaining} ${action} remaining this month.`,
        {
          duration: 5000,
          action: {
            label: 'Upgrade',
            onClick: () => window.location.href = '/dashboard/subscription',
          },
        }
      );
    }
  }, []);

  return {
    // Core functions
    logUsage,
    getUsageStats,
    checkUsageLimit,
    getRemainingUsage,

    // Specific tracking functions
    trackTemplateCreation,
    trackTemplateExport,
    trackFontUpload,
    trackApiCall,

    // Utility functions
    getUsageSummary,
    showUsageWarning,
  };
}
