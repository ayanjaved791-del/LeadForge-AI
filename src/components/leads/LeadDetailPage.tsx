import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  ExternalLink, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  RefreshCw
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext.js';
import { ScoreBadge } from '../common/ScoreBadge.js';
import { useToast } from '../common/Toast.js';
import { analyzeCompany } from '../../services/aiService.js';
import type { 
  Lead, 
  LeadStatus, 
  AIAnalysis 
} from '../../types/index.js';

interface LeadDetailPageProps {
  lead: Lead;
  onBack: () => void;
  onGenerateOutreach?: (leadId: string) => void;
}

export const LeadDetailPage: React.FC<LeadDetailPageProps> = ({ lead, onBack, onGenerateOutreach }) => {
  const { updateLeadDetails, updateLeadStatus } = useLeads();
  const { showToast } = useToast();

  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Trigger AI Company Analysis
  const handleAnalyzeWithAI = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await analyzeCompany({
        companyName: lead.companyName,
        industry: lead.industry,
        location: lead.location,
        website: lead.website,
        email: lead.email,
        phone: lead.phone,
        companySize: lead.companySize,
        existingNotes: lead.notes,
      });

      const updatedAIAnalysis: AIAnalysis = {
        summary: response.summary,
        digitalAssessment: response.digitalAssessment,
        problems: response.problems,
        opportunities: response.opportunities,
        recommendedServices: response.recommendedServices,
        confidence: response.confidence,
        generatedAt: new Date().toISOString(),
      };

      await updateLeadDetails(lead.id, {
        leadScore: response.leadScore,
        scoreCategory: response.scoreCategory,
        scoreBreakdown: {
          businessPotential: response.businessPotentialScore,
          digitalOpportunity: response.digitalOpportunityScore,
          websiteQuality: response.websiteQualityScore,
          onlinePresence: response.onlinePresenceScore,
          serviceFit: response.serviceFitScore,
        },
        aiAnalysis: updatedAIAnalysis,
        recommendedServices: response.recommendedServices,
      });

      showToast(`AI Opportunity analysis complete (Score: ${response.leadScore})`, 'success');
    } catch (err: any) {
      console.error('Analysis error:', err);
      setAnalysisError(err?.message || 'Failed to analyze company with AI. Please try again.');
      showToast('AI analysis failed. Check network.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const breakdown = lead.scoreBreakdown || {
    businessPotential: 75,
    digitalOpportunity: 80,
    websiteQuality: 65,
    onlinePresence: 60,
    serviceFit: 85,
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors shrink-0 mt-0.5 sm:mt-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-heading truncate" title={lead.companyName}>
                {lead.companyName}
              </h1>
              {lead.website && (
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-500 hover:text-white shrink-0 p-0.5 rounded hover:bg-neutral-800"
                  title="Open company website"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-neutral-400 mt-1">
              <span className="truncate max-w-[150px]">{lead.industry}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate max-w-[150px]">{lead.location}</span>
              <span aria-hidden="true">·</span>
              <span className="whitespace-nowrap">Added {new Date(lead.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Lead Status Selector & Outreach Pitch Action */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto flex-wrap">
          {onGenerateOutreach && (
            <button
              onClick={() => onGenerateOutreach(lead.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-colors shadow-xs shrink-0"
              title="Draft personalized outreach message for this company"
            >
              <Sparkles className="h-3.5 w-3.5 text-black" />
              <span>Draft Outreach</span>
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-neutral-400 whitespace-nowrap">Status:</span>
            <select
              value={lead.status}
              onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white font-medium focus:outline-hidden focus:border-white shrink-0"
            >
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Replied">Replied</option>
              <option value="Interested">Interested</option>
              <option value="Converted">Converted</option>
              <option value="Not Interested">Not Interested</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid: Left Column / Right Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 5 cols */}
        <div className="lg:col-span-5 space-y-5">
          {/* Company Details Card */}
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-heading">
              Company Information
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-neutral-300">
                <Building2 className="h-3.5 w-3.5 text-neutral-500" />
                <span className="text-neutral-500">Size:</span>
                <span>{lead.companySize || 'Not specified'}</span>
              </div>

              <div className="flex items-center gap-2 text-neutral-300">
                <MapPin className="h-3.5 w-3.5 text-neutral-500" />
                <span className="text-neutral-500">Location:</span>
                <span>{lead.location}</span>
              </div>

              {lead.email && (
                <div className="flex items-center gap-2 text-neutral-300">
                  <Mail className="h-3.5 w-3.5 text-neutral-500" />
                  <span className="text-neutral-500">Email:</span>
                  <a href={`mailto:${lead.email}`} className="text-white hover:underline">
                    {lead.email}
                  </a>
                </div>
              )}

              {lead.phone && (
                <div className="flex items-center gap-2 text-neutral-300">
                  <Phone className="h-3.5 w-3.5 text-neutral-500" />
                  <span className="text-neutral-500">Phone:</span>
                  <a href={`tel:${lead.phone}`} className="text-white hover:underline">
                    {lead.phone}
                  </a>
                </div>
              )}

              {lead.website && (
                <div className="flex items-center gap-2 text-neutral-300">
                  <ExternalLink className="h-3.5 w-3.5 text-neutral-500" />
                  <span className="text-neutral-500">Website:</span>
                  <a 
                    href={lead.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-white hover:underline truncate max-w-[200px]"
                  >
                    {lead.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}

              {lead.googleMapsUri && (
                <div className="flex items-center gap-2 text-neutral-300">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-neutral-500">Google Maps:</span>
                  <a 
                    href={lead.googleMapsUri} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <span>View on Maps</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {lead.rating && (
                    <span className="ml-auto text-[11px] font-bold text-amber-400">
                      ⭐ {lead.rating.toFixed(1)} ({lead.userRatingCount || 0})
                    </span>
                  )}
                </div>
              )}

              <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
                <span>Ingestion Source:</span>
                <span className="uppercase font-mono text-neutral-400">{lead.source}</span>
              </div>
            </div>
          </div>

          {/* AI Opportunity Score Breakdown Card */}
          <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-heading">
                AI Opportunity Score
              </h2>
              <ScoreBadge score={lead.leadScore} category={lead.scoreCategory} />
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-400">Business Potential</span>
                  <span className="font-mono text-white font-medium">{breakdown.businessPotential}/100</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-white h-full rounded-full transition-all duration-300"
                    style={{ width: `${breakdown.businessPotential}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-400">Digital Headroom</span>
                  <span className="font-mono text-white font-medium">{breakdown.digitalOpportunity}/100</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-white h-full rounded-full transition-all duration-300"
                    style={{ width: `${breakdown.digitalOpportunity}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-400">Website Modernization Need</span>
                  <span className="font-mono text-white font-medium">{breakdown.websiteQuality}/100</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-white h-full rounded-full transition-all duration-300"
                    style={{ width: `${breakdown.websiteQuality}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-400">Online Footprint Gap</span>
                  <span className="font-mono text-white font-medium">{breakdown.onlinePresence}/100</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-white h-full rounded-full transition-all duration-300"
                    style={{ width: `${breakdown.onlinePresence}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-400">Service Fit Probability</span>
                  <span className="font-mono text-white font-medium">{breakdown.serviceFit}/100</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-white h-full rounded-full transition-all duration-300"
                    style={{ width: `${breakdown.serviceFit}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="text-[10px] text-neutral-500 italic leading-relaxed pt-2 border-t border-neutral-800">
              * The AI Opportunity Score measures modernization need and digital headroom.
            </p>

            <button
              onClick={handleAnalyzeWithAI}
              disabled={isAnalyzing}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition-all shadow-xs disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-black" />
                  <span>Analyzing company digital footprint...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-black" />
                  <span>Re-Analyze with Gemini AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: 7 cols */}
        <div className="lg:col-span-7 space-y-5">
          {/* Structured AI Analysis Cards */}
          {lead.aiAnalysis ? (
            <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-white" />
                  <h2 className="text-sm font-semibold text-white font-heading">
                    AI Opportunity & Digital Analysis
                  </h2>
                </div>
                <span className="text-[11px] text-neutral-400 font-mono">
                  Confidence: {lead.aiAnalysis.confidence}%
                </span>
              </div>

              {/* Summary & Assessment */}
              <div className="space-y-2 text-xs leading-relaxed">
                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                  <span className="text-[11px] font-semibold text-white block mb-1">Company Summary:</span>
                  <p className="text-neutral-300">{lead.aiAnalysis.summary}</p>
                </div>
                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                  <span className="text-[11px] font-semibold text-white block mb-1">Digital Footprint Assessment:</span>
                  <p className="text-neutral-300">{lead.aiAnalysis.digitalAssessment}</p>
                </div>
              </div>

              {/* Two Column Problems & Opportunities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Problems */}
                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                  <span className="text-[11px] font-semibold text-neutral-200 block mb-2">
                    Identified Bottlenecks
                  </span>
                  <ul className="space-y-1.5 text-neutral-400">
                    {lead.aiAnalysis.problems.map((prob, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-neutral-500 shrink-0 mt-0.5">•</span>
                        <span>{prob}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Opportunities */}
                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                  <span className="text-[11px] font-semibold text-white block mb-2">
                    High-ROI Opportunities
                  </span>
                  <ul className="space-y-1.5 text-neutral-300">
                    {lead.aiAnalysis.opportunities.map((opp, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-neutral-500 shrink-0 mt-0.5">•</span>
                        <span>{opp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommended Services */}
              <div className="pt-2">
                <span className="text-[11px] font-medium text-neutral-400 block mb-1.5">
                  Recommended Service Focus:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(lead.recommendedServices || lead.aiAnalysis.recommendedServices).map((svc, i) => (
                    <span 
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-neutral-850 border border-neutral-750 text-white text-xs font-medium"
                    >
                      {svc}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl border border-neutral-800 bg-neutral-900/30 text-center space-y-3">
              <Sparkles className="h-8 w-8 text-neutral-600 mx-auto" />
              <div className="text-xs text-neutral-400 max-w-sm mx-auto">
                No detailed AI analysis generated for this lead yet. Click below to analyze company public signals, operational pain points, and opportunity scoring.
              </div>
              <button
                onClick={handleAnalyzeWithAI}
                disabled={isAnalyzing}
                className="px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-colors"
              >
                {isAnalyzing ? 'Analyzing company...' : 'Analyze with AI Now'}
              </button>
            </div>
          )}

          {analysisError && (
            <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-neutral-300">
              {analysisError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
