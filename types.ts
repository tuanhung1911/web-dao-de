export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
  originalLabel?: string; // e.g., "A", "B"
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
  originalNumber?: number;
  hasDetectedAnswer: boolean;
}

export enum AppStep {
  UPLOAD = 'UPLOAD',
  REVIEW = 'REVIEW',
  GENERATE = 'GENERATE',
  FINISHED = 'FINISHED'
}

export interface DebugData {
  rawHtml: string;
  documentXml: string; // New field for raw Word XML
  detectedColors: string[];
  logs: string[];
}

export interface ParsedData {
  questions: Question[];
  fileName: string;
  debugData?: DebugData;
}
