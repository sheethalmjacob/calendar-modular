import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

async function listModels() {
  try {
    console.log('Testing Gemini API...');
    console.log('API Key (first 10 chars):', process.env.VITE_GEMINI_API_KEY?.substring(0, 10));
    
    // Try to list available models
    const models = await genAI.listModels();
    console.log('\nAvailable models:');
    for await (const model of models) {
      console.log('- ', model.name);
      console.log('  Supported methods:', model.supportedGenerationMethods);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listModels();
