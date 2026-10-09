require('dotenv').config();
const { GoogleGenAI, Type } = require('@google/genai');

const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
const FALLBACK_MODELS = [
  PRIMARY_MODEL,
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
].filter((v, i, a) => a.indexOf(v) === i);

/**
 * Returns an instance of GoogleGenAI using the server's configured environment key.
 */
function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    throw new Error('GEMINI_API_KEY is not configured in backend environment.');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Generates content using the configured Gemini model, with bounded fallback
 * strictly to candidate Gemini models if a transient quota or 503 error occurs.
 */
async function callGemini(contents, config = {}) {
  const ai = getAiClient();
  let lastError = null;

  for (const model of FALLBACK_MODELS) {
    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model,
          contents,
          config: Object.keys(config).length > 0 ? config : undefined,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Model ${model} request exceeded 15000ms timeout`)), 15000)
        ),
      ]);

      return { text: response.text, modelUsed: model };
    } catch (err) {
      console.warn(`⚠️ [Gemini ${model}]: ${err.status || err.message}`);
      lastError = err;
      // If error is not a transient/model-availability error, do not retry
      if (err.status === 400 && !err.message?.includes('not found')) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Failed to generate response from Gemini API.');
}

/**
 * JSON Schema for Text-to-SQL generation
 */
const textToSqlSchema = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      description: 'Intent type: "database_query", "conversational", or "clarification_needed"',
    },
    thought: {
      type: Type.STRING,
      description: 'Step-by-step reasoning explaining intent resolution, schema entity identification, conversational context resolution (pronouns, active filters), and query structure.',
    },
    sql: {
      type: Type.STRING,
      description: 'Valid, read-only PostgreSQL SELECT query. Blank if intent is conversational or clarification_needed.',
    },
    explanation: {
      type: Type.STRING,
      description: 'Brief explanation of what data the query retrieves.',
    },
    clarification_message: {
      type: Type.STRING,
      description: 'Message to the user if clarification or greeting is needed without querying SQL.',
    },
  },
  required: ['intent', 'thought', 'sql', 'explanation'],
};

/**
 * Dynamically generates a PostgreSQL query from a user query, conversation history, and live schema.
 * @param {string} userQuery
 * @param {Array} history - Prior conversation turns [{ role, content, sql? }]
 * @param {string} schemaText - Live database schema description
 * @returns {Promise<{ intent: string, thought: string, sql: string, explanation: string, clarification_message?: string, modelUsed: string }>}
 */
async function generateSqlFromPrompt(userQuery, history = [], schemaText = '') {
  const historyText = (history || [])
    .slice(-6)
    .map((m) => {
      const role = m.role === 'user' ? 'User' : 'Assistant';
      const sqlInfo = m.sql ? `\n[Executed SQL in turn: ${m.sql}]` : '';
      return `${role}: ${m.content}${sqlInfo}`;
    })
    .join('\n\n');

  const prompt = `You are a Principal PostgreSQL Database Architect and Text-to-SQL Engine.
Your task is to analyze the user's natural language inquiry, resolve conversational context, and generate an optimal, safe, read-only PostgreSQL SELECT query.

${schemaText}

### CONVERSATION HISTORY:
${historyText || '(No previous conversation turns. This is the start of the session.)'}

### CURRENT USER INQUIRY:
"${userQuery}"

### CRITICAL RULES & GUIDELINES:
1. DIALECT: PostgreSQL 15+. Use standard PostgreSQL syntax.
2. READ-ONLY: ONLY generate "SELECT" (or safe read-only "WITH ... SELECT") statements. Never use INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, etc.
3. CONVERSATIONAL CONTEXT RESOLUTION:
   - If the user refers to previous results ("those", "them", "these", "the first one", "filter by...", "sort them", "how many are there?"), identify the previously executed SQL and apply the new condition or projection on top of the active filters!
   - Example 1: Previous query was for Agriculture schemes. User says: "Now show only those with benefit over 5000". Retain: category ILIKE '%Agriculture%' AND total_benefit_value > 5000.
   - Example 2: User says: "How many are there?". Retain previous filters and use SELECT COUNT(*).
   - Example 3: User shifts topic completely (e.g. asking for help centers after looking at schemes). Discard previous scheme filters and query service_centers!
4. STRING MATCHING:
   - Use ILIKE for case-insensitive string matching (e.g., category ILIKE '%Healthcare%', location_zone ILIKE '%North%').
5. SECURITY & SENSITIVE DATA:
   - NEVER query or select sensitive columns like "password_hash" or "token_hash".
   - Do not query system tables or admin tables (admins, admin_sessions).
6. ROW LIMITS:
   - Always include a reasonable "LIMIT" clause (e.g. LIMIT 20 or LIMIT 50) unless doing a COUNT(*) or aggregate.
7. INTENT & CONVERSATIONAL HANDLING:
   - If the user is simply greeting or bantering ("hi", "hello", "hey buddy", "who are you?", "thanks buddy!"), set intent="conversational", sql="", and provide a warm, lively, buddy-style reply in clarification_message (e.g., "Hey buddy! I'm your CivicHelper AI guide. I'm here to help you uncover welfare schemes, grants, and support programs tailored to you. What are you looking for today?").
   - If the user asks a question about civic resources, schemes, eligibility rules, service centers, notifications, or statistics, generate the appropriate SQL query.
8. RETURN PURE JSON adhering to the required schema.`;

  const { text, modelUsed } = await callGemini(prompt, {
    responseMimeType: 'application/json',
    responseJsonSchema: textToSqlSchema,
  });

  const parsed = JSON.parse(text);
  return {
    ...parsed,
    modelUsed,
  };
}

/**
 * Generates an accurate, natural conversational answer grounded strictly in the executed SQL results.
 * @param {Object} options
 * @param {string} options.userQuery
 * @param {string} options.sql
 * @param {Object} options.executionResult - { success, rows, rowCount, columns, executionTimeMs, error, isTimeout }
 * @param {string} options.language - Target language (e.g. 'English', 'Hindi')
 * @returns {Promise<string>}
 */
async function generateGroundedAnswer({ userQuery, sql, executionResult, language = 'English' }) {
  if (!executionResult.success) {
    const errorPrompt = `You are CivicHelper AI, a warm and friendly civic assistant and buddy.
Target Language: ${language}
User Query: "${userQuery}"
Attempted SQL Query: "${sql}"
Execution Error: "${executionResult.error}"
Is Timeout: ${executionResult.isTimeout}

Generate a clear, friendly, and transparent explanation in ${language} telling your buddy why the query could not be completed.
If it was a timeout, explain that the query exceeded the safe execution time limit.
If it was a syntax or schema error, explain transparently without technical jargon, and invite them to rephrase.
Do NOT fabricate results or pretend the query succeeded.`;

    const { text } = await callGemini(errorPrompt);
    return text.trim();
  }

  // Cap rows sent to prompt to prevent exceeding context window
  const sampleRows = (executionResult.rows || []).slice(0, 20);
  const totalCount = executionResult.rowCount || 0;
  const isTruncated = totalCount > sampleRows.length;

  const prompt = `You are CivicHelper AI — the friendly, energetic, and super-helpful civic buddy who helps citizens find government welfare schemes, grants, and community benefits!
Target Language: ${language}
A citizen asked you: "${userQuery}"

Executed SQL Query:
${sql}

Real Database Execution Results:
- Total matching rows found: ${totalCount}
- Columns: ${JSON.stringify(executionResult.columns || [])}
- Rows returned (sample up to 20):
${JSON.stringify(sampleRows, null, 2)}
${isTruncated ? `(Note: Results were limited to top 20 of ${totalCount} matching rows.)` : ''}

CONVERSATIONAL BUDDY PERSONA & GROUNDING INSTRUCTIONS:
1. CONVERSATIONAL & ENGAGING TONE ("BUDDY" PERSONA):
   - Talk like a warm, supportive, enthusiastic, and knowledgeable friend and buddy who genuinely cares about helping the citizen!
   - Use natural conversational phrasing, friendly greetings, and engaging transitions (e.g., "Hey buddy!", "Great news, I found some wonderful options for you!", "Here's what our records show, buddy:", "Let me break this down for you so it's super easy to understand:").
   - Add friendly closing thoughts (e.g., "If you want me to check documents or filter down to a specific zone, just holler — I've got your back, buddy!").
2. STRICT GROUNDING (ZERO FABRICATION):
   - You MUST base all factual claims, scheme names, eligibility rules, locations, and monetary values strictly on the Real Database Execution Results above.
   - Do NOT invent imaginary schemes, numbers, or rules not present in the SQL output.
3. HANDLING ZERO MATCHES:
   - If 0 matching rows were found (${totalCount} === 0), respond in a friendly, encouraging buddy way! For example:
     "Hey buddy, I checked our database thoroughly, but couldn't find any schemes matching those exact filters right now. Don't worry though! You can try broadening your search (like checking other zones or categories), or tell me a bit more about your situation and we'll find what works best for you!"
4. NUMERICAL & FACTUAL PRECISION:
   - When presenting monetary benefits, format them clearly with the ₹ symbol (e.g. ₹1,50,000, ₹6,000).
   - If an aggregation was queried (like total or average benefit), explain the calculation warmly and clearly.
5. CLEAN, READABLE STRUCTURE:
   - Use bold titles, concise bullet points, and neat spacing so it's a breeze to read on mobile or desktop.
   - For each scheme, highlight the key benefit and a quick relatable summary.`;

  const { text } = await callGemini(prompt);
  return text.trim();
}

module.exports = {
  generateSqlFromPrompt,
  generateGroundedAnswer,
  getAiClient,
  PRIMARY_MODEL,
};
