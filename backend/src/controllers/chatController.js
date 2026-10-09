const { query } = require('../config/db');
const { processConversationalTurn, generateMatchSummary, extractDemographics } = require('../services/llmService');

/**
 * POST /api/chat
 * Handles multi-turn conversational inquiries or manual structured demographic inputs,
 * extracts parameters via Gemini LLM, deterministically filters PostgreSQL schemes,
 * logs interaction with user_id, and returns conversational guidance + matched programs.
 */
async function handleChat(req, res) {
  try {
    const { query: rawQuery, history = [], demographics: manualDemographics = {}, userId, language = 'English' } = req.body;

    if (!rawQuery && (!manualDemographics || Object.keys(manualDemographics).length === 0)) {
      return res.status(400).json({
        status: 'error',
        message: 'Either "query" (conversational text) or "demographics" object must be provided.',
      });
    }

    const effectiveQuery = rawQuery || 'Manual demographic filter execution';
    let conversationalReply = '';
    let extractedParams = { ...manualDemographics };

    // Step 1: LLM Processing if natural language query provided
    if (rawQuery) {
      const turnResult = await processConversationalTurn(rawQuery, history, manualDemographics, language);
      conversationalReply = turnResult.conversationalReply;

      // Merge newly extracted parameters on top of existing known demographics
      extractedParams = {
        ...manualDemographics,
        ...turnResult.extractedParams,
      };
    } else {
      conversationalReply = 'Demographic parameters applied directly to relational matching engine.';
    }

    // Sanitize values for SQL parameters
    const income = extractedParams.annual_income !== undefined && extractedParams.annual_income !== null
      ? Number(extractedParams.annual_income)
      : null;
    const age = extractedParams.age !== undefined && extractedParams.age !== null
      ? parseInt(extractedParams.age, 10)
      : null;
    const gender = extractedParams.gender || null;
    const familySize = extractedParams.family_size !== undefined && extractedParams.family_size !== null
      ? parseInt(extractedParams.family_size, 10)
      : null;
    const occupation = extractedParams.occupation || null;
    const socialCategory = extractedParams.social_category || null;
    const hasDisability = Boolean(extractedParams.disability_status);
    const landholding = extractedParams.landholding_acres !== undefined && extractedParams.landholding_acres !== null
      ? Number(extractedParams.landholding_acres)
      : null;
    const zone = extractedParams.location_zone || null;
    const category = extractedParams.category || null;

    // Step 2: Deterministic Relational SQL Filtering
    // Strictly parameterized to prevent SQL Injection
    const sql = `
      SELECT 
        s.scheme_id,
        s.scheme_name,
        s.description,
        s.category,
        s.total_benefit_value,
        s.required_documents,
        s.official_url,
        r.rule_id,
        r.max_income,
        r.min_age,
        r.max_age,
        r.target_gender,
        r.min_family_size,
        r.target_occupation,
        r.target_social_category,
        r.requires_disability,
        r.max_landholding
      FROM govt_schemes s
      JOIN eligibility_rules r ON s.scheme_id = r.scheme_id
      WHERE 
        ($1::numeric IS NULL OR r.max_income IS NULL OR $1::numeric <= r.max_income)
        AND ($2::int IS NULL OR ($2::int >= r.min_age AND $2::int <= r.max_age))
        AND ($3::varchar IS NULL OR r.target_gender IS NULL OR r.target_gender = $3::varchar)
        AND ($4::int IS NULL OR $4::int >= r.min_family_size)
        AND ($5::varchar IS NULL OR r.target_occupation IS NULL OR r.target_occupation ILIKE $5::varchar)
        AND ($6::varchar IS NULL OR r.target_social_category IS NULL OR r.target_social_category ILIKE $6::varchar)
        AND (r.requires_disability = FALSE OR $7::boolean = TRUE)
        AND ($8::numeric IS NULL OR r.max_landholding IS NULL OR $8::numeric <= r.max_landholding)
        AND ($9::varchar IS NULL OR s.category ILIKE '%' || $9::varchar || '%' OR $9::varchar ILIKE '%' || s.category || '%')
      ORDER BY s.total_benefit_value DESC;
    `;

    const sqlParams = [
      income,          // $1
      age,             // $2
      gender,          // $3
      familySize,      // $4
      occupation,      // $5
      socialCategory,  // $6
      hasDisability,   // $7
      landholding,     // $8
      category,        // $9
    ];


    const schemesResult = await query(sql, sqlParams);
    const matchedSchemes = schemesResult.rows;
    const matchedSchemeIds = matchedSchemes.map((s) => s.scheme_id);

    // Step 3: Fetch Service Centers (Filtered by zone if specified)
    let serviceCentersSql = `SELECT * FROM service_centers`;
    const serviceCenterParams = [];

    if (zone) {
      serviceCentersSql += ` WHERE location_zone ILIKE $1`;
      serviceCenterParams.push(`%${zone}%`);
    }
    serviceCentersSql += ` ORDER BY name ASC LIMIT 5;`;

    const centersResult = await query(serviceCentersSql, serviceCenterParams);
    const serviceCenters = centersResult.rows;

    // Step 4: Log to user_interactions Table (Linked with user_id when available)
    let interactionId = null;
    try {
      const logSql = `
        INSERT INTO user_interactions (user_id, raw_query, extracted_payload, matched_scheme_ids)
        VALUES ($1, $2, $3::jsonb, $4::uuid[])
        RETURNING interaction_id;
      `;
      const logRes = await query(logSql, [
        userId || null,
        effectiveQuery,
        JSON.stringify(extractedParams),
        matchedSchemeIds,
      ]);
      interactionId = logRes.rows[0]?.interaction_id;
    } catch (logErr) {
      console.warn('⚠️ [Interaction Log Warning] Could not record interaction:', logErr.message);
    }

    // Step 5: Grounded Summary from LLM
    let summary = '';
    if (matchedSchemes.length > 0) {
      summary = await generateMatchSummary(effectiveQuery, extractedParams, matchedSchemes, language);
    } else {
      summary = language === 'Hindi'
        ? 'आपके मापदंडों के अनुसार कोई प्रत्यक्ष योजना नहीं मिली। कृपया अपने विवरण अपडेट करें या नजदीकी सेवा केंद्र से संपर्क करें।'
        : 'No exact scheme matches found for these specific criteria. Try adjusting your income or zone settings, or check our Service Centers for personalized civic assistance.';
    }

    return res.status(200).json({
      status: 'success',
      interaction_id: interactionId,
      conversational_reply: conversationalReply,
      summary,
      extracted_params: extractedParams,
      matched_count: matchedSchemes.length,
      schemes: matchedSchemes,
      service_centers: serviceCenters,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [Chat Controller Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process inquiry and match schemes.',
      error: error.message,
    });
  }
}

module.exports = {
  handleChat,
};
