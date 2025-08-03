'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface Institution {
  id: number;
  name: string;
  type: string;
  location: string;
}

interface InstitutionAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function InstitutionAutocomplete({
  value,
  onChange,
  placeholder = "Search for your institution...",
  className = ""
}: InstitutionAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Search institutions based on input
  const searchInstitutions = async (query: string) => {
    if (query.length < 2) {
      setInstitutions([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .or(`name.ilike.%${query}%,location.ilike.%${query}%`)
        .order('name')
        .limit(10);

      if (error) throw error;
      setInstitutions(data || []);
    } catch (error) {
      console.error('Error searching institutions:', error);
      setInstitutions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== value) {
        searchInstitutions(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, value]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
    
    // If user clears the input, also clear the selected value
    if (newValue === '') {
      onChange('');
    }
  };

  // Handle institution selection
  const handleSelect = (institution: Institution) => {
    const fullName = `${institution.name}, ${institution.location}`;
    setSearchTerm(fullName);
    onChange(fullName);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < institutions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && institutions[highlightedIndex]) {
          handleSelect(institutions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  // Update search term when value prop changes
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  return (
    <div className="relative" ref={inputRef}>
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => {
          setIsOpen(true);
          if (searchTerm.length >= 2) {
            searchInstitutions(searchTerm);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder-gray-400 ${className}`}
        autoComplete="off"
      />

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Searching institutions...
            </div>
          )}

          {!loading && institutions.length === 0 && searchTerm.length >= 2 && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No institutions found matching "{searchTerm}"
            </div>
          )}

          {!loading && searchTerm.length < 2 && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Type at least 2 characters to search
            </div>
          )}

          {!loading && institutions.length > 0 && (
            <ul ref={listRef} className="py-1">
              {institutions.map((institution, index) => (
                <li
                  key={institution.id}
                  onClick={() => handleSelect(institution)}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                    index === highlightedIndex ? 'bg-gray-100' : ''
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">
                      {institution.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {institution.type} • {institution.location}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
