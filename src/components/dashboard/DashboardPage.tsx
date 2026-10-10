import React from 'react';
import { 
  Users, 
  Flame, 
  Mail, 
  MessageSquare, 
  ThumbsUp, 
  CheckCircle, 
  Sparkles, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import { useLeads } from '../../context/LeadContext.js';
import { ScoreBadge, StatusBadge } from '../common/ScoreBadge.js';
import type { Lead, LeadStatus } from '../../types/index.js';
import type { NavigationTab } from '../layout/Sidebar.js';

interface DashboardPageProps {
  onNavigate: (tab: NavigationTab) => void;
  onSelectLead: (lead: Lead) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onSelectLead }) => {
  const { leads, updateLeadStatus } = useLeads();

  // Metrics
  const totalLeads = leads.length;
  const hotLeads = leads.filter(l => l.scoreCategory === 'Hot').length;
  const contacted = leads.filter(l => ['Contacted', 'Replied', 'Interested', 'Converted'].includes(l.status)).length;
  const replied = leads.filter(l => ['Replied', 'Interested', 'Converted'].includes(l.status)).length;
  const interested = leads.filter(l => ['Interested', 'Converted'].includes(l.status)).length;
  const converted = leads.filter(l => l.status === 'Converted').length;

  const kpis = [
    { label: 'Total Leads', value: totalLeads, icon: Users, color: 'text-neutral-700', trend: '+12% this week' },
    { label: 'Hot Leads', value: hotLeads, icon: Flame, color: 'text-yellow-600', trend: 'Score 85+' },
    { label: 'Contacted', value: contacted, icon: Mail, color: 'text-neutral-700', trend: `${totalLeads ? Math.round((contacted/totalLeads)*100) : 0}% contacted` },
    { label: 'Replies', value: replied, icon: MessageSquare, color: 'text-neutral-700', trend: `${contacted ? Math.round((replied/contacted)*100) : 0}% reply rate` },
    { label: 'Interested', value: interested, icon: ThumbsUp, color: 'text-yellow-600', trend: 'High intent' },
    { label: 'Converted', value: converted, icon: CheckCircle, color: 'text-black', trend: 'Won deals' },
  ];

  // Chart Data: Activity timeline (Yellow & White theme)
  const activityData = [
    { day: 'Mon', leads: 4, contacted: 2, converted: 0 },
    { day: 'Tue', leads: 7, contacted: 5, converted: 1 },
    { day: 'Wed', leads: 9, contacted: 6, converted: 0 },
    { day: 'Thu', leisure: 14, leads: 14, contacted: 9, converted: 1 },
    { day: 'Fri', leads: 18, contacted: 12, converted: 2 },
    { day: 'Sat', leads: 22, contacted: 15, converted: 2 },
    { day: 'Sun', leads: leads.length, contacted: contacted, converted: converted },
  ];

  // Chart Data: Score Distribution (Yellow bars)
  const scoreBuckets = [
    { range: '0–39 (Low)', count: leads.filter(l => l.leadScore < 40).length, fill: '#fef08a' },
    { range: '40–69 (Mod)', count: leads.filter(l => l.leadScore >= 40 && l.leadScore < 70).length, fill: '#fde047' },
    { range: '70–84 (Good)', count: leads.filter(l => l.leadScore >= 70 && l.leadScore < 85).length, fill: '#facc15' },
    { range: '85–100 (Hot)', count: leads.filter(l => l.leadScore >= 85).length, fill: '#eab308' },
  ];

  const recentLeads = [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-heading">
            Executive Overview
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time pipeline metrics, AI score distribution, and recent B2B interactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('find-leads')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-neutral-200 hover:text-white transition-colors"
          >
            <span>Explore Discovery</span>
          </button>
          <button
            onClick={() => onNavigate('outreach')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-colors shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-black" />
            <span>Generate Outreach</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx}
              className="p-3.5 rounded-xl border border-neutral-200 bg-white shadow-xs flex flex-col justify-between text-black transition-all"
            >
              <div className="flex items-center justify-between text-neutral-600 mb-2">
                <span className="text-[11px] font-medium truncate">{kpi.label}</span>
                <Icon className={`h-3.5 w-3.5 ${kpi.color}`} />
              </div>
              <div className="text-2xl font-bold tracking-tight font-mono tabular-nums text-black">
                {kpi.value}
              </div>
              <div className="text-[10px] text-neutral-500 mt-1 truncate">
                {kpi.trend}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row - White Background, Black Text, Yellow Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Activity Timeline Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-neutral-200 bg-white shadow-sm text-black">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-black font-heading">Prospecting Activity</h2>
              <p className="text-[11px] text-neutral-600">Cumulative leads tracked and outreach velocity</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-neutral-800 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500 shadow-xs" /> Total Leads
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-neutral-400" /> Contacted
              </span>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.45}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0.02}/>
                  </linearGradient>
                  <linearGradient id="colorContacted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#737373" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#737373" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#737373" fontSize={11} tickLine={false} tick={{ fill: '#000000', fontWeight: 500 }} />
                <YAxis stroke="#737373" fontSize={11} tickLine={false} tick={{ fill: '#000000', fontWeight: 500 }} />
                <Tooltip 
                  wrapperStyle={{ outline: 'none', zIndex: 50 }}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e5e5', borderRadius: '8px', fontSize: '11px', color: '#000000', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e5e5' }}
                  labelStyle={{ color: '#000000', fontWeight: 'bold' }}
                  itemStyle={{ color: '#000000', fontWeight: '500' }}
                />
                <Area type="monotone" dataKey="leads" stroke="#eab308" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLeads)" />
                <Area type="monotone" dataKey="contacted" stroke="#737373" strokeWidth={1.5} fillOpacity={1} fill="url(#colorContacted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Score Distribution Chart */}
        <div className="p-5 rounded-xl border border-neutral-200 bg-white shadow-sm text-black">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-black font-heading">AI Opportunity Distribution</h2>
            <p className="text-[11px] text-neutral-600">Pipeline segment by opportunity probability</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreBuckets} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="range" stroke="#737373" fontSize={10} tickLine={false} tick={{ fill: '#000000', fontWeight: 500 }} />
                <YAxis stroke="#737373" fontSize={11} tickLine={false} tick={{ fill: '#000000', fontWeight: 500 }} />
                <Tooltip 
                  wrapperStyle={{ outline: 'none', zIndex: 50 }}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e5e5', borderRadius: '8px', fontSize: '11px', color: '#000000', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e5e5' }}
                  labelStyle={{ color: '#000000', fontWeight: 'bold' }}
                  itemStyle={{ color: '#000000', fontWeight: '500' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#eab308">
                  {scoreBuckets.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Leads Table - White Background, Black Text */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-xs overflow-hidden text-black">
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-black font-heading">Recent Opportunities</h2>
            <p className="text-[11px] text-neutral-600">Latest analyzed companies and CRM progress</p>
          </div>
          <button
            onClick={() => onNavigate('my-leads')}
            className="flex items-center gap-1 text-xs font-semibold text-black hover:text-neutral-700 transition-colors"
          >
            <span>View All Leads</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {recentLeads.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-500">
            No leads yet. Import a CSV or browse the Discovery pool.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Company</th>
                  <th className="py-2.5 px-4 font-semibold">Industry</th>
                  <th className="py-2.5 px-4 font-semibold">Location</th>
                  <th className="py-2.5 px-4 font-semibold">AI Score</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {recentLeads.map((lead) => (
                  <tr 
                    key={lead.id}
                    className="hover:bg-neutral-50/80 transition-colors cursor-pointer group"
                    onClick={() => onSelectLead(lead)}
                  >
                    <td className="py-3 px-4 font-semibold text-black">
                      <div className="flex items-center gap-2">
                        <span className="group-hover:text-black transition-colors">{lead.companyName}</span>
                        {lead.website && (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-neutral-400 hover:text-black"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-600 font-medium">
                      {lead.industry}
                    </td>
                    <td className="py-3 px-4 text-neutral-600 font-medium">
                      {lead.location}
                    </td>
                    <td className="py-3 px-4">
                      <ScoreBadge score={lead.leadScore} category={lead.scoreCategory} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                          className="bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-[11px] text-black font-medium focus:outline-hidden focus:border-black"
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
                          className="px-2.5 py-1 rounded bg-black hover:bg-neutral-800 text-white text-[11px] font-semibold transition-colors shadow-2xs"
                        >
                          Review
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
