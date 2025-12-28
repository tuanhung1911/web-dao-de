import React, { useState } from 'react';
import { generateAndDownloadZip } from '../services/generator';
import { Question } from '../types';

interface GenerateStepProps {
  questions: Question[];
  onReset: () => void;
}

export const GenerateStep: React.FC<GenerateStepProps> = ({ questions, onReset }) => {
  const [versionCount, setVersionCount] = useState<number>(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Small timeout to allow UI to update to "Generating..." state before heavy sync work blocks thread
    setTimeout(async () => {
      try {
        await generateAndDownloadZip(questions, versionCount);
        setIsDone(true);
      } catch (e) {
        console.error(e);
        alert("An error occurred during generation.");
      } finally {
        setIsGenerating(false);
      }
    }, 100);
  };

  if (isDone) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow-lg max-w-lg mx-auto text-center animate-fade-in">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Success!</h2>
        <p className="text-gray-600 mb-8">
          Your zip file containing {versionCount} unique shuffled tests and the answer key has been generated and downloaded.
        </p>
        <button 
          onClick={onReset}
          className="text-primary hover:text-blue-800 font-medium underline"
        >
          Start Over with New File
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-primary p-6 text-white text-center">
        <h2 className="text-2xl font-bold">Configure Generation</h2>
        <p className="opacity-90 text-sm mt-1">Ready to shuffle {questions.length} questions</p>
      </div>
      
      <div className="p-8">
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Number of Versions to Generate
        </label>
        <div className="flex items-center gap-4 mb-8">
          <input
            type="range"
            min="1"
            max="20"
            value={versionCount}
            onChange={(e) => setVersionCount(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <input
            type="number"
            min="1"
            max="50"
            value={versionCount}
            onChange={(e) => setVersionCount(Number(e.target.value))}
            className="w-20 p-2 border border-gray-300 rounded text-center font-bold text-lg focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`w-full py-4 px-6 rounded-lg text-white font-bold text-lg shadow-md transition-all transform
            ${isGenerating 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-1 active:scale-95'
            }
          `}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
          ) : (
            `Generate ${versionCount} Versions`
          )}
        </button>
        
        <div className="mt-6 text-center">
             <button onClick={onReset} className="text-sm text-gray-500 hover:text-gray-700 underline">
                 Back to start
             </button>
        </div>
      </div>
    </div>
  );
};
