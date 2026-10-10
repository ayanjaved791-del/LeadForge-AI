import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  FileSpreadsheet, 
  Download, 
  Trash2, 
  ExternalLink, 
  CheckSquare, 
  Square,
  ArrowUpDown,
  X,
  Sparkles
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext.js';
import { ScoreBadge, StatusBadge } from '../common/ScoreBadge.js';
import { useToast } from '../common/Toast.js';
import type { Lead, LeadStatus } from '../../types/index.js';

interface MyLeadsPageProps {
  onSelectLead: (lead: Lead) => void;
  onOpenAddModal: () => void;
  onOpenCsvModal: () => void;
  globalSearchQuery?: string;
  setGlobalSearchQuery?: (q: string) => void;
  onNavigateToOutreach?: (leadIds: string[]) => void;
}

export const MyLeadsPage: React.FC<MyLeadsPageProps> = ({ 
  onSelectLead, 
  onOpenAddModal, 
  onOpenCsvModal,
  globalSearchQuery = '',
  setGlobalSearchQuery,
  onNavigateToOutreach
}) => {
  const { leads, updateLeadStatus, deleteLead } = useLeads();
  const { showToast } = useToast();

  const [search, setSearch] = useState(globalSearchQuery);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [industryFilter, setIndustryFilter] = useState<string>('All');
  const [scoreFilter, setScoreFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Sync if globalSearchQuery changes
  useEffect(() => {
    if (globalSearchQuery !== undefined) {
      setSearch(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  // Unique industries in current CRM
  const uniqueIndustries = useMemo(() => {
    const set = new Set(leads.map(l => l.industry));
    return ['All', ...Array.from(set)];
  }, [leads]);

  // Filter & Sort
  const processedLeads = useMemo(() => {
    return leads
      .filter(lead => {
        if (statusFilter !== 'All' && lead.status !== statusFilter) return false;
        if (industryFilter !== 'All' && lead.industry !== industryFilter) return false;
        if (scoreFilter === 'Hot' && lead.leadScore < 85) return false;
        if (scoreFilter === 'Good' && (lead.leadScore < 70 || lead.leadScore >= 85)) return false;
        if (scoreFilter === 'Moderate' && (lead.leadScore < 40 || lead.leadScore >= 70)) return false;
        if (scoreFilter === 'Low' && lead.leadScore >= 40) return false;

        const effectiveSearch = search.trim();
        if (effectiveSearch) {
          const q = effectiveSearch.toLowerCase();
          const matchCompany = lead.companyName.toLowerCase().includes(q);
          const matchLocation = (lead.location || '').toLowerCase().includes(q);
          const matchIndustry = (lead.industry || '').toLowerCase().includes(q);
          const matchEmail = (lead.email || '').toLowerCase().includes(q);
          const matchPhone = (lead.phone || '').toLowerCase().includes(q);
          const matchNotes = (lead.notes || '').toLowerCase().includes(q);
          const matchWebsite = (lead.website || '').toLowerCase().includes(q);
          const matchStatus = (lead.status || '').toLowerCase().includes(q);
          if (!matchCompany && !matchLocation && !matchIndustry && !matchEmail && !matchPhone && !matchNotes && !matchWebsite && !matchStatus) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'score') {
          diff = a.leadScore - b.leadScore;
        } else if (sortBy === 'name') {
          diff = a.companyName.localeCompare(b.companyName);
        } else {
          diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [leads, search, statusFilter, industryFilter, scoreFilter, sortBy, sortOrder]);

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === processedLeads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(processedLeads.map(l => l.id));
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} lead(s)?`)) return;
    for (const id of selectedIds) {
      await deleteLead(id);
    }
    showToast(`Deleted ${selectedIds.length} lead(s)`, 'info');
    setSelectedIds([]);
  };

  const handleBulkStatusChange = async (status: LeadStatus) => {
    for (const id of selectedIds) {
      await updateLeadStatus(id, status);
    }
    showToast(`Updated status for ${selectedIds.length} lead(s) to ${status}`, 'success');
  };

  // CSV Export Functionality
  const handleExportCsv = () => {
    const exportData = selectedIds.length > 0 
      ? leads.filter(l => selectedIds.includes(l.id))
      : processedLeads;

    if (exportData.length === 0) {
      showToast('No leads available to export', 'error');
      return;
    }

    const headers = ['company_name', 'industry', 'location', 'website', 'email', 'phone', 'lead_score', 'score_category', 'status', 'source', 'created_at'];
    const rows = exportData.map(l => [
      `"${l.companyName.replace(/"/g, '""')}"`,
      `"${l.industry.replace(/"/g, '""')}"`,
      `"${l.location.replace(/"/g, '""')}"`,
      `"${(l.website || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      l.leadScore,
      `"${l.scoreCategory}"`,
      `"${l.status}"`,
      `"${l.source}"`,
      `"${l.createdAt}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leadforge_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${exportData.length} lead(s) to CSV`, 'success');
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-heading">
            My Leads CRM
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage your saved prospects, track status progression, and launch AI analyses.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCsv}
            className="flex-1 sm:flex-initial whitespace-nowrap flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-750 bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-neutral-200 hover:text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenCsvModal}
            className="flex-1 sm:flex-initial whitespace-nowrap flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-750 bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-neutral-200 hover:text-white transition-colors"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex-1 sm:flex-initial whitespace-nowrap flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-colors shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 text-black shrink-0" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Filter & Controls Toolbar */}
      <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (setGlobalSearchQuery) setGlobalSearchQuery(e.target.value);
              }}
              placeholder="Search companies, cities, emails..."
              className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  if (setGlobalSearchQuery) setGlobalSearchQuery('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-white"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Replied">Replied</option>
              <option value="Interested">Interested</option>
              <option value="Converted">Converted</option>
              <option value="Not Interested">Not Interested</option>
            </select>

            {/* Industry Filter */}
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-white"
            >
              {uniqueIndustries.map(ind => (
                <option key={ind} value={ind}>{ind === 'All' ? 'All Industries' : ind}</option>
              ))}
            </select>

            {/* Score Filter */}
            <select
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-white"
            >
              <option value="All">All Scores</option>
              <option value="Hot">Hot (85-100)</option>
              <option value="Good">Good (70-84)</option>
              <option value="Moderate">Moderate (40-69)</option>
              <option value="Low">Low (0-39)</option>
            </select>

            {/* Sort Order Toggle */}
            <button
              onClick={() => {
                setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-750 bg-neutral-950 text-xs text-neutral-300 hover:text-white"
            >
              <ArrowUpDown className="h-3 w-3" />
              <span className="capitalize">{sortBy} ({sortOrder})</span>
            </button>
          </div>
        </div>

        {/* Bulk Action Bar (Visible when rows selected) */}
        {selectedIds.length > 0 && (
          <div className="pt-2 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs animate-in fade-in">
            <span className="text-white font-medium whitespace-nowrap">
              <span className="font-mono text-white font-bold">{selectedIds.length}</span> lead(s) selected
            </span>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {onNavigateToOutreach && (
                <button
                  type="button"
                  onClick={() => onNavigateToOutreach(selectedIds)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white hover:bg-neutral-200 text-black text-[11px] font-semibold whitespace-nowrap shrink-0 shadow-xs transition-colors"
                >
                  <Sparkles className="h-3 w-3 text-black shrink-0" />
                  <span>Generate Outreach ({selectedIds.length})</span>
                </button>
              )}
              <span className="text-neutral-400 text-[11px] whitespace-nowrap">Change Status:</span>
              {(['Contacted', 'Replied', 'Interested', 'Converted'] as LeadStatus[]).map(st => (
                <button
                  key={st}
                  onClick={() => handleBulkStatusChange(st)}
                  className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-medium border border-neutral-700 whitespace-nowrap shrink-0"
                >
                  {st}
                </button>
              ))}
              <div className="hidden sm:block h-3 w-px bg-neutral-800 mx-0.5" />
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-[11px] font-medium whitespace-nowrap shrink-0"
              >
                <Trash2 className="h-3 w-3 shrink-0" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CRM Leads Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
        {processedLeads.length === 0 ? (
          <div className="p-16 text-center text-xs text-neutral-400 space-y-3">
            <p className="text-neutral-300 font-medium">No leads currently in your CRM pipeline.</p>
            <p className="text-neutral-500 text-[11px] max-w-md mx-auto">
              Get started by manually adding a prospective business or importing prospect lists from a CSV file.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={onOpenAddModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-black" />
                <span>Add Lead</span>
              </button>
              <button
                onClick={onOpenCsvModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-colors"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-neutral-300" />
                <span>Import CSV</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[850px]">
              <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 font-medium text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 w-10 shrink-0">
                    <button onClick={handleSelectAll} className="text-neutral-400 hover:text-white mt-1">
                      {selectedIds.length > 0 && selectedIds.length === processedLeads.length ? (
                        <CheckSquare className="h-4 w-4 text-white" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-2.5 px-4 font-medium min-w-[220px]">Company</th>
                  <th className="py-2.5 px-4 font-medium min-w-[140px] whitespace-nowrap">Industry</th>
                  <th className="py-2.5 px-4 font-medium min-w-[140px] whitespace-nowrap">Location</th>
                  <th className="py-2.5 px-4 font-medium min-w-[110px] whitespace-nowrap">AI Score</th>
                  <th className="py-2.5 px-4 font-medium min-w-[120px] whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-4 font-medium min-w-[110px] whitespace-nowrap">Source</th>
                  <th className="py-2.5 px-4 font-medium text-right min-w-[170px] whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {processedLeads.map((lead) => {
                  const isSelected = selectedIds.includes(lead.id);
                  return (
                    <tr 
                      key={lead.id}
                      className={`hover:bg-neutral-850/50 transition-colors cursor-pointer group ${
                        isSelected ? 'bg-neutral-900 border-l-2 border-white' : ''
                      }`}
                      onClick={() => onSelectLead(lead)}
                    >
                      <td className="py-3 px-4 w-10 shrink-0" onClick={(e) => handleToggleSelect(lead.id, e)}>
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-white" />
                        ) : (
                          <Square className="h-4 w-4 text-neutral-600 group-hover:text-neutral-400" />
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-neutral-200 min-w-[220px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span 
                            className="font-semibold text-white transition-colors truncate max-w-[200px]"
                            title={lead.companyName}
                          >
                            {lead.companyName}
                          </span>
                          {lead.website && (
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-neutral-500 hover:text-white shrink-0 p-0.5 rounded hover:bg-neutral-800 transition-colors"
                              title="Visit company website"
                            >
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          )}
                        </div>
                        <div 
                          className="text-[11px] text-neutral-400 truncate max-w-[220px] mt-0.5 font-normal"
                          title={lead.email || lead.phone || 'No direct contact'}
                        >
                          {lead.email || lead.phone || 'No direct contact'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-neutral-300 min-w-[140px] whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-800/80 border border-neutral-700/60 text-[11px] font-medium text-neutral-300 whitespace-nowrap">
                          {lead.industry}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-400 min-w-[140px] whitespace-nowrap">
                        <span className="truncate max-w-[160px] inline-block align-middle" title={lead.location}>
                          {lead.location}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap min-w-[110px]">
                        <ScoreBadge score={lead.leadScore} category={lead.scoreCategory} />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap min-w-[120px]">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="py-3 px-4 text-neutral-400 font-medium text-[10px] whitespace-nowrap min-w-[110px]">
                        {lead.source === 'google-maps' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold whitespace-nowrap">
                            Google Maps
                          </span>
                        ) : (
                          <span className="uppercase tracking-wider font-mono whitespace-nowrap">
                            {lead.source}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap min-w-[170px]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 shrink-0">
                          <select
                            value={lead.status}
                            onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                            className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-[11px] text-neutral-200 focus:outline-hidden focus:border-white shrink-0"
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Replied">Replied</option>
                            <option value="Interested">Interested</option>
                            <option value="Converted">Converted</option>
                            <option value="Not Interested">Not Interested</option>
                          </select>
                          <button
                            onClick={() => onSelectLead(lead)}
                            className="whitespace-nowrap shrink-0 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-medium transition-colors border border-neutral-750"
                          >
                            Review
                          </button>
                          {onNavigateToOutreach && (
                            <button
                              onClick={() => onNavigateToOutreach([lead.id])}
                              title={`Generate personalized outreach for ${lead.companyName}`}
                              className="whitespace-nowrap shrink-0 px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-[11px] font-medium transition-colors border border-neutral-800 flex items-center gap-1"
                            >
                              <Sparkles className="h-3 w-3 text-white shrink-0" />
                              <span>Pitch</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
