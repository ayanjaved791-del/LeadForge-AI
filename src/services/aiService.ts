import type { 
  AnalyzeCompanyRequest, 
  AnalyzeCompanyResponse, 
  GenerateOutreachRequest, 
  GenerateOutreachResponse 
} from '../types/index.js';

export async function analyzeCompany(request: AnalyzeCompanyRequest): Promise<AnalyzeCompanyResponse> {
  const response = await fetch('/api/leads/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Analysis failed with status ${response.status}`);
  }

  return response.json();
}

export async function generateOutreach(request: GenerateOutreachRequest): Promise<GenerateOutreachResponse> {
  const response = await fetch('/api/leads/outreach', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Outreach generation failed with status ${response.status}`);
  }

  return response.json();
}

export async function improveOutreach(params: {
  currentSubject: string;
  currentMessage: string;
  action: 'shorter' | 'more_professional' | 'regenerate';
  channel: string;
  tone: string;
  service: string;
  companyName: string;
}): Promise<GenerateOutreachResponse> {
  const response = await fetch('/api/leads/improve-outreach', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Refinement failed with status ${response.status}`);
  }

  return response.json();
}
