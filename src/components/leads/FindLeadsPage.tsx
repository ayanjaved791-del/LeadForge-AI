import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Globe, 
  Phone, 
  Star, 
  ExternalLink, 
  BookmarkPlus, 
  Check, 
  Sparkles, 
  FileSpreadsheet, 
  Navigation, 
  RefreshCw, 
  Building2, 
  Layers, 
  Map as MapIcon, 
  List, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  LocateFixed,
  Radio,
  X,
  ArrowUpDown,
  Zap
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext.js';
import { ScoreBadge } from '../common/ScoreBadge.js';
import { useToast } from '../common/Toast.js';
import { GooglePlacesMap } from './GooglePlacesMap.js';
import { RealTimeLocationPromptModal } from './RealTimeLocationPromptModal.js';
import type { Lead, GooglePlaceBusiness } from '../../types/index.js';

interface FindLeadsPageProps {
  onSelectLead: (lead: Lead) => void;
  onOpenCsvModal: () => void;
  globalSearchQuery?: string;
  setGlobalSearchQuery?: (q: string) => void;
}

const POPULAR_LOCATIONS = [
  'San Francisco, CA',
  'New York, NY',
  'London, UK',
  'Austin, TX',
  'Dubai, UAE',
  'Chicago, IL',
  'Berlin, Germany',
  'Toronto, Canada',
  'Sydney, Australia',
];

const INDUSTRIES = [
  'All Businesses',
  'Software & Technology',
  'Marketing Agencies',
  'Dental & Medical Clinics',
  'Real Estate Agencies',
  'Law Firms',
  'Financial Services',
  'Home & Trade Services',
  'Restaurants & Cafes',
  'Fitness & Wellness',
  'Automotive Services',
];

const QUICK_CATEGORY_TAGS = [
  { label: 'All Businesses', category: 'All Businesses', query: '' },
  { label: '💻 Software & Tech', category: 'Software & Technology', query: 'software tech companies' },
  { label: '📈 Marketing Agencies', category: 'Marketing Agencies', query: 'marketing agency' },
  { label: '🦷 Dental & Medical', category: 'Dental & Medical Clinics', query: 'dental clinics' },
  { label: '🏡 Real Estate', category: 'Real Estate Agencies', query: 'real estate agency' },
  { label: '⚖️ Law Firms', category: 'Law Firms', query: 'law firms' },
  { label: '💼 Financial Services', category: 'Financial Services', query: 'financial services' },
  { label: '🔧 Home & Trade', category: 'Home & Trade Services', query: 'home services contractors' },
  { label: '☕ Cafes & Dining', category: 'Restaurants & Cafes', query: 'restaurants cafes' },
  { label: '🏋️ Fitness & Gym', category: 'Fitness & Wellness', query: 'fitness wellness gym' },
];

const STORAGE_KEY_LOCATION = 'leadforge_user_location_pref';
const STORAGE_KEY_GPS_USED = 'leadforge_gps_used';

export const FindLeadsPage: React.FC<FindLeadsPageProps> = ({ 
  onSelectLead, 
  onOpenCsvModal,
  globalSearchQuery = '',
  setGlobalSearchQuery
}) => {
  const { leads, saveDiscoveryLeadToMyLeads, saveBatchDiscoveryLeadsToMyLeads } = useLeads();
  const { showToast } = useToast();

  // Location State
  const [userLocation, setUserLocation] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_LOCATION) || '';
  });
  const [locationInput, setLocationInput] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_LOCATION) || '';
  });
  const [isGpsActive, setIsGpsActive] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_GPS_USED) === 'true';
  });
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Real-Time Location Modal State - open on initial visit if no location has been saved or explicitly prompted yet
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(() => {
    const hasLocation = localStorage.getItem(STORAGE_KEY_LOCATION);
    const hasPrompted = localStorage.getItem('leadforge_location_prompted');
    return !hasLocation && hasPrompted !== 'true';
  });

  // Search parameters
  const [selectedIndustry, setSelectedIndustry] = useState<string>('All Businesses');
  const [customKeyword, setCustomKeyword] = useState<string>('');

  // Results Instant Filters & Sorting
  const [resultsFilter, setResultsFilter] = useState<'all' | 'no-website' | 'has-website' | 'high-rated' | 'hot-score'>('all');
  const [resultsSearchText, setResultsSearchText] = useState<string>('');
  const [sortBy, setSortBy] = useState<'score' | 'rating' | 'reviews' | 'name'>('score');
  const [viewMode, setViewMode] = useState<'split' | 'grid' | 'table'>('split');

  // Lead Saving to CRM States
  const [savingLeadIds, setSavingLeadIds] = useState<Set<string>>(new Set());
  const [isSavingAll, setIsSavingAll] = useState<boolean>(false);

  // Google Places API State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [placesCompanies, setPlacesCompanies] = useState<GooglePlaceBusiness[]>([]);
  const [selectedCompanyOnMap, setSelectedCompanyOnMap] = useState<GooglePlaceBusiness | null>(null);

  // Sync globalSearchQuery if entered from TopBar
  useEffect(() => {
    if (globalSearchQuery && globalSearchQuery.trim().length > 0) {
      setResultsSearchText(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  // Search places using Google Places API (New)
  const searchGooglePlaces = async (targetLoc: string, category: string, keyword?: string) => {
    if (!targetLoc || !targetLoc.trim()) {
      showToast('Please enter or select a target location first', 'error', 'Location Required');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const cleanKeyword = keyword?.trim() || '';
      const res = await fetch('/api/places/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: targetLoc.trim(),
          query: cleanKeyword,
          category: category === 'All Businesses' ? '' : category,
          maxResultCount: 20,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to search Google Maps places');
      }

      const data = await res.json();
      const fetched: GooglePlaceBusiness[] = data.companies || [];
      setPlacesCompanies(fetched);
      setUserLocation(targetLoc.trim());
      localStorage.setItem(STORAGE_KEY_LOCATION, targetLoc.trim());

      const searchTermLabel = cleanKeyword || (category !== 'All Businesses' ? category : 'businesses');
      if (fetched.length === 0) {
        showToast(`No registered companies found for "${searchTermLabel}" in ${targetLoc}. Try a broader search.`, 'info', 'Zero Results');
      } else {
        showToast(`Discovered ${fetched.length} verified real companies on Google Maps in ${targetLoc}`, 'success', 'Google Maps Live Data');
      }
    } catch (err: any) {
      console.error('Error fetching Google Places:', err);
      setError(err.message || 'Error communicating with Google Maps');
      showToast(err.message || 'Failed to query Google Maps', 'error', 'Search Error');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-search on initial load if user already has a saved location preference
  useEffect(() => {
    if (userLocation && placesCompanies.length === 0 && !isLoading) {
      searchGooglePlaces(userLocation, selectedIndustry, customKeyword);
    }
  }, []);

  // Handle Real-Time Location Detected from Modal or Quick Action
  const handleRealTimeLocationDetected = async (detectedCity: string, coords?: { lat: number; lng: number }) => {
    setLocationInput(detectedCity);
    setUserLocation(detectedCity);
    setIsGpsActive(true);
    if (coords) setGpsCoords(coords);
    localStorage.setItem(STORAGE_KEY_LOCATION, detectedCity);
    localStorage.setItem(STORAGE_KEY_GPS_USED, 'true');
    localStorage.setItem('leadforge_location_prompted', 'true');
    await searchGooglePlaces(detectedCity, selectedIndustry, customKeyword);
  };

  // Handle Manual City Selected from Modal
  const handleManualLocationSelected = (city: string) => {
    setLocationInput(city);
    setUserLocation(city);
    setIsGpsActive(false);
    setGpsCoords(null);
    localStorage.setItem(STORAGE_KEY_LOCATION, city);
    localStorage.setItem(STORAGE_KEY_GPS_USED, 'false');
    localStorage.setItem('leadforge_location_prompted', 'true');
    searchGooglePlaces(city, selectedIndustry, customKeyword);
  };

  // Detect current location via browser Geolocation + Google Maps reverse geocode
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error', 'Geolocation Unavailable');
      setIsLocationModalOpen(true);
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setGpsCoords({ lat: latitude, lng: longitude });
        try {
          const res = await fetch('/api/places/reverse-geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          });

          if (!res.ok) throw new Error('Could not resolve your location name');
          const data = await res.json();
          const detectedName = data.locationName || `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;

          setLocationInput(detectedName);
          setUserLocation(detectedName);
          setIsGpsActive(true);
          localStorage.setItem(STORAGE_KEY_LOCATION, detectedName);
          localStorage.setItem(STORAGE_KEY_GPS_USED, 'true');
          localStorage.setItem('leadforge_location_prompted', 'true');
          showToast(`Detected location: ${detectedName}`, 'success', 'GPS Resolved');
          
          // Auto search in detected location
          await searchGooglePlaces(detectedName, selectedIndustry, customKeyword);
        } catch (err: any) {
          console.warn('Geocoding error:', err);
          showToast('Could not resolve city name, please type your location', 'error', 'Reverse Geocode Failed');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (geoError) => {
        setIsDetectingLocation(false);
        let msg = 'Unable to retrieve your location.';
        if (geoError.code === geoError.PERMISSION_DENIED) {
          msg = 'Location permission was denied. You can enter your location manually.';
        }
        showToast(msg, 'error', 'Location Error');
        setIsLocationModalOpen(true);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationInput.trim()) {
      showToast('Please enter a city or region', 'error', 'Location Required');
      return;
    }
    searchGooglePlaces(locationInput, selectedIndustry, customKeyword);
  };

  const handleSelectPresetLocation = (loc: string) => {
    setLocationInput(loc);
    searchGooglePlaces(loc, selectedIndustry, customKeyword);
  };

  const handleSelectQuickCategory = (cat: typeof QUICK_CATEGORY_TAGS[0]) => {
    setSelectedIndustry(cat.category);
    if (cat.query) {
      setCustomKeyword(cat.query);
    }
    if (locationInput.trim() || userLocation) {
      searchGooglePlaces(locationInput.trim() || userLocation, cat.category, cat.query);
    }
  };

  // Helper to convert GooglePlaceBusiness to Lead for My Leads CRM
  const convertPlaceToLead = (company: GooglePlaceBusiness): Lead => ({
    id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ownerId: 'current-user',
    companyName: company.companyName,
    industry: company.industry,
    location: company.location,
    formattedAddress: company.formattedAddress,
    website: company.website || '',
    email: '',
    phone: company.phone || '',
    source: 'google-maps',
    leadScore: company.leadScore,
    scoreCategory: company.scoreCategory,
    status: 'New',
    placeId: company.id,
    googleMapsUri: company.googleMapsUri,
    rating: company.rating,
    userRatingCount: company.userRatingCount,
    coordinates: company.coordinates,
    notes: `Registered business discovered via Google Maps in ${company.location}.${company.rating ? ` Rating: ${company.rating} (${company.userRatingCount || 0} reviews).` : ''}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Check if lead already saved in CRM
  const isAlreadySaved = (companyName: string) => {
    return leads.some((l) => l.companyName.toLowerCase() === companyName.toLowerCase());
  };

  // Single Lead Save to CRM
  const handleSaveToMyLeads = async (company: GooglePlaceBusiness) => {
    if (isAlreadySaved(company.companyName)) return;

    setSavingLeadIds((prev) => new Set(prev).add(company.id));
    try {
      const leadData = convertPlaceToLead(company);
      await saveDiscoveryLeadToMyLeads(leadData);
      showToast(`Saved "${company.companyName}" to your My Leads CRM`, 'success', 'Added to Pipeline');
    } catch (err: any) {
      console.error('Error saving lead to CRM:', err);
      showToast(`Failed to save lead: ${err.message}`, 'error', 'Save Error');
    } finally {
      setSavingLeadIds((prev) => {
        const next = new Set(prev);
        next.delete(company.id);
        return next;
      });
    }
  };

  // Bulk Save All Unsaved Leads to CRM
  const handleSaveAllToMyLeads = async () => {
    const unsaved = filteredCompanies.filter((c) => !isAlreadySaved(c.companyName));
    if (unsaved.length === 0) {
      showToast('All visible companies are already saved to your CRM', 'info', 'Already Saved');
      return;
    }

    setIsSavingAll(true);
    try {
      const leadsToSave = unsaved.map(convertPlaceToLead);
      const savedCount = await saveBatchDiscoveryLeadsToMyLeads(leadsToSave);
      showToast(`Quickly saved ${savedCount} companies to your My Leads list!`, 'success', 'Added to My Leads');
    } catch (err: any) {
      console.error('Error batch saving leads:', err);
      showToast(`Failed to batch save leads: ${err.message}`, 'error', 'Batch Save Error');
    } finally {
      setIsSavingAll(false);
    }
  };

  // Convert for opening analysis directly
  const handleAnalyzeCompany = (company: GooglePlaceBusiness) => {
    const existing = leads.find((l) => l.companyName.toLowerCase() === company.companyName.toLowerCase());
    if (existing) {
      onSelectLead(existing);
      return;
    }

    const tempLead: Lead = {
      id: `temp_${Date.now()}`,
      ownerId: 'current-user',
      companyName: company.companyName,
      industry: company.industry,
      location: company.location,
      formattedAddress: company.formattedAddress,
      website: company.website || '',
      email: '',
      phone: company.phone || '',
      source: 'google-maps',
      leadScore: company.leadScore,
      scoreCategory: company.scoreCategory,
      status: 'New',
      placeId: company.id,
      googleMapsUri: company.googleMapsUri,
      rating: company.rating,
      userRatingCount: company.userRatingCount,
      coordinates: company.coordinates,
      notes: `Google Maps business in ${company.location}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSelectLead(tempLead);
  };

  // Filtered and Sorted companies based on in-results search and pills
  const filteredCompanies = useMemo(() => {
    let result = placesCompanies.filter((c) => {
      // In-results instant search
      if (resultsSearchText.trim()) {
        const q = resultsSearchText.toLowerCase().trim();
        const matchName = c.companyName.toLowerCase().includes(q);
        const matchAddr = (c.formattedAddress || '').toLowerCase().includes(q);
        const matchPhone = (c.phone || '').toLowerCase().includes(q);
        const matchIndustry = (c.industry || '').toLowerCase().includes(q);
        if (!matchName && !matchAddr && !matchPhone && !matchIndustry) return false;
      }

      // Quick filter pill
      if (resultsFilter === 'no-website' && c.website && c.website.trim() !== '') return false;
      if (resultsFilter === 'has-website' && (!c.website || c.website.trim() === '')) return false;
      if (resultsFilter === 'high-rated' && (!c.rating || c.rating < 4.5)) return false;
      if (resultsFilter === 'hot-score' && c.leadScore < 85) return false;

      return true;
    });

    // Sorting
    return result.sort((a, b) => {
      if (sortBy === 'score') return b.leadScore - a.leadScore;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'reviews') return (b.userRatingCount || 0) - (a.userRatingCount || 0);
      return a.companyName.localeCompare(b.companyName);
    });
  }, [placesCompanies, resultsFilter, resultsSearchText, sortBy]);

  // Counts for pills
  const counts = useMemo(() => {
    const noWebsite = placesCompanies.filter(c => !c.website || c.website.trim() === '').length;
    const hasWebsite = placesCompanies.filter(c => c.website && c.website.trim() !== '').length;
    const highRated = placesCompanies.filter(c => c.rating && c.rating >= 4.5).length;
    const hotScore = placesCompanies.filter(c => c.leadScore >= 85).length;
    return { noWebsite, hasWebsite, highRated, hotScore };
  }, [placesCompanies]);

  return (
    <div className="space-y-5 min-w-0">
      {/* 1. Header with Live Google Maps Indicator & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-white font-heading">
              Find Leads & Real Companies
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Google Maps Live Data
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Search authentic registered businesses on Google Maps across any city. Explore verified websites, phone numbers, ratings, and save high-value prospects into your CRM.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="flex-1 sm:flex-initial whitespace-nowrap flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-yellow-500/30 bg-yellow-400/10 hover:bg-yellow-400/20 text-xs font-semibold text-yellow-300 transition-colors shadow-xs"
          >
            <LocateFixed className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
            <span>Take Real-Time Location</span>
          </button>

          <button
            onClick={onOpenCsvModal}
            className="flex-1 sm:flex-initial whitespace-nowrap flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-white transition-colors"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-neutral-300 shrink-0" />
            <span>Import CSV</span>
          </button>
        </div>
      </div>

      {/* Real-Time Location Interactive Status & Ask Banner */}
      {isGpsActive ? (
        <div className="p-3.5 sm:p-4 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-neutral-900/60 to-neutral-950/80 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="relative p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
              <LocateFixed className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-xs font-bold text-white whitespace-nowrap">Live GPS Active:</span>
                <span className="text-xs font-semibold text-yellow-400 truncate max-w-[220px]">{userLocation}</span>
                {gpsCoords && (
                  <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-300 shrink-0">
                    {gpsCoords.lat.toFixed(3)}°, {gpsCoords.lng.toFixed(3)}°
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                Browsing authentic businesses registered on Google Maps within your live vicinity.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={handleDetectLocation}
              disabled={isDetectingLocation}
              className="flex-1 sm:flex-initial whitespace-nowrap px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 text-neutral-300 shrink-0 ${isDetectingLocation ? 'animate-spin' : ''}`} />
              <span>{isDetectingLocation ? 'Locating...' : 'Re-take GPS'}</span>
            </button>
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="flex-1 sm:flex-initial whitespace-nowrap px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-colors"
            >
              Change Location
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3.5 sm:p-4 rounded-xl border border-yellow-500/30 bg-gradient-to-r from-yellow-950/20 via-neutral-900/60 to-neutral-950/80 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 shrink-0 mt-0.5 sm:mt-0">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white whitespace-nowrap">Ask for Real-Time Location</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 shrink-0">
                  Google Maps Places
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                Allow LeadForge to take your real-time location to discover high-value prospects in your immediate market.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-black text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 whitespace-nowrap"
            >
              <LocateFixed className="h-3.5 w-3.5 text-black shrink-0" />
              <span>Take Real-Time Location</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Interactive Search & Discovery Engine */}
      <div className="p-4 sm:p-5 rounded-xl border border-neutral-800 bg-neutral-900/70 shadow-xl space-y-4 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-md bg-yellow-400/10 text-yellow-400 shrink-0">
              <Search className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white">Google Maps Place Discovery Engine</h2>
              <p className="text-[11px] text-neutral-400">
                Search by city, niche keyword, or industry category to pull live registered Google Maps companies.
              </p>
            </div>
          </div>

          {userLocation && (
            <div className="text-[11px] text-neutral-400 shrink-0">
              Active market: <strong className="text-yellow-400">{userLocation}</strong>
            </div>
          )}
        </div>

        {/* Search Form with Dual Inputs */}
        <form onSubmit={handleSearchSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 min-w-0">
            {/* Input 1: Location Input */}
            <div className="md:col-span-4 min-w-0">
              <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                Target Location / City
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="e.g. San Francisco, London, Dubai..."
                  className="w-full pl-9 pr-22 py-2 rounded-lg bg-neutral-950 border border-neutral-750 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-white transition-colors"
                />
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
                  title="Detect my current location via GPS"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-neutral-850 hover:bg-neutral-800 text-[10px] font-medium text-neutral-200 border border-neutral-700 flex items-center gap-1 transition-colors"
                >
                  <Navigation className={`h-3 w-3 text-yellow-400 shrink-0 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                  <span className="whitespace-nowrap">{isDetectingLocation ? 'GPS...' : 'Near Me'}</span>
                </button>
              </div>
            </div>

            {/* Input 2: Search Query / Keyword */}
            <div className="md:col-span-3 min-w-0">
              <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                Keyword or Business Niche
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  value={customKeyword}
                  onChange={(e) => setCustomKeyword(e.target.value)}
                  placeholder="e.g. Dental, AI, Roofing, Lawyer..."
                  className="w-full pl-9 pr-8 py-2 rounded-lg bg-neutral-950 border border-neutral-750 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-white transition-colors"
                />
                {customKeyword && (
                  <button
                    type="button"
                    onClick={() => setCustomKeyword('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Input 3: Industry Category Selector */}
            <div className="md:col-span-3 min-w-0">
              <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                Industry Category
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-neutral-950 border border-neutral-750 text-xs text-white focus:outline-hidden focus:border-white transition-colors truncate"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-3.5 rounded-lg bg-white hover:bg-neutral-100 text-black text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98] whitespace-nowrap"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-black shrink-0" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-3.5 w-3.5 text-black shrink-0" />
                    <span>Search Maps</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Category Badges */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 min-w-0">
            <span className="text-[11px] text-neutral-400 mr-1 shrink-0 font-medium">Quick Categories:</span>
            {QUICK_CATEGORY_TAGS.map((tag) => (
              <button
                key={tag.label}
                type="button"
                onClick={() => handleSelectQuickCategory(tag)}
                className={`px-2.5 py-1 rounded-md text-[11px] transition-colors border whitespace-nowrap shrink-0 ${
                  selectedIndustry === tag.category
                    ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40 font-semibold'
                    : 'bg-neutral-950 hover:bg-neutral-850 text-neutral-300 border-neutral-800'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>

          {/* Quick Popular Location Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 min-w-0">
            <span className="text-[11px] text-neutral-400 mr-1 shrink-0 font-medium">Popular Hubs:</span>
            {POPULAR_LOCATIONS.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => handleSelectPresetLocation(loc)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors border whitespace-nowrap shrink-0 ${
                  locationInput.toLowerCase() === loc.toLowerCase()
                    ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40 font-semibold'
                    : 'bg-neutral-950 hover:bg-neutral-850 text-neutral-400 hover:text-white border-neutral-850'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* 3. Empty State if no location provided yet */}
      {!userLocation && placesCompanies.length === 0 && !isLoading && (
        <div className="p-10 sm:p-14 text-center rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-4">
          <div className="h-12 w-12 rounded-full bg-yellow-400/10 text-yellow-400 flex items-center justify-center mx-auto">
            <MapPin className="h-6 w-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-semibold text-white">Find Authentic Companies Near You</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Enter your city or market above, or click <strong>Near Me</strong> to discover authentic businesses registered on Google Maps.
            </p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={handleDetectLocation}
              disabled={isDetectingLocation}
              className="px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>Use My Live Location</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Results Toolbar with Instant Filters & View Toggles */}
      {placesCompanies.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 shadow-md space-y-3 min-w-0">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 text-xs min-w-0">
            {/* Left: Result Counter & Bulk Save */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 min-w-0">
              <div className="text-neutral-300 min-w-0">
                Found <span className="font-bold text-white">{filteredCompanies.length}</span> of{' '}
                <span className="font-bold text-white">{placesCompanies.length}</span> verified companies in{' '}
                <span className="text-yellow-400 font-semibold">{userLocation}</span>
              </div>

              {/* Quick Bulk Save All to CRM Button */}
              {(() => {
                const unsavedCount = filteredCompanies.filter(c => !isAlreadySaved(c.companyName)).length;
                if (unsavedCount > 0) {
                  return (
                    <button
                      type="button"
                      onClick={handleSaveAllToMyLeads}
                      disabled={isSavingAll}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black font-semibold text-xs transition-all shadow-xs active:scale-95 whitespace-nowrap shrink-0"
                      title="Quickly add all found companies into your My Leads list"
                    >
                      {isSavingAll ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin text-black shrink-0" />
                          <span>Saving {unsavedCount} to CRM...</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="h-3.5 w-3.5 text-black shrink-0" />
                          <span>Save All to CRM ({unsavedCount})</span>
                        </>
                      )}
                    </button>
                  );
                }
                return (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium whitespace-nowrap shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span>All Saved in CRM</span>
                  </span>
                );
              })()}
            </div>

            {/* Right: Instant In-Results Search & View Mode */}
            <div className="flex flex-wrap items-center gap-2.5 min-w-0">
              {/* Instant Search in retrieved results */}
              <div className="relative flex-1 sm:w-56 min-w-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500 shrink-0" />
                <input
                  type="text"
                  value={resultsSearchText}
                  onChange={(e) => setResultsSearchText(e.target.value)}
                  placeholder="Filter results..."
                  className="w-full pl-8 pr-7 py-1 rounded-md bg-neutral-950 border border-neutral-800 text-[11px] text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-white"
                />
                {resultsSearchText && (
                  <button
                    type="button"
                    onClick={() => setResultsSearchText('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-neutral-400 text-[11px] whitespace-nowrap">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-neutral-950 border border-neutral-800 rounded-md px-2 py-1 text-[11px] text-white focus:outline-hidden"
                >
                  <option value="score">AI Score (High to Low)</option>
                  <option value="rating">Google Rating (⭐)</option>
                  <option value="reviews">Review Count</option>
                  <option value="name">Company Name (A–Z)</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-950 p-0.5 shrink-0">
                <button
                  onClick={() => setViewMode('split')}
                  title="Split Map & List View"
                  className={`p-1 rounded text-xs transition-colors ${
                    viewMode === 'split' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  title="Card Grid View"
                  className={`p-1 rounded text-xs transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  title="Table View"
                  className={`p-1 rounded text-xs transition-colors ${
                    viewMode === 'table' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Second Row: Filter Badges */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-neutral-800/80 min-w-0">
            <span className="text-[11px] text-neutral-400 mr-1 shrink-0 font-medium">Filter by Signal:</span>
            
            <button
              onClick={() => setResultsFilter('all')}
              className={`px-2.5 py-0.5 rounded text-[11px] transition-colors border shrink-0 whitespace-nowrap ${
                resultsFilter === 'all'
                  ? 'bg-white text-black font-semibold border-white'
                  : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
              }`}
            >
              All ({placesCompanies.length})
            </button>

            <button
              onClick={() => setResultsFilter('no-website')}
              className={`px-2.5 py-0.5 rounded text-[11px] transition-colors border flex items-center gap-1 shrink-0 whitespace-nowrap ${
                resultsFilter === 'no-website'
                  ? 'bg-amber-400 text-black font-bold border-amber-400'
                  : 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/60'
              }`}
              title="Filter to companies without a website (high digital outreach opportunity)"
            >
              <Zap className="h-3 w-3 shrink-0" />
              <span>Missing Website ({counts.noWebsite})</span>
            </button>

            <button
              onClick={() => setResultsFilter('has-website')}
              className={`px-2.5 py-0.5 rounded text-[11px] transition-colors border shrink-0 whitespace-nowrap ${
                resultsFilter === 'has-website'
                  ? 'bg-white text-black font-semibold border-white'
                  : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
              }`}
            >
              Has Website ({counts.hasWebsite})
            </button>

            <button
              onClick={() => setResultsFilter('high-rated')}
              className={`px-2.5 py-0.5 rounded text-[11px] transition-colors border shrink-0 whitespace-nowrap ${
                resultsFilter === 'high-rated'
                  ? 'bg-white text-black font-semibold border-white'
                  : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
              }`}
            >
              ⭐ 4.5+ Rating ({counts.highRated})
            </button>

            <button
              onClick={() => setResultsFilter('hot-score')}
              className={`px-2.5 py-0.5 rounded text-[11px] transition-colors border shrink-0 whitespace-nowrap ${
                resultsFilter === 'hot-score'
                  ? 'bg-yellow-400 text-black font-bold border-yellow-400'
                  : 'bg-neutral-950 text-yellow-400 border-neutral-800 hover:bg-neutral-800'
              }`}
            >
              🔥 Hot Opportunity ({counts.hotScore})
            </button>
          </div>
        </div>
      )}

      {/* 5. Split View / Grid View / Table View Rendering */}
      {filteredCompanies.length > 0 && (
        <div>
          {viewMode === 'split' ? (
            /* True Responsive Split View: Side-by-Side on Desktop (lg+), Stacked on Mobile/Tablet */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start min-w-0">
              {/* Left Column: Interactive Google Map */}
              <div className="lg:col-span-5 min-w-0 order-1 lg:order-1">
                <div className="lg:sticky lg:top-20 space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                    <div className="flex items-center gap-1.5 font-medium text-white truncate">
                      <MapIcon className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
                      <span className="truncate">Google Map ({userLocation})</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 shrink-0">Click markers for details</span>
                  </div>
                  <GooglePlacesMap
                    companies={filteredCompanies}
                    selectedCompany={selectedCompanyOnMap}
                    onSelectCompany={setSelectedCompanyOnMap}
                    onSaveCompany={handleSaveToMyLeads}
                    isSaved={isAlreadySaved}
                    containerClassName="w-full h-[320px] sm:h-[400px] lg:h-[calc(100vh-190px)] min-h-[350px] lg:min-h-[480px] rounded-xl border border-neutral-800 overflow-hidden relative shadow-lg bg-neutral-950 min-w-0"
                  />
                </div>
              </div>

              {/* Right Column: Scrollable Company Cards */}
              <div className="lg:col-span-7 min-w-0 order-2 lg:order-2">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {filteredCompanies.map((company) => (
                    <CompanyCard
                      key={company.id}
                      company={company}
                      isSaved={isAlreadySaved(company.companyName)}
                      isSaving={savingLeadIds.has(company.id)}
                      isSelectedOnMap={selectedCompanyOnMap?.id === company.id}
                      onSelectOnMap={() => setSelectedCompanyOnMap(company)}
                      onSave={() => handleSaveToMyLeads(company)}
                      onAnalyze={() => handleAnalyzeCompany(company)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : viewMode === 'table' ? (
            /* Full Table View with Responsive Scroll and Anti-Squash Column Widths */
            <div className="rounded-xl border border-neutral-300 bg-white overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-900 min-w-[850px]">
                  <thead className="bg-neutral-100 border-b border-neutral-200 text-neutral-700 font-semibold text-[11px]">
                    <tr>
                      <th className="py-3 px-4 min-w-[200px]">Company Name</th>
                      <th className="py-3 px-4 min-w-[140px]">Industry / Category</th>
                      <th className="py-3 px-4 min-w-[200px]">Address</th>
                      <th className="py-3 px-4 min-w-[140px]">Real Website</th>
                      <th className="py-3 px-4 min-w-[120px]">Phone</th>
                      <th className="py-3 px-4 min-w-[100px]">Google Rating</th>
                      <th className="py-3 px-4 min-w-[90px]">AI Score</th>
                      <th className="py-3 px-4 min-w-[150px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredCompanies.map((company) => {
                      const saved = isAlreadySaved(company.companyName);
                      return (
                        <tr 
                          key={company.id} 
                          className="hover:bg-neutral-50 transition-colors cursor-pointer"
                          onClick={() => setSelectedCompanyOnMap(company)}
                        >
                          <td className="py-3.5 px-4 font-bold text-neutral-950">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate max-w-[180px]" title={company.companyName}>{company.companyName}</span>
                              {company.googleMapsUri && (
                                <a
                                  href={company.googleMapsUri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  title="View listing on Google Maps"
                                  className="text-neutral-500 hover:text-black shrink-0"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                            <span className="text-[10px] text-emerald-700 font-medium block">Google Maps Verified</span>
                          </td>
                          <td className="py-3.5 px-4 text-neutral-700 whitespace-nowrap">
                            {company.industry}
                          </td>
                          <td className="py-3.5 px-4 text-neutral-700 max-w-[200px] truncate" title={company.formattedAddress}>
                            {company.formattedAddress}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            {company.website ? (
                              <a
                                href={company.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-semibold max-w-[140px] truncate"
                              >
                                <Globe className="h-3 w-3 shrink-0" />
                                <span className="truncate">{company.website.replace(/^https?:\/\//, '')}</span>
                              </a>
                            ) : (
                              <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                                No Website
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            {company.phone ? (
                              <a href={`tel:${company.phone}`} className="text-neutral-800 hover:underline flex items-center gap-1 text-[11px]">
                                <Phone className="h-3 w-3 text-neutral-500 shrink-0" />
                                <span>{company.phone}</span>
                              </a>
                            ) : (
                              <span className="text-neutral-400 italic">None</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {company.rating ? (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0" />
                                <span className="font-bold text-neutral-900">{company.rating.toFixed(1)}</span>
                                <span className="text-neutral-500 text-[10px]">({company.userRatingCount || 0})</span>
                              </div>
                            ) : (
                              <span className="text-neutral-400 italic text-[11px]">Unrated</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-900 border border-neutral-300">
                              {company.leadScore}/100
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5 shrink-0">
                              <button
                                onClick={() => handleSaveToMyLeads(company)}
                                disabled={saved || savingLeadIds.has(company.id)}
                                className={`whitespace-nowrap shrink-0 px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                                  saved
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                    : savingLeadIds.has(company.id)
                                    ? 'bg-neutral-800 text-neutral-300 cursor-wait'
                                    : 'bg-black text-white hover:bg-neutral-800 active:scale-95 shadow-2xs'
                                }`}
                                title={saved ? 'Already in My Leads' : 'Save to CRM'}
                              >
                                {saved ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                                    <span>Saved to CRM</span>
                                  </>
                                ) : savingLeadIds.has(company.id) ? (
                                  <>
                                    <RefreshCw className="h-3 w-3 animate-spin text-white shrink-0" />
                                    <span>Saving...</span>
                                  </>
                                ) : (
                                  <>
                                    <BookmarkPlus className="h-3 w-3 text-yellow-300 shrink-0" />
                                    <span>Save to CRM</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleAnalyzeCompany(company)}
                                className="whitespace-nowrap shrink-0 px-2.5 py-1 rounded border border-neutral-300 bg-white hover:bg-neutral-100 text-black text-[11px] font-semibold transition-colors"
                              >
                                Analyze
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Cards View: White Background, Black Text, Responsive Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
              {filteredCompanies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  isSaved={isAlreadySaved(company.companyName)}
                  isSaving={savingLeadIds.has(company.id)}
                  isSelectedOnMap={selectedCompanyOnMap?.id === company.id}
                  onSelectOnMap={() => setSelectedCompanyOnMap(company)}
                  onSave={() => handleSaveToMyLeads(company)}
                  onAnalyze={() => handleAnalyzeCompany(company)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Real-Time Location Permission & Modal Dialog */}
      <RealTimeLocationPromptModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationDetected={handleRealTimeLocationDetected}
        onSelectManualLocation={handleManualLocationSelected}
        currentLocation={userLocation}
      />
    </div>
  );
};

// Extracted Responsive Company Card with Guaranteed Anti-Shrink Layout
interface CompanyCardProps {
  company: GooglePlaceBusiness;
  isSaved: boolean;
  isSaving: boolean;
  isSelectedOnMap: boolean;
  onSelectOnMap: () => void;
  onSave: () => void;
  onAnalyze: () => void;
}

const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  isSaved,
  isSaving,
  isSelectedOnMap,
  onSelectOnMap,
  onSave,
  onAnalyze,
}) => {
  return (
    <div
      onClick={onSelectOnMap}
      className={`rounded-xl border p-4 sm:p-4.5 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between min-w-0 ${
        isSelectedOnMap
          ? 'bg-white border-yellow-500 ring-2 ring-yellow-400 text-black'
          : 'bg-white border-neutral-200 hover:border-neutral-400 text-black'
      }`}
    >
      <div className="space-y-3 min-w-0 flex-1">
        {/* Top Bar: Company Name & Rating */}
        <div className="flex items-start justify-between gap-2.5 min-w-0">
          <div className="min-w-0 flex-1">
            <h3 
              className="font-bold text-sm text-neutral-950 leading-snug truncate"
              title={company.companyName}
            >
              {company.companyName}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className="text-[11px] font-medium text-neutral-600 truncate max-w-[150px]">
                {company.industry}
              </span>
              <span className="inline-flex items-center text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                Google Maps Verified
              </span>
            </div>
          </div>

          {company.rating ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shrink-0 whitespace-nowrap self-start">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0" />
              <span>{company.rating.toFixed(1)}</span>
              <span className="text-[10px] text-amber-700 font-normal">({company.userRatingCount || 0})</span>
            </div>
          ) : null}
        </div>

        {/* Physical Address */}
        <div className="flex items-start gap-1.5 text-xs text-neutral-700 min-w-0">
          <MapPin className="h-3.5 w-3.5 text-neutral-500 shrink-0 mt-0.5" />
          <span className="line-clamp-2 text-[11px] leading-relaxed break-words" title={company.formattedAddress}>
            {company.formattedAddress}
          </span>
        </div>

        {/* Real Website & Phone */}
        <div className="space-y-2 pt-2 border-t border-neutral-100 min-w-0">
          {/* Real Website */}
          <div className="flex items-center gap-2 text-xs min-w-0">
            <Globe className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
            {company.website ? (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-blue-600 hover:text-blue-800 hover:underline font-semibold flex items-center gap-1 min-w-0 text-[11px] truncate group"
              >
                <span className="truncate">{company.website.replace(/^https?:\/\//, '')}</span>
                <ExternalLink className="h-3 w-3 shrink-0 text-blue-500 group-hover:text-blue-700" />
              </a>
            ) : (
              <span className="inline-flex items-center text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 whitespace-nowrap">
                ⚡ No Website (High Opportunity)
              </span>
            )}
          </div>

          {/* Phone */}
          {company.phone && (
            <div className="flex items-center gap-2 text-xs text-neutral-800 min-w-0">
              <Phone className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
              <a
                href={`tel:${company.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:underline text-[11px] text-neutral-800 truncate"
              >
                {company.phone}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions Bar - Responsive with wrap & no shrinkage */}
      <div className="mt-4 pt-3 border-t border-neutral-100 flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between gap-2.5 min-w-0">
        <div className="flex items-center justify-between min-[380px]:justify-start gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-neutral-700">
              AI Score:
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-100 text-neutral-900 border border-neutral-300 shrink-0">
              {company.leadScore}/100
            </span>
          </div>
          {company.googleMapsUri && (
            <a
              href={company.googleMapsUri}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Open listing on Google Maps"
              className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-black font-medium transition-colors ml-1 shrink-0"
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span className="text-[10px]">Maps</span>
            </a>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            disabled={isSaved || isSaving}
            className={`flex-1 min-[380px]:flex-initial whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs shrink-0 ${
              isSaved
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default font-medium'
                : isSaving
                ? 'bg-neutral-800 text-neutral-300 cursor-wait'
                : 'bg-black text-white hover:bg-neutral-800 active:scale-95 shadow-sm'
            }`}
            title={isSaved ? 'Already in My Leads' : 'Save to CRM'}
          >
            {isSaved ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Saved to CRM</span>
              </>
            ) : isSaving ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-white shrink-0" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="h-3.5 w-3.5 text-yellow-300 shrink-0" />
                <span>Save to CRM</span>
              </>
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAnalyze();
            }}
            className="whitespace-nowrap px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-900 text-xs font-semibold transition-colors shrink-0"
          >
            Analyze
          </button>
        </div>
      </div>
    </div>
  );
};
