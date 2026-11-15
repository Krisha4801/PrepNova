import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  Plus, 
  Check, 
  Sparkles, 
  Filter, 
  CheckCheck, 
  Trash2, 
  Layers,
  Code2,
  AlertTriangle,
  FileCode2,
  Layout,
  Server,
  Laptop,
  Database,
  Cpu,
  Globe,
  Network,
  Cloud,
  ShieldCheck,
  CheckSquare,
  Coffee,
  Users
} from 'lucide-react';
import { 
  INTERVIEW_SECTIONS_LIBRARY, 
  SECTION_CATEGORIES, 
  filterSections 
} from '../../../constants/sections';

const ICON_MAP = {
  Users,
  AlertTriangle,
  Layers,
  Code2,
  FileCode2,
  Layout,
  Server,
  Laptop,
  Database,
  Cpu,
  Globe,
  Network,
  Sparkles,
  Cloud,
  ShieldCheck,
  CheckSquare,
  Coffee
};

export default function SectionSelector({
  selectedSections = [],
  onToggleSection,
  onRemoveSection,
  onAddCustomSection,
  onSelectAll,
  onClearAll,
  recommendations = null,
  onApplyRecommended
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [customInput, setCustomInput] = useState('');
  const [customError, setCustomError] = useState('');

  // Filter sections by search and category
  const filteredSections = useMemo(() => {
    return filterSections(INTERVIEW_SECTIONS_LIBRARY, searchQuery, activeCategory);
  }, [searchQuery, activeCategory]);

  const selectedIds = useMemo(() => {
    return new Set(selectedSections.map((s) => (typeof s === 'string' ? s : s.id)));
  }, [selectedSections]);

  const handleAddCustom = (e) => {
    if (e) e.preventDefault();
    const trimmed = customInput.trim();
    if (!trimmed) return;

    if (trimmed.length < 2) {
      setCustomError('Custom section name must be at least 2 characters.');
      return;
    }

    const customId = `custom_${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    if (selectedIds.has(customId)) {
      setCustomError('This section is already selected.');
      return;
    }

    setCustomError('');
    onAddCustomSection({
      id: customId,
      name: trimmed,
      category: 'custom',
      categoryLabel: 'Custom Topic',
      badge: 'Custom Section',
      isCustom: true,
      description: `Targeted practice on custom candidate topic: ${trimmed}`,
      defaultObjective: `Examine candidate depth, architecture knowledge, and applied problem-solving in ${trimmed}.`,
      competencies: [trimmed]
    });
    setCustomInput('');
  };

  return (
    <div className="space-y-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/20 dark:bg-indigo-950/20 p-4 sm:p-6 transition-all">
      
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100 dark:border-indigo-900/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Categorized Section Library
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
              {selectedSections.length} Selected
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Choose any combination of technical and behavioral sections, or type your own custom topics.
          </p>
        </div>

        {/* Global Select / Clear Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onSelectAll}
            className="btn-secondary text-[11px] h-7 px-2.5 flex items-center gap-1.5 cursor-pointer"
            title="Select all standard sections"
          >
            <CheckCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Select All</span>
          </button>
          <button
            type="button"
            onClick={onClearAll}
            disabled={selectedSections.length === 0}
            className="btn-secondary text-[11px] h-7 px-2.5 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer text-rose-600 hover:text-rose-700 dark:text-rose-400"
            title="Clear all selections"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Role & Resume/JD Recommendations Banner */}
      {recommendations && recommendations.recommendedSections?.length > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-amber-300/40 dark:border-amber-700/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Recommendations for {recommendations.basisLabel}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Curated competency sections matching your profile. Recommendations do not limit your choices.
                </p>
              </div>
            </div>

            {onApplyRecommended && (
              <button
                type="button"
                onClick={onApplyRecommended}
                className="btn-primary text-xs h-7 px-3 bg-amber-600 hover:bg-amber-700 border-amber-600 shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                <span>Apply Recommendations</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {recommendations.recommendedSections.map((rec) => {
              const isSelected = selectedIds.has(rec.id);
              return (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => onToggleSection(rec)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-amber-400'
                  }`}
                >
                  {isSelected ? <Check className="w-3 h-3 text-indigo-600" /> : <Plus className="w-3 h-3 text-slate-400" />}
                  <span>{rec.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Sections Active Chips Tray */}
      {selectedSections.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Active Selected Practice Sections:</span>
            <span className="text-[11px]">Click cross to remove</span>
          </div>
          <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-36 overflow-y-auto">
            {selectedSections.map((sec) => {
              const secObj = typeof sec === 'string' ? { id: sec, name: sec } : sec;
              return (
                <span
                  key={secObj.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-600 text-white shadow-xs group transition-all"
                >
                  {secObj.isCustom && (
                    <span className="text-[10px] px-1 py-0.2 rounded bg-indigo-800 text-indigo-200">
                      Custom
                    </span>
                  )}
                  <span>{secObj.name}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveSection(secObj.id)}
                    className="hover:bg-indigo-700 p-0.5 rounded-full transition-colors cursor-pointer"
                    title={`Remove ${secObj.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Topic Addition Bar */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Add Custom Topic or Competency</span>
        </label>
        <form onSubmit={handleAddCustom} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={customInput}
              onChange={(e) => {
                setCustomInput(e.target.value);
                if (customError) setCustomError('');
              }}
              placeholder="e.g. GraphQL, WebSockets, Kafka, Rust, Distributed Systems, Micro-frontends..."
              className="input-field text-xs h-9 w-full"
            />
          </div>
          <button
            type="submit"
            className="btn-primary text-xs h-9 px-4 shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Topic</span>
          </button>
        </form>
        {customError && (
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">{customError}</p>
        )}
      </div>

      {/* Search and Category Filter Toolbar */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sections by name, keyword, or concept (e.g. SQL, React, OOP, Docker)..."
              className="input-field pl-9 h-9 text-xs w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
          {SECTION_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
        {filteredSections.map((sec) => {
          const isSelected = selectedIds.has(sec.id);
          const isRecommended = Boolean(recommendations?.recommendedIds?.includes(sec.id));
          const Icon = ICON_MAP[sec.icon] || Layers;

          return (
            <div
              key={sec.id}
              onClick={() => onToggleSection(sec)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between group ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/50 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700/60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 group-hover:text-indigo-600'
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {sec.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isRecommended && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold" title="Recommended for your target role">
                        Role Match
                      </span>
                    )}
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-300 dark:border-slate-700 group-hover:border-indigo-400'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {sec.description}
                </p>
              </div>

              {/* Subtopics / Competencies Preview */}
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-1">
                {sec.competencies.slice(0, 3).map((comp, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  >
                    {comp}
                  </span>
                ))}
                {sec.competencies.length > 3 && (
                  <span className="text-[10px] text-slate-400 self-center">
                    +{sec.competencies.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredSections.length === 0 && (
          <div className="col-span-full py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
            <p className="font-semibold">No sections found matching "{searchQuery}"</p>
            <p className="mt-1">Try another keyword, clear the filter, or add a custom topic above.</p>
          </div>
        )}
      </div>

    </div>
  );
}

