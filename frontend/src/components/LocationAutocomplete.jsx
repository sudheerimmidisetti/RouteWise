import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * LocationAutocomplete component featuring debounced geocoding search,
 * in-memory session caching, keyboard navigation (Up, Down, Enter, Esc),
 * click-outside detection, and loading/empty states.
 */
const LocationAutocomplete = ({
  label,
  name,
  value = '',
  onChange,
  placeholder,
  icon,
  error,
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);

  const containerRef = useRef(null);
  const cacheRef = useRef({}); // In-memory session cache
  const debounceTimerRef = useRef(null);

  // Sync internal query state with parent value prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click outside listener to close dropdown
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

  // Format Nominatim API item into clean "City, State/Province, Country" string
  const formatLocationName = (item) => {
    const addr = item.address || {};
    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.municipality ||
      addr.county ||
      item.name ||
      '';
    const state = addr.state || addr.region || addr.province || '';
    const country = addr.country || '';

    const parts = [city, state, country].filter((p) => p.trim().length > 0);
    return parts.length > 0 ? parts.join(', ') : item.display_name;
  };

  // Perform geocoding fetch with caching
  const fetchSuggestions = useCallback(async (searchTerm) => {
    const cleanTerm = searchTerm.trim().toLowerCase();
    if (cleanTerm.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      setIsOpen(false);
      return;
    }

    // Check session cache first
    if (cacheRef.current[cleanTerm]) {
      setSuggestions(cacheRef.current[cleanTerm]);
      setIsLoading(false);
      setIsOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        searchTerm
      )}&format=json&addressdetails=1&limit=5`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'RouteWise-App/1.0',
        },
      });

      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((item) => ({
          displayName: formatLocationName(item),
          rawName: item.display_name,
          lat: floatOrNull(item.lat),
          lon: floatOrNull(item.lon),
        }));

        // Deduplicate suggestions by displayName
        const unique = [];
        const seen = new Set();
        formatted.forEach((item) => {
          if (!seen.has(item.displayName)) {
            seen.add(item.displayName);
            unique.push(item);
          }
        });

        cacheRef.current[cleanTerm] = unique;
        setSuggestions(unique);
        setIsOpen(true);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.warn('Geocoding search error:', err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const floatOrNull = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };

  // Handle text input change with 300ms debouncing
  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (onChange) {
      onChange({ target: { name, value: val } });
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length >= 2) {
      setIsLoading(true);
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(val);
      }, 300);
    } else {
      setSuggestions([]);
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  // Select a suggestion
  const handleSelect = (suggestion) => {
    const selectedName = suggestion.displayName;
    setQuery(selectedName);
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIdx(-1);

    if (onChange) {
      onChange({
        target: {
          name,
          value: selectedName,
          lat: suggestion.lat,
          lon: suggestion.lon,
        },
      });
    }
  };

  // Keyboard navigation
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
        handleSelect(suggestions[highlightedIdx]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIdx(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
        {label}
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

        {/* Loading Spinner / Search Icon */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {isLoading ? (
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
          ) : null}
        </div>
      </div>

      {/* Error Message */}
      {error && <p className="text-rose-400 text-[11px] mt-1 font-mono">{error}</p>}

      {/* Autocomplete Dropdown Overlay */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden font-sans">
          {suggestions.length > 0 ? (
            <ul className="py-1 max-h-56 overflow-y-auto text-xs font-mono">
              {suggestions.map((item, idx) => (
                <li
                  key={idx}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightedIdx(idx)}
                  className={`px-4 py-2.5 cursor-pointer flex items-center justify-between transition ${
                    highlightedIdx === idx
                      ? 'bg-indigo-600/80 text-white font-semibold'
                      : 'text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span className="truncate">{item.displayName}</span>
                  </div>
                  {item.lat && item.lon && (
                    <span className="text-[10px] opacity-60 ml-2 font-mono shrink-0">
                      {item.lat.toFixed(2)}, {item.lon.toFixed(2)}
                    </span>
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

export default LocationAutocomplete;
