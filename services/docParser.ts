import mammoth from 'mammoth';
import JSZip from 'jszip';
import { Question, DebugData } from '../types';

// Unique marker that won't appear in normal text
const MARKER = "[[CORRECT_ANS]]";

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Checks if a hex color is "Red-ish".
 */
const isRedish = (hex: string | null | undefined): boolean => {
  if (!hex || hex.length < 6) return false;
  
  // Clean hex
  hex = hex.replace('#', '');
  if (hex.toLowerCase() === 'auto') return false;
  if (hex.toLowerCase() === '000000') return false;
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Logic: Red component is dominant and strong
  return r > 150 && g < r * 0.7 && b < r * 0.7;
};

/**
 * PRE-PROCESSOR:
 * Injects MARKER into the raw XML text content if styling matches.
 */
const preprocessDocx = async (file: File): Promise<{ arrayBuffer: ArrayBuffer, logs: string[], modifiedXml: string }> => {
    const logs: string[] = [];
    const log = (m: string) => logs.push(m);
    
    try {
        const zip = new JSZip();
        await zip.loadAsync(file);
        
        const docXmlPath = "word/document.xml";
        let docXml = await zip.file(docXmlPath)?.async("string");
        
        if (!docXml) {
            log("Error: Could not find word/document.xml");
            return { arrayBuffer: await file.arrayBuffer(), logs, modifiedXml: "" };
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(docXml, "application/xml");
        
        const runs = doc.getElementsByTagName("w:r");
        let modifiedCount = 0;

        for (let i = 0; i < runs.length; i++) {
            const run = runs[i];
            const rPr = run.getElementsByTagName("w:rPr")[0];
            
            if (rPr) {
                let isCorrect = false;
                
                // 1. Check for Color
                const colorEl = rPr.getElementsByTagName("w:color")[0];
                if (colorEl && isRedish(colorEl.getAttribute("w:val"))) {
                    isCorrect = true;
                }
                
                // 2. Check for Underline
                const uEl = rPr.getElementsByTagName("w:u")[0];
                if (uEl) {
                    const val = uEl.getAttribute("w:val");
                    if (val && val !== 'none' && val !== 'false') {
                        isCorrect = true;
                    }
                }

                if (isCorrect) {
                    const tEls = run.getElementsByTagName("w:t");
                    for (let k = 0; k < tEls.length; k++) {
                        const tEl = tEls[k];
                        if (tEl.textContent) {
                            // Prepend marker WITH A SPACE. 
                            // This space acts as a boundary for the Regex to recognize the start of a new token
                            // preventing the marker from being attached to the previous word if there is no spacing in the XML.
                            const originalText = tEl.textContent;
                            tEl.textContent = ` ${MARKER}${originalText}`;
                            modifiedCount++;
                        }
                    }
                }
            }
        }

        log(`Pre-processor: Injected marker into ${modifiedCount} text runs.`);

        const serializer = new XMLSerializer();
        const newDocXml = serializer.serializeToString(doc);
        
        zip.file(docXmlPath, newDocXml);
        const newBuffer = await zip.generateAsync({ type: "arraybuffer" });
        return { arrayBuffer: newBuffer, logs, modifiedXml: newDocXml };

    } catch (e) {
        log(`Pre-processing failed: ${e}`);
        return { arrayBuffer: await file.arrayBuffer(), logs, modifiedXml: "Error during processing" };
    }
};

export interface ParseResult {
  questions: Question[];
  debugData: DebugData;
}

export const parseDocx = async (file: File): Promise<ParseResult> => {
  const { arrayBuffer, logs, modifiedXml } = await preprocessDocx(file);
  const log = (msg: string) => logs.push(msg);

  return new Promise((resolve, reject) => {
      // Standard conversion
      mammoth.convertToHtml({ arrayBuffer }, { includeDefaultStyleMap: true })
        .then(result => {
            const html = result.value;
            log(`HTML Generated Length: ${html.length}`);
            
            const questions = parseHtmlToQuestions(html, log);
            log(`Parsed ${questions.length} questions.`);

            extractStylesFromDocx(file).then(({ colors }) => {
                resolve({
                    questions,
                    debugData: {
                      rawHtml: html,
                      documentXml: modifiedXml,
                      detectedColors: colors,
                      logs
                    }
                });
            });
        })
        .catch(err => {
            log(`Mammoth Error: ${err}`);
            reject(err);
        });
  });
};

const extractStylesFromDocx = async (file: File): Promise<{ colors: string[] }> => {
  try {
    const zip = new JSZip();
    await zip.loadAsync(file);
    const docXml = await zip.file("word/document.xml")?.async("string");
    const colors = new Set<string>();
    const colorRegex = /w:val=["']([0-9A-Fa-f]{6})["']/g;
    let match;
    if (docXml) {
        while ((match = colorRegex.exec(docXml)) !== null) {
            colors.add(match[1]);
        }
    }
    return { colors: Array.from(colors) };
  } catch (e) {
    return { colors: [] };
  }
};

const parseHtmlToQuestions = (html: string, log: (m:string)=>void): Question[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const elements = Array.from(doc.body.children);

  const questions: Question[] = [];
  let currentQuestion: Question | null = null;
  let questionCounter = 1;

  // Regex to detect Question start (e.g., "Câu 1:")
  const questionStartRegex = /^(?:Câu|Question|Bài|Số)?\s*(\d+)[\.:\)]\s+(.+)/i;
  
  // FIXED REGEX (GREEDY MARKER CONSUMPTION):
  // We look for the pattern: [Start or Space] + [Greedy Group of Markers, Spaces, or Dots] + [Letter] + [Dot/Paren]
  // This ensures that if we have "...Answer A.[[CORRECT]]. [[CORRECT]] B...", the regex consumes the markers
  // into the start of B, preventing A from claiming them.
  // The pre-processor now guarantees a space exists before MARKER, ensuring this regex triggers correctly.
  const optionLabelRegex = /(?:^|[\s\u00A0])((?:\[\[CORRECT_ANS\]\]|[\s\u00A0\.])*[A-D][\.:\)])/g;

  elements.forEach((el) => {
    const rawText = el.textContent?.trim() || "";
    if (!rawText) return;

    // Remove markers for the Question Title check to ensure clean matching
    const cleanTextForTitle = rawText.split(MARKER).join('');
    const questionMatch = cleanTextForTitle.match(questionStartRegex);

    if (questionMatch) {
      const originalNum = parseInt(questionMatch[1], 10);
      const qText = questionMatch[2];
      
      currentQuestion = {
        id: generateId(),
        text: qText,
        options: [],
        originalNumber: originalNum || questionCounter++,
        hasDetectedAnswer: false
      };
      questions.push(currentQuestion);
      return; 
    }

    if (currentQuestion) {
      const matches = [...rawText.matchAll(optionLabelRegex)];

      if (matches.length > 0) {
        matches.forEach((match, index) => {
          // match[1] is the Label Group (e.g. "[[CORRECT_ANS]]. [[CORRECT_ANS]] B.")
          
          // Calculate start of this segment. 
          // Note: match.index is the start of the whole match including the leading space/boundary.
          // match[0].indexOf(match[1]) finds where the label group starts.
          const matchIndex = match.index! + match[0].indexOf(match[1]);
          
          const nextMatch = matches[index + 1];
          let endIndex = rawText.length;
          
          if (nextMatch) {
             endIndex = nextMatch.index! + nextMatch[0].indexOf(nextMatch[1]);
          }
          
          const segment = rawText.substring(matchIndex, endIndex);
          
          // CHECK CORRECTNESS:
          // Does the raw segment (which includes the label prefix with potential markers) contain the marker?
          const isSegmentCorrect = segment.includes(MARKER);
          
          // CLEANUP:
          // 1. Remove ALL instances of the marker (Global removal) to fix garbage text.
          let cleanSegment = segment.split(MARKER).join('').trim();
          
          // 2. Remove the "A." prefix from the cleaned text.
          // We use a regex that looks for the letter and separator, allowing preceding dots/spaces.
          cleanSegment = cleanSegment.replace(/^[\s\.]*([A-D][\.:\)])\s*/, '');

          // Extract Label Char (A, B, C...) from the dirty match string
          // We assume the last capital letter in the capture group is the label.
          const labelMatch = match[1].split(MARKER).join('').match(/([A-D])[\.:\)]/);
          const labelChar = labelMatch ? labelMatch[1] : '?';

          if (isSegmentCorrect) {
            currentQuestion!.hasDetectedAnswer = true;
          }

          currentQuestion!.options.push({
            id: generateId(),
            text: cleanSegment,
            isCorrect: isSegmentCorrect,
            originalLabel: labelChar
          });
        });

      } else {
        // No labels found, append to previous option
        const isLineCorrect = rawText.includes(MARKER);
        // Clean globally
        const cleanLine = rawText.split(MARKER).join('').trim();

        if (currentQuestion.options.length === 0) {
           currentQuestion.text += ` ${cleanLine}`;
        } else {
           const lastOption = currentQuestion.options[currentQuestion.options.length - 1];
           lastOption.text += ` ${cleanLine}`;
           
           if (isLineCorrect) {
             lastOption.isCorrect = true;
             currentQuestion.hasDetectedAnswer = true;
           }
        }
      }
    }
  });

  return questions;
};
