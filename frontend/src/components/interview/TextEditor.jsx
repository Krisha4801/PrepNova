import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  Save, 
  Code, 
  Bold, 
  List, 
  Sparkles,
  CornerDownLeft
} from 'lucide-react';

export default function TextEditor({
  value = '',
  onChange,
  onSubmit,
  onSaveDraft,
  placeholder = 'Type your technical response here... (Press Ctrl + Enter to submit)'
}) {
  const [text, setText] = useState(value);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const textareaRef = useRef(null);

  // Sync internal state when external value changes (e.g. navigation)
  useEffect(() => {
    setText(value);
    setHasUnsavedChanges(false);
  }, [value]);

  // Handle local text updates
  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    setHasUnsavedChanges(true);
    if (onChange) onChange(val);
  };

  // Autosave every 5 seconds if unsaved changes exist
  useEffect(() => {
    const timer = setInterval(() => {
      if (hasUnsavedChanges) {
        if (onSaveDraft) onSaveDraft(text);
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [hasUnsavedChanges, text, onSaveDraft]);

  // Keyboard shortcut: Ctrl + Enter / Cmd + Enter to submit
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (onSubmit) onSubmit(text);
    }
  };

  // Quick formatting insert helpers
  const insertFormatting = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = text.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    
    setText(newText);
    setHasUnsavedChanges(true);
    if (onChange) onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 4));
    }, 10);
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return (
    <div className="bg-white dark:bg-[#081A3A] rounded-[18px] border border-[#E5E7EB] dark:border-white/10 shadow-[0_2px_8px_rgba(15,23,42,0.04)] overflow-hidden flex flex-col transition-all">
      
      {/* Editor Toolbar */}
      <div className="px-4 py-2.5 border-b border-[#E5E7EB] dark:border-white/10 bg-slate-50/70 dark:bg-white/5 flex items-center justify-between text-xs select-none">
        
        {/* Formatting buttons */}
        <div className="flex items-center gap-1 text-[#64748B] dark:text-[#94A3B8]">
          <button
            type="button"
            onClick={() => insertFormatting('**', '**')}
            className="p-1.5 rounded hover:bg-white dark:hover:bg-white/10 hover:text-[#0F172A] dark:hover:text-white transition-colors"
            title="Bold (**text**)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('`', '`')}
            className="p-1.5 rounded hover:bg-white dark:hover:bg-white/10 hover:text-[#0F172A] dark:hover:text-white transition-colors"
            title="Inline Code (`code`)"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('\n- ')}
            className="p-1.5 rounded hover:bg-white dark:hover:bg-white/10 hover:text-[#0F172A] dark:hover:text-white transition-colors"
            title="Bullet point (- item)"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
          {hasUnsavedChanges ? (
            <span className="text-amber-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Unsaved changes
            </span>
          ) : lastSaved ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <Check className="w-3 h-3" />
              Autosaved
            </span>
          ) : (
            <span>Ready</span>
          )}

          <div className="h-3 w-[1px] bg-slate-200 dark:bg-white/10" />

          <button
            type="button"
            onClick={() => {
              if (onSaveDraft) onSaveDraft(text);
              setLastSaved(new Date());
              setHasUnsavedChanges(false);
            }}
            className="hover:text-[#2563EB] dark:hover:text-[#38BDF8] flex items-center gap-1 cursor-pointer"
            title="Save draft now"
          >
            <Save className="w-3 h-3" />
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      {/* Main Textarea */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={10}
        className="w-full p-4 sm:p-5 bg-transparent text-[15px] font-normal text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] outline-none border-none resize-y min-h-[220px] leading-relaxed font-sans"
      />

      {/* Footer Counter & Shortcut Hint */}
      <div className="px-4 sm:px-5 py-2.5 border-t border-[#E5E7EB] dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between text-[12px] text-[#64748B] dark:text-[#94A3B8] select-none">
        <div>
          <span>{charCount} characters</span>
          <span className="mx-1.5">•</span>
          <span>{wordCount} words</span>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono">
          <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-white/10 border border-[#E2E8F0] dark:border-white/10 text-[10px]">
            Ctrl
          </kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-white/10 border border-[#E2E8F0] dark:border-white/10 text-[10px]">
            Enter
          </kbd>
          <span className="ml-1 text-[#64748B]">Next question</span>
        </div>
      </div>

    </div>
  );
}
