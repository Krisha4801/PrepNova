import React from 'react';
import { Clock, MessageSquare, Award, FileSearch } from 'lucide-react';

export default function InterviewSummary() {
  const items = [
    {
      icon: Clock,
      title: 'Duration',
      value: '30–40 Minutes'
    },
    {
      icon: MessageSquare,
      title: 'Question Type',
      value: 'Technical + HR'
    },
    {
      icon: Award,
      title: 'Evaluation',
      value: 'AI Scoring & Feedback'
    },
    {
      icon: FileSearch,
      title: 'Resume Insights',
      value: 'ATS Keyword Alignment'
    }
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-card rounded-xl p-5 border border-border shadow-sm flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                <Icon className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-semibold text-body uppercase tracking-wider mb-1">{item.title}</h4>
              <p className="text-sm font-bold text-heading">{item.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
