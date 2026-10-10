import React from 'react';
import { 
  Sparkles, 
  FileSpreadsheet, 
  ShieldCheck, 
  CheckCircle2,
} from 'lucide-react';

export const HelpPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white font-heading">
          Help & Operational Playbook
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Best practices for B2B lead discovery, AI opportunity scoring calibration, and prospect qualification.
        </p>
      </div>

      <div className="space-y-5">
        {/* Playbook Cards */}
        <div className="p-5 rounded-xl border border-neutral-800/80 bg-neutral-900/40 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-800/70">
            <Sparkles className="h-4 w-4 text-white" />
            <h2 className="text-sm font-semibold text-white font-heading">
              Understanding the AI Opportunity Score
            </h2>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            The <strong>AI Opportunity Score (0–100)</strong> quantifies how much commercial headroom and digital modernization potential a prospective company presents.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
            <div className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-800">
              <span className="font-semibold text-white block mb-1">Hot Leads (85–100):</span>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                Companies with established customer footfall or revenue, but suffering from severe operational bottlenecks (e.g. lost after-hours inquiries, unindexed services, or outdated manual intake). High modernization potential for modern web & software tools.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-800">
              <span className="font-semibold text-neutral-200 block mb-1">Good Leads (70–84):</span>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                Solid businesses with moderate web presence that would benefit from targeted enhancements like conversion rate optimization, local SEO, or automated follow-ups.
              </p>
            </div>
          </div>
        </div>

        {/* Prospect Quality & Verification */}
        <div className="p-5 rounded-xl border border-neutral-800/80 bg-neutral-900/40 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-800/70">
            <ShieldCheck className="h-4 w-4 text-white" />
            <h2 className="text-sm font-semibold text-white font-heading">
              Prospect Quality & Verification Philosophy
            </h2>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            LeadForge AI is explicitly designed for <strong>bespoke, high-value B2B prospect research</strong> and qualification.
          </p>
          <ul className="space-y-2 text-xs text-neutral-400">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-white shrink-0 mt-0.5" />
              <span><strong>Verify Digital Footprint:</strong> Inspect the prospect's public website and contact details to validate operational need.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-white shrink-0 mt-0.5" />
              <span><strong>Prioritize Modernization Need:</strong> Focus on businesses where digital gaps directly impede conversion or customer booking.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-white shrink-0 mt-0.5" />
              <span><strong>Calibrated Service Fit:</strong> Match recommended service pitches with the diagnosed operational bottlenecks.</span>
            </li>
          </ul>
        </div>

        {/* CSV Ingestion Guide */}
        <div className="p-5 rounded-xl border border-neutral-800/80 bg-neutral-900/40 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-800/70">
            <FileSpreadsheet className="h-4 w-4 text-white" />
            <h2 className="text-sm font-semibold text-white font-heading">
              CSV Import Formatting Guide
            </h2>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            When importing proprietary lead files, ensure your CSV has a header row with columns like:
          </p>
          <div className="p-3 rounded-lg bg-neutral-950 font-mono text-[11px] text-neutral-300 border border-neutral-800 overflow-x-auto">
            company_name, website, email, phone, industry, location
          </div>
          <p className="text-[11px] text-neutral-500 italic">
            Column headers do not need to match exactly; our interactive mapper will let you map each column before final database import.
          </p>
        </div>
      </div>
    </div>
  );
};
