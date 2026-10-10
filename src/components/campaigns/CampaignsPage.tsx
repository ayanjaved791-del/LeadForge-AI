import React, { useState } from 'react';
import { 
  Target, 
  Plus, 
  Trash2, 
  X,
  Layers
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext.js';
import { ScoreBadge } from '../common/ScoreBadge.js';
import { useToast } from '../common/Toast.js';
import type { Lead, LeadStatus } from '../../types/index.js';

interface CampaignsPageProps {
  onSelectLead: (lead: Lead) => void;
}

export const CampaignsPage: React.FC<CampaignsPageProps> = ({ onSelectLead }) => {
  const { campaigns, leads, createCampaign, deleteCampaign, updateLeadStatus } = useLeads();
  const { showToast } = useToast();

  const [activeCampaignId, setActiveCampaignId] = useState<string>(campaigns[0]?.id || '');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Campaign Form
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('Dental Clinics');
  const [location, setLocation] = useState('Dubai');
  const [service, setService] = useState('AI Chatbot');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeCampaign = campaigns.find(c => c.id === activeCampaignId) || campaigns[0];
  const campaignLeads = leads.filter(l => l.campaignId === activeCampaign?.id);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Campaign name is required', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const newCamp = await createCampaign({
        name: name.trim(),
        industry,
        location,
        service,
        description: description.trim(),
      });
      setActiveCampaignId(newCamp.id);
      setIsCreateModalOpen(false);
      setName('');
      setDescription('');
      showToast(`Campaign "${newCamp.name}" created`, 'success');
    } catch (err: any) {
      showToast('Failed to create campaign', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCampaign = async (id: string, campName: string) => {
    if (!confirm(`Delete campaign "${campName}"?`)) return;
    await deleteCampaign(id);
    if (activeCampaignId === id) {
      const remaining = campaigns.filter(c => c.id !== id);
      setActiveCampaignId(remaining[0]?.id || '');
    }
    showToast(`Campaign "${campName}" removed`, 'info');
  };

  // Pipeline Kanban Columns (Monochrome)
  const pipelineColumns: { status: LeadStatus; label: string; color: string }[] = [
    { status: 'New', label: 'New', color: 'border-neutral-700' },
    { status: 'Contacted', label: 'Contacted', color: 'border-neutral-500' },
    { status: 'Replied', label: 'Replied', color: 'border-neutral-400' },
    { status: 'Interested', label: 'Interested', color: 'border-neutral-200' },
    { status: 'Converted', label: 'Converted', color: 'border-white' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-heading">
            Campaigns & CRM Pipeline
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Organize prospects into targeted service initiatives and manage deal velocity.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-colors shadow-xs"
        >
          <Plus className="h-3.5 w-3.5 text-black" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Campaigns Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-neutral-800">
        {campaigns.map((camp) => (
          <button
            key={camp.id}
            onClick={() => setActiveCampaignId(camp.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeCampaign?.id === camp.id
                ? 'bg-white text-black font-semibold shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Target className={`h-3.5 w-3.5 ${activeCampaign?.id === camp.id ? 'text-black' : 'text-neutral-500'}`} />
            <span>{camp.name}</span>
            <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-sm ${
              activeCampaign?.id === camp.id ? 'bg-neutral-200 text-black font-semibold' : 'bg-neutral-800 text-neutral-300'
            }`}>
              {leads.filter(l => l.campaignId === camp.id).length}
            </span>
          </button>
        ))}
      </div>

      {activeCampaign ? (
        <div className="space-y-6">
          {/* Active Campaign Header & Metrics Card */}
          <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base font-bold text-white font-heading">{activeCampaign.name}</h2>
                  <span className="px-2 py-0.5 rounded-md bg-neutral-800 border border-neutral-700 text-white text-[11px] font-mono">
                    {activeCampaign.service}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                  {activeCampaign.description || 'Targeted cold outreach campaign.'}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-neutral-500 mt-2 font-mono">
                  <span>Target: {activeCampaign.industry}</span>
                  <span>·</span>
                  <span>Region: {activeCampaign.location}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteCampaign(activeCampaign.id, activeCampaign.name)}
                  className="p-1.5 rounded-lg border border-neutral-800 text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
                  title="Delete Campaign"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Campaign Performance Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-neutral-800">
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-850">
                <span className="text-[10px] text-neutral-500 block">Total In Campaign</span>
                <span className="text-lg font-bold font-mono text-white">{campaignLeads.length}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-850">
                <span className="text-[10px] text-neutral-500 block">Contacted</span>
                <span className="text-lg font-bold font-mono text-neutral-300">
                  {campaignLeads.filter(l => ['Contacted', 'Replied', 'Interested', 'Converted'].includes(l.status)).length}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-850">
                <span className="text-[10px] text-neutral-500 block">Replies</span>
                <span className="text-lg font-bold font-mono text-white">
                  {campaignLeads.filter(l => ['Replied', 'Interested', 'Converted'].includes(l.status)).length}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-850">
                <span className="text-[10px] text-neutral-500 block">Interested</span>
                <span className="text-lg font-bold font-mono text-white">
                  {campaignLeads.filter(l => ['Interested', 'Converted'].includes(l.status)).length}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-850">
                <span className="text-[10px] text-neutral-500 block">Converted Deals</span>
                <span className="text-lg font-bold font-mono text-white">
                  {campaignLeads.filter(l => l.status === 'Converted').length}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-850">
                <span className="text-[10px] text-neutral-500 block">Reply Rate</span>
                <span className="text-lg font-bold font-mono text-white">
                  {campaignLeads.length ? Math.round((campaignLeads.filter(l => ['Replied', 'Interested', 'Converted'].includes(l.status)).length / campaignLeads.length) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* CRM Visual Pipeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-white" />
                <h3 className="text-sm font-semibold text-white font-heading">Interactive CRM Pipeline</h3>
              </div>
              <span className="text-xs text-neutral-500">
                Move leads through pipeline stages as conversations evolve
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {pipelineColumns.map((col) => {
                const columnLeads = campaignLeads.filter(l => l.status === col.status);
                return (
                  <div
                    key={col.status}
                    className="rounded-xl border border-neutral-800 bg-neutral-900/40 flex flex-col min-h-[380px]"
                  >
                    <div className={`p-3 border-b border-neutral-800 flex items-center justify-between border-t-2 ${col.color}`}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white">{col.label}</span>
                      </div>
                      <span className="text-[11px] font-mono text-neutral-300 bg-neutral-800 px-1.5 py-0.2 rounded-sm">
                        {columnLeads.length}
                      </span>
                    </div>

                    <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[500px]">
                      {columnLeads.length === 0 ? (
                        <div className="p-6 text-center text-[11px] text-neutral-600 italic">
                          No leads in {col.label}
                        </div>
                      ) : (
                        columnLeads.map((lead) => (
                          <div
                            key={lead.id}
                            className="p-3 rounded-lg border border-neutral-800 bg-neutral-950 hover:border-neutral-600 transition-all cursor-pointer group space-y-2"
                            onClick={() => onSelectLead(lead)}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-semibold text-xs text-white line-clamp-1">
                                {lead.companyName}
                              </span>
                              <ScoreBadge score={lead.leadScore} category={lead.scoreCategory} size="sm" showCategory={false} />
                            </div>

                            <div className="text-[11px] text-neutral-400 truncate">
                              {lead.location} · {lead.industry}
                            </div>

                            <div className="pt-1.5 border-t border-neutral-850 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={lead.status}
                                onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                                className="bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-[10px] text-neutral-200 focus:outline-hidden focus:border-white"
                              >
                                {pipelineColumns.map(p => (
                                  <option key={p.status} value={p.status}>{p.label}</option>
                                ))}
                              </select>

                              <button
                                onClick={() => onSelectLead(lead)}
                                className="text-[10px] text-neutral-400 hover:text-white"
                              >
                                View →
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-16 text-center text-xs text-neutral-500 rounded-xl border border-neutral-800 bg-neutral-900/30">
          No campaigns created yet. Click "New Campaign" to set up your first outreach segment.
        </div>
      )}

      {/* Create Campaign Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div 
            className="relative w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute right-4 top-4 p-1 text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-black font-bold">
                <Target className="h-4 w-4 text-black" />
              </div>
              <h2 className="text-base font-bold text-white tracking-tight font-heading">
                Create Outreach Campaign
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mb-4">
              Group prospects into focused outbound sales campaigns.
            </p>

            <form onSubmit={handleCreateCampaign} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">Campaign Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dubai Aesthetic Clinics Q4 Modernization"
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-300 mb-1">Target Industry</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white focus:outline-hidden"
                  >
                    <option value="Dental Clinics">Dental Clinics</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Restaurants">Restaurants</option>
                    <option value="Gyms">Gyms</option>
                    <option value="Law Firms">Law Firms</option>
                    <option value="Marketing Agencies">Marketing Agencies</option>
                    <option value="Software Companies">Software Companies</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-300 mb-1">Target Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. London"
                    className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">Target Pitch Service</label>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white focus:outline-hidden"
                >
                  <option value="Website Development">Website Development</option>
                  <option value="AI Chatbot">AI Chatbot</option>
                  <option value="Software Development">Software Development</option>
                  <option value="SEO">SEO</option>
                  <option value="Custom Service">Custom Service</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">Description / Strategy</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline the core thesis and target pain point for this campaign..."
                  className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-neutral-750 text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black font-semibold"
                >
                  <span>{isSubmitting ? 'Creating...' : 'Create Campaign'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
