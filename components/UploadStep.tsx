import React, { useCallback, useState } from 'react';
import { parseDocx } from '../services/docParser';
import { Question, DebugData } from '../types';

interface UploadStepProps {
  onDataParsed: (questions: Question[], fileName: string, debugData: DebugData) => void;
}

export const UploadStep: React.FC<UploadStepProps> = ({ onDataParsed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.docx')) {
      setError('Please upload a valid .docx file.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await parseDocx(file);
      
      if (result.questions.length === 0) {
        setError("Không tìm thấy câu hỏi nào. Vui lòng đảm bảo định dạng đúng (Câu 1: ... A. ...).");
        setIsProcessing(false);
        return;
      }
      
      // Pass data AND debug info up
      onDataParsed(result.questions, file.name, result.debugData);

    } catch (err) {
      console.error(err);
      setError("Failed to parse the file. Ensure it is a valid Word document.");
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div 
        className={`border-4 border-dashed rounded-xl p-10 text-center transition-colors duration-200 ease-in-out cursor-pointer relative
          ${isDragging ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-primary/50'}
        `}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <input 
          type="file" 
          id="fileInput" 
          className="hidden" 
          accept=".docx" 
          onChange={onFileChange} 
        />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          
          <h3 className="text-xl font-semibold text-gray-700">
            {isProcessing ? 'Đang xử lý...' : 'Tải lên file .docx của bạn'}
          </h3>
          
          <p className="text-sm text-gray-500 max-w-sm">
            Kéo thả hoặc nhấn để chọn file. 
            <br/>
            <span className="font-medium text-orange-600">Lưu ý: Đáp án đúng phải được bôi đỏ hoặc gạch chân.</span>
          </p>

          {!isProcessing && (
            <button className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition shadow-lg">
              Chọn File
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded shadow-sm">
          <p className="font-bold">Lỗi</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};
