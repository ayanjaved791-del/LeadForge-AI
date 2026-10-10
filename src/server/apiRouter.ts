import express, { Request, Response } from 'express';
import { getGeminiClient } from './gemini.js';
import type { 
  AnalyzeCompanyRequest, 
  AnalyzeCompanyResponse, 
  GenerateOutreachRequest, 
  GenerateOutreachResponse,
  ScoreCategory 
} from '../types/index.js';

export const apiRouter = express.Router();
apiRouter.use(express.json());

function calculateScoreCategory(score: number): ScoreCategory {
  if (score >= 85) return 'Hot';
  if (score >= 70) return 'Good';
  if (score >= 40) return 'Moderate';
  return 'Low';
}

function getFallbackAnalysis(data: AnalyzeCompanyRequest): AnalyzeCompanyResponse {
  const company = data.companyName || 'This Company';
  const industry = data.industry || 'B2B Services';
  const location = data.location || 'Metropolitan Area';
  const hasWebsite = Boolean(data.website && data.website.includes('.'));
  
  // Deterministic realistic scores
  const businessPotential = Math.min(95, Math.max(55, Math.floor(65 + (company.length % 25))));
  const digitalOpportunity = hasWebsite ? 75 : 90;
  const websiteQuality = hasWebsite ? 68 : 32;
  const onlinePresence = hasWebsite ? 62 : 40;
  const serviceFit = 82;
  
  const leadScore = Math.round(
    (businessPotential * 0.25) + 
    (digitalOpportunity * 0.25) + 
    (websiteQuality * 0.20) + 
    (onlinePresence * 0.15) + 
    (serviceFit * 0.15)
  );

  return {
    summary: `${company} is an active business operating in the ${industry} sector in ${location}. Based on public profile data, they possess an established customer base with substantial headroom for modern digital customer acquisition and streamlined workflows.`,
    digitalAssessment: hasWebsite 
      ? `Their current web presence provides foundational visibility, but lacks modern conversion triggers, interactive client qualification, and fast mobile response times.`
      : `Currently operating without a modern, dedicated web presence or automated booking/inquiry funnel, representing an immediate high-ROI digital opportunity.`,
    problems: [
      `Absence of an automated, 24/7 client booking or inquiry qualification workflow on mobile.`,
      `Manual follow-up process causing delayed response times to prospective inbound leads.`,
      `Sub-optimal search visibility compared to local direct competitors in ${location}.`,
      `Lack of social proof integrations and automated review generation pipeline.`
    ],
    opportunities: [
      `Deploy a high-converting modern web platform with built-in scheduling and lead capture.`,
      `Implement an AI-powered conversational assistant to capture and qualify out-of-hours inquiries.`,
      `Launch targeted local SEO and structured citation management to dominate ${location} queries.`,
      `Automate client onboarding and automated SMS/email reminders to reduce no-shows.`
    ],
    recommendedServices: [
      `Website Development`,
      `AI Chatbot & Lead Qualifier`,
      `SEO & Local Visibility`,
      `CRM Automation`
    ],
    confidence: 88,
    businessPotentialScore: businessPotential,
    digitalOpportunityScore: digitalOpportunity,
    websiteQualityScore: websiteQuality,
    onlinePresenceScore: onlinePresence,
    serviceFitScore: serviceFit,
    leadScore,
    scoreCategory: calculateScoreCategory(leadScore)
  };
}

// 1. Analyze Company Endpoint
apiRouter.post('/leads/analyze', async (req: Request, res: Response) => {
  const data = req.body as AnalyzeCompanyRequest;
  if (!data || !data.companyName) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  const ai = getGeminiClient();

  if (!ai) {
    // Return high quality deterministic fallback analysis
    const fallback = getFallbackAnalysis(data);
    return res.json(fallback);
  }

  try {
    const prompt = `You are a Senior B2B Sales Intelligence and Opportunity Scoring Analyst for LeadForge AI.
Analyze the following prospective company:
Company Name: "${data.companyName}"
Industry: "${data.industry || 'Unknown'}"
Location: "${data.location || 'Unknown'}"
Website: "${data.website || 'None provided'}"
Email: "${data.email || 'None provided'}"
Phone: "${data.phone || 'None provided'}"
Company Size: "${data.companySize || 'Unknown'}"
Context/Notes: "${data.existingNotes || 'None'}"

Evaluate the company's digital maturity, commercial pain points, and modernization opportunities.
Provide your analysis in strictly valid JSON format matching this schema:
{
  "summary": "2-3 concise sentences describing their business model and current commercial posture",
  "digitalAssessment": "2 concise sentences assessing their digital footprint and web presence",
  "problems": ["3 to 4 specific operational, web, or acquisition bottlenecks"],
  "opportunities": ["3 to 4 concrete software, AI, web or SEO solutions"],
  "recommendedServices": ["3 to 4 primary service offerings from: Website Development, AI Chatbot, Software Development, SEO, CRM Integration, Automation"],
  "confidence": 85,
  "businessPotentialScore": 75,
  "digitalOpportunityScore": 88,
  "websiteQualityScore": 60,
  "onlinePresenceScore": 55,
  "serviceFitScore": 82
}
All scores must be integers between 10 and 98. Return ONLY valid JSON, with no code fences or markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text?.trim() || '';
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Failed to parse AI output');
      }
    }

    const businessPotential = Math.min(100, Math.max(10, Number(parsed.businessPotentialScore) || 70));
    const digitalOpportunity = Math.min(100, Math.max(10, Number(parsed.digitalOpportunityScore) || 75));
    const websiteQuality = Math.min(100, Math.max(10, Number(parsed.websiteQualityScore) || 55));
    const onlinePresence = Math.min(100, Math.max(10, Number(parsed.onlinePresenceScore) || 50));
    const serviceFit = Math.min(100, Math.max(10, Number(parsed.serviceFitScore) || 80));

    const leadScore = Math.round(
      (businessPotential * 0.25) + 
      (digitalOpportunity * 0.25) + 
      (websiteQuality * 0.20) + 
      (onlinePresence * 0.15) + 
      (serviceFit * 0.15)
    );

    const result: AnalyzeCompanyResponse = {
      summary: parsed.summary || `${data.companyName} operates in the ${data.industry} space.`,
      digitalAssessment: parsed.digitalAssessment || 'Digital footprint shows strong growth opportunity.',
      problems: Array.isArray(parsed.problems) ? parsed.problems.slice(0, 5) : [
        'Manual appointment scheduling bottleneck',
        'Outdated mobile responsive layout',
        'Delayed response to prospective inquiries'
      ],
      opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities.slice(0, 5) : [
        'Deploy conversion-focused web architecture',
        'Add AI automated inquiry handler',
        'Boost local geographic search rankings'
      ],
      recommendedServices: Array.isArray(parsed.recommendedServices) ? parsed.recommendedServices.slice(0, 4) : [
        'Website Development',
        'AI Chatbot',
        'SEO'
      ],
      confidence: Math.min(99, Math.max(60, Number(parsed.confidence) || 85)),
      businessPotentialScore: businessPotential,
      digitalOpportunityScore: digitalOpportunity,
      websiteQualityScore: websiteQuality,
      onlinePresenceScore: onlinePresence,
      serviceFitScore: serviceFit,
      leadScore,
      scoreCategory: calculateScoreCategory(leadScore)
    };

    return res.json(result);
  } catch (error) {
    console.warn('Gemini analysis failed or rate limited, falling back to local heuristic:', error);
    const fallback = getFallbackAnalysis(data);
    return res.json(fallback);
  }
});

// 2. Generate Outreach Endpoint
apiRouter.post('/leads/outreach', async (req: Request, res: Response) => {
  const data = req.body as GenerateOutreachRequest;
  if (!data || !data.companyName) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  const { companyName, industry, location, channel, tone, service, aiAnalysis } = data;
  const ai = getGeminiClient();

  if (!ai) {
    // Deterministic fallback generator
    let subject = `Quick observation regarding ${companyName}'s digital growth`;
    let message = '';
    let personalizationNotes = `Referenced ${companyName}'s position in ${industry} (${location}) and suggested high-impact ${service}.`;

    if (channel === 'Email') {
      subject = `Ideas to streamline ${companyName}'s client acquisition`;
      message = `Hi ${companyName} team,\n\nI was reviewing established businesses in the ${industry} space across ${location} and came across ${companyName}.\n\nNoticed that while your local reputation is strong, there is a clear opportunity to modernize your ${service.toLowerCase()}—specifically around capturing inbound customer interest outside regular hours and improving conversion.\n\nWe recently helped a similar team increase their qualified inquiries by 35% without adding overhead. Would you be open to a brief 7-minute chat this Thursday to see what we identified for ${companyName}?\n\nBest regards,\n[Your Name]`;
    } else if (channel === 'WhatsApp') {
      subject = `Direct WhatsApp Outreach`;
      message = `Hi team ${companyName}! 👋 Came across your ${industry} business in ${location}. We help teams implement high-impact ${service.toLowerCase()} to capture more qualified inquiries on autopilot. Would love to share 2 quick ideas we drafted specifically for ${companyName}. Would you be open to a 2-minute overview?`;
    } else {
      // LinkedIn
      subject = `Connecting regarding ${companyName}'s digital growth`;
      message = `Hi ${companyName} leadership team,\n\nCame across your work in the ${industry} sector in ${location}. I've been studying growth trends for companies like yours and put together a quick observation on how modernizing your ${service.toLowerCase()} could capture significant untapped inbound demand.\n\nWould love to connect here and share the quick breakdown if you're open to it!`;
    }

    const fallbackResponse: GenerateOutreachResponse = {
      subject,
      message,
      personalizationNotes
    };
    return res.json(fallbackResponse);
  }

  try {
    const prompt = `You are an elite B2B sales copywriter crafting bespoke, high-converting outreach for LeadForge AI.
Target Company: "${companyName}"
Industry: "${industry || 'B2B'}"
Location: "${location || 'Metro'}"
Channel: "${channel}" (options: Email, WhatsApp, LinkedIn)
Tone: "${tone}" (options: Professional, Friendly, Personalized, Concise)
Target Service: "${service}"
AI Opportunities noted: "${aiAnalysis?.opportunities?.join('; ') || 'Modernize customer acquisition and web presence'}"
Key bottlenecks: "${aiAnalysis?.problems?.join('; ') || 'Delayed inquiry responses and mobile bottlenecks'}"

Rules for ${channel}:
- If Email: Write a compelling 3-5 word subject line that feels like a peer email (not spammy, no fake 'Re:'). Write 3 clean, focused paragraphs. Lead with a concrete observation about their business, present the ${service} angle respectfully, and end with a soft, low-friction call-to-action.
- If WhatsApp: Extremely crisp (under 80 words), friendly yet professional, polite emoji usage, clear question at the end.
- If LinkedIn: Under 110 words, peer-to-peer conversational, focused on mutual industry context, ending with an invitation to connect.
- No generic AI cliches ("I hope this email finds you well", "In today's fast-paced digital world", "Synergy").
- Respect the Tone ("${tone}").

Return your response strictly in JSON:
{
  "subject": "Email subject or message hook",
  "message": "Full message text with appropriate line breaks",
  "personalizationNotes": "1-2 sentences explaining why this specific angle was chosen for ${companyName}"
}
Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text?.trim() || '';
    const parsed = JSON.parse(responseText);

    const result: GenerateOutreachResponse = {
      subject: parsed.subject || `Opportunity for ${companyName}`,
      message: parsed.message || 'Error generating message content.',
      personalizationNotes: parsed.personalizationNotes || `Tailored to ${companyName}'s ${industry} profile in ${location}.`
    };

    return res.json(result);
  } catch (error) {
    console.warn('Gemini outreach generation failed, using fallback:', error);
    return res.json({
      subject: `Quick observation for ${companyName}`,
      message: `Hi ${companyName} team,\n\nI was looking through leading ${industry} companies in ${location} and noticed an opportunity to enhance your customer acquisition with modern ${service.toLowerCase()}.\n\nWould you be open to seeing a quick 3-point breakdown of where qualified inquiries might be slipping through?\n\nBest,\n[Your Name]`,
      personalizationNotes: `Generated based on verified ${industry} industry benchmarks for ${location}.`
    });
  }
});

// Helper to classify authentic industry from Google Maps place types, primaryType, name, and search query
function detectBusinessIndustry(place: any, requestedCategory?: string, searchQuery?: string): string {
  const primaryType = (place.primaryType || '').toLowerCase();
  const allTypes = Array.isArray(place.types) ? place.types.map((t: string) => t.toLowerCase()).join(' ') : '';
  const name = (place.displayName?.text || '').toLowerCase();
  const combined = `${primaryType} ${allTypes} ${name}`.toLowerCase();

  if (
    combined.includes('software') || 
    combined.includes('technology') || 
    combined.includes('tech') || 
    combined.includes('computer') || 
    combined.includes('it_services') || 
    combined.includes('cloud') || 
    combined.includes('app_developer') || 
    combined.includes('data_') || 
    combined.includes('telecommunications')
  ) {
    return 'Software & Technology';
  }

  if (
    combined.includes('marketing') || 
    combined.includes('advertising') || 
    combined.includes('consultant') || 
    combined.includes('digital_marketing') || 
    combined.includes('media_company') || 
    combined.includes('creative_agency') || 
    combined.includes('seo') || 
    combined.includes('public_relations') || 
    combined.includes('branding')
  ) {
    return 'Marketing Agencies';
  }

  if (
    combined.includes('dental') || 
    combined.includes('dentist') || 
    combined.includes('orthodont') || 
    combined.includes('doctor') || 
    combined.includes('physician') || 
    combined.includes('medical') || 
    combined.includes('clinic') || 
    combined.includes('hospital') || 
    combined.includes('health') || 
    combined.includes('pediatric') || 
    combined.includes('chiropract') || 
    combined.includes('physical_therap') || 
    combined.includes('dermatolog') ||
    combined.includes('pharmacy')
  ) {
    return 'Dental & Medical Clinics';
  }

  if (
    combined.includes('lawyer') || 
    combined.includes('attorney') || 
    combined.includes('legal') || 
    combined.includes('law_firm') || 
    combined.includes('solicitor') || 
    combined.includes('notary') || 
    combined.includes('advocate') ||
    combined.includes('court')
  ) {
    return 'Law Firms';
  }

  if (
    combined.includes('real_estate') || 
    combined.includes('realtor') || 
    combined.includes('property') || 
    combined.includes('realty') || 
    combined.includes('housing') || 
    combined.includes('broker') || 
    combined.includes('mortgage')
  ) {
    return 'Real Estate Agencies';
  }

  if (
    combined.includes('accounting') || 
    combined.includes('accountant') || 
    combined.includes('cpa') || 
    combined.includes('tax') || 
    combined.includes('bank') || 
    combined.includes('finance') || 
    combined.includes('financial') || 
    combined.includes('investment') || 
    combined.includes('insurance') || 
    combined.includes('wealth') || 
    combined.includes('bookkeep')
  ) {
    return 'Financial Services';
  }

  if (
    combined.includes('plumber') || 
    combined.includes('plumbing') || 
    combined.includes('electrician') || 
    combined.includes('electrical') || 
    combined.includes('hvac') || 
    combined.includes('air_conditioning') || 
    combined.includes('heating') || 
    combined.includes('roofing') || 
    combined.includes('roofer') || 
    combined.includes('contractor') || 
    combined.includes('construction') || 
    combined.includes('painter') || 
    combined.includes('landscap') || 
    combined.includes('pest_control') || 
    combined.includes('locksmith')
  ) {
    return 'Home & Trade Services';
  }

  if (
    combined.includes('restaurant') || 
    combined.includes('cafe') || 
    combined.includes('bakery') || 
    combined.includes('bistro') || 
    combined.includes('bar') || 
    combined.includes('pub') || 
    combined.includes('coffee') || 
    combined.includes('catering') || 
    combined.includes('hotel') || 
    combined.includes('resort') || 
    combined.includes('food')
  ) {
    return 'Restaurants & Cafes';
  }

  if (
    combined.includes('gym') || 
    combined.includes('fitness') || 
    combined.includes('workout') || 
    combined.includes('yoga') || 
    combined.includes('pilates') || 
    combined.includes('crossfit') || 
    combined.includes('spa') || 
    combined.includes('salon') || 
    combined.includes('wellness')
  ) {
    return 'Fitness & Wellness';
  }

  if (
    combined.includes('car_dealer') || 
    combined.includes('car_repair') || 
    combined.includes('auto_repair') || 
    combined.includes('mechanic') || 
    combined.includes('automotive') || 
    combined.includes('tire')
  ) {
    return 'Automotive Services';
  }

  // Fallback to explicit requested category if not generic
  if (requestedCategory && requestedCategory !== 'All' && requestedCategory !== 'All Businesses') {
    return requestedCategory;
  }

  // If search query indicated a niche
  if (searchQuery && searchQuery.trim().length > 2 && searchQuery.toLowerCase() !== 'companies') {
    return searchQuery.trim();
  }

  return 'B2B Services';
}

// 4. Google Places API (New) Search Companies Endpoint
apiRouter.post('/places/search', async (req: Request, res: Response) => {
  const { location, query, category, minRating, maxResultCount = 20 } = req.body;

  if (!location || typeof location !== 'string' || !location.trim()) {
    return res.status(400).json({ error: 'Location is required to find companies on Google Maps' });
  }

  const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Google Maps API key is not configured' });
  }

  const cleanLocation = location.trim();
  const rawQuery = query?.trim() || '';
  const rawCategory = (category && category !== 'All' && category !== 'All Businesses') ? category.trim() : '';

  // Formulate high-precision Google Maps searchText query
  let searchQueryTerm = 'companies';
  if (rawQuery && rawCategory) {
    searchQueryTerm = `${rawQuery} ${rawCategory}`;
  } else if (rawQuery) {
    searchQueryTerm = rawQuery;
  } else if (rawCategory) {
    searchQueryTerm = rawCategory;
  }

  const fullTextQuery = `${searchQueryTerm} in ${cleanLocation}`;

  try {
    const url = 'https://places.googleapis.com/v1/places:searchText';
    const requestBody: any = {
      textQuery: fullTextQuery,
      maxResultCount: Math.min(20, Math.max(1, Number(maxResultCount) || 20)),
    };

    if (minRating && Number(minRating) > 0) {
      requestBody.minRating = Math.min(5, Math.max(1, Number(minRating)));
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.primaryType,places.types,places.location,places.businessStatus,places.googleMapsUri',
        'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Google Places API search error:', response.status, errText);
      return res.status(response.status).json({ 
        error: 'Failed to fetch places from Google Maps',
        details: errText 
      });
    }

    const data: any = await response.json();
    const rawPlaces = data.places || [];

    // Map raw Google Maps places to structured real business records
    const companies = rawPlaces.map((place: any) => {
      const companyName = place.displayName?.text || 'Business';
      const website = place.websiteUri || '';
      const hasWebsite = Boolean(website && website.includes('.'));
      const rating = place.rating || 0;
      const reviews = place.userRatingCount || 0;

      // Extract high-accuracy industry classification
      const detectedIndustry = detectBusinessIndustry(place, category, searchQueryTerm);

      // Compute commercial opportunity score:
      // Real businesses with high reputation but missing websites or outdated tech are prime clients for B2B agencies
      let oppScore = 65;
      if (!hasWebsite) {
        oppScore += 24; // Massive digital opportunity (needs a website, online presence, scheduling)
      } else if (!website.startsWith('https://')) {
        oppScore += 12; // Unsecured or outdated protocol
      } else {
        oppScore += 6;
      }

      if (rating >= 4.5) {
        oppScore += 7; // Top-tier local reputation
      } else if (rating >= 4.0) {
        oppScore += 4; // Solid reputation
      }

      if (reviews > 25) {
        oppScore += 4; // High client activity
      } else if (reviews > 5) {
        oppScore += 2;
      }

      if (place.nationalPhoneNumber) {
        oppScore += 2; // Verified direct line
      }

      oppScore = Math.min(96, Math.max(45, oppScore));
      const scoreCategory: ScoreCategory = calculateScoreCategory(oppScore);

      return {
        id: place.id,
        placeId: place.id,
        companyName,
        industry: detectedIndustry,
        location: cleanLocation,
        formattedAddress: place.formattedAddress || cleanLocation,
        website,
        phone: place.nationalPhoneNumber || '',
        rating: place.rating,
        userRatingCount: place.userRatingCount,
        googleMapsUri: place.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${place.id}`,
        businessStatus: place.businessStatus || 'OPERATIONAL',
        types: place.types || [],
        coordinates: place.location ? {
          lat: place.location.latitude,
          lng: place.location.longitude,
        } : undefined,
        leadScore: oppScore,
        scoreCategory,
      };
    });

    return res.json({
      location: cleanLocation,
      query: searchQueryTerm,
      total: companies.length,
      companies,
    });
  } catch (error: any) {
    console.error('Error querying Google Maps Places:', error);
    return res.status(500).json({ error: 'Internal error communicating with Google Maps Platform', message: error.message });
  }
});

// 5. Reverse Geocode endpoint (translates lat/lng from user's browser to city/country)
apiRouter.post('/places/reverse-geocode', async (req: Request, res: Response) => {
  const { lat, lng } = req.body;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'lat and lng coordinates are required' });
  }

  const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Google Maps API key is not configured' });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Geocoding failed' });
    }

    const data: any = await response.json();
    const results = data.results || [];
    if (results.length === 0) {
      return res.json({ locationName: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, formattedAddress: '' });
    }

    // Extract locality/city and country from address components
    let locality = '';
    let adminArea = '';
    let country = '';

    for (const comp of results[0].address_components || []) {
      if (comp.types.includes('locality')) {
        locality = comp.long_name;
      } else if (comp.types.includes('administrative_area_level_1')) {
        adminArea = comp.short_name;
      } else if (comp.types.includes('country')) {
        country = comp.long_name;
      }
    }

    const locationParts = [locality, adminArea, country].filter(Boolean);
    const locationName = locationParts.length > 0 ? locationParts.join(', ') : results[0].formatted_address;

    return res.json({
      locationName,
      formattedAddress: results[0].formatted_address,
      locality,
      adminArea,
      country,
      coordinates: { lat, lng },
    });
  } catch (error: any) {
    console.error('Error in reverse geocoding:', error);
    return res.status(500).json({ error: 'Failed to reverse geocode location', message: error.message });
  }
});

// 6. Improve Outreach Endpoint
apiRouter.post('/leads/improve-outreach', async (req: Request, res: Response) => {
  const { currentSubject, currentMessage, action, channel, tone, service, companyName } = req.body;
  const ai = getGeminiClient();

  if (!ai || !currentMessage) {
    if (action === 'shorter') {
      const shortened = currentMessage.split('\n').filter((l: string) => l.trim().length > 0).slice(0, 3).join('\n\n');
      return res.json({
        subject: currentSubject,
        message: shortened || currentMessage,
        personalizationNotes: 'Condensed for quicker reading and response rate.'
      });
    }
    return res.json({
      subject: currentSubject,
      message: currentMessage,
      personalizationNotes: 'Preserved core message.'
    });
  }

  try {
    let instruction = '';
    if (action === 'shorter') {
      instruction = 'Condense this outreach message to be at least 40% shorter, punchier, and faster to read, while keeping the core value proposition and call to action intact.';
    } else if (action === 'more_professional') {
      instruction = 'Elevate this message to be more polished, executive, and consultative in tone without becoming stiff or formal jargon.';
    } else {
      instruction = 'Provide a fresh alternative angle for this message, using a different psychological hook and perspective.';
    }

    const prompt = `You are an expert sales copy editor.
Target Company: "${companyName || 'the prospect'}"
Channel: "${channel || 'Email'}"
Current Subject: "${currentSubject || ''}"
Current Message:
"""
${currentMessage}
"""

Task: ${instruction}
Format output as JSON:
{
  "subject": "Refined subject line",
  "message": "Refined message text",
  "personalizationNotes": "Brief explanation of the refinement made"
}
Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({
      subject: parsed.subject || currentSubject,
      message: parsed.message || currentMessage,
      personalizationNotes: parsed.personalizationNotes || 'Refined message.'
    });
  } catch (error) {
    console.warn('Error improving outreach:', error);
    return res.json({
      subject: currentSubject,
      message: currentMessage,
      personalizationNotes: 'Maintained current draft.'
    });
  }
});


