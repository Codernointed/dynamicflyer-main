/**
 * Dashboard Sidebar Component
 * Navigation sidebar for the dashboard with template categories and actions
 */

import { NavLink, useLocation } from 'react-router-dom';
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
  Type,
  Download,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface DashboardSidebarProps {
  onClose?: () => void;
  onToggle?: () => void;
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
  { name: 'Downloads', href: '/dashboard/downloads', icon: Download },
  { name: 'Subscription', href: '/dashboard/subscription', icon: CreditCard },
];

export default function DashboardSidebar({ onClose, onToggle }: DashboardSidebarProps) {
  const location = useLocation();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full w-full flex-col bg-white border-r border-slate-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-200">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">GenEdit</h2>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Design Studio</p>
          </div>
        </div>
        
        <div className="flex items-center">
          {onClose && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="md:hidden rounded-full hover:bg-slate-100"
            >
              <X className="h-4 w-4 text-slate-500" />
            </Button>
          )}
        </div>
      </div>

      {/* Create New Template */}
      <div className="p-6 pb-4">
        <Button 
          onClick={() => window.location.href = '/dashboard/editor/new'}
          className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-lg shadow-slate-200 rounded-xl transition-all hover:-translate-y-0.5"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Template
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
        {/* Navigation */}
        <div className="mb-8 mt-2">
          <h3 className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Navigation
          </h3>
          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-50 text-amber-700 shadow-sm shadow-amber-100/50'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <item.icon className={`h-4 w-4 ${location.pathname === item.href ? 'text-amber-600' : 'text-slate-400'}`} />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="px-3">
          <Separator className="bg-slate-100" />
        </div>

        {/* Template Categories */}
        <div className="mt-8">
          <h3 className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Categories
          </h3>
          <nav className="space-y-1">
            {templateCategories.map((category) => (
              <NavLink
                key={category.id}
                to={`/dashboard?category=${category.id}`}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-50 text-amber-700 shadow-sm shadow-amber-100/50'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <category.icon className="h-4 w-4 text-slate-400" />
                  {category.name}
                </div>
                {category.count > 0 && (
                  <Badge variant="secondary" className="text-[10px] font-bold h-5 px-1.5 bg-slate-100 text-slate-600">
                    {category.count}
                  </Badge>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Footer / Pro Upgrade */}
      <div className="p-4 pt-4 border-t border-slate-100 bg-slate-50/50">
        <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-5 text-white shadow-xl">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-amber-400/20 blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 bg-amber-400 rounded-md">
                <Award className="h-3.5 w-3.5 text-slate-900" />
              </div>
              <span className="text-xs font-bold uppercase tracking-tight">Pro Studio</span>
            </div>
            <p className="text-[11px] text-slate-300 mb-4 leading-relaxed">
              Unlock AI enhancements, premium fonts and team collaboration.
            </p>
            <Button size="sm" className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold border-0 shadow-lg shadow-amber-400/20">
              Upgrade Now
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
 