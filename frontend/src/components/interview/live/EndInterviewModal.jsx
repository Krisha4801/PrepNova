import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Confirmation dialog shown before ending an interview early.
 *
 * @param {object} props
 * @param {number} props.answered number of questions already answered
 * @param {number} props.total total number of questions
 * @param {() => void} props.onCancel
 * @param {() => void} props.onConfirm
 */
export default function EndInterviewModal({ answered, total, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-modal space-y-4">
        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">End current interview?</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            You have answered {answered} of {total} questions. Ending early will calculate your scorecard based on completed questions.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button type="button" onClick={onCancel} className="btn-secondary text-xs">
            Continue Interview
          </button>
          <button type="button" onClick={onConfirm} className="btn-primary bg-rose-600 hover:bg-rose-700 text-xs">
            Yes, Finish & View Report
          </button>
        </div>
      </div>
    </div>
  );
}
