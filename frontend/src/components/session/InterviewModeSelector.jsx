import React from 'react';
import { FileText, BriefcaseBusiness } from 'lucide-react';
import SessionCard from '../home/SessionCard';

export default function InterviewModeSelector({ selectedMode, onSelectMode }) {
  const modes = [
    {
      id: 'resume',
      title: 'Resume Interview',
      icon: FileText,
      description: 'Upload your resume and optionally add a Job Description for personalized interview generation.',
      features: ['Resume Parsing', 'Projects & Skills', 'Experience-Based Questions']
    },
    {
      id: 'role',
      title: 'Role Interview',
      icon: BriefcaseBusiness,
      description: 'No resume required. Questions are generated from our curated domain knowledge base.',
      features: ['Software Developer', 'Backend Developer', 'AI Engineer', 'Prompt Engineer', 'MBA Roles']
    }
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6 w-full">
      {modes.map((mode) => (
        <SessionCard 
          key={mode.id} 
          mode={mode} 
          selectedMode={selectedMode} 
          onSelectMode={onSelectMode} 
        />
      ))}
    </div>
  );
}
