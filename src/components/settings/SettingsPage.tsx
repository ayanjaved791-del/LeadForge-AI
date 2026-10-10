import React, { useState } from 'react';
import { 
  User, 
  Sparkles, 
  Bell, 
  Database, 
  RotateCcw, 
  Save
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useLeads } from '../../context/LeadContext.js';
import { useToast } from '../common/Toast.js';

export const SettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { resetToDemoData } = useLeads();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || 'Alex Vance');
  const [email] = useState(currentUser?.email || 'operator@leadforge.ai');
  const [company, setCompany] = useState(currentUser?.company || 'LeadForge Growth Labs');
  const [defaultService, setDefaultService] = useState('Website Development');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [hotLeadNotifications, setHotLeadNotifications] = useState(true);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Workspace settings saved', 'success');
  };

  const handleResetDemo = () => {
    if (confirm('Reset workspace database to initial verified demo leads, campaigns, and outreach?')) {
      resetToDemoData();
      showToast('Workspace reset to initial seed data', 'info');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white font-heading">
          Workspace Settings
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Manage your operator profile, AI customization defaults, and data preferences.
        </p>
      </div>

      <div className="space-y-5">
        {/* Profile Settings */}
        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
            <User className="h-4 w-4 text-white" />
            <h2 className="text-sm font-semibold text-white font-heading">Operator Profile</h2>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white focus:outline-hidden focus:border-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950/60 border border-neutral-850 text-neutral-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-300 mb-1">Organization / Agency Name</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white focus:outline-hidden focus:border-white"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black font-semibold text-xs"
              >
                <Save className="h-3.5 w-3.5 text-black" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        </div>

        {/* AI Analysis Defaults */}
        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
            <Sparkles className="h-4 w-4 text-white" />
            <h2 className="text-sm font-semibold text-white font-heading">AI Analysis Defaults</h2>
          </div>

          <div className="text-xs">
            <label className="block text-[11px] font-medium text-neutral-300 mb-1">Primary Target Service Focus</label>
            <select
              value={defaultService}
              onChange={(e) => setDefaultService(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-white focus:outline-hidden"
            >
              <option value="Website Development">Website Development</option>
              <option value="AI Chatbot">AI Chatbot</option>
              <option value="Software Development">Software Development</option>
              <option value="SEO">SEO</option>
              <option value="Custom Service">Custom Service</option>
            </select>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
            <Bell className="h-4 w-4 text-white" />
            <h2 className="text-sm font-semibold text-white font-heading">Notification Preferences</h2>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 cursor-pointer">
              <div>
                <span className="font-medium text-white block">Hot Lead Notifications</span>
                <span className="text-[11px] text-neutral-500">Alert when a lead scores 85+ during AI analysis</span>
              </div>
              <input
                type="checkbox"
                checked={hotLeadNotifications}
                onChange={(e) => setHotLeadNotifications(e.target.checked)}
                className="h-4 w-4 rounded-sm border-neutral-700 bg-neutral-900 text-white focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 cursor-pointer">
              <div>
                <span className="font-medium text-white block">Pipeline Scoring Updates</span>
                <span className="text-[11px] text-neutral-500">Digest of newly analyzed leads and opportunity scores</span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="h-4 w-4 rounded-sm border-neutral-700 bg-neutral-900 text-white focus:ring-0"
              />
            </label>
          </div>
        </div>

        {/* Database Management */}
        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
            <Database className="h-4 w-4 text-white" />
            <h2 className="text-sm font-semibold text-white font-heading">Database & Cache Management</h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-medium text-white block">Clear Local Leads Storage</span>
              <span className="text-[11px] text-neutral-500">
                Purge locally cached lead records from browser storage.
              </span>
            </div>

            <button
              onClick={() => {
                if (confirm('Clear local lead cache?')) {
                  resetToDemoData();
                  showToast('Local database cache cleared', 'info');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-750 bg-neutral-950 hover:bg-neutral-850 text-neutral-200 hover:text-white transition-colors shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5 text-neutral-400" />
              <span>Clear Cache</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
