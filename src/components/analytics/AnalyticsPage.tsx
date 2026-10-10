import React, { useMemo } from 'react';
import { 
  Users, 
  Flame, 
  Mail, 
  MessageSquare, 
  CheckCircle,
  TrendingUp,
  Globe,
  Award,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  XAxis, 
  YAxis, 
  Tooltip,
  CartesianGrid
} from 'recharts';
import { useLeads } from '../../context/LeadContext.js';
import type { NavigationTab } from '../layout/Sidebar.js';

interface AnalyticsPageProps {
  onNavigate?: (tab: NavigationTab) => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onNavigate }) => {
  const { leads } = useLeads();

  // Real KPIs strictly calculated from user's genuine leads data
  const totalLeads = leads.length;
  const hotLeads = leads.filter(l => l.scoreCategory === 'Hot' || l.leadScore >= 85).length;
  const contacted = leads.filter(l => ['Contacted', 'Replied', 'Interested', 'Converted'].includes(l.status)).length;
  const replied = leads.filter(l => ['Replied', 'Interested', 'Converted'].includes(l.status)).length;
  const interested = leads.filter(l => ['Interested', 'Converted'].includes(l.status)).length;
  const converted = leads.filter(l => l.status === 'Converted').length;

  const replyRate = contacted > 0 ? Math.round((replied / contacted) * 100) : 0;
  const conversionRate = totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0;
  const avgLeadScore = totalLeads > 0 ? Math.round(leads.reduce((sum, l) => sum + (l.leadScore || 0), 0) / totalLeads) : 0;
  const leadsWithWebsite = leads.filter(l => l.website && l.website.trim().length > 0).length;
  const leadsWithEmail = leads.filter(l => l.email && l.email.trim().length > 0).length;

  // Real Industry breakdown
  const industryData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => {
      const ind = l.industry || 'Uncategorized';
      counts[ind] = (counts[ind] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({
        name: name.replace(' Clinics', '').replace(' Companies', ''),
        fullName: name,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [leads]);

  // Real Score tiers (Yellow palette)
  const scoreData = useMemo(() => [
    { range: '0–39 (Low)', count: leads.filter(l => (l.leadScore || 0) < 40).length, fill: '#fef08a' },
    { range: '40–69 (Mod)', count: leads.filter(l => (l.leadScore || 0) >= 40 && (l.leadScore || 0) < 70).length, fill: '#fde047' },
    { range: '70–84 (Good)', count: leads.filter(l => (l.leadScore || 0) >= 70 && (l.leadScore || 0) < 85).length, fill: '#facc15' },
    { range: '85–100 (Hot)', count: leads.filter(l => (l.leadScore || 0) >= 85).length, fill: '#eab308' },
  ], [leads]);

  // Real Pipeline Status Data
  const statusColors: Record<string, string> = {
    New: '#e5e5e5',
    Contacted: '#fef08a',
    Replied: '#fde047',
    Interested: '#facc15',
    Converted: '#ca8a04',
    'Not Interested': '#737373'
  };

  const statusData = useMemo(() => [
    { name: 'New', value: leads.filter(l => l.status === 'New').length },
    { name: 'Contacted', value: leads.filter(l => l.status === 'Contacted').length },
    { name: 'Replied', value: leads.filter(l => l.status === 'Replied').length },
    { name: 'Interested', value: leads.filter(l => l.status === 'Interested').length },
    { name: 'Converted', value: leads.filter(l => l.status === 'Converted').length },
    { name: 'Not Interested', value: leads.filter(l => l.status === 'Not Interested').length },
  ].filter(s => s.value > 0), [leads]);

  // Real Location Breakdown
  const locationData = useMemo(() => {
    const locMap: Record<string, number> = {};
    leads.forEach(l => {
      const loc = l.location?.trim() || 'Unknown';
      locMap[loc] = (locMap[loc] || 0) + 1;
    });
    return Object.entries(locMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [leads]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-heading flex items-center gap-2">
            Analytics & Pipeline Intelligence
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time quantified performance derived strictly from your authentic verified leads database.
          </p>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('my-leads')}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-200 hover:text-white text-xs font-semibold hover:bg-neutral-850 transition-colors"
          >
            <span>View All Leads</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* KPI Cards - White background, black text, yellow accents */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 min-w-0">
        {[
          { label: 'Total Verified Leads', val: totalLeads, icon: Users, color: 'text-neutral-700', sub: 'In your database' },
          { label: 'Hot Opportunities', val: hotLeads, icon: Flame, color: 'text-yellow-600', sub: 'Score 85+ readiness' },
          { label: 'Outreach Contacted', val: contacted, icon: Mail, color: 'text-neutral-700', sub: `${totalLeads > 0 ? Math.round((contacted/totalLeads)*100) : 0}% contacted` },
          { label: 'Positive Replies', val: replied, icon: MessageSquare, color: 'text-neutral-700', sub: `${replyRate}% reply rate` },
          { label: 'Average AI Score', val: avgLeadScore > 0 ? avgLeadScore : '—', icon: Award, color: 'text-yellow-600', sub: 'Calculated readiness' },
          { label: 'Won Conversions', val: converted, icon: CheckCircle, color: 'text-black', sub: `${conversionRate}% overall rate` },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="p-3 sm:p-3.5 rounded-xl border border-neutral-200 bg-white shadow-xs text-black flex flex-col justify-between min-w-0">
              <div className="flex items-center justify-between text-neutral-600 mb-1.5 gap-1 min-w-0">
                <span className="text-[11px] font-medium truncate" title={item.label}>{item.label}</span>
                <Icon className={`h-3.5 w-3.5 shrink-0 ${item.color}`} />
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-bold font-mono text-black tabular-nums truncate">
                  {item.val}
                </div>
                <div className="text-[10px] text-neutral-500 mt-0.5 truncate" title={item.sub}>
                  {item.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* When no leads exist yet: Clean, authentic empty state explaining how analytics updates */}
      {totalLeads === 0 ? (
        <div className="p-12 rounded-xl border border-neutral-200 bg-white text-center space-y-4 shadow-sm text-black">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-800">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h2 className="text-base font-bold text-black font-heading">
              No Data to Chart Yet
            </h2>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Analytics graphs will populate in real time once you add real leads or import your prospects CSV. No artificial or fake metrics are displayed.
            </p>
          </div>
          {onNavigate && (
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => onNavigate('my-leads')}
                className="px-4 py-2 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs font-semibold transition-colors"
              >
                Go to My Leads
              </button>
              <button
                onClick={() => onNavigate('find-leads')}
                className="px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-black text-xs font-semibold transition-colors"
              >
                Discover Real Prospects
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Charts Grid - White Background, Black Text, Yellow Charts */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 min-w-0">
          {/* Pipeline Status Breakdown */}
          <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 bg-white shadow-sm text-black space-y-4 min-w-0 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-black font-heading truncate">Pipeline Stage Distribution</h2>
                <p className="text-[11px] text-neutral-600 truncate">Real status distribution of {totalLeads} prospects</p>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 shrink-0">
                {statusData.length} stages active
              </span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={statusColors[entry.name] || '#eab308'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e5e5', borderRadius: '8px', fontSize: '11px', color: '#000000', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#000000', fontWeight: 'bold' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    wrapperStyle={{ fontSize: '11px', color: '#171717', fontWeight: 500 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Industry Distribution Bar (Yellow theme) */}
          <div className="p-5 rounded-xl border border-neutral-200 bg-white shadow-sm text-black space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-black font-heading">Prospects by Vertical Industry</h2>
                <p className="text-[11px] text-neutral-600">Breakdown of commercial sectors in your portfolio</p>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800">
                {industryData.length} industries
              </span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={industryData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#737373" 
                    fontSize={10} 
                    angle={-20} 
                    textAnchor="end"
                    tickLine={false} 
                    tick={{ fill: '#000000', fontWeight: 500 }}
                  />
                  <YAxis stroke="#737373" fontSize={10} tickLine={false} tick={{ fill: '#000000', fontWeight: 500 }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e5e5', borderRadius: '8px', fontSize: '11px', color: '#000000', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#000000', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" fill="#eab308" radius={[4, 4, 0, 0]} name="Leads Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Opportunity Score Segments (Yellow Bar palette) */}
          <div className="p-5 rounded-xl border border-neutral-200 bg-white shadow-sm text-black space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-black font-heading">AI Opportunity Score Segments</h2>
                <p className="text-[11px] text-neutral-600">Real lead qualification score distribution</p>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-yellow-100 text-yellow-900">
                Avg: {avgLeadScore}
              </span>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                  <XAxis dataKey="range" stroke="#737373" fontSize={11} tickLine={false} tick={{ fill: '#000000', fontWeight: 500 }} />
                  <YAxis stroke="#737373" fontSize={11} tickLine={false} tick={{ fill: '#000000', fontWeight: 500 }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e5e5', borderRadius: '8px', fontSize: '11px', color: '#000000', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#000000', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#eab308" name="Leads Count">
                    {scoreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Territory & Location Breakdown */}
          <div className="p-5 rounded-xl border border-neutral-200 bg-white shadow-sm text-black space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-black font-heading">Territory & Geographic Spread</h2>
                <p className="text-[11px] text-neutral-600">Distribution of leads across regions and cities</p>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800">
                {locationData.length} locations
              </span>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#737373" 
                    fontSize={11} 
                    tickLine={false} 
                    tick={{ fill: '#000000', fontWeight: 500 }} 
                  />
                  <YAxis stroke="#737373" fontSize={11} tickLine={false} tick={{ fill: '#000000', fontWeight: 500 }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e5e5', borderRadius: '8px', fontSize: '11px', color: '#000000', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#000000', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" fill="#ca8a04" radius={[4, 4, 0, 0]} name="Leads Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data Quality & Enrichment Readiness */}
          <div className="lg:col-span-2 p-5 rounded-xl border border-neutral-200 bg-white shadow-sm text-black">
            <h2 className="text-sm font-bold text-black font-heading mb-1">Data Health & Enrichment Completeness</h2>
            <p className="text-[11px] text-neutral-600 mb-4">Availability of contact points for cold prospecting</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-lg border border-neutral-100 bg-neutral-50">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 mb-1">
                  <span>Has Live Website</span>
                  <Globe className="h-3.5 w-3.5 text-neutral-500" />
                </div>
                <div className="text-xl font-bold font-mono text-black">
                  {leadsWithWebsite} <span className="text-xs font-sans text-neutral-500 font-normal">({totalLeads > 0 ? Math.round((leadsWithWebsite / totalLeads) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-yellow-500 h-full rounded-full" 
                    style={{ width: `${totalLeads > 0 ? (leadsWithWebsite / totalLeads) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-neutral-100 bg-neutral-50">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 mb-1">
                  <span>Verified Email Available</span>
                  <Mail className="h-3.5 w-3.5 text-neutral-500" />
                </div>
                <div className="text-xl font-bold font-mono text-black">
                  {leadsWithEmail} <span className="text-xs font-sans text-neutral-500 font-normal">({totalLeads > 0 ? Math.round((leadsWithEmail / totalLeads) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-yellow-500 h-full rounded-full" 
                    style={{ width: `${totalLeads > 0 ? (leadsWithEmail / totalLeads) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-neutral-100 bg-neutral-50">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 mb-1">
                  <span>AI Analyzed Records</span>
                  <Award className="h-3.5 w-3.5 text-yellow-600" />
                </div>
                <div className="text-xl font-bold font-mono text-black">
                  {leads.filter(l => l.aiAnalysis).length} <span className="text-xs font-sans text-neutral-500 font-normal">({totalLeads > 0 ? Math.round((leads.filter(l => l.aiAnalysis).length / totalLeads) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-yellow-500 h-full rounded-full" 
                    style={{ width: `${totalLeads > 0 ? (leads.filter(l => l.aiAnalysis).length / totalLeads) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
