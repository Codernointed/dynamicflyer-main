/**
 * Dashboard Sidebar Component
 * Navigation sidebar for the dashboard with template categories and actions
 */

import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutTemplate, 
  Plus, 
  FileImage, 
  Award, 
  FileText, 
  CreditCard, 
  Mail, 
  Share2, 
  BarChart3,
  X,
  Sparkles,
  Type
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface DashboardSidebarProps {
  onClose?: () => void;
}

const templateCategories = [
  { id: 'all', name: 'All Templates', icon: LayoutTemplate, count: 0 },
  { id: 'flyers', name: 'Flyers', icon: FileImage, count: 0 },
  { id: 'certificates', name: 'Certificates', icon: Award, count: 0 },
  { id: 'brochures', name: 'Brochures', icon: FileText, count: 0 },
  { id: 'business-cards', name: 'Business Cards', icon: CreditCard, count: 0 },
  { id: 'invitations', name: 'Invitations', icon: Mail, count: 0 },
  { id: 'social', name: 'Social Media', icon: Share2, count: 0 },
];

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutTemplate },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Fonts', href: '/dashboard/fonts', icon: Type },
];

export default function DashboardSidebar({ onClose }: DashboardSidebarProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full w-full flex-col bg-white shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">TemplateHub</h2>
            <p className="text-xs text-gray-500">Design Platform</p>
          </div>
        </div>
        
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="md:hidden">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Create New Template */}
      <div className="p-6 pb-4">
        <Button className="w-full" size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Create New Template
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-6">
        {/* Navigation */}
        <div className="mb-8">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
            Navigation
          </h3>
          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-50 text-amber-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        <Separator className="mb-6" />

        {/* Template Categories */}
        <div>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
            Template Categories
          </h3>
          <nav className="space-y-1">
            {templateCategories.map((category) => (
              <NavLink
                key={category.id}
                to={`/dashboard?category=${category.id}`}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-50 text-amber-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <category.icon className="h-4 w-4" />
                  {category.name}
                </div>
                {category.count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {category.count}
                  </Badge>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 pt-4 border-t">
        <div className="rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-gray-900">Pro Features</span>
          </div>
          <p className="text-xs text-gray-600 mb-3">
            Unlock advanced templates, analytics, and unlimited exports.
          </p>
          <Button size="sm" className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white border-0">
            Upgrade to Pro
          </Button>
        </div>
      </div>
    </motion.div>
  );
} 