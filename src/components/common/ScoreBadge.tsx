import React from 'react';
import type { ScoreCategory, LeadStatus } from '../../types/index.js';

interface ScoreBadgeProps {
  score: number;
  category?: ScoreCategory;
  showCategory?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ 
  score, 
  category, 
  showCategory = true,
  size = 'md' 
}) => {
  const cat = category || (score >= 85 ? 'Hot' : score >= 70 ? 'Good' : score >= 40 ? 'Moderate' : 'Low');

  const badgeStyles: Record<ScoreCategory, {
    container: string;
    dot: string;
    score: string;
    label: string;
  }> = {
    Hot: {
      container: 'bg-amber-400/15 text-amber-300 border border-amber-400/35',
      dot: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]',
      score: 'text-amber-200 font-bold',
      label: 'text-amber-300/90 font-medium',
    },
    Good: {
      container: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35',
      dot: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]',
      score: 'text-emerald-200 font-bold',
      label: 'text-emerald-300/90 font-medium',
    },
    Moderate: {
      container: 'bg-blue-500/15 text-blue-300 border border-blue-500/35',
      dot: 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]',
      score: 'text-blue-200 font-bold',
      label: 'text-blue-300/90 font-medium',
    },
    Low: {
      container: 'bg-neutral-800/80 text-neutral-300 border border-neutral-700',
      dot: 'bg-neutral-400',
      score: 'text-neutral-200 font-bold',
      label: 'text-neutral-400 font-medium',
    },
  };

  const style = badgeStyles[cat] || badgeStyles.Low;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono tabular-nums whitespace-nowrap ${style.container} ${
      size === 'sm' ? 'text-xs px-1.5 py-0.5' : size === 'lg' ? 'text-base font-semibold px-2.5 py-1' : 'text-xs font-medium'
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`} />
      <span className={style.score}>{score}</span>
      {showCategory && (
        <span className={`text-[11px] font-sans ${style.label}`}>
          · {cat}
        </span>
      )}
    </div>
  );
};

interface StatusBadgeProps {
  status: LeadStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusStyles: Record<LeadStatus, {
    container: string;
    dot: string;
    text: string;
  }> = {
    New: {
      container: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
      dot: 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.7)]',
      text: 'text-sky-300 font-medium',
    },
    Contacted: {
      container: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
      dot: 'bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.7)]',
      text: 'text-purple-300 font-medium',
    },
    Replied: {
      container: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
      dot: 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.7)]',
      text: 'text-cyan-300 font-medium',
    },
    Interested: {
      container: 'bg-amber-400/15 text-amber-300 border border-amber-400/35',
      dot: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]',
      text: 'text-amber-300 font-semibold',
    },
    Converted: {
      container: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35',
      dot: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]',
      text: 'text-emerald-300 font-bold',
    },
    'Not Interested': {
      container: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
      dot: 'bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.7)]',
      text: 'text-rose-300 font-medium',
    },
  };

  const style = statusStyles[status] || statusStyles.New;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] whitespace-nowrap ${style.container}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`} />
      <span className={style.text}>{status}</span>
    </span>
  );
};
