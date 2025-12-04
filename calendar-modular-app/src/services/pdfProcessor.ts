import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '../lib/supabase';

// Configure PDF.js worker - use the npm package version
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface ExtractedClass {
  course_name: string;
  course_code?: string;
  section?: string;
  instructor?: string;
  location?: string;
  days: string[];
  start_time: string;
  end_time: string;
}

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
}

/**
 * Process a PDF file and extract class schedule information using Google Gemini
 */
export async function processPDF(file: File, userId: string): Promise<ExtractedClass[]> {
  try {
    // Step 1: Extract text from PDF
    console.log('Extracting text from PDF...');
    const pdfText = await extractTextFromPDF(file);
    console.log('Extracted text length:', pdfText.length);
    
    if (!pdfText || pdfText.trim().length === 0) {
      throw new Error('Could not extract text from PDF. The PDF might be image-based or corrupted.');
    }
    
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!API_KEY) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env.local file.');
    }
    
    // Step 2: Create the prompt for class schedule extraction
    const userPrompt = `Analyze this text from a class schedule PDF and extract ALL class sections:

${pdfText}

Return a JSON array where each object has:
- course_name: Full course name
- course_code: Course code (e.g., "CS101")
- section: Section number
- instructor: Professor name
- location: Room/building
- days: Array of days ["M", "T", "W", "R", "F", "S", "U"]
- start_time: 24-hour format (e.g., "09:00")
- end_time: 24-hour format (e.g., "10:15")

Use null for missing fields. Return ONLY the JSON array, no other text.`;

    // Step 3: Call Gemini API - use gemini-pro
    console.log('Sending to Gemini API...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    // Use gemini-pro which is available in v1
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: userPrompt
            }]
          }]
        }),
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('No response from Gemini API');
    }

    console.log('Gemini response:', text);
    
    // Parse the JSON response
    let extractedClasses: ExtractedClass[];
    try {
      // Remove markdown code blocks if present
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedClasses = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      throw new Error('Failed to parse AI response. Please ensure the PDF contains a valid class schedule.');
    }

    // Validate the response
    if (!Array.isArray(extractedClasses)) {
      throw new Error('Invalid response format from AI');
    }

    // Save to database
    const classesToInsert = extractedClasses.map(classData => ({
      user_id: userId,
      course_name: classData.course_name,
      course_code: classData.course_code || null,
      section: classData.section || null,
      instructor: classData.instructor || null,
      location: classData.location || null,
      days: classData.days,
      start_time: classData.start_time,
      end_time: classData.end_time,
      is_hidden: false
    }));

    const { error } = await supabase
      .from('class_catalog')
      .insert(classesToInsert)
      .select();

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to save extracted classes to database');
    }

    return extractedClasses;
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw error;
  }
}
