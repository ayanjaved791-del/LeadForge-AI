import React, { useState, useMemo, useEffect } from 'react';
import { 
  Send, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  X, 
  Mail, 
  MessageSquare, 
  Linkedin, 
  Sparkles, 
  Building2, 
  MapPin, 
  Globe, 
  Phone, 
  CheckSquare, 
  Square, 
  Search, 
  Download, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle,
  FileText,
  UserCheck
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext.js';
import { useToast } from '../common/Toast.js';
import { generateOutreach } from '../../services/aiService.js';
import type { 
  Lead, 
  OutreachMessage, 
  OutreachChannel, 
  OutreachTone 
} from '../../types/index.js';

interface OutreachPageProps {
  preselectedLeadIds?: string[];
  onSelectLead?: (lead: Lead) => void;
  onNavigateTab?: (tab: string) => void;
}

export const OutreachPage: React.FC<OutreachPageProps> = ({
  preselectedLeadIds = [],
  onSelectLead,
  onNavigateTab
}) => {
  const { 
    leads, 
    outreach, 
    deleteOutreachMessage, 
    updateOutreachMessage, 
    saveOutreachMessage,
    clearAllOutreach
  } = useLeads();
  const { showToast } = useToast();

  // Selection of leads from My Leads
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>(() => {
    if (preselectedLeadIds && preselectedLeadIds.length > 0) {
      return preselectedLeadIds.filter(id => leads.some(l => l.id === id));
    }
    return [];
  });

  // Sync if preselectedLeadIds change externally
  useEffect(() => {
    if (preselectedLeadIds && preselectedLeadIds.length > 0) {
      const valid = preselectedLeadIds.filter(id => leads.some(l => l.id === id));
      if (valid.length > 0) {
        setSelectedLeadIds(prev => Array.from(new Set([...prev, ...valid])));
      }
    }
  }, [preselectedLeadIds, leads]);

  // Lead search within the lead picker
  const [leadSearch, setLeadSearch] = useState('');

  // Generation Form State
  const [targetChannel, setTargetChannel] = useState<OutreachChannel>('Email');
  const [targetTone, setTargetTone] = useState<OutreachTone>('Professional');
  const [targetService, setTargetService] = useState('Website Modernization');
  const [customAngle, setCustomAngle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number; company: string } | null>(null);

  // Outreach Filter & View State
  const [channelFilter, setChannelFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [messageSearch, setMessageSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<OutreachMessage | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editMessageBody, setEditMessageBody] = useState('');
  const [editStatus, setEditStatus] = useState<'Draft' | 'Ready' | 'Sent'>('Ready');

  // Filter leads in the picker
  const filteredPickerLeads = useMemo(() => {
    if (!leadSearch.trim()) return leads;
    const q = leadSearch.toLowerCase().trim();
    return leads.filter(l => 
      l.companyName.toLowerCase().includes(q) ||
      l.industry.toLowerCase().includes(q) ||
      l.location.toLowerCase().includes(q)
    );
  }, [leads, leadSearch]);

  // Filter messages in the drafts repository
  const filteredOutreach = useMemo(() => {
    return outreach.filter(msg => {
      if (channelFilter !== 'All' && msg.channel !== channelFilter) return false;
      if (statusFilter !== 'All' && msg.status !== statusFilter) return false;
      if (messageSearch.trim()) {
        const q = messageSearch.toLowerCase().trim();
        const matchesComp = msg.companyName.toLowerCase().includes(q);
        const matchesSubj = msg.subject ? msg.subject.toLowerCase().includes(q) : false;
        const matchesBody = msg.message.toLowerCase().includes(q);
        if (!matchesComp && !matchesSubj && !matchesBody) return false;
      }
      return true;
    });
  }, [outreach, channelFilter, statusFilter, messageSearch]);

  // Lead selection helpers
  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredPickerLeads.map(l => l.id);
    const combined = Array.from(new Set([...selectedLeadIds, ...allFilteredIds]));
    setSelectedLeadIds(combined);
  };

  const handleDeselectAll = () => {
    setSelectedLeadIds([]);
  };

  const handleSelectHotLeads = () => {
    const hotLeadIds = leads.filter(l => l.leadScore >= 80).map(l => l.id);
    setSelectedLeadIds(hotLeadIds);
    showToast(`Selected ${hotLeadIds.length} high-opportunity companies`, 'info');
  };

  // Generate outreach ONLY for user-selected companies
  const handleGenerateOutreachForSelected = async () => {
    if (selectedLeadIds.length === 0) {
      showToast('Please select at least 1 company from My Leads to generate outreach.', 'info');
      return;
    }

    const selectedCompanies = leads.filter(l => selectedLeadIds.includes(l.id));
    if (selectedCompanies.length === 0) {
      showToast('No matching companies found in your CRM.', 'error');
      return;
    }

    setIsGenerating(true);
    let successCount = 0;

    try {
      for (let i = 0; i < selectedCompanies.length; i++) {
        const company = selectedCompanies[i];
        setGenerationProgress({
          current: i + 1,
          total: selectedCompanies.length,
          company: company.companyName
        });

        try {
          const res = await generateOutreach({
            companyName: company.companyName,
            industry: company.industry,
            location: company.location,
            channel: targetChannel,
            tone: targetTone,
            service: targetService,
            aiAnalysis: company.aiAnalysis
          });

          // Save authentic outreach draft
          await saveOutreachMessage({
            leadId: company.id,
            companyName: company.companyName,
            channel: targetChannel,
            subject: res.subject || `${targetService} proposal for ${company.companyName}`,
            message: res.message,
            tone: targetTone,
            service: targetService,
            personalizationNotes: res.personalizationNotes || (customAngle ? `Custom focus: ${customAngle}` : undefined),
            status: 'Draft'
          });

          successCount++;
        } catch (itemErr) {
          console.error(`Failed to generate outreach for ${company.companyName}:`, itemErr);
        }
      }

      showToast(`Successfully generated ${successCount} outreach message(s) for selected companies!`, 'success');
    } catch (err: any) {
      console.error('Error during outreach generation sequence:', err);
      showToast('Error generating outreach. Please try again.', 'error');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  };

  const handleCopy = (msg: OutreachMessage) => {
    const textToCopy = msg.channel === 'Email' && msg.subject 
      ? `Subject: ${msg.subject}\n\n${msg.message}` 
      : msg.message;

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(msg.id);
    showToast(`Copied ${msg.channel} message for ${msg.companyName} to clipboard!`, 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenEdit = (msg: OutreachMessage) => {
    setEditingMessage(msg);
    setEditSubject(msg.subject || '');
    setEditMessageBody(msg.message);
    setEditStatus(msg.status);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingMessage) return;
    await updateOutreachMessage(editingMessage.id, {
      subject: editSubject,
      message: editMessageBody,
      status: editStatus,
    });
    setIsEditModalOpen(false);
    showToast('Outreach draft updated successfully', 'success');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this outreach draft?')) return;
    await deleteOutreachMessage(id);
    showToast('Outreach message removed', 'info');
  };

  const handleClearAllDrafts = async () => {
    if (outreach.length === 0) return;
    if (!confirm(`Are you sure you want to clear all ${outreach.length} drafts and generated messages? This will leave your outreach repository completely clean.`)) return;
    await clearAllOutreach();
    showToast('All outreach drafts have been purged', 'info');
  };

  const handleExportMessages = () => {
    if (outreach.length === 0) {
      showToast('No messages available to export.', 'info');
      return;
    }

    const lines: string[] = [];
    lines.push('Company,Channel,Status,Subject,Service,Tone,Created,Message');
    
    outreach.forEach(m => {
      const escape = (str?: string) => `"${(str || '').replace(/"/g, '""')}"`;
      lines.push([
        escape(m.companyName),
        escape(m.channel),
        escape(m.status),
        escape(m.subject),
        escape(m.service),
        escape(m.tone),
        escape(new Date(m.createdAt).toLocaleDateString()),
        escape(m.message)
      ].join(','));
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leadforge_outreach_drafts_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${outreach.length} outreach drafts`, 'success');
  };

  const getChannelIcon = (ch: OutreachChannel) => {
    switch (ch) {
      case 'Email':
        return <Mail className="h-3.5 w-3.5 text-white" />;
      case 'WhatsApp':
        return <MessageSquare className="h-3.5 w-3.5 text-neutral-300" />;
      case 'LinkedIn':
        return <Linkedin className="h-3.5 w-3.5 text-neutral-200" />;
    }
  };

  return (
    <div className="space-y-7 min-w-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-heading">
              Outreach & Message Generator
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-700 text-[10px] font-mono text-neutral-300">
              Gemini Powered
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Directly connected to <strong>My Leads</strong>. Select the companies you want to pitch, choose your communication angle, and generate tailored outreach messages on demand.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          {outreach.length > 0 && (
            <>
              <button
                onClick={handleExportMessages}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-750 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs transition-colors"
                title="Export all generated drafts as CSV"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Drafts</span>
              </button>

              <button
                onClick={handleClearAllDrafts}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 hover:bg-neutral-850 text-neutral-400 hover:text-red-400 text-xs transition-colors"
                title="Purge all old or fake drafts"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear All</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* SECTION 1: MY LEADS SELECTOR (Integrated with User's CRM) */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-white text-black text-xs font-bold font-mono">
                1
              </span>
              <h2 className="text-sm sm:text-base font-semibold text-white font-heading">
                Select Target Companies from My Leads
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5 ml-7">
              Only companies checked below will have outreach messages generated.
            </p>
          </div>

          <div className="flex items-center gap-2 ml-7 sm:ml-0 flex-wrap">
            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-neutral-950 border border-neutral-800 text-neutral-200">
              <strong className="text-white font-semibold">{selectedLeadIds.length}</strong> of {leads.length} selected
            </span>

            {leads.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-neutral-750 text-white text-[11px] font-medium border border-neutral-700 transition-colors"
                >
                  Select All
                </button>
                {selectedLeadIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="px-2 py-1 rounded-md bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white text-[11px] border border-neutral-800 transition-colors"
                  >
                    Deselect All
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSelectHotLeads}
                  className="px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-[11px] font-medium border border-neutral-700 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3 text-white" />
                  <span>Select Hot Leads</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Zero leads in CRM state */}
        {leads.length === 0 ? (
          <div className="p-8 rounded-lg border border-dashed border-neutral-800 bg-neutral-950/60 text-center space-y-3">
            <Building2 className="h-8 w-8 text-neutral-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">Your CRM pipeline is currently empty</h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                To generate outreach messages, first save prospective businesses to <strong>My Leads</strong> using Google Places search or manual entry.
              </p>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('find-leads')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition-colors shadow-xs"
              >
                <Search className="h-3.5 w-3.5 text-black" />
                <span>Search Google Places for Leads</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Filter Search for Picker */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500 shrink-0" />
              <input
                type="text"
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                placeholder="Filter your saved companies by name, city, industry..."
                className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-white"
              />
              {leadSearch && (
                <button
                  type="button"
                  onClick={() => setLeadSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Scrollable Grid of Leads */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[290px] overflow-y-auto pr-1">
              {filteredPickerLeads.map((lead) => {
                const isSelected = selectedLeadIds.includes(lead.id);
                const leadOutreachCount = outreach.filter(m => m.leadId === lead.id).length;

                return (
                  <div
                    key={lead.id}
                    onClick={() => toggleSelectLead(lead.id)}
                    className={`cursor-pointer p-3 rounded-lg border transition-all text-xs flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'border-white bg-neutral-850 shadow-xs'
                        : 'border-neutral-800 bg-neutral-950/70 hover:border-neutral-700 hover:bg-neutral-900/60'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="pt-0.5 shrink-0 text-white">
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-white" />
                        ) : (
                          <Square className="h-4 w-4 text-neutral-600" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-semibold text-white truncate text-xs" title={lead.companyName}>
                            {lead.companyName}
                          </h4>
                          <span className={`shrink-0 text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                            lead.leadScore >= 80 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-neutral-800 text-neutral-400'
                          }`}>
                            {lead.leadScore}/100
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-0.5 truncate">
                          <span className="truncate">{lead.industry}</span>
                          <span>•</span>
                          <span className="truncate">{lead.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-neutral-800/80">
                      <div className="flex items-center gap-2 text-neutral-400">
                        {lead.email && <span title={`Email: ${lead.email}`}><Mail className="h-3 w-3 text-neutral-300" /></span>}
                        {lead.phone && <span title={`Phone: ${lead.phone}`}><Phone className="h-3 w-3 text-neutral-300" /></span>}
                        {lead.website && <span title={`Website: ${lead.website}`}><Globe className="h-3 w-3 text-neutral-300" /></span>}
                      </div>

                      {leadOutreachCount > 0 ? (
                        <span className="text-[10px] font-mono text-neutral-300 bg-neutral-800 px-1.5 py-0.5 rounded">
                          {leadOutreachCount} draft{leadOutreachCount > 1 ? 's' : ''} saved
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-500 italic">
                          No drafts yet
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: GENERATION FORM (Only active if companies are selected) */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-white text-black text-xs font-bold font-mono">
              2
            </span>
            <h2 className="text-sm sm:text-base font-semibold text-white font-heading">
              Configure Outreach Channel & Angle
            </h2>
          </div>

          {selectedLeadIds.length > 0 ? (
            <div className="flex items-center gap-1.5 text-xs text-white">
              <UserCheck className="h-3.5 w-3.5 text-white" />
              <span>Ready to generate for <strong>{selectedLeadIds.length}</strong> selected compan{selectedLeadIds.length === 1 ? 'y' : 'ies'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-amber-400/90">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Select at least 1 company in Step 1 to activate generator</span>
            </div>
          )}
        </div>

        {/* Generator Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Channel Choice */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-neutral-300">
              Outreach Channel
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-lg">
              {(['Email', 'LinkedIn', 'WhatsApp'] as OutreachChannel[]).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setTargetChannel(ch)}
                  className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-md font-medium text-xs transition-colors ${
                    targetChannel === ch
                      ? 'bg-white text-black font-semibold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {getChannelIcon(ch)}
                  <span>{ch}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tone Choice */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-neutral-300">
              Copy Tone
            </label>
            <select
              value={targetTone}
              onChange={(e) => setTargetTone(e.target.value as OutreachTone)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-white"
            >
              <option value="Professional">Professional (Direct & Credible)</option>
              <option value="Friendly">Friendly (Warm & Casual)</option>
              <option value="Personalized">Personalized (Deep Pain-Point Hook)</option>
              <option value="Concise">Concise (High-Impact 3-Sentence Hook)</option>
            </select>
          </div>

          {/* Service Pitch Focus */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-neutral-300">
              Pitch Focus / Service
            </label>
            <select
              value={targetService}
              onChange={(e) => setTargetService(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-white"
            >
              <option value="Website Modernization">Website Modernization & Mobile UX</option>
              <option value="AI Chatbots & Automation">AI Chatbots & Automated Inquiries</option>
              <option value="Local SEO & Search Ranking">Local Google Maps SEO & Visibility</option>
              <option value="Workflow Automation">CRM & Customer Scheduling Automation</option>
              <option value="Custom Web App Development">Custom Software & Digital Tools</option>
            </select>
          </div>

          {/* Custom Angle (Optional) */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-neutral-300">
              Custom Angle (Optional)
            </label>
            <input
              type="text"
              value={customAngle}
              onChange={(e) => setCustomAngle(e.target.value)}
              placeholder="e.g. Free 10-minute audit, slow mobile speed..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-white"
            />
          </div>
        </div>

        {/* Generate Action Button & Progress */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-neutral-400">
            {selectedLeadIds.length === 0 ? (
              <span className="italic text-neutral-500">
                Pick 1 or more companies above to generate messages.
              </span>
            ) : (
              <span>
                Gemini AI will craft bespoke {targetChannel} copy tailored to each company's industry, location, and rating.
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={selectedLeadIds.length === 0 || isGenerating}
            onClick={handleGenerateOutreachForSelected}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-xs shrink-0 ${
              selectedLeadIds.length > 0 && !isGenerating
                ? 'bg-white hover:bg-neutral-200 text-black cursor-pointer'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-750'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-black" />
                <span>
                  {generationProgress 
                    ? `Generating for ${generationProgress.company} (${generationProgress.current}/${generationProgress.total})...`
                    : 'Crafting messages...'}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-black" />
                <span>
                  Generate Outreach for {selectedLeadIds.length} Selected Compan{selectedLeadIds.length === 1 ? 'y' : 'ies'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SECTION 3: GENERATED MESSAGES & DRAFTS REPOSITORY */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-white text-black text-xs font-bold font-mono">
              3
            </span>
            <h2 className="text-sm sm:text-base font-semibold text-white font-heading">
              Generated Outreach & Drafts Repository ({filteredOutreach.length})
            </h2>
          </div>

          {/* Filtering toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Channel filter pills */}
            <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg text-xs">
              {['All', 'Email', 'LinkedIn', 'WhatsApp'].map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChannelFilter(ch)}
                  className={`px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                    channelFilter === ch 
                      ? 'bg-white text-black font-semibold' 
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Ready">Ready to Send</option>
              <option value="Sent">Sent</option>
            </select>

            {/* Search within messages */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-500" />
              <input
                type="text"
                value={messageSearch}
                onChange={(e) => setMessageSearch(e.target.value)}
                placeholder="Search drafts..."
                className="pl-7 pr-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden w-36 sm:w-44"
              />
            </div>
          </div>
        </div>

        {/* Message Cards List */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
          {filteredOutreach.length === 0 ? (
            <div className="p-16 text-center text-xs text-neutral-400 space-y-3">
              <FileText className="h-8 w-8 text-neutral-600 mx-auto" />
              <p className="text-neutral-300 font-medium">No outreach messages found in repository.</p>
              <p className="text-neutral-500 text-[11px] max-w-md mx-auto">
                Select companies from <strong>My Leads</strong> in Step 1 and click "Generate Outreach" to create authentic, personalized pitches.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/70">
              {filteredOutreach.map((msg) => {
                const targetLead = leads.find(l => l.id === msg.leadId);
                const isCopied = copiedId === msg.id;

                // Mailto link generator
                const mailtoUrl = msg.channel === 'Email' && targetLead?.email
                  ? `mailto:${encodeURIComponent(targetLead.email)}?subject=${encodeURIComponent(msg.subject || '')}&body=${encodeURIComponent(msg.message)}`
                  : null;

                // WhatsApp link generator
                const rawPhone = targetLead?.phone?.replace(/\D/g, '');
                const whatsappUrl = msg.channel === 'WhatsApp' && rawPhone
                  ? `https://wa.me/${rawPhone}?text=${encodeURIComponent(msg.message)}`
                  : null;

                return (
                  <div 
                    key={msg.id}
                    className="p-5 hover:bg-neutral-850/30 transition-colors space-y-3.5"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 text-[11px] font-medium text-white">
                          {getChannelIcon(msg.channel)}
                          <span>{msg.channel}</span>
                        </div>

                        <span 
                          onClick={() => {
                            if (targetLead && onSelectLead) {
                              onSelectLead(targetLead);
                            }
                          }}
                          className={`font-semibold text-sm text-white ${
                            targetLead && onSelectLead ? 'hover:underline cursor-pointer' : ''
                          }`}
                          title="View company in CRM"
                        >
                          {msg.companyName}
                        </span>

                        {targetLead && (
                          <span className="text-[11px] text-neutral-500 font-mono">
                            ({targetLead.industry} · {targetLead.location})
                          </span>
                        )}
                      </div>

                      {/* Status & Date */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <select
                          value={msg.status}
                          onChange={(e) => updateOutreachMessage(msg.id, { status: e.target.value as any })}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border focus:outline-hidden ${
                            msg.status === 'Sent'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : msg.status === 'Ready'
                              ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                              : 'bg-neutral-900 border-neutral-700 text-neutral-300'
                          }`}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Ready">Ready to Send</option>
                          <option value="Sent">Sent</option>
                        </select>

                        <span className="text-[11px] text-neutral-500 font-mono">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Email Subject Line */}
                    {msg.subject && (
                      <div className="text-xs text-neutral-200 font-medium">
                        <span className="text-neutral-500 font-mono text-[11px]">Subject: </span>
                        {msg.subject}
                      </div>
                    )}

                    {/* Formatted Message Body */}
                    <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 font-mono leading-relaxed whitespace-pre-wrap select-text">
                      {msg.message}
                    </div>

                    {/* Hook Context / AI Strategy Note */}
                    {msg.personalizationNotes && (
                      <div className="text-[11px] text-neutral-500 italic flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-neutral-400 shrink-0" />
                        <span>Hook Context: {msg.personalizationNotes}</span>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-neutral-800/40">
                      <div className="text-[11px] text-neutral-500">
                        Pitch: <strong className="text-neutral-300 font-normal">{msg.service}</strong> ({msg.tone} tone)
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                        {/* Direct Send via Mailto */}
                        {mailtoUrl && (
                          <a
                            href={mailtoUrl}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-xs border border-neutral-750 transition-colors"
                            title={`Open email client to send to ${targetLead?.email}`}
                          >
                            <Mail className="h-3 w-3" />
                            <span>Send via Email</span>
                          </a>
                        )}

                        {/* Direct WhatsApp link */}
                        {whatsappUrl && (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-200 text-xs transition-colors"
                            title="Open WhatsApp chat"
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span>Open WhatsApp</span>
                          </a>
                        )}

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(msg)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-xs transition-colors border border-neutral-750"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="p-1 rounded text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
                          title="Delete Draft"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        {/* Copy for Sending Button */}
                        <button
                          onClick={() => handleCopy(msg)}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-colors shadow-xs"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3 w-3 text-black" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 text-black" />
                              <span>Copy Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Outreach Modal */}
      {isEditModalOpen && editingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div 
            className="relative w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-4 top-4 p-1 text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-base font-bold text-white tracking-tight mb-1 font-heading">
              Edit Outreach Copy
            </h2>
            <p className="text-xs text-neutral-400 mb-4">
              Customizing pitch for <strong>{editingMessage.companyName}</strong> ({editingMessage.channel})
            </p>

            <div className="space-y-3.5 text-xs">
              {editingMessage.channel === 'Email' && (
                <div>
                  <label className="block text-[11px] font-medium text-neutral-300 mb-1">Subject</label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white focus:outline-hidden focus:border-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">Message Body</label>
                <textarea
                  rows={8}
                  value={editMessageBody}
                  onChange={(e) => setEditMessageBody(e.target.value)}
                  className="w-full p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-white font-mono text-xs focus:outline-hidden focus:border-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white focus:outline-hidden"
                >
                  <option value="Draft">Draft</option>
                  <option value="Ready">Ready to Send</option>
                  <option value="Sent">Sent</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-neutral-750 text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
