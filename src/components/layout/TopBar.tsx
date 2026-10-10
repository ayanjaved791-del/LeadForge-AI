import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  Plus, 
  FileSpreadsheet, 
  LogOut, 
  User as UserIcon, 
  ChevronDown,
  LocateFixed,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import type { NavigationTab } from './Sidebar.js';

interface TopBarProps {
  onOpenMobileSidebar: () => void;
  onNavigate: (tab: NavigationTab) => void;
  onOpenAddLeadModal: () => void;
  onOpenCsvImportModal: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenMobileSidebar,
  onNavigate,
  onOpenAddLeadModal,
  onOpenCsvImportModal,
  searchQuery,
  setSearchQuery,
}) => {
  const { currentUser, isDemoUser, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-neutral-800 bg-black/90 backdrop-blur-md px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2.5 sm:gap-4">
      {/* Left: Mobile hamburger & Global Search */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-lg">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-1.5 sm:p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors shrink-0"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative w-full min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads, companies, locations..."
            className="w-full pl-9 pr-8 sm:pr-4 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-white focus:ring-1 focus:ring-white/20 transition-all truncate"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Quick actions, notifications, user avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Quick Actions */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => onNavigate('find-leads')}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-yellow-500/25 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 text-xs font-medium transition-colors"
            title="Ask for real-time location & discover companies near you on Google Maps"
          >
            <LocateFixed className="h-3.5 w-3.5 text-yellow-400" />
            <span>Near Me</span>
          </button>

          <button
            onClick={onOpenCsvImportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-750 bg-neutral-900 hover:bg-neutral-800 hover:text-white text-xs font-medium text-neutral-300 transition-colors"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-neutral-400" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={onOpenAddLeadModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-colors shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 text-black" />
            <span>Add Lead</span>
          </button>
        </div>

        {/* Notifications Icon */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_5px_rgba(255,255,255,0.9)]" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-neutral-800 bg-neutral-950 p-3 shadow-xl backdrop-blur-md z-50 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-2">
                <span className="font-semibold text-white">Notifications</span>
                <span className="text-[10px] text-neutral-500">Workspace updates</span>
              </div>
              <div className="py-6 text-center text-neutral-500 text-xs">
                No new notifications. Real-time updates appear here when leads are scored.
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-900 transition-colors"
          >
            <img
              src={currentUser?.photoURL || '/src/assets/images/leadforge_user_avatar_1791391664859.jpg'}
              alt={currentUser?.displayName || 'User'}
              className="h-7 w-7 rounded-full object-cover border border-neutral-700 grayscale contrast-125"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="hidden sm:block text-left text-xs">
              <div className="font-medium text-white max-w-[120px] truncate leading-tight">
                {currentUser?.displayName || 'Alex Vance'}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-800 bg-neutral-950 p-2 shadow-xl backdrop-blur-md z-50 text-xs">
              <div className="px-3 py-2 border-b border-neutral-800 mb-1">
                <div className="font-semibold text-white truncate">
                  {currentUser?.displayName || 'Sales Operator'}
                </div>
                <div className="text-[11px] text-neutral-400 truncate">
                  {currentUser?.email || 'operator@leadforge.ai'}
                </div>
                {isDemoUser && (
                  <span className="inline-block mt-1 text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-neutral-900 text-neutral-300 border border-neutral-700">
                    Live Demo Workspace
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  onNavigate('settings');
                  setProfileDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors"
              >
                <UserIcon className="h-3.5 w-3.5 text-neutral-400" />
                <span>Account & Preferences</span>
              </button>

              <div className="my-1 border-t border-neutral-800" />

              <button
                onClick={() => {
                  logout();
                  setProfileDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
