import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Globe, 
  Building2, 
  Sparkles, 
  LocateFixed,
  ArrowRight
} from 'lucide-react';

interface RealTimeLocationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationDetected: (locationName: string, coords?: { lat: number; lng: number }) => Promise<void>;
  onSelectManualLocation: (city: string) => void;
  currentLocation?: string;
}

const POPULAR_CITIES = [
  'San Francisco, CA',
  'New York, NY',
  'London, UK',
  'Chicago, IL',
  'Austin, TX',
  'Toronto, Canada',
  'Dubai, UAE',
  'Berlin, Germany',
  'Sydney, Australia',
];

export const RealTimeLocationPromptModal: React.FC<RealTimeLocationPromptModalProps> = ({
  isOpen,
  onClose,
  onLocationDetected,
  onSelectManualLocation,
  currentLocation,
}) => {
  const [step, setStep] = useState<'prompt' | 'detecting' | 'geocoding' | 'searching' | 'success' | 'error'>('prompt');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [resolvedCity, setResolvedCity] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [manualInput, setManualInput] = useState<string>('');
  const [dontAskAgain, setDontAskAgain] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleTakeRealTimeLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your current browser.');
      setStep('error');
      return;
    }

    setStep('detecting');
    setErrorMessage('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        setStep('geocoding');

        try {
          const res = await fetch('/api/places/reverse-geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          });

          if (!res.ok) {
            throw new Error('Could not translate GPS coordinates to city name.');
          }

          const data = await res.json();
          const detectedCity = data.locationName || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setResolvedCity(detectedCity);
          setStep('searching');

          if (dontAskAgain) {
            localStorage.setItem('leadforge_location_prompted', 'true');
          }

          // Trigger lead discovery in this real-time location
          await onLocationDetected(detectedCity, { lat: latitude, lng: longitude });
          setStep('success');

          // Auto-close modal after brief feedback
          setTimeout(() => {
            onClose();
            setStep('prompt');
          }, 1200);
        } catch (err: any) {
          console.warn('Geocoding error:', err);
          setErrorMessage(err.message || 'Failed to resolve location address.');
          setStep('error');
        }
      },
      (geoError) => {
        let msg = 'Unable to retrieve real-time location.';
        if (geoError.code === geoError.PERMISSION_DENIED) {
          msg = 'Location permission was denied. You can enter your city manually or select a hub below.';
        } else if (geoError.code === geoError.TIMEOUT) {
          msg = 'Location request timed out. Please enter your location manually.';
        }
        setErrorMessage(msg);
        setStep('error');
      },
      {
        timeout: 12000,
        enableHighAccuracy: true,
        maximumAge: 0,
      }
    );
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    if (dontAskAgain) {
      localStorage.setItem('leadforge_location_prompted', 'true');
    }
    onSelectManualLocation(manualInput.trim());
    onClose();
  };

  const handleSelectPopularCity = (city: string) => {
    if (dontAskAgain) {
      localStorage.setItem('leadforge_location_prompted', 'true');
    }
    onSelectManualLocation(city);
    onClose();
  };

  const handleDismiss = () => {
    if (dontAskAgain) {
      localStorage.setItem('leadforge_location_prompted', 'true');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-5 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-yellow-500/10 to-transparent pointer-events-none rounded-t-2xl" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* State: Prompt */}
        {step === 'prompt' && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="relative p-3.5 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 shrink-0">
                <LocateFixed className="h-7 w-7" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400" />
                </span>
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 uppercase tracking-wider">
                  Live Google Maps Discovery
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Take Real-Time Location?
                </h2>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Allow LeadForge to take your current GPS location to automatically browse authentic businesses registered on Google Maps in your immediate area.
                </p>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 rounded-xl border border-neutral-850 bg-neutral-900/60">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <MapPin className="h-3.5 w-3.5 text-yellow-400" />
                  <span>Local Proximity</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Target verified companies in your city or neighborhood.
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Globe className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Real Websites</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Inspect authentic domains & discover missing websites.
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Building2 className="h-3.5 w-3.5 text-blue-400" />
                  <span>Direct Pipeline</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  1-click save to CRM with phone & rating records.
                </p>
              </div>
            </div>

            {currentLocation && (
              <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                <span className="text-neutral-500">Currently selected market:</span>
                <span className="font-semibold text-white">{currentLocation}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleTakeRealTimeLocation}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-100 text-black text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
              >
                <Navigation className="h-4 w-4 text-black fill-black" />
                <span>Take Real-Time Location Now</span>
              </button>

              <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="dontAskAgain"
                    checked={dontAskAgain}
                    onChange={(e) => setDontAskAgain(e.target.checked)}
                    className="rounded border-neutral-700 bg-neutral-900 text-yellow-400 focus:ring-0 text-xs"
                  />
                  <label htmlFor="dontAskAgain" className="text-[11px] text-neutral-400 cursor-pointer">
                    Remember preference
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('error')}
                  className="text-[11px] text-neutral-400 hover:text-white underline underline-offset-2"
                >
                  Enter city manually instead
                </button>
              </div>
            </div>
          </div>
        )}

        {/* State: Detecting / Geocoding / Searching */}
        {(step === 'detecting' || step === 'geocoding' || step === 'searching') && (
          <div className="py-8 space-y-6 text-center">
            {/* Pulsing Radar Animation */}
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-yellow-400/40 animate-ping" />
              <div className="absolute inset-2 rounded-full border border-yellow-400/60 animate-pulse" />
              <div className="h-12 w-12 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center shadow-lg">
                <Navigation className="h-6 w-6 animate-spin text-yellow-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-white">
                {step === 'detecting' && 'Requesting Real-Time Location...'}
                {step === 'geocoding' && 'Resolving Local Coordinates...'}
                {step === 'searching' && `Searching Companies in ${resolvedCity || 'Your Area'}...`}
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                {step === 'detecting' && 'Please allow location permission in your browser prompt.'}
                {step === 'geocoding' && coords && `Coordinates: Lat ${coords.lat.toFixed(4)}, Lng ${coords.lng.toFixed(4)}. Translating via Google Maps Geocoding API.`}
                {step === 'searching' && 'Connecting to Google Places API (New) to fetch authentic businesses with websites & ratings.'}
              </p>
            </div>

            {/* Stepper progress */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <span className={`h-2 w-8 rounded-full ${step === 'detecting' || step === 'geocoding' || step === 'searching' ? 'bg-yellow-400' : 'bg-neutral-800'}`} />
              <span className={`h-2 w-8 rounded-full ${step === 'geocoding' || step === 'searching' ? 'bg-yellow-400' : 'bg-neutral-800'}`} />
              <span className={`h-2 w-8 rounded-full ${step === 'searching' ? 'bg-yellow-400' : 'bg-neutral-800'}`} />
            </div>
          </div>
        )}

        {/* State: Success */}
        {step === 'success' && (
          <div className="py-8 space-y-4 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Real-Time Location Verified!</h3>
              <p className="text-xs text-neutral-300">
                Target market locked: <strong className="text-yellow-400">{resolvedCity}</strong>
              </p>
              <p className="text-[11px] text-neutral-500">
                Loading live Google Maps companies & websites into your pipeline...
              </p>
            </div>
          </div>
        )}

        {/* State: Error / Fallback Manual Input */}
        {step === 'error' && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-yellow-400 shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Manual Location Selection</h3>
                <p className="text-xs text-neutral-400">
                  {errorMessage || 'Enter your target city or select from popular business hubs below.'}
                </p>
              </div>
            </div>

            {/* Manual Form */}
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="e.g. San Francisco, CA or London, UK"
                  autoFocus
                  className="w-full pl-9 pr-24 py-2.5 rounded-xl bg-neutral-900 border border-neutral-750 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-white transition-colors"
                />
                <button
                  type="submit"
                  disabled={!manualInput.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-colors disabled:opacity-40"
                >
                  Set City
                </button>
              </div>
            </form>

            {/* Popular City Chips */}
            <div className="space-y-2">
              <span className="text-[11px] font-medium text-neutral-400">Or choose a major business hub:</span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_CITIES.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleSelectPopularCity(city)}
                    className="px-2.5 py-1 rounded-lg text-xs bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-800 hover:border-neutral-700 transition-colors"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Retry GPS button */}
            <div className="pt-2 border-t border-neutral-850 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleTakeRealTimeLocation}
                className="inline-flex items-center gap-1.5 text-yellow-400 hover:text-yellow-300 text-xs font-medium"
              >
                <LocateFixed className="h-3.5 w-3.5" />
                <span>Retry Real-Time GPS Detection</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="text-neutral-500 hover:text-neutral-300 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
