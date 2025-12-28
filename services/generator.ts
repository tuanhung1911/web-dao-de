import { Document, Packer, Paragraph, TextRun, AlignmentType, Indent } from 'docx';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { Question, Option } from '../types';

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const generateAndDownloadZip = async (
  originalQuestions: Question[],
  versionCount: number
) => {
  const zip = new JSZip();
  const answerKeyRows: string[][] = [];

  // Header for Answer Key CSV
  // Added 'Original_Answer' column
  const headerRow = ['Original_Q_Num', 'Original_Answer', ...Array.from({ length: versionCount }, (_, i) => `Ver_${i + 1}_Ans`)];
  answerKeyRows.push(headerRow);

  // Initialize data structure for answer key: map[originalId] -> array of answers
  const answerKeyMap: Record<string, string[]> = {};
  originalQuestions.forEach(q => {
    answerKeyMap[q.id] = new Array(versionCount).fill('');
  });

  // Generate N versions
  for (let v = 0; v < versionCount; v++) {
    const shuffledQuestions = shuffleArray(originalQuestions);
    const docChildren: Paragraph[] = [];

    // Title
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Exam Version ${v + 1}`,
            bold: true,
            size: 32,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    shuffledQuestions.forEach((q, index) => {
      // Shuffle options
      const shuffledOptions = shuffleArray(q.options);
      
      // Find the new correct answer letter
      const correctOptionIndex = shuffledOptions.findIndex(o => o.isCorrect);
      const correctLetter = correctOptionIndex !== -1 ? LETTERS[correctOptionIndex] : 'ERR';
      
      // Record in Answer Key Map
      if (answerKeyMap[q.id]) {
        answerKeyMap[q.id][v] = correctLetter;
      }

      // Add Question Text to Doc
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index + 1}. ${q.text}`,
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 300, after: 100 },
        })
      );

      // Add Options to Doc
      shuffledOptions.forEach((opt, optIndex) => {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${LETTERS[optIndex]}. ${opt.text}`,
                size: 24,
              }),
            ],
            indent: { left: 720 }, // Indent options
            spacing: { after: 50 },
          })
        );
      });
    });

    // Create Docx Blob
    const doc = new Document({
      sections: [{
        properties: {},
        children: docChildren,
      }],
    });

    const blob = await Packer.toBlob(doc);
    zip.file(`Test_Version_${String(v + 1).padStart(3, '0')}.docx`, blob);
  }

  // Compile Answer Key CSV
  // Row structure: Original Question # | Original Answer | V1 Answer | V2 Answer ...
  let csvContent = headerRow.join(',') + '\n';
  
  // Sort by original number for clarity
  const sortedOriginals = [...originalQuestions].sort((a, b) => (a.originalNumber || 0) - (b.originalNumber || 0));

  sortedOriginals.forEach(q => {
    // Determine Original Answer Letter (based on index in the UN-shuffled options list)
    const originalCorrectIndex = q.options.findIndex(o => o.isCorrect);
    const originalAnsLetter = originalCorrectIndex !== -1 ? LETTERS[originalCorrectIndex] : '?';

    const row = [
      q.originalNumber?.toString() || '?', 
      originalAnsLetter,
      ...answerKeyMap[q.id]
    ];
    csvContent += row.join(',') + '\n';
  });

  zip.file('Answer_Key.csv', csvContent);

  // Generate Zip Blob and Trigger Download
  const zipContent = await zip.generateAsync({ type: 'blob' });
  saveAs(zipContent, 'Shuffled_Exams.zip');
};