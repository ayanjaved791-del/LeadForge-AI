export type LeadStatus = 'New' | 'Contacted' | 'Replied' | 'Interested' | 'Converted' | 'Not Interested';

export type ScoreCategory = 'Low' | 'Moderate' | 'Good' | 'Hot';

export type OutreachChannel = 'Email' | 'WhatsApp' | 'LinkedIn';

export type OutreachTone = 'Professional' | 'Friendly' | 'Personalized' | 'Concise';

export type TargetService = 
  | 'Website Development' 
  | 'AI Chatbot' 
  | 'Software Development' 
  | 'SEO' 
  | 'Custom Service';

export interface ScoreBreakdown {
  businessPotential: number; // 0-100
  digitalOpportunity: number; // 0-100
  websiteQuality: number; // 0-100
  onlinePresence: number; // 0-100
  serviceFit: number; // 0-100
}

export interface AIAnalysis {
  summary: string;
  digitalAssessment: string;
  problems: string[];
  opportunities: string[];
  recommendedServices: string[];
  confidence: number; // 0-100
  generatedAt?: string;
}

export interface Lead {
  id: string;
  ownerId: string;
  companyName: string;
  industry: string;
  location: string;
  website: string;
  email: string;
  phone: string;
  companySize?: string;
  source: 'demo' | 'csv' | 'discovery' | 'manual' | 'google-maps';
  leadScore: number; // 0-100
  scoreCategory: ScoreCategory;
  scoreBreakdown?: ScoreBreakdown;
  aiAnalysis?: AIAnalysis;
  recommendedServices?: string[];
  status: LeadStatus;
  campaignId?: string;
  notes?: string;
  placeId?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  formattedAddress?: string;
  coordinates?: { lat: number; lng: number };
  createdAt: string;
  updatedAt: string;
}

export interface GooglePlaceBusiness {
  id: string;
  companyName: string;
  industry: string;
  location: string;
  formattedAddress: string;
  website: string;
  phone: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  businessStatus?: string;
  types?: string[];
  coordinates?: { lat: number; lng: number };
  leadScore: number;
  scoreCategory: ScoreCategory;
}

export interface Campaign {
  id: string;
  ownerId: string;
  name: string;
  industry: string;
  location: string;
  service: string;
  description: string;
  leadCount: number;
  contactedCount: number;
  replyCount: number;
  interestedCount: number;
  convertedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OutreachMessage {
  id: string;
  ownerId: string;
  leadId: string;
  companyName: string;
  campaignId?: string;
  channel: OutreachChannel;
  subject: string;
  message: string;
  tone: OutreachTone;
  service: string;
  personalizationNotes?: string;
  status: 'Draft' | 'Ready' | 'Sent';
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  plan: 'starter' | 'pro' | 'agency';
  company?: string;
  createdAt: string;
}

export interface AnalyzeCompanyRequest {
  companyName: string;
  industry: string;
  location: string;
  website?: string;
  email?: string;
  phone?: string;
  companySize?: string;
  existingNotes?: string;
}

export interface AnalyzeCompanyResponse {
  summary: string;
  digitalAssessment: string;
  problems: string[];
  opportunities: string[];
  recommendedServices: string[];
  confidence: number;
  businessPotentialScore: number;
  digitalOpportunityScore: number;
  websiteQualityScore: number;
  onlinePresenceScore: number;
  serviceFitScore: number;
  leadScore: number;
  scoreCategory: ScoreCategory;
}

export interface GenerateOutreachRequest {
  companyName: string;
  industry: string;
  location: string;
  website?: string;
  channel: OutreachChannel;
  tone: OutreachTone;
  service: string;
  aiAnalysis?: AIAnalysis;
  customContext?: string;
}

export interface GenerateOutreachResponse {
  subject: string;
  message: string;
  personalizationNotes: string;
}
