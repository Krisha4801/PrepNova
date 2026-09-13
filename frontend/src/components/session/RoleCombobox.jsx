import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const ROLE_CATEGORIES = [
  {
    name: 'Software',
    roles: ['Frontend', 'Backend', 'Full Stack', 'React', 'Angular', 'Vue', 'Java', 'Python', 'Node', 'Go']
  },
  {
    name: 'AI',
    roles: ['AI Engineer', 'ML Engineer', 'Prompt Engineer', 'GenAI Engineer', 'NLP Engineer']
  },
  {
    name: 'Data',
    roles: ['Data Analyst', 'Data Engineer', 'BI Developer', 'Analytics Engineer']
  },
  {
    name: 'Cloud',
    roles: ['AWS', 'Azure', 'GCP', 'Cloud Architect']
  },
  {
    name: 'DevOps',
    roles: ['DevOps Engineer', 'SRE', 'Platform Engineer']
  },
  {
    name: 'Cybersecurity',
    roles: ['Security Analyst', 'SOC', 'PenTester']
  },
  {
    name: 'Business',
    roles: ['Product Manager', 'HR', 'Marketing', 'Sales', 'Business Analyst']
  }
];

export default function RoleCombobox({ value, onChange, hasError = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Filter roles based on query
  const filteredData = ROLE_CATEGORIES.map(category => ({
    ...category,
    roles: category.roles.filter(role => role.toLowerCase().includes(query.toLowerCase()))
  })).filter(category => category.roles.length > 0);

  // Flatten for keyboard navigation
  const flatRoles = filteredData.flatMap(c => c.roles);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset active index when query changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < flatRoles.length - 1 ? prev + 1 : prev));
      scrollToActive();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
      scrollToActive();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatRoles[activeIndex]) {
        selectRole(flatRoles[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const scrollToActive = () => {
    if (listRef.current) {
      const activeElement = listRef.current.querySelector('[aria-selected="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  };

  const selectRole = (role) => {
    onChange(role);
    setQuery('');
    setIsOpen(false);
  };

  // Helper to highlight matching text
  const highlightText = (text, highlight) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? <span key={i} className="text-primary font-bold">{part}</span> : <span key={i}>{part}</span>
        )}
      </span>
    );
  };

  return (
    <div className="relative w-full" ref={containerRef} onKeyDown={handleKeyDown}>
      <div 
        className={cn(
          "w-full px-4 py-3 rounded-xl border bg-white flex items-center justify-between cursor-pointer transition-all",
          hasError 
            ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20" 
            : isOpen 
              ? "ring-2 ring-primary/20 border-primary" 
              : "border-border hover:border-gray-300"
        )}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && inputRef.current) setTimeout(() => inputRef.current.focus(), 50);
        }}
        tabIndex={0}
      >
        <span className={cn("text-base truncate", !value && "text-gray-400")}>
          {value || "Search or select a role..."}
        </span>
        <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white border border-border rounded-xl shadow-lg overflow-hidden flex flex-col"
          >
            <div className="flex items-center px-4 py-3 border-b border-gray-100">
              <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                className="w-full bg-transparent border-none outline-none text-sm text-heading placeholder-gray-400"
                placeholder="Type to search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            
            <div 
              ref={listRef}
              className="max-h-[320px] overflow-y-auto custom-scrollbar p-2"
            >
              {filteredData.length === 0 ? (
                <div className="p-4 text-center text-sm text-body">
                  No roles found matching "{query}"
                </div>
              ) : (
                filteredData.map((category, catIdx) => (
                  <div key={category.name} className="mb-2 last:mb-0 relative">
                    <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider sticky top-0 bg-white z-10 shadow-[0_4px_4px_-4px_rgba(0,0,0,0.05)]">
                      {category.name}
                    </div>
                    {category.roles.map((role) => {
                      const globalIdx = flatRoles.indexOf(role);
                      const isSelected = value === role;
                      const isActive = activeIndex === globalIdx;
                      
                      return (
                        <div
                          key={role}
                          aria-selected={isActive}
                          className={cn(
                            "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                            isActive ? "bg-primary/5 text-primary" : "text-heading hover:bg-gray-50"
                          )}
                          onMouseEnter={() => setActiveIndex(globalIdx)}
                          onClick={() => selectRole(role)}
                        >
                          <span className="text-sm font-medium">{highlightText(role, query)}</span>
                          {isSelected && <Check className="w-4 h-4 text-primary" />}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
