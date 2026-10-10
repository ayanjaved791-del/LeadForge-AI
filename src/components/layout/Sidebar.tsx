import React from 'react';
import { 
  Search, 
  Users, 
  BarChart3,
  Send,
  Settings, 
  HelpCircle, 
  Sparkles,
  X
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext.js';

export type NavigationTab = 
  | 'dashboard' 
  | 'find-leads' 
  | 'my-leads' 
  | 'campaigns' 
  | 'outreach' 
  | 'analytics' 
  | 'settings' 
  | 'help';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  onSelectTab, 
  isOpenMobile, 
  onCloseMobile 
}) => {
  const { leads, outreach } = useLeads();

  const hotLeadsCount = leads.filter(l => l.scoreCategory === 'Hot').length;

  const navItems = [
    {
      id: 'find-leads' as NavigationTab,
      label: 'Find Leads',
      icon: Search,
    },
    {
      id: 'my-leads' as NavigationTab,
      label: 'My Leads',
      icon: Users,
      badge: leads.length,
    },
    {
      id: 'outreach' as NavigationTab,
      label: 'Outreach & Drafts',
      icon: Send,
      badge: outreach?.length || 0,
    },
    {
      id: 'analytics' as NavigationTab,
      label: 'Analytics',
      icon: BarChart3,
    },
  ];

  const bottomItems = [
    {
      id: 'settings' as NavigationTab,
      label: 'Settings',
      icon: Settings,
    },
    {
      id: 'help' as NavigationTab,
      label: 'Help & Docs',
      icon: HelpCircle,
    },
  ];

  const handleNav = (tab: NavigationTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 max-w-[85vw] border-r border-neutral-800 bg-black flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Lockup */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black font-bold">
              <Sparkles className="h-4 w-4 text-black" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white block font-heading">
                LeadForge AI
              </span>
              <span className="text-[10px] text-neutral-400 font-medium block">
                B2B Outreach Platform
              </span>
            </div>
          </div>
          <button 
            onClick={onCloseMobile}
            className="lg:hidden text-neutral-400 hover:text-white p-1 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Opportunity Stats Bar */}
        <div className="mx-3 my-3 p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-medium text-neutral-300">Hot Pipeline Leads</span>
            <span className="font-mono tabular-nums text-white font-semibold">{hotLeadsCount}</span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-1 overflow-hidden">
            <div 
              className="bg-white h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(15, (hotLeadsCount / Math.max(1, leads.length)) * 100))}%` }}
            />
          </div>
        </div>

        {/* Primary Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-black' : 'text-neutral-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`font-mono tabular-nums text-[11px] px-1.5 py-0.2 rounded-md ${
                    isActive ? 'bg-neutral-200 text-black font-semibold' : 'text-neutral-400 bg-neutral-850'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-neutral-800 space-y-1">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white text-black font-semibold'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-black' : 'text-neutral-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
};
