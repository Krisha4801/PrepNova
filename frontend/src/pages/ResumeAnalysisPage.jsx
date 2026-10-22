import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  UploadCloud, 
  FileSearch, 
  Loader2, 
  Play,
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  GraduationCap,
  Code2,
  FolderGit2,
  Award,
  Layers,
  ChevronRight,
  ExternalLink,
  Target,
  BarChart3,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';
import { uploadResumeApi, getMyResumesApi } from '../lib/api';

/**
 * Deterministic client ATS analyzer that computes scoring, dimension breakdown,
 * and contextual suggestions based on actual parsed resume fields.
 */
function calculateClientAtsDetails(parsedData, detectedRole = '') {
  if (!parsedData || typeof parsedData !== 'object') {
    return {
      score: 70,
      breakdown: {
        contact: { score: 10, max: 15, label: 'Contact Details' },
        summary: { score: 5, max: 10, label: 'Professional Summary' },
        experience: { score: 18, max: 25, label: 'Work Experience' },
        skills: { score: 18, max: 25, label: 'Technical Skills' },
        education: { score: 11, max: 15, label: 'Education' },
        projects: { score: 8, max: 10, label: 'Projects & Certs' }
      },
      suggestions: [
        {
          id: 'gen-1',
          priority: 'High',
          priorityColor: 'badge-primary',
          title: 'Include measurable metrics in project bullet points',
          explanation: 'Quantify scale, latency reduction, user volume, or throughput (e.g. "Reduced API response times by 35% across 50k DAU").'
        }
      ],
      foundKeywords: ['Software Development'],
      suggestedKeywords: ['Docker', 'CI/CD Pipelines', 'AWS / Cloud', 'Redis']
    };
  }

  const candidate = parsedData.candidate || {};
  let contactScore = 0;
  if (candidate.name && String(candidate.name).trim().length > 1) contactScore += 4;
  if (candidate.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(candidate.email).trim())) contactScore += 5;
  if (candidate.phone && String(candidate.phone).trim().length >= 6) contactScore += 3;
  if (candidate.location && String(candidate.location).trim().length > 1) contactScore += 3;

  let summaryScore = 0;
  const summaryStr = Array.isArray(parsedData.summary) 
    ? parsedData.summary.join(' ') 
    : String(parsedData.summary || '');
  if (summaryStr.trim().length > 20) summaryScore += 5;
  if (summaryStr.trim().length >= 80) summaryScore += 5;

  const experience = Array.isArray(parsedData.experience) ? parsedData.experience : [];
  let experienceScore = 0;
  if (experience.length >= 1) experienceScore += 10;
  if (experience.length >= 2) experienceScore += 5;
  const hasRoleAndCompany = experience.some(e => (e.role || e.title) && e.company);
  if (hasRoleAndCompany) experienceScore += 4;
  const hasDescriptions = experience.some(e => {
    const desc = Array.isArray(e.description) ? e.description.join(' ') : String(e.description || '');
    return desc.length > 25;
  });
  if (hasDescriptions) experienceScore += 3;
  const hasMetrics = experience.some(e => {
    const desc = Array.isArray(e.description) ? e.description.join(' ') : String(e.description || '');
    return /\b\d+%|\b\d+x|\b\d+k|\b\d+\s*(users|ms|clients|projects|million|reduction|increase)/i.test(desc);
  });
  if (hasMetrics) experienceScore += 3;

  // Gather all unique skills from skills section, experience techs, and project techs
  const skillsObj = parsedData.skills || {};
  const foundKeywordsList = [];
  if (Array.isArray(skillsObj)) {
    foundKeywordsList.push(...skillsObj);
  } else if (typeof skillsObj === 'object') {
    for (const val of Object.values(skillsObj)) {
      if (Array.isArray(val)) foundKeywordsList.push(...val);
      else if (typeof val === 'string') foundKeywordsList.push(...val.split(',').map(s => s.trim()));
    }
  }

  experience.forEach(exp => {
    if (Array.isArray(exp.technologies)) foundKeywordsList.push(...exp.technologies);
    else if (typeof exp.technologies === 'string') foundKeywordsList.push(...exp.technologies.split(',').map(s => s.trim()));
  });

  const projects = Array.isArray(parsedData.projects) ? parsedData.projects : [];
  projects.forEach(p => {
    if (Array.isArray(p.technologies)) foundKeywordsList.push(...p.technologies);
    else if (typeof p.technologies === 'string') foundKeywordsList.push(...p.technologies.split(',').map(s => s.trim()));
  });

  const uniqueSkills = [...new Set(foundKeywordsList.map(s => String(s).trim()).filter(Boolean))];
  let skillsScore = 0;
  if (uniqueSkills.length >= 3) skillsScore += 10;
  if (uniqueSkills.length >= 6) skillsScore += 5;
  if (uniqueSkills.length >= 10) skillsScore += 5;
  if (uniqueSkills.length >= 15) skillsScore += 5;

  const education = Array.isArray(parsedData.education) ? parsedData.education : [];
  let educationScore = 0;
  if (education.length >= 1) educationScore += 8;
  if (education.some(e => e.degree || e.field)) educationScore += 4;
  if (education.some(e => e.institution)) educationScore += 3;

  let projectsScore = 0;
  if (projects.length >= 1) projectsScore += 6;
  const certs = Array.isArray(parsedData.certifications) 
    ? parsedData.certifications 
    : (parsedData.certifications ? [parsedData.certifications] : []);
  const achievements = Array.isArray(parsedData.achievements) 
    ? parsedData.achievements 
    : (parsedData.achievements ? [parsedData.achievements] : []);
  if (certs.length > 0 || achievements.length > 0) projectsScore += 4;

  const totalScore = Math.min(100, Math.max(35, contactScore + summaryScore + experienceScore + skillsScore + educationScore + projectsScore));

  // Actionable tips based on what is detected
  const suggestions = [];
  if (!candidate.phone || !candidate.location) {
    suggestions.push({
      id: 'contact-fix',
      priority: 'High',
      priorityColor: 'badge-primary',
      title: 'Complete Contact & Location Details',
      explanation: 'Recruiter ATS filters prioritize candidates with a reachable contact phone and target location or time zone.'
    });
  }
  if (!summaryStr || summaryStr.trim().length < 60) {
    suggestions.push({
      id: 'summary-fix',
      priority: 'High',
      priorityColor: 'badge-primary',
      title: 'Add a Strong Professional Summary',
      explanation: 'A 2-3 sentence executive summary highlighting core tech stack, years of experience, and key competencies significantly improves ATS scoring.'
    });
  }
  if (!hasMetrics) {
    suggestions.push({
      id: 'metrics-fix',
      priority: 'High',
      priorityColor: 'badge-primary',
      title: 'Include Quantifiable Impact Metrics',
      explanation: 'Highlight scale and concrete outcomes in experience bullet points (e.g. "Reduced API latency by 35%", "Scaled to 100k DAU", "Automated deployment pipeline saving 6 hrs/week").'
    });
  }
  if (uniqueSkills.length < 8) {
    suggestions.push({
      id: 'skills-fix',
      priority: 'Medium',
      priorityColor: 'badge-neutral',
      title: 'Expand Technical Skills Breadth',
      explanation: 'Explicitly categorize your proficiencies across languages, frameworks, cloud infrastructure, and database management for higher match frequency.'
    });
  }
  if (projects.length === 0 || !projects.some(p => p.technologies && p.technologies.length > 0)) {
    suggestions.push({
      id: 'projects-fix',
      priority: 'Medium',
      priorityColor: 'badge-neutral',
      title: 'Detail Portfolio Projects with Tech Stacks',
      explanation: 'ATS screeners verify practical application of keywords when they appear in hands-on projects and open-source contributions.'
    });
  }
  if (suggestions.length === 0) {
    suggestions.push({
      id: 'well-optimized',
      priority: 'Low',
      priorityColor: 'badge-success',
      title: 'Well Optimized ATS Structure',
      explanation: 'Your resume contains clear section headers, comprehensive technical skills, and quantifiable experience entries.'
    });
  }

  // Recommended industry keywords depending on role or skills
  const roleStr = (detectedRole || parsedData.candidate?.targetRole || '').toLowerCase();
  let suggestedKeywords = ['Docker', 'CI/CD Pipelines', 'AWS / Cloud', 'Redis', 'Unit Testing'];
  if (roleStr.includes('backend') || roleStr.includes('system') || roleStr.includes('cloud')) {
    suggestedKeywords = ['Kubernetes', 'Docker', 'Redis', 'Kafka', 'PostgreSQL', 'CI/CD Pipelines', 'Microservices', 'GraphQL'];
  } else if (roleStr.includes('devops') || roleStr.includes('sre') || roleStr.includes('infra')) {
    suggestedKeywords = ['Terraform', 'Kubernetes', 'Prometheus', 'Grafana', 'Ansible', 'AWS CloudFormation', 'ArgoCD'];
  } else if (roleStr.includes('data') || roleStr.includes('ai') || roleStr.includes('ml')) {
    suggestedKeywords = ['PyTorch', 'TensorFlow', 'Apache Spark', 'MLflow', 'Pandas', 'Vector Databases', 'HuggingFace'];
  } else if (roleStr.includes('front') || roleStr.includes('react') || roleStr.includes('web')) {
    suggestedKeywords = ['TypeScript', 'Next.js', 'Tailwind CSS', 'GraphQL', 'Vitest / Jest', 'Webpack / Vite', 'WebSockets'];
  }

  const lowerFound = new Set(uniqueSkills.map(k => k.toLowerCase()));
  const missingKeywords = suggestedKeywords.filter(k => !lowerFound.has(k.toLowerCase()));

  return {
    score: totalScore,
    breakdown: {
      contact: { score: contactScore, max: 15, label: 'Contact Details' },
      summary: { score: summaryScore, max: 10, label: 'Professional Summary' },
      experience: { score: experienceScore, max: 25, label: 'Work Experience' },
      skills: { score: skillsScore, max: 25, label: 'Technical Skills' },
      education: { score: educationScore, max: 15, label: 'Education' },
      projects: { score: projectsScore, max: 10, label: 'Projects & Certs' }
    },
    suggestions,
    foundKeywords: uniqueSkills,
    suggestedKeywords: missingKeywords.length > 0 ? missingKeywords : ['System Design', 'Performance Profiling', 'Security Best Practices']
  };
}

export default function ResumeAnalysisPage() {
  const [activeTab, setActiveTab] = useState('extracted'); // 'extracted' | 'suggestions' | 'keywords'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Resume Data State (initializes from active resume if available)
  const [resumeData, setResumeData] = useState(() => {
    try {
      const activeDoc = localStorage.getItem('prepnova_resume_doc');
      if (activeDoc) {
        const doc = JSON.parse(activeDoc);
        const sizeStr = typeof doc.fileSize === 'number'
          ? `${(doc.fileSize / (1024 * 1024)).toFixed(1)} MB`
          : (doc.size || '1.0 MB');
        const parsed = doc.parsedData || doc.parsed_data || null;
        const analysis = calculateClientAtsDetails(parsed, doc.detectedRole);
        return {
          fileName: doc.originalFilename || doc.name || 'My_Resume.pdf',
          fileSize: sizeStr,
          uploadDate: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Active Resume',
          atsScore: typeof doc.atsScore === 'number' ? doc.atsScore : analysis.score,
          status: 'Parsed',
          documentId: doc.documentId,
          detectedRole: doc.detectedRole || parsed?.candidate?.targetRole || null,
          parsedData: parsed
        };
      }
      const saved = localStorage.getItem('prepnova_uploaded_resume');
      if (saved) {
        const parsedSaved = JSON.parse(saved);
        if (parsedSaved.parsedData) return parsedSaved;
      }
    } catch (e) { /* ignore */ }
    return null;
  });

  // Fetch active resume from MongoDB on mount if not loaded
  useEffect(() => {
    let isMounted = true;
    const fetchActiveResume = async () => {
      try {
        const res = await getMyResumesApi();
        if (isMounted && res.resumes && res.resumes.length > 0) {
          const latest = res.resumes[0];
          const parsedContent = latest.parsedData || latest.parsed_data || null;
          const analysis = calculateClientAtsDetails(parsedContent, latest.detectedRole);
          const parsed = {
            fileName: latest.originalFilename,
            fileSize: `${(latest.fileSize / (1024 * 1024)).toFixed(1)} MB`,
            uploadDate: new Date(latest.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            atsScore: typeof latest.atsScore === 'number' ? latest.atsScore : analysis.score,
            status: 'Parsed',
            documentId: latest.documentId,
            detectedRole: latest.detectedRole,
            parsedData: parsedContent
          };
          setResumeData(parsed);
          localStorage.setItem('prepnova_resume_id', latest.documentId);
          localStorage.setItem('prepnova_resume_doc', JSON.stringify(latest));
          localStorage.setItem('prepnova_resume_name', latest.originalFilename);
          localStorage.setItem('prepnova_uploaded_resume', JSON.stringify(parsed));
        }
      } catch (err) { /* silent fallback */ }
    };

    fetchActiveResume();
    return () => { isMounted = false; };
  }, []);

  // Compute dynamic analysis on the fly from parsedData
  const atsAnalysis = useMemo(() => {
    return calculateClientAtsDetails(resumeData?.parsedData, resumeData?.detectedRole);
  }, [resumeData]);

  const displayAtsScore = typeof resumeData?.atsScore === 'number' 
    ? resumeData.atsScore 
    : atsAnalysis.score;

  const handleFile = async (file) => {
    if (!file) return;

    const validExtensions = ['.pdf', '.docx'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setToastMessage('Supported formats: PDF or DOCX only.');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToastMessage('File size exceeds the 5MB maximum limit.');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    setIsAnalyzing(true);
    setToastMessage(`Processing & indexing ${file.name}...`);

    try {
      const res = await uploadResumeApi(file);
      const doc = res.resume || {};
      const parsedContent = doc.parsedData || doc.parsed_data || null;
      const analysis = calculateClientAtsDetails(parsedContent, doc.detectedRole);

      const parsedResume = {
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        atsScore: typeof doc.atsScore === 'number' ? doc.atsScore : analysis.score,
        status: 'Parsed',
        documentId: doc.documentId,
        detectedRole: doc.detectedRole,
        parsedData: parsedContent
      };
      setResumeData(parsedResume);
      localStorage.setItem('prepnova_uploaded_resume', JSON.stringify(parsedResume));
      if (doc.documentId) {
        localStorage.setItem('prepnova_resume_id', doc.documentId);
        localStorage.setItem('prepnova_resume_doc', JSON.stringify(doc));
        localStorage.setItem('prepnova_resume_name', file.name);
      }
      setToastMessage('Resume parsed and extracted fields saved successfully.');
    } catch (err) {
      setToastMessage(err.message || 'Resume extraction failed. Check the AI service configuration and try again.');
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemoveResume = () => {
    setResumeData(null);
    localStorage.removeItem('prepnova_uploaded_resume');
    localStorage.removeItem('prepnova_resume_id');
    localStorage.removeItem('prepnova_resume_doc');
    localStorage.removeItem('prepnova_resume_name');
  };

  const parsed = resumeData?.parsedData || {};
  const candidate = parsed.candidate || {};
  const experiences = Array.isArray(parsed.experience) ? parsed.experience : [];
  const educations = Array.isArray(parsed.education) ? parsed.education : [];
  const projects = Array.isArray(parsed.projects) ? parsed.projects : [];
  const certifications = Array.isArray(parsed.certifications) 
    ? parsed.certifications 
    : (parsed.certifications ? [parsed.certifications] : []);
  const achievements = Array.isArray(parsed.achievements) 
    ? parsed.achievements 
    : (parsed.achievements ? [parsed.achievements] : []);
  const links = Array.isArray(parsed.links) 
    ? parsed.links 
    : (candidate.links ? (Array.isArray(candidate.links) ? candidate.links : [candidate.links]) : []);

  // Normalize skills object for categorized view
  const categorizedSkills = useMemo(() => {
    const raw = parsed.skills;
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return [{ category: 'Technical Skills', items: raw }];
    }
    if (typeof raw === 'object') {
      const categoryLabels = {
        programming_languages: 'Programming Languages',
        frameworks: 'Frameworks & Libraries',
        databases: 'Databases & Storage',
        cloud: 'Cloud & Infrastructure',
        ai_ml: 'AI & Machine Learning',
        tools: 'Developer Tools',
        other: 'Other Competencies'
      };

      const result = [];
      for (const [key, val] of Object.entries(raw)) {
        let items = [];
        if (Array.isArray(val)) items = val;
        else if (typeof val === 'string' && val.trim()) items = val.split(',').map(s => s.trim());
        if (items.length > 0) {
          result.push({
            category: categoryLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            items: items.filter(Boolean)
          });
        }
      }
      return result;
    }
    return [];
  }, [parsed.skills]);

  return (
    <WorkspaceLayout title="Resume & ATS Analysis">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFile(e.target.files?.[0])}
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
      />

      <div className="max-w-4xl mx-auto space-y-7">
        
        {!resumeData ? (
          /* ================================================== */
          /* EMPTY / UPLOAD STATE                              */
          /* ================================================== */
          <div className="panel-card p-8 sm:p-12 text-center space-y-6">
            <div className="max-w-md mx-auto space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-indigo-800/50">
                <FileSearch className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Upload Resume for ATS Parsing
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Extract your candidate profile, structured technical skills, experience timeline, and receive instant ATS compliance scoring.
              </p>
            </div>

            {/* Drag and drop area */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 sm:p-10 border-2 border-dashed rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40'
                  : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-700 bg-slate-50/60 dark:bg-slate-900/40'
              }`}
            >
              {isAnalyzing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Extracting structured fields with AI parser...</span>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-slate-400" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">PDF or DOCX (Max 5MB)</p>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-200">Field Extraction</span>
                <p className="text-[11px] text-slate-400">Extracts candidate info, skills, projects, and work history.</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-200">ATS Compliance</span>
                <p className="text-[11px] text-slate-400">Scores layout readability, contact completeness, and metrics.</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-200">Keyword Matching</span>
                <p className="text-[11px] text-slate-400">Highlights detected framework terms vs role benchmarks.</p>
              </div>
            </div>
          </div>
        ) : (
          /* ================================================== */
          /* PARSED RESUME VIEW                                */
          /* ================================================== */
          <div className="space-y-6">
            
            {/* Header / Active Document Card */}
            <div className="panel-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/50">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{resumeData.fileName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Uploaded on {resumeData.uploadDate} • {resumeData.fileSize}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/start-interview"
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start Mock with this Resume</span>
                </Link>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary text-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Replace</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemoveResume}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs transition-colors"
                  title="Remove document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Score & Tabs Overview */}
            <div className="panel-card space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Resume Analysis & Extraction</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Extracted fields from your document and live ATS scoring metrics.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
                    displayAtsScore >= 80 
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200/60'
                      : displayAtsScore >= 60
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200/60'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200/60'
                  }`}>
                    ATS Score: {displayAtsScore}%
                  </div>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                {[
                  { id: 'extracted', label: 'Extracted Resume Data', count: (experiences.length + educations.length + projects.length) || undefined },
                  { id: 'suggestions', label: 'ATS Score & Suggestions' },
                  { id: 'keywords', label: 'Keyword Density & Match' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        activeTab === tab.id ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* ================================================== */}
              {/* TAB 1: EXTRACTED RESUME FIELDS                      */}
              {/* ================================================== */}
              {activeTab === 'extracted' && (
                <div className="space-y-6 pt-1">
                  
                  {/* Candidate Profile Card */}
                  <div className="p-4 sm:p-5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/80 pb-3">
                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          {candidate.name || 'Candidate Name Not Detected'}
                        </h4>
                        {(resumeData.detectedRole || candidate.targetRole) && (
                          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                            {resumeData.detectedRole || candidate.targetRole}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-y-2 gap-x-5 text-xs text-slate-600 dark:text-slate-300">
                      {candidate.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{candidate.email}</span>
                        </div>
                      )}
                      {candidate.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{candidate.phone}</span>
                        </div>
                      )}
                      {candidate.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{candidate.location}</span>
                        </div>
                      )}
                    </div>

                    {links.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.startsWith('http') ? link : `https://${link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            <Globe className="w-3 h-3" />
                            <span>{link.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  {parsed.summary && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        <FileText className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Professional Summary</span>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {Array.isArray(parsed.summary) ? parsed.summary.join(' ') : parsed.summary}
                      </div>
                    </div>
                  )}

                  {/* Categorized Skills */}
                  {categorizedSkills.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Extracted Technical Skills</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {categorizedSkills.map((cat, idx) => (
                          <div 
                            key={idx}
                            className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 space-y-2"
                          >
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                              {cat.category}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {cat.items.map((skill, sIdx) => (
                                <span key={sIdx} className="badge-neutral text-[11px]">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Work Experience */}
                  {experiences.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Work Experience ({experiences.length})</span>
                      </div>
                      <div className="space-y-3">
                        {experiences.map((exp, idx) => (
                          <div 
                            key={idx}
                            className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 space-y-2"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div>
                                <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                                  {exp.role || exp.title || 'Role'}
                                </h5>
                                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                  {exp.company || 'Company'}
                                </p>
                              </div>
                              {(exp.start_date || exp.end_date) && (
                                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                                  {exp.start_date || 'Start'} — {exp.end_date || 'Present'}
                                </span>
                              )}
                            </div>

                            {/* Descriptions */}
                            {exp.description && (
                              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pl-1 pt-1">
                                {Array.isArray(exp.description) ? (
                                  <ul className="list-disc list-inside space-y-1">
                                    {exp.description.map((bullet, bIdx) => (
                                      <li key={bIdx} className="leading-relaxed">{bullet}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="leading-relaxed">{exp.description}</p>
                                )}
                              </div>
                            )}

                            {/* Technologies tag row */}
                            {exp.technologies && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                                {(Array.isArray(exp.technologies) ? exp.technologies : [exp.technologies]).map((tech, tIdx) => (
                                  <span key={tIdx} className="badge-primary text-[10px]">
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {projects.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        <FolderGit2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Key Projects ({projects.length})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {projects.map((proj, idx) => (
                          <div 
                            key={idx}
                            className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 space-y-2"
                          >
                            <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                              {proj.name || 'Project'}
                            </h5>
                            {proj.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                {Array.isArray(proj.description) ? proj.description.join(' ') : proj.description}
                              </p>
                            )}
                            {proj.technologies && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {(Array.isArray(proj.technologies) ? proj.technologies : [proj.technologies]).map((tech, tIdx) => (
                                  <span key={tIdx} className="badge-neutral text-[10px]">
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {educations.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Education</span>
                      </div>
                      <div className="space-y-2.5">
                        {educations.map((edu, idx) => (
                          <div 
                            key={idx}
                            className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                          >
                            <div>
                              <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                                {edu.degree ? `${edu.degree}${edu.field ? ` in ${edu.field}` : ''}` : (edu.field || 'Degree')}
                              </h5>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {edu.institution || 'University / Institution'}
                              </p>
                            </div>
                            {(edu.start_year || edu.end_year) && (
                              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                {edu.start_year || ''} {edu.start_year && edu.end_year ? '—' : ''} {edu.end_year || ''}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications & Achievements */}
                  {(certifications.length > 0 || achievements.length > 0) && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        <Award className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Certifications & Achievements</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {certifications.map((cert, idx) => (
                          <span key={`cert-${idx}`} className="badge-success text-xs">
                            ✓ {cert}
                          </span>
                        ))}
                        {achievements.map((ach, idx) => (
                          <span key={`ach-${idx}`} className="badge-primary text-xs">
                            ★ {ach}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ================================================== */}
              {/* TAB 2: ATS SCORING BREAKDOWN & SUGGESTIONS         */}
              {/* ================================================== */}
              {activeTab === 'suggestions' && (
                <div className="space-y-6">
                  
                  {/* Category Breakdown Bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(atsAnalysis.breakdown).map(([key, item]) => {
                      const pct = Math.round((item.score / item.max) * 100);
                      return (
                        <div 
                          key={key}
                          className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{item.score}/{item.max}</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-indigo-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actionable Suggestions */}
                  <div className="space-y-3.5 pt-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Targeted Optimization Recommendations
                    </h4>
                    {atsAnalysis.suggestions.map((item) => (
                      <div 
                        key={item.id} 
                        className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`${item.priorityColor} text-[11px]`}>{item.priority} Priority</span>
                          <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{item.title}</h5>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-0.5">
                          {item.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ================================================== */}
              {/* TAB 3: KEYWORDS & DENSITY                          */}
              {/* ================================================== */}
              {activeTab === 'keywords' && (
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                        Found Technical Keywords ({atsAnalysis.foundKeywords.length})
                      </span>
                    </div>
                    {atsAnalysis.foundKeywords.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {atsAnalysis.foundKeywords.map((kw, idx) => (
                          <span key={idx} className="badge-success text-xs">
                            ✓ {kw}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No specific technical keywords detected yet.</p>
                    )}
                  </div>

                  <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                      Recommended Competency Keywords for {resumeData.detectedRole || 'Technical Roles'}
                    </span>
                    <p className="text-xs text-slate-400">
                      Adding these keywords to your projects or skills section can improve candidate match ranking.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {atsAnalysis.suggestedKeywords.map((kw, idx) => (
                        <span key={idx} className="badge-neutral text-xs">
                          + {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </WorkspaceLayout>
  );
}
