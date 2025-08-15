/**
 * Download Limit Manager Component
 * Allows creators to manage download limits for their templates
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Download, Plus, CreditCard, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface TemplateUsage {
  template_id: string;
  template_name: string;
  download_count: number;
  download_limit: number;
}

const ADDITIONAL_DOWNLOAD_PRICING = {
  50: 10,   // 50 downloads for ₵10
  100: 18,  // 100 downloads for ₵18 (10% discount)
  200: 35,  // 200 downloads for ₵35 (12.5% discount)
  500: 80,  // 500 downloads for ₵80 (20% discount)
};

export default function DownloadLimitManager() {
  const { currentPlan, userSubscription } = useSubscription();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TemplateUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingDownloads, setPurchasingDownloads] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [additionalDownloads, setAdditionalDownloads] = useState<number>(50);
  const [error, setError] = useState<string | null>(null);

  // Load template usage data - prevent infinite loops
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (user?.id && mounted) {
        await loadTemplateUsage();
      }
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
  }, [user?.id]); // Only depend on user ID

  const loadTemplateUsage = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      // Get user's templates
      const { data: userTemplates, error: templatesError } = await supabase
        .from('templates')
        .select('id, name, download_limit')
        .eq('user_id', user.id);

      if (templatesError) {
        console.error('Error fetching templates:', templatesError);
        setError('Failed to load templates. Please try again.');
        return;
      }

      if (!userTemplates || userTemplates.length === 0) {
        setTemplates([]);
        setLoading(false);
        return;
      }

      // Get download counts for each template
      const templateUsage: TemplateUsage[] = [];
      
      for (const template of userTemplates) {
        try {
          // Count template_exported actions in usage_logs
          const { count, error: countError } = await supabase
            .from('usage_logs')
            .select('*', { count: 'exact', head: true })
            .eq('resource_id', template.id)
            .eq('action', 'template_exported');

          if (countError) {
            console.error('Error counting downloads:', countError);
            continue;
          }

          templateUsage.push({
            template_id: template.id,
            template_name: template.name || 'Untitled Template',
            download_count: count || 0,
            download_limit: template.download_limit || 200, // Default limit
          });
        } catch (err) {
          console.error('Error processing template:', template.id, err);
        }
      }

      setTemplates(templateUsage);
    } catch (error) {
      console.error('Error loading template usage:', error);
      setError('Failed to load template usage data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseAdditionalDownloads = async () => {
    if (!selectedTemplate || !additionalDownloads) {
      toast.error('Please select a template and download amount');
      return;
    }

    setPurchasingDownloads(true);
    
    try {
      const price = ADDITIONAL_DOWNLOAD_PRICING[additionalDownloads as keyof typeof ADDITIONAL_DOWNLOAD_PRICING];
      
      // Initialize Paystack payment
      const reference = `DL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user?.id,
          amount: price * 100, // Convert to pesewas
          currency: 'GHS',
          paystack_reference: reference,
          description: `Additional ${additionalDownloads} downloads for template`,
          metadata: {
            template_id: selectedTemplate,
            download_count: additionalDownloads,
            type: 'additional_downloads'
          }
        });

      if (paymentError) throw paymentError;

      // Initialize Paystack
      const handler = (window as any).PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: user?.email,
        amount: price * 100, // Amount in pesewas
        currency: 'GHS',
        ref: reference,
        callback: async (response: any) => {
          try {
            // Update template download limit
            const currentTemplate = templates.find(t => t.template_id === selectedTemplate);
            const newLimit = (currentTemplate?.download_limit || 200) + additionalDownloads;
            
            const { error: updateError } = await supabase
              .from('templates')
              .update({ download_limit: newLimit })
              .eq('id', selectedTemplate);

            if (updateError) throw updateError;

            // Update payment status
            await supabase
              .from('payments')
              .update({ 
                status: 'successful',
                paystack_transaction_id: response.transaction 
              })
              .eq('paystack_reference', reference);

            toast.success(`Successfully added ${additionalDownloads} downloads!`);
            loadTemplateUsage(); // Refresh data
            setSelectedTemplate('');
            setAdditionalDownloads(50);
          } catch (error) {
            console.error('Error processing payment:', error);
            toast.error('Payment successful but failed to update download limit');
          }
        },
        onClose: () => {
          toast.info('Payment cancelled');
        }
      });

      handler.openIframe();
    } catch (error) {
      console.error('Error purchasing downloads:', error);
      toast.error('Failed to initiate payment');
    } finally {
      setPurchasingDownloads(false);
    }
  };

  const totalDownloads = templates.reduce((sum, t) => sum + t.download_count, 0);
  const totalLimits = templates.reduce((sum, t) => sum + t.download_limit, 0);
  const usagePercentage = totalLimits > 0 ? (totalDownloads / totalLimits) * 100 : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-red-600 font-medium">{error}</p>
            <Button 
              variant="outline" 
              onClick={loadTemplateUsage} 
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-amber-600" />
            Download Limits Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalDownloads}</div>
              <div className="text-sm text-gray-600">Total Downloads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalLimits}</div>
              <div className="text-sm text-gray-600">Total Limit</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{templates.length}</div>
              <div className="text-sm text-gray-600">Active Templates</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Overall Usage</span>
              <span className="text-sm font-medium">{usagePercentage.toFixed(1)}%</span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Template Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Template Download Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templates.map((template) => {
              const percentage = template.download_limit > 0 
                ? (template.download_count / template.download_limit) * 100 
                : 0;
              const isNearLimit = percentage >= 80;
              const isAtLimit = percentage >= 100;

              return (
                <div key={template.template_id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{template.template_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={isAtLimit ? 'destructive' : isNearLimit ? 'default' : 'secondary'}>
                          {template.download_count}/{template.download_limit} downloads
                        </Badge>
                        {isAtLimit && (
                          <Badge variant="destructive">Limit Reached</Badge>
                        )}
                        {isNearLimit && !isAtLimit && (
                          <Badge variant="default">Near Limit</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTemplate(template.template_id)}
                      className="ml-2"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Downloads
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Usage</span>
                      <span className="font-medium">{percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                </div>
              );
            })}

            {templates.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Download className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No templates found. Create a template to see download usage.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Purchase Additional Downloads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            Purchase Additional Downloads
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-select">Select Template</Label>
              <select
                id="template-select"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="">Choose a template...</option>
                {templates.map((template) => (
                  <option key={template.template_id} value={template.template_id}>
                    {template.template_name} ({template.download_count}/{template.download_limit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="download-amount">Additional Downloads</Label>
              <select
                id="download-amount"
                value={additionalDownloads}
                onChange={(e) => setAdditionalDownloads(Number(e.target.value))}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
              >
                {Object.entries(ADDITIONAL_DOWNLOAD_PRICING).map(([downloads, price]) => (
                  <option key={downloads} value={downloads}>
                    {downloads} downloads - ₵{price}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-600">
                Adding {additionalDownloads} downloads
              </div>
              <div className="text-lg font-semibold text-gray-900">
                Total: ₵{ADDITIONAL_DOWNLOAD_PRICING[additionalDownloads as keyof typeof ADDITIONAL_DOWNLOAD_PRICING]}
              </div>
            </div>
            
            <Button
              onClick={handlePurchaseAdditionalDownloads}
              disabled={!selectedTemplate || purchasingDownloads}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {purchasingDownloads ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Purchase Downloads
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}