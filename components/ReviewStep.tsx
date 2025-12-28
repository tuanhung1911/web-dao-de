import React, { useState } from 'react';
import { Question, DebugData } from '../types';

interface ReviewStepProps {
  questions: Question[];
  debugData?: DebugData;
  onConfirm: (updatedQuestions: Question[]) => void;
  onCancel: () => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ questions, debugData, onConfirm, onCancel }) => {
  const [localQuestions, setLocalQuestions] = useState<Question[]>(JSON.parse(JSON.stringify(questions)));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Debug toggle
  const [showDebug, setShowDebug] = useState(false);

  // Stats
  const total = localQuestions.length;
  const missingAnswers = localQuestions.filter(q => !q.hasDetectedAnswer).length;

  const handleOptionSelect = (qId: string, optionId: string) => {
    setLocalQuestions(prev => prev.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          hasDetectedAnswer: true,
          options: q.options.map(o => ({
            ...o,
            isCorrect: o.id === optionId
          }))
        };
      }
      return q;
    }));
  };

  const handleConfirm = () => {
    const stillMissing = localQuestions.filter(q => !q.hasDetectedAnswer).length;
    if (stillMissing > 0) {
      setErrorMsg(`Please select a correct answer for the ${stillMissing} highlighted questions.`);
      const firstError = document.querySelector('.border-red-500');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    onConfirm(localQuestions);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 pb-24 flex flex-col md:flex-row gap-6">
      
      {/* LEFT COLUMN: Questions */}
      <div className="flex-grow">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 sticky top-4 z-10 border-l-4 border-primary">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Review Questions</h2>
              <p className="text-gray-600">
                Found <span className="font-semibold text-primary">{total}</span> questions. 
                {missingAnswers > 0 ? (
                  <span className="text-red-600 font-bold ml-1"> {missingAnswers} missing answers.</span>
                ) : (
                  <span className="text-green-600 font-bold ml-1"> All answers detected!</span>
                )}
              </p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirm}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded shadow transition"
              >
                Confirm & Proceed
              </button>
            </div>
          </div>
          {errorMsg && (
            <div className="mt-3 text-red-600 bg-red-50 p-2 rounded text-sm font-medium">
              {errorMsg}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {localQuestions.map((q, idx) => (
            <div 
              key={q.id} 
              className={`bg-white rounded-lg shadow p-6 border-2 transition-all ${
                !q.hasDetectedAnswer ? 'border-red-500 bg-red-50/10' : 'border-transparent hover:border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="bg-slate-200 text-slate-700 font-bold rounded px-2 py-1 text-sm h-fit shrink-0">
                  #{q.originalNumber ?? idx + 1}
                </span>
                <p className="text-lg text-gray-800 font-medium">{q.text}</p>
              </div>

              {!q.hasDetectedAnswer && (
                <p className="text-xs text-red-600 font-bold uppercase tracking-wide mb-2">
                  ⚠ No correct answer detected. Please select one:
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                {q.options.map((opt) => (
                  <label 
                    key={opt.id} 
                    className={`flex items-center p-3 rounded-md border cursor-pointer transition-all
                      ${opt.isCorrect 
                        ? 'bg-green-50 border-green-500 ring-1 ring-green-500' 
                        : 'bg-white border-gray-200 hover:border-gray-400'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={opt.isCorrect}
                      onChange={() => handleOptionSelect(q.id, opt.id)}
                      className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <span className={`ml-3 ${opt.isCorrect ? 'text-green-800 font-medium' : 'text-gray-700'}`}>
                      {opt.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN: Debug Panel (Hidden by default) */}
      <div className={`fixed inset-y-0 right-0 w-96 bg-gray-900 text-gray-300 shadow-2xl transform transition-transform duration-300 z-50 overflow-y-auto ${showDebug ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-bold text-lg">Parser Debugger</h3>
            <button onClick={() => setShowDebug(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>

          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase text-yellow-500 mb-2">Detected Colors (XML)</h4>
            <div className="flex flex-wrap gap-2 text-xs">
              {debugData?.detectedColors && debugData.detectedColors.length > 0 ? (
                debugData.detectedColors.map(c => (
                  <span key={c} className="px-2 py-1 bg-gray-800 border border-gray-700 rounded flex items-center">
                    <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: c.startsWith('#') ? c : `#${c}`}}></span>
                    {c}
                  </span>
                ))
              ) : (
                <span className="text-gray-600 italic">No custom colors found in Document.xml</span>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase text-blue-500 mb-2">Parser Logs</h4>
            <div className="bg-black rounded p-2 text-xs font-mono h-32 overflow-y-auto border border-gray-800">
               {debugData?.logs.map((log, i) => <div key={i} className="mb-1">{log}</div>)}
            </div>
          </div>

          <div className="mb-6">
             <h4 className="text-xs font-bold uppercase text-pink-500 mb-2">Raw Word XML (Internal)</h4>
             <p className="text-xs text-gray-500 mb-2">Copy this if you need to debug formatting tags.</p>
             <textarea 
                readOnly
                className="w-full h-48 bg-black text-pink-400 text-xs font-mono p-2 rounded border border-gray-800 focus:outline-none"
                value={debugData?.documentXml || "No XML Data"}
             />
          </div>

          <div>
             <h4 className="text-xs font-bold uppercase text-green-500 mb-2">Generated HTML (Mammoth)</h4>
             <textarea 
                readOnly
                className="w-full h-48 bg-black text-green-400 text-xs font-mono p-2 rounded border border-gray-800 focus:outline-none"
                value={debugData?.rawHtml || "No HTML Data"}
             />
          </div>
        </div>
      </div>

      {/* Floating Toggle Button */}
      {!showDebug && (
        <button 
          onClick={() => setShowDebug(true)}
          className="fixed bottom-6 right-6 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg z-40 flex items-center gap-2 text-sm font-medium"
        >
          <span className="text-yellow-400">⚡</span> Debug
        </button>
      )}

    </div>
  );
};
