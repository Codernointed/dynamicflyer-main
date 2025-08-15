/**
 * Feature Demo Component
 * Demonstrates the feature gating system in action
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Zap, Users, Building2, Award, Download, Upload, FileText, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FeatureGate } from './FeatureGate';

export default function FeatureDemo() {
  const features = [
    {
      id: 'create_template',
      name: 'Create Template',
      description: 'Create new design templates',
      icon: <FileText className="h-5 w-5" />,
      tier: 'free',
      available: true,
    },
    {
      id: 'export_template',
      name: 'Export Template',
      description: 'Download your designs',
      icon: <Download className="h-5 w-5" />,
      tier: 'free',
      available: true,
    },
    {
      id: 'upload_font',
      name: 'Custom Fonts',
      description: 'Upload and use custom fonts',
      icon: <Upload className="h-5 w-5" />,
      tier: 'student_pro',
      available: false,
    },
    {
      id: 'pdf_export',
      name: 'PDF Export',
      description: 'Export designs as PDF files',
      icon: <FileText className="h-5 w-5" />,
      tier: 'creator_pro',
      available: false,
    },
    {
      id: 'high_res_export',
      name: 'High-Resolution Export',
      description: 'Export in high quality formats',
      icon: <Download className="h-5 w-5" />,
      tier: 'student_pro',
      available: false,
    },
    {
      id: 'bulk_generation',
      name: 'Bulk Generation',
      description: 'Generate multiple designs at once',
      icon: <Settings className="h-5 w-5" />,
      tier: 'department',
      available: false,
    },
  ];

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'free': return <Star className="h-4 w-4 text-gray-500" />;
      case 'student_pro': return <Zap className="h-4 w-4 text-blue-500" />;
      case 'creator_pro': return <Crown className="h-4 w-4 text-purple-500" />;
      case 'department': return <Users className="h-4 w-4 text-green-500" />;
      case 'church': return <Building2 className="h-4 w-4 text-amber-500" />;
      case 'faculty': return <Award className="h-4 w-4 text-red-500" />;
      default: return <Star className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTierName = (tier: string) => {
    switch (tier) {
      case 'free': return 'Free';
      case 'student_pro': return 'Student Pro';
      case 'creator_pro': return 'Creator Pro';
      case 'department': return 'Department';
      case 'church': return 'Church';
      case 'faculty': return 'Faculty';
      default: return 'Free';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Feature Access Demo
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          See how the feature gating system controls access to different features based on your subscription tier.
          Try clicking on features to see upgrade prompts.
        </p>
      </motion.div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <FeatureGate 
              feature={feature.id} 
              showUpgradePrompt={true}
            >
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      {feature.icon}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {getTierIcon(feature.tier)}
                      {getTierName(feature.tier)}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{feature.name}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant={feature.available ? "default" : "secondary"}>
                        {feature.available ? 'Available' : 'Locked'}
                      </Badge>
                    </div>
                    
                    {feature.available ? (
                      <Button className="w-full" variant="outline">
                        Use Feature
                      </Button>
                    ) : (
                      <Button 
                        className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white"
                        onClick={() => window.location.href = '/dashboard/subscription'}
                      >
                        Upgrade to {getTierName(feature.tier)}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </FeatureGate>
          </motion.div>
        ))}
      </div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-amber-800">
              How Feature Gating Works
            </CardTitle>
            <CardDescription className="text-amber-700">
              Understanding the subscription-based access control system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-amber-800 mb-2">Feature Detection</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• System checks your current subscription tier</li>
                  <li>• Compares against feature requirements</li>
                  <li>• Shows/hides features accordingly</li>
                  <li>• Provides upgrade prompts when needed</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-amber-800 mb-2">Usage Tracking</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Monitors feature usage in real-time</li>
                  <li>• Enforces monthly limits</li>
                  <li>• Shows usage warnings</li>
                  <li>• Tracks for analytics and billing</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-white/50 rounded-lg">
              <h4 className="font-semibold text-amber-800 mb-2">Current Implementation</h4>
              <p className="text-sm text-amber-700">
                This demo shows the FeatureGate component in action. Features are automatically 
                gated based on your subscription tier, and upgrade prompts appear when you try 
                to access locked features. The system integrates seamlessly with the subscription 
                management and usage tracking systems.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

