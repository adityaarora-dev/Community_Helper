require('dotenv').config();
const { GoogleGenAI, Type } = require('@google/genai');

const CANDIDATE_MODELS = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-3.7-flash'];

/**
 * Parameter Extraction JSON Schema for Structured Output
 */
const demographicExtractionSchema = {
  type: Type.OBJECT,
  properties: {
    annual_income: {
      type: Type.NUMBER,
      description: 'Annual household or personal income in INR (numeric number only, e.g. 180000). Convert 1.8 Lakhs to 180000, 50k to 50000. Null if unknown.',
    },
    family_size: {
      type: Type.INTEGER,
      description: 'Number of family members. Minimum 1. Null if unspecified.',
    },
    location_zone: {
      type: Type.STRING,
      description: 'Civic zone name, e.g. "North Zone", "South Zone", "Central Zone", "East Zone", "West Zone". Null if unknown.',
    },
    age: {
      type: Type.INTEGER,
      description: 'Age of the citizen in years (0 to 120). Null if unknown.',
    },
    gender: {
      type: Type.STRING,
      description: 'Gender of the applicant: "Male", "Female", or "Other". Null if unspecified.',
    },
    occupation: {
      type: Type.STRING,
      description: 'Occupation of the citizen, e.g. "Farmer", "Street Vendor", "Student", "Daily Wage Worker". Null if unspecified.',
    },
    social_category: {
      type: Type.STRING,
      description: 'Social category if stated, e.g. "SC/ST/OBC", "General", "BPL". Null if unspecified.',
    },
    disability_status: {
      type: Type.BOOLEAN,
      description: 'True if citizen explicitly mentions having a disability or physical challenge, false otherwise.',
    },
    landholding_acres: {
      type: Type.NUMBER,
      description: 'Agricultural land owned in acres. Null if unspecified.',
    },
    summary_of_situation: {
      type: Type.STRING,
      description: 'Brief 1-sentence synopsis of the citizen context extracted from their query.',
    },
  },
};

/**
 * Conversational Extraction + Dialogue JSON Schema
 */
const conversationalFlowSchema = {
  type: Type.OBJECT,
  properties: {
    extracted_params: {
      type: Type.OBJECT,
      properties: {
        annual_income: { type: Type.NUMBER, description: 'Annual income in INR (number) or null if unknown' },
        family_size: { type: Type.INTEGER, description: 'Family members count or null' },
        location_zone: { type: Type.STRING, description: 'Zone (North/South/Central/East/West Zone) or null' },
        age: { type: Type.INTEGER, description: 'Age in years or null' },
        gender: { type: Type.STRING, description: 'Gender Male/Female/Other or null' },
        occupation: { type: Type.STRING, description: 'Occupation or null' },
        social_category: { type: Type.STRING, description: 'Social category or null' },
        disability_status: { type: Type.BOOLEAN, description: 'Disability flag true/false' },
        landholding_acres: { type: Type.NUMBER, description: 'Acres or null' },
      },
    },
    conversational_reply: {
      type: Type.STRING,
      description: 'Warm, empathetic civic assistant response in the user requested language. Acknowledge what was shared, answer any questions, and politely ask for any crucial missing eligibility data (income, zone, occupation, family size) to find exact welfare schemes.',
    },
  },
  required: ['extracted_params', 'conversational_reply'],
};

/**
 * Robust Google GenAI generator with multi-model fallback
 */
async function generateWithFallback(apiKey, prompt, schema = null) {
  const ai = new GoogleGenAI({ apiKey });
  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const config = {};
      if (schema) {
        config.responseMimeType = 'application/json';
        config.responseJsonSchema = schema;
      }

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      return response.text;
    } catch (err) {
      console.warn(`⚠️ [Gemini Model ${model}]: ${err.status || err.message}. Trying next fallback model...`);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini models exhausted.');
}

/**
 * Heuristic Extractor Fallback
 */
function heuristicExtract(text) {
  const lower = (text || '').toLowerCase();
  const result = {
    annual_income: null,
    family_size: null,
    location_zone: null,
    age: null,
    gender: null,
    occupation: null,
    social_category: null,
    disability_status: false,
    landholding_acres: null,
    summary_of_situation: 'Parsed using rule-based demographic extraction.',
  };

  // Age extraction
  const ageMatch = lower.match(/\b(\d{1,3})\s*(?:yo|years?\s*old|yrs?\s*old|साल|वर्ष)\b/) || lower.match(/\bage\s*(?:is|of)?\s*(\d{1,3})\b/);
  if (ageMatch) {
    const ageVal = parseInt(ageMatch[1], 10);
    if (ageVal >= 0 && ageVal <= 120) result.age = ageVal;
  }

  // Income extraction
  const lakhMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lakhs?|lac|l|लाख)\b/);
  const kMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:k|thousand|हजार)\b/);
  const rawNumMatch = lower.match(/(?:income|salary|earning|making|आय|कमाता)\s*(?:of|is|around)?\s*(?:₹|rs\.?|inr)?\s*(\d{4,8})\b/) || lower.match(/\b(\d{4,7})\b/);

  if (lakhMatch) {
    result.annual_income = Math.round(parseFloat(lakhMatch[1]) * 100000);
  } else if (kMatch) {
    result.annual_income = Math.round(parseFloat(kMatch[1]) * 1000);
  } else if (rawNumMatch) {
    result.annual_income = parseInt(rawNumMatch[1], 10);
  }

  // Location Zone
  if (lower.includes('north') || lower.includes('उत्तर')) result.location_zone = 'North Zone';
  else if (lower.includes('south') || lower.includes('दक्षिण')) result.location_zone = 'South Zone';
  else if (lower.includes('central') || lower.includes('मध्य')) result.location_zone = 'Central Zone';
  else if (lower.includes('east') || lower.includes('पूर्व')) result.location_zone = 'East Zone';
  else if (lower.includes('west') || lower.includes('पश्चिम')) result.location_zone = 'West Zone';

  // Occupation
  if (lower.includes('farmer') || lower.includes('farming') || lower.includes('kisan') || lower.includes('किसान') || lower.includes('kheti')) {
    result.occupation = 'Farmer';
  } else if (lower.includes('street vendor') || lower.includes('vendor') || lower.includes('hawker') || lower.includes('ठेला') || lower.includes('विक्रेता') || lower.includes('thela')) {
    result.occupation = 'Street Vendor';
  } else if (lower.includes('student') || lower.includes('college') || lower.includes('studying') || lower.includes('छात्र') || lower.includes('विद्यार्थी') || lower.includes('vidyarthi')) {
    result.occupation = 'Student';
  } else if (lower.includes('daily wage') || lower.includes('labor') || lower.includes('labourer') || lower.includes('मजदूर') || lower.includes('mazdoor')) {
    result.occupation = 'Daily Wage Worker';
  }

  // Gender
  if (lower.includes('female') || lower.includes('woman') || lower.includes('mahila') || lower.includes('girl')) {
    result.gender = 'Female';
  } else if (lower.includes('male') || lower.includes('man') || lower.includes('purush') || lower.includes('boy')) {
    result.gender = 'Male';
  }

  // Family size
  const familyMatch = lower.match(/family\s*(?:of|size)?\s*(\d+)/) || lower.match(/(\d+)\s*(?:family\s*members?|members?|parivar)/);
  if (familyMatch) {
    result.family_size = parseInt(familyMatch[1], 10);
  }

  // Disability
  if (lower.includes('disab') || lower.includes('handicap') || lower.includes('pwd') || lower.includes('divyang')) {
    result.disability_status = true;
  }

  // Social Category
  if (lower.includes('sc/st') || lower.includes('sc') || lower.includes('st') || lower.includes('obc')) {
    result.social_category = 'SC/ST/OBC';
  } else if (lower.includes('bpl') || lower.includes('below poverty line')) {
    result.social_category = 'BPL';
  }

  // Landholding
  const landMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:acres?|bigha|hectares?)/);
  if (landMatch) {
    result.landholding_acres = parseFloat(landMatch[1]);
  }

  return result;
}

/**
 * Clean and sanitize extracted values from LLM
 */
function sanitizeExtracted(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const clean = {};

  if (raw.annual_income !== null && raw.annual_income !== undefined && !isNaN(raw.annual_income) && raw.annual_income !== 'unknown') {
    clean.annual_income = Number(raw.annual_income);
  }
  if (raw.age !== null && raw.age !== undefined && !isNaN(raw.age) && raw.age !== 'unknown') {
    clean.age = parseInt(raw.age, 10);
  }
  if (raw.family_size !== null && raw.family_size !== undefined && !isNaN(raw.family_size) && raw.family_size !== 'unknown') {
    clean.family_size = parseInt(raw.family_size, 10);
  }
  if (raw.landholding_acres !== null && raw.landholding_acres !== undefined && !isNaN(raw.landholding_acres) && raw.landholding_acres !== 'unknown') {
    clean.landholding_acres = Number(raw.landholding_acres);
  }
  if (raw.disability_status !== undefined) {
    clean.disability_status = Boolean(raw.disability_status);
  }

  ['location_zone', 'gender', 'occupation', 'social_category'].forEach((k) => {
    if (raw[k] && typeof raw[k] === 'string' && raw[k].toLowerCase() !== 'unknown' && raw[k].toLowerCase() !== 'null') {
      clean[k] = raw[k].trim();
    }
  });

  return clean;
}

/**
 * Conversational Turn Processor with Multilingual Support
 * Powers the interactive conversational flow in English, Hindi, Bengali, Marathi, Telugu, Tamil, etc.
 */
async function processConversationalTurn(userQuery, history = [], existingDemographics = {}, language = 'English') {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const heuristic = heuristicExtract(userQuery);
    return {
      extractedParams: heuristic,
      conversationalReply: 'I have analyzed your situation using our civic parameters rule engine. Check the matched welfare schemes below or update your details in the Demographic Intake tab.',
    };
  }

  try {
    const contextPrompt = `You are the Intelligent Civic Eligibility Assistant.
Your mission is to help citizens identify and apply for government welfare schemes (such as agricultural subsidies, food security, pensions, healthcare, and education support).

TARGET CONVERSATION LANGUAGE: ${language}
NOTE: You MUST formulate the "conversational_reply" in ${language} (fluent, empathetic, professional civic advisor tone).
If language is Hindi, use polite Hindi (e.g. "नमस्ते...").
However, inside "extracted_params", all keys and values must remain standard English (e.g. occupation: "Farmer", numbers as pure digits).

Current Known Citizen Demographics:
${JSON.stringify(existingDemographics, null, 2)}

Recent Conversation History:
${(history || [])
  .slice(-4)
  .map((m) => `${m.role === 'user' ? 'Citizen' : 'Assistant'}: ${m.content}`)
  .join('\n')}

Latest Citizen Message:
"${userQuery}"

Task:
1. Extract any demographic variables stated or updated in this turn into "extracted_params".
   If not mentioned in this turn, keep as null.
   Convert colloquial expressions ("50k", "2 Lakhs", "दो लाख") to pure numeric integers.
2. In "conversational_reply" (IN ${language}):
   - Acknowledge their situation warmly in ${language}.
   - If key demographic parameters are still unknown (especially Annual Income, Location Zone, Occupation, or Family Size), politely ask for them so the relational database can match specific programs.
   - Keep the reply concise (2-3 sentences), helpful, and direct.`;

    const text = await generateWithFallback(apiKey, contextPrompt, conversationalFlowSchema);
    const parsed = JSON.parse(text);

    return {
      extractedParams: sanitizeExtracted(parsed.extracted_params),
      conversationalReply: parsed.conversational_reply || 'Thank you for providing your information. Here are the eligible schemes matched for you.',
    };
  } catch (error) {
    console.warn('⚠️ [Conversational Turn Error] Gemini failed, falling back to heuristic:', error.message);
    const fallback = heuristicExtract(userQuery);
    return {
      extractedParams: fallback,
      conversationalReply: 'I have reviewed your inquiry and matched relevant government programs from our database. You can refine your details anytime in the Demographic Intake panel.',
    };
  }
}

/**
 * Extract Demographics (1-shot)
 */
async function extractDemographics(userQuery) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return heuristicExtract(userQuery);
  }

  try {
    const prompt = `You are an expert demographic parameter extraction agent for government welfare scheme matching.
Extract all citizen demographic variables from the user message into the exact requested JSON schema.
If a parameter is not mentioned, use null.
Convert colloquial financial terms (e.g. "50k", "1.5 Lakhs") to pure numeric integers (e.g. 50000, 150000).

Citizen Query:
"${userQuery}"`;

    const text = await generateWithFallback(apiKey, prompt, demographicExtractionSchema);
    const parsed = JSON.parse(text);
    return sanitizeExtracted(parsed);
  } catch (error) {
    console.warn('⚠️ [LLM Service Error] Gemini extraction failed, falling back to heuristic:', error.message);
    return heuristicExtract(userQuery);
  }
}

/**
 * Generate Grounded Summary of Matched Schemes with Multilingual Support
 */
async function generateMatchSummary(userQuery, extractedParams, matchedSchemes, language = 'English') {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || matchedSchemes.length === 0) {
    if (matchedSchemes.length === 0) {
      return language === 'Hindi'
        ? 'आपके मापदंडों के अनुसार कोई सरकारी योजना नहीं मिली। कृपया अपने विवरण अपडेट करें या निकटतम सेवा केंद्र पर जाएँ।'
        : 'Based on your criteria, no exact matching government schemes were found. Consider checking broader eligibility rules or visiting your nearest facilitation center.';
    }
    const names = matchedSchemes.map((s) => s.scheme_name).join(', ');
    return `You qualify for ${matchedSchemes.length} welfare scheme(s): ${names}. Review the required documents and benefits below.`;
  }

  try {
    const prompt = `You are an empathetic, professional civic advisor.
TARGET LANGUAGE: ${language}
A citizen asked: "${userQuery}"
Extracted Demographics: ${JSON.stringify(extractedParams)}
Matching Schemes Found in Relational Database:
${matchedSchemes.map((s) => `- ${s.scheme_name} (${s.category}): Benefit value ₹${Number(s.total_benefit_value).toLocaleString('en-IN')}`).join('\n')}

Provide a concise, encouraging 2-3 sentence summary IN ${language} explaining why these schemes match their profile and advising them on the next step.`;

    const text = await generateWithFallback(apiKey, prompt);
    return text.trim();
  } catch (error) {
    const names = matchedSchemes.map((s) => s.scheme_name).join(', ');
    return `You qualify for ${matchedSchemes.length} welfare scheme(s): ${names}. Please review the documents and benefits below.`;
  }
}

module.exports = {
  extractDemographics,
  generateMatchSummary,
  processConversationalTurn,
};
