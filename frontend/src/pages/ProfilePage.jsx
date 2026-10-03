import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Building2, 
  Briefcase, 
  MapPin, 
  Phone, 
  Check, 
  Edit3, 
  Save, 
  X, 
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    organization: user?.organization || user?.university || '',
    targetRole: user?.targetRole || user?.preferredRole || 'Frontend Developer',
    experienceLevel: user?.experienceLevel || 'Mid-Level (3–5 years)',
    location: user?.location || 'Remote / Hybrid',
    phone: user?.phone || '',
    bio: user?.bio || 'Full stack developer focused on responsive UI architecture, state management, and reliable REST microservices.'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (updateProfile) {
      updateProfile({
        name: formData.fullName,
        organization: formData.organization,
        targetRole: formData.targetRole,
        experienceLevel: formData.experienceLevel,
        location: formData.location,
        phone: formData.phone,
        bio: formData.bio
      });
    }
    setIsEditing(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.name || '',
      email: user?.email || '',
      organization: user?.organization || user?.university || '',
      targetRole: user?.targetRole || user?.preferredRole || 'Frontend Developer',
      experienceLevel: user?.experienceLevel || 'Mid-Level (3–5 years)',
      location: user?.location || 'Remote / Hybrid',
      phone: user?.phone || '',
      bio: user?.bio || ''
    });
    setIsEditing(false);
  };

  const userInitial = (user?.name ? user.name[0] : (user?.email ? user.email[0] : 'C')).toUpperCase();

  return (
    <WorkspaceLayout title="Candidate Profile">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Profile changes updated successfully</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-7">
        
        {/* Header Profile Identity Card */}
        <div className="panel-card flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white text-2xl font-extrabold flex items-center justify-center shrink-0 shadow-xs">
              {userInitial}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                  {formData.fullName || user?.name || 'Candidate Profile'}
                </h2>
                <span className="badge-primary text-[11px] capitalize">{user?.role || 'User'}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formData.email || user?.email}</p>
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">{formData.targetRole}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-secondary text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="btn-primary text-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="btn-secondary text-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Details Form */}
        <div className="panel-card space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Profile Details</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Personalized metadata used to contextualize interview scenarios.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                disabled={!isEditing}
                value={formData.fullName}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={formData.email}
                className="input-field bg-slate-100 dark:bg-slate-800/80 cursor-not-allowed text-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Company / Institution
              </label>
              <input
                type="text"
                name="organization"
                disabled={!isEditing}
                value={formData.organization}
                onChange={handleInputChange}
                className="input-field"
                placeholder="e.g. Acme Corp or University"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Target Role
              </label>
              <input
                type="text"
                name="targetRole"
                disabled={!isEditing}
                value={formData.targetRole}
                onChange={handleInputChange}
                className="input-field"
                placeholder="e.g. Frontend Developer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Experience Level
              </label>
              <input
                type="text"
                name="experienceLevel"
                disabled={!isEditing}
                value={formData.experienceLevel}
                onChange={handleInputChange}
                className="input-field"
                placeholder="e.g. Mid-Level (3-5 years)"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Location
              </label>
              <input
                type="text"
                name="location"
                disabled={!isEditing}
                value={formData.location}
                onChange={handleInputChange}
                className="input-field"
                placeholder="e.g. Remote / City, Country"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Professional Summary / Bio
            </label>
            <textarea
              rows={3}
              name="bio"
              disabled={!isEditing}
              value={formData.bio}
              onChange={handleInputChange}
              className="input-field resize-none leading-relaxed"
              placeholder="Brief summary of your primary technical stack and domain focus..."
            />
          </div>
        </div>

      </div>
    </WorkspaceLayout>
  );
}
