import React, { useState } from 'react';
import { UploadStep } from './components/UploadStep';
import { ReviewStep } from './components/ReviewStep';
import { GenerateStep } from './components/GenerateStep';
import { AppStep, Question, DebugData } from './types';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [questions, setQuestions] = useState<Question[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [fileName, setFileName] = useState<string>('');
  
  // Debug Data State
  const [debugData, setDebugData] = useState<DebugData | undefined>(undefined);

  const handleDataParsed = (parsedQuestions: Question[], name: string, debug: DebugData) => {
    setQuestions(parsedQuestions);
    setFileName(name);
    setDebugData(debug); // Store debug info
    setStep(AppStep.REVIEW);
  };

  const handleReviewConfirm = (confirmedQuestions: Question[]) => {
    setQuestions(confirmedQuestions);
    setStep(AppStep.GENERATE);
  };

  const handleReset = () => {
    setQuestions([]);
    setFileName('');
    setDebugData(undefined);
    setStep(AppStep.UPLOAD);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 rounded-lg p-2">
               <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
               </svg>
             </div>
             <h1 className="text-xl font-bold text-gray-900 tracking-tight">Exam Shuffler</h1>
          </div>
          
          {/* Progress Steps */}
          <div className="hidden md:flex items-center space-x-2 text-sm font-medium">
             <span className={`${step === AppStep.UPLOAD ? 'text-primary' : 'text-gray-400'}`}>1. Upload</span>
             <span className="text-gray-300">/</span>
             <span className={`${step === AppStep.REVIEW ? 'text-primary' : 'text-gray-400'}`}>2. Review</span>
             <span className="text-gray-300">/</span>
             <span className={`${step === AppStep.GENERATE ? 'text-primary' : 'text-gray-400'}`}>3. Generate</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-start pt-10 px-4">
        {step === AppStep.UPLOAD && (
          <div className="animate-fade-in w-full">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-extrabold text-slate-800 mb-4">Shuffle Your Exams in Seconds</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Upload a standard Word document (.docx). We'll detect your questions and correct answers (marked in <span className="text-red-500 font-bold">red</span> or <u>underlined</u>), then create randomized versions for you.
              </p>
            </div>
            <UploadStep onDataParsed={handleDataParsed} />
          </div>
        )}

        {step === AppStep.REVIEW && (
          <div className="w-full animate-fade-in">
             <ReviewStep 
               questions={questions} 
               debugData={debugData}
               onConfirm={handleReviewConfirm} 
               onCancel={handleReset}
             />
          </div>
        )}

        {step === AppStep.GENERATE && (
          <div className="w-full animate-fade-in mt-10">
            <GenerateStep questions={questions} onReset={handleReset} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Exam Shuffler. All processing happens locally in your browser.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
