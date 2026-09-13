import React from 'react';
import { cn } from '../../lib/utils';
import { Search } from 'lucide-react';
import RoleCombobox from './RoleCombobox';
export default function CandidateForm({ formData, setFormData, mode, errors = {} }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="w-full">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-sm font-semibold text-[#0F172A]">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            placeholder="e.g. Alex Morgan"
            className={cn(
              "w-full px-4 py-3 rounded-xl border bg-[#F8FAFC] focus:outline-none transition-all text-[#0F172A] placeholder:text-[#64748B]",
              errors.name 
                ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20" 
                : "border-[#E7EAF3] focus:border-[#5B4DFF] focus:ring-2 focus:ring-[#5B4DFF]/20"
            )}
          />
          {errors.name && (
            <p className="text-xs text-rose-500 font-semibold mt-1">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-semibold text-[#0F172A]">
            Email <span className="text-[#64748B] font-normal">(Optional)</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email || ''}
            onChange={handleChange}
            placeholder="alex@example.com"
            className="w-full px-4 py-3 rounded-xl border border-[#E7EAF3] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/20 focus:border-[#5B4DFF] transition-all text-[#0F172A] placeholder:text-[#64748B]"
          />
        </div>

        {/* Job Role (Required for both modes) */}
        <div className="space-y-1.5 md:col-span-2">
          <label htmlFor="role" className="block text-sm font-semibold text-[#0F172A]">
            Target Job Role <span className="text-rose-500">*</span>
          </label>
          <div className={cn(
            "rounded-xl transition-all",
            errors.role && "ring-2 ring-rose-500/20 rounded-xl"
          )}>
            <RoleCombobox 
              value={formData.role || ''} 
              onChange={(role) => setFormData(prev => ({ ...prev, role }))} 
              hasError={!!errors.role}
            />
          </div>
          {errors.role && (
            <p className="text-xs text-rose-500 font-semibold mt-1">{errors.role}</p>
          )}
        </div>
      </div>
    </div>
  );
}
