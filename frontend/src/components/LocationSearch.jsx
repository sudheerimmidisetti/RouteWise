import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Production-Grade LocationSearch Component
 *
 * Implements high-accuracy geocoding autocomplete for commercial route planning:
 * - Prioritizes Cities, Towns, Municipalities, Airports & Freight Hubs over minor POIs
 *   (filters out restaurants, shops, parking lots, and individual houses).
 * - Dual Nominatim search (Settlements + General Places) with 350ms debouncing.
 * - AbortController request cancellation to prevent race conditions.
 * - In-memory session result caching (cacheRef).
 * - 2-line clean dropdown display (Line 1: Primary City/Name, Line 2: State, Country).
 * - Matching query text highlighting.
 * - Full keyboard navigation (Up, Down, Enter, Escape).
 * - Strict selection validation tracking.
 */
const LocationSearch = ({
  label,
  name,
  value = '',
  onChange,
  onSelect,
  placeholder,
  icon,
  error,
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const containerRef = useRef(null);
  const cacheRef = useRef({});
  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Sync query when parent prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setHighlightedIdx(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Intelligently parses Nominatim API item into Primary Name and Secondary Location
   */
  const parseLocationItem = (item, searchTerm = '') => {
    const addr = item.address || {};
    const cls = (item.class || '').toLowerCase();
    const type = (item.type || '').toLowerCase();

    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.municipality ||
      addr.county ||
      '';
    const state = addr.state || addr.region || addr.province || '';
    const country = addr.country || '';

    let primaryName = '';
    let secondaryParts = [];

    // Is it a city, town, village, or administrative boundary?
    const isSettlement =
      cls === 'place' ||
      cls === 'boundary' ||
      ['city', 'town', 'village', 'municipality', 'county', 'administrative', 'state', 'country'].includes(type);

    if (isSettlement) {
      primaryName = item.name || city || item.display_name.split(',')[0];
      if (state && state.toLowerCase() !== primaryName.toLowerCase()) {
        secondaryParts.push(state);
      }
      if (country) {
        secondaryParts.push(country);
      }
    } else {
      // For Airports, Ports, Landmarks, Addresses
      primaryName = item.name || item.display_name.split(',')[0];
      if (city && city.toLowerCase() !== primaryName.toLowerCase()) {
        secondaryParts.push(city);
      }
      if (state) secondaryParts.push(state);
      if (country) secondaryParts.push(country);
    }

    const secondaryText = secondaryParts.join(', ');
    const fullDisplayName = secondaryText ? `${primaryName}, ${secondaryText}` : primaryName;

    // Calculate ranking score (Lower = Higher Priority)
    let rankScore = 5;
    const cleanSearch = searchTerm.trim().toLowerCase();
    const cleanPrimary = primaryName.toLowerCase();

    // Minor noise POIs to penalize or filter
    const isMinorNoise = [
      'amenity',
      'shop',
      'tourism',
      'leisure',
      'building',
      'parking',
    ].includes(cls) || ['restaurant', 'cafe', 'fast_food', 'house', 'parking'].includes(type);

    if (isSettlement) {
      if (cleanPrimary === cleanSearch) rankScore = 0; // Exact city match
      else if (cleanPrimary.startsWith(cleanSearch)) rankScore = 1; // Starts with query
      else rankScore = 2; // Contains query
    } else if (cls === 'aeroway' || type === 'aerodrome' || type === 'airport') {
      rankScore = 2; // Airports
    } else if (isMinorNoise) {
      rankScore = 9; // Low priority noise
    } else {
      rankScore = 4;
    }

    return {
      primaryName,
      secondaryText,
      displayName: fullDisplayName,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      city,
      state,
      country,
      rawClass: cls,
      rawType: type,
      rankScore,
      isMinorNoise,
    };
  };

  /**
   * Dual Geocoding Search: Queries settlements + places, filters noise, ranks results
   */
  const fetchLocations = useCallback(async (searchTerm) => {
    const cleanTerm = searchTerm.trim().toLowerCase();
    if (cleanTerm.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      setIsOpen(false);
      return;
    }

    // Check in-memory session cache
    if (cacheRef.current[cleanTerm]) {
      setSuggestions(cacheRef.current[cleanTerm]);
      setApiError(null);
      setIsLoading(false);
      setIsOpen(true);
      return;
    }

    // Cancel any in-flight HTTP request to prevent race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setApiError(null);

    try {
      // Query 1: Settlement search (cities, towns, villages)
      const settlementUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        searchTerm
      )}&format=json&addressdetails=1&featuretype=settlement&limit=6`;

      // Query 2: General location search
      const generalUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        searchTerm
      )}&format=json&addressdetails=1&limit=8`;

      const signal = abortControllerRef.current.signal;

      const [settlementRes, generalRes] = await Promise.allSettled([
        fetch(settlementUrl, { signal, headers: { 'User-Agent': 'RouteWise-App/1.0' } }),
        fetch(generalUrl, { signal, headers: { 'User-Agent': 'RouteWise-App/1.0' } }),
      ]);

      let rawData = [];

      if (settlementRes.status === 'fulfilled' && settlementRes.value.ok) {
        const sData = await settlementRes.value.json();
        rawData.push(...sData);
      }

      if (generalRes.status === 'fulfilled' && generalRes.value.ok) {
        const gData = await generalRes.value.json();
        rawData.push(...gData);
      }

      const parsedItems = rawData.map((item) => parseLocationItem(item, searchTerm));

      // Deduplicate results based on primaryName + secondaryText
      const uniqueSuggestions = [];
      const seenKeys = new Set();

      parsedItems.forEach((item) => {
        const key = `${item.primaryName.toLowerCase()}|${item.secondaryText.toLowerCase()}`;
        if (!seenKeys.has(key) && !isNaN(item.latitude) && !isNaN(item.longitude)) {
          seenKeys.add(key);
          uniqueSuggestions.push(item);
        }
      });

      // Filter out minor noise (restaurants/parking) if major city/town places exist
      const majorPlaces = uniqueSuggestions.filter((item) => !item.isMinorNoise);
      const finalSuggestions = majorPlaces.length > 0 ? majorPlaces : uniqueSuggestions;

      // Sort by rank score (Cities/Airports first)
      finalSuggestions.sort((a, b) => a.rankScore - b.rankScore);

      // Limit to top 6 results
      const sliced = finalSuggestions.slice(0, 6);

      cacheRef.current[cleanTerm] = sliced;
      setSuggestions(sliced);
      setIsOpen(true);
    } catch (err) {
      if (err.name === 'AbortError') {
        return; // Request aborted due to new input, ignore
      }
      console.warn('Location Search API Error:', err);
      setApiError('Unable to fetch locations. Please try again.');
      setSuggestions([]);
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle Text Input Change with 350ms Debounce
  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedLocation(null);

    if (onChange) {
      onChange({
        target: {
          name,
          value: val,
          location: null,
          isResolved: false,
        },
      });
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length >= 2) {
      setIsLoading(true);
      debounceTimerRef.current = setTimeout(() => {
        fetchLocations(val);
      }, 350);
    } else {
      setSuggestions([]);
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  // Handle Selecting a Suggestion
  const handleSelectSuggestion = (suggestion) => {
    setQuery(suggestion.displayName);
    setSelectedLocation(suggestion);
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIdx(-1);
    setApiError(null);

    if (onChange) {
      onChange({
        target: {
          name,
          value: suggestion.displayName,
          location: suggestion,
          isResolved: true,
        },
      });
    }
    if (onSelect) {
      onSelect(suggestion);
    }
  };

  // Keyboard Navigation Handlers (Up, Down, Enter, Esc)
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsOpen(true);
        setHighlightedIdx(0);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIdx >= 0 && highlightedIdx < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[highlightedIdx]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIdx(-1);
    }
  };

  // Render Highlighted Matching Substring
  const renderHighlightedText = (text, searchTerm) => {
    if (!text || !searchTerm.trim()) return text;
    const cleanSearch = searchTerm.trim();
    const idx = text.toLowerCase().indexOf(cleanSearch.toLowerCase());
    if (idx === -1) return text;

    const before = text.substring(0, idx);
    const match = text.substring(idx, idx + cleanSearch.length);
    const after = text.substring(idx + cleanSearch.length);

    return (
      <>
        {before}
        <span className="text-indigo-400 font-bold underline decoration-indigo-400/50">{match}</span>
        {after}
      </>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
        <span>{label}</span>
        {selectedLocation && (
          <span className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
            <span>✓ Verified Location</span>
          </span>
        )}
      </label>

      <div className="relative">
        {/* Left Icon */}
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          {icon}
        </div>

        {/* Input Field */}
        <input
          type="text"
          name={name}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 && query.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full pl-10 pr-9 py-2.5 bg-slate-950/80 border rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition placeholder:text-slate-600 ${
            error ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-indigo-500'
          }`}
        />

        {/* Loading Spinner */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {isLoading && (
            <svg
              className="animate-spin h-4 w-4 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
        </div>
      </div>

      {/* Validation Error Message */}
      {error && <p className="text-rose-400 text-[11px] mt-1 font-mono">{error}</p>}

      {/* Dropdown Suggestions List */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden font-sans">
          {apiError ? (
            <div className="px-4 py-3 text-xs text-rose-400 font-mono text-center flex items-center justify-center space-x-2">
              <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{apiError}</span>
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="py-1 max-h-64 overflow-y-auto">
              {suggestions.map((item, idx) => (
                <li
                  key={idx}
                  onClick={() => handleSelectSuggestion(item)}
                  onMouseEnter={() => setHighlightedIdx(idx)}
                  className={`px-4 py-2.5 cursor-pointer border-b border-white/5 last:border-0 transition flex flex-col justify-center ${
                    highlightedIdx === idx
                      ? 'bg-indigo-600/90 text-white'
                      : 'text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  {/* Line 1: Primary Name (City / Airport / Place) */}
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span className="truncate">{renderHighlightedText(item.primaryName, query)}</span>
                    {!isNaN(item.latitude) && !isNaN(item.longitude) && (
                      <span className="text-[10px] font-mono opacity-60 ml-2 shrink-0">
                        {item.latitude.toFixed(2)}, {item.longitude.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Line 2: City, State, Country */}
                  {item.secondaryText && (
                    <div className="text-[11px] text-slate-400 opacity-90 truncate mt-0.5">
                      {renderHighlightedText(item.secondaryText, query)}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-xs text-slate-400 font-mono text-center">
              No locations found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
