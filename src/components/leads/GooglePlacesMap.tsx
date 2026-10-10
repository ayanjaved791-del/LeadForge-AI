import React, { useState, useEffect } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  InfoWindow, 
  useMap 
} from '@vis.gl/react-google-maps';
import { ExternalLink, Star, Phone, BookmarkPlus, Check } from 'lucide-react';
import type { GooglePlaceBusiness } from '../../types/index.js';

declare const google: any;

interface GooglePlacesMapProps {
  companies: GooglePlaceBusiness[];
  selectedCompany: GooglePlaceBusiness | null;
  onSelectCompany: (company: GooglePlaceBusiness | null) => void;
  onSaveCompany: (company: GooglePlaceBusiness) => void;
  isSaved: (name: string) => boolean;
  defaultCenter?: { lat: number; lng: number };
  containerClassName?: string;
}

// Controller to auto-center and fit bounds when companies change
const MapBoundsController: React.FC<{ 
  companies: GooglePlaceBusiness[]; 
  selectedCompany: GooglePlaceBusiness | null;
  defaultCenter?: { lat: number; lng: number };
}> = ({ companies, selectedCompany, defaultCenter }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (selectedCompany?.coordinates) {
      map.panTo(selectedCompany.coordinates);
      map.setZoom(15);
      return;
    }

    const validCoords = companies
      .filter((c) => c.coordinates && typeof c.coordinates.lat === 'number')
      .map((c) => c.coordinates!);

    if (validCoords.length === 1) {
      map.setCenter(validCoords[0]);
      map.setZoom(14);
    } else if (validCoords.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      validCoords.forEach((coord) => bounds.extend(coord));
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    } else if (defaultCenter) {
      map.setCenter(defaultCenter);
      map.setZoom(12);
    }
  }, [map, companies, selectedCompany, defaultCenter]);

  return null;
};

export const GooglePlacesMap: React.FC<GooglePlacesMapProps> = ({
  companies,
  selectedCompany,
  onSelectCompany,
  onSaveCompany,
  isSaved,
  defaultCenter = { lat: 37.7749, lng: -122.4194 },
  containerClassName
}) => {
  const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [activeInfoWindow, setActiveInfoWindow] = useState<GooglePlaceBusiness | null>(null);

  useEffect(() => {
    if (selectedCompany) {
      setActiveInfoWindow(selectedCompany);
    }
  }, [selectedCompany]);

  if (!apiKey) {
    return (
      <div className={containerClassName || "w-full h-80 rounded-xl border border-neutral-800 bg-neutral-900/60 flex items-center justify-center p-6 text-center text-xs text-neutral-400"}>
        Google Maps API key is being initialized.
      </div>
    );
  }

  // Calculate default center if there are companies with coordinates
  const initialCenter = companies.find(c => c.coordinates)?.coordinates || defaultCenter;

  return (
    <div className={containerClassName || "w-full h-80 sm:h-96 rounded-xl border border-neutral-800 overflow-hidden relative shadow-lg bg-neutral-950 min-w-0"}>
      <APIProvider apiKey={apiKey} libraries={['places', 'marker']}>
        <Map
          defaultCenter={initialCenter}
          defaultZoom={12}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="w-full h-full"
          onClick={() => {
            setActiveInfoWindow(null);
            onSelectCompany(null);
          }}
        >
          <MapBoundsController 
            companies={companies} 
            selectedCompany={selectedCompany} 
            defaultCenter={initialCenter} 
          />

          {companies.map((company) => {
            if (!company.coordinates) return null;
            const isSelected = selectedCompany?.id === company.id;
            const saved = isSaved(company.companyName);

            return (
              <AdvancedMarker
                key={company.id}
                position={company.coordinates}
                title={company.companyName}
                onClick={(e) => {
                  e.domEvent?.stopPropagation();
                  setActiveInfoWindow(company);
                  onSelectCompany(company);
                }}
              >
                <Pin
                  background={isSelected ? '#eab308' : saved ? '#10b981' : '#ffffff'}
                  borderColor="#000000"
                  glyphColor="#000000"
                  scale={isSelected ? 1.25 : 1.0}
                />
              </AdvancedMarker>
            );
          })}

          {activeInfoWindow && activeInfoWindow.coordinates && (
            <InfoWindow
              position={activeInfoWindow.coordinates}
              onCloseClick={() => {
                setActiveInfoWindow(null);
                onSelectCompany(null);
              }}
            >
              <div className="p-1 max-w-xs text-neutral-900 font-sans">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-xs text-neutral-950 leading-snug">
                    {activeInfoWindow.companyName}
                  </h3>
                  {activeInfoWindow.rating && (
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-[10px] font-bold text-amber-800 shrink-0">
                      <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                      <span>{activeInfoWindow.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-neutral-600 mt-1 line-clamp-2">
                  {activeInfoWindow.formattedAddress}
                </p>

                <div className="mt-2 space-y-1 text-[11px]">
                  {activeInfoWindow.website ? (
                    <a
                      href={activeInfoWindow.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium truncate"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      <span className="truncate">{activeInfoWindow.website.replace(/^https?:\/\//, '')}</span>
                    </a>
                  ) : (
                    <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-medium block">
                      ⚡ No website listed (High Opportunity)
                    </span>
                  )}

                  {activeInfoWindow.phone && (
                    <a
                      href={`tel:${activeInfoWindow.phone}`}
                      className="text-neutral-700 hover:text-neutral-900 flex items-center gap-1 truncate"
                    >
                      <Phone className="h-3 w-3 shrink-0 text-neutral-500" />
                      <span>{activeInfoWindow.phone}</span>
                    </a>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-neutral-200 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold text-neutral-600 shrink-0">
                    AI Score: <strong className="text-neutral-900">{activeInfoWindow.leadScore}/100</strong>
                  </span>

                  <button
                    onClick={() => onSaveCompany(activeInfoWindow)}
                    disabled={isSaved(activeInfoWindow.companyName)}
                    className={`whitespace-nowrap shrink-0 px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                      isSaved(activeInfoWindow.companyName)
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                        : 'bg-black text-white hover:bg-neutral-800 active:scale-95'
                    }`}
                  >
                    {isSaved(activeInfoWindow.companyName) ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span>Saved to CRM</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="h-3 w-3 text-yellow-300 shrink-0" />
                        <span>Save to CRM</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
};
