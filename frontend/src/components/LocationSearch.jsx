import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * LocationSearch component providing high-accuracy location autocomplete.
 *
 * Features:
 * - 350ms debouncing & AbortController request cancellation
 * - In-memory session result caching (cacheRef)
 * - 2-line clean dropdown display (Primary Name / Secondary City, State, Country)
 * - Matching query text highlighting
 * - Full keyboard navigation (Up, Down, Enter, Escape)
 * - Click-outside detection
 * - Robust error handling (Network errors & No locations found)
 * - Selection validation tracking (latitude, longitude, displayName, city, state, country)
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

  // Format Nominatim API item into Primary Name and Secondary Location (City, State, Country)
  const parseLocationItem = (item) => {
    const addr = item.address || {};

    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.municipality ||
      addr.county ||
      '';
    const state = addr.state || addr.region || addr.province || '';
    const country = addr.country || '';

    // Primary name: item name, airport, building, or city
    let primaryName =
      item.name ||
      addr.aeroway ||
      addr.amenity ||
      city ||
      item.display_name.split(',')[0] ||
      '';

    // Secondary location parts
    const secondaryParts = [];
    if (city && city.toLowerCase() !== primaryName.toLowerCase()) {
      secondaryParts.push(city);
    }
    if (state) secondaryParts.push(state);
    if (country) secondaryParts.push(country);

    const secondaryText = secondaryParts.join(', ');
    const fullDisplayName = secondaryText ? `${primaryName}, ${secondaryText}` : primaryName;

    return {
      primaryName,
      secondaryText,
      displayName: fullDisplayName,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      city,
      state,
      country,
      rawType: item.type || item.class || '',
    };
  };

  // Perform Geocoding Search with AbortController and Caching
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

    // Cancel any ongoing in-flight HTTP request to prevent race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setApiError(null);

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        searchTerm
      )}&format=json&addressdetails=1&limit=8`;

      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers: {
          'User-Agent': 'RouteWise-App/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const parsedItems = data.map(parseLocationItem);

      // Deduplicate results based on primaryName + secondaryText
      const uniqueSuggestions = [];
      const seenKeys = new Set();

      parsedItems.forEach((item) => {
        const key = `${item.primaryName.toLowerCase()}|${item.secondaryText.toLowerCase()}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniqueSuggestions.push(item);
        }
      });

      // Prioritize city/town/airport places over minor streets
      uniqueSuggestions.sort((a, b) => {
        const aIsCity = ['city', 'town', 'administrative', 'aeroway'].includes(a.rawType);
        const bIsCity = ['city', 'town', 'administrative', 'aeroway'].includes(b.rawType);
        if (aIsCity && !bIsCity) return -1;
        if (!aIsCity && bIsCity) return 1;
        return 0;
      });

      cacheRef.current[cleanTerm] = uniqueSuggestions;
      setSuggestions(uniqueSuggestions);
      setIsOpen(true);
    } catch (err) {
      if (err.name === 'AbortError') {
        // Request aborted due to newer keystroke, ignore
        return;
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
                  {/* Line 1: Primary Name */}
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
