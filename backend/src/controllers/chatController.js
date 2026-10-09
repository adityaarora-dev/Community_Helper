const { query } = require('../config/db');
const { getSchemaContext } = require('../services/schemaService');
const { generateSqlFromPrompt, generateGroundedAnswer } = require('../services/textToSqlService');
const { validateSql } = require('../services/sqlValidator');
const { executeSafeQuery } = require('../services/sqlExecutor');

/**
 * POST /api/chat
 * Zero-fallback AI-powered Text-to-SQL conversational handler.
 *
 * Pipeline:
 * User Prompt -> Intent & Context Analysis -> Schema Retrieval ->
 * SQL Generation -> Independent SQL Validation -> Safe DB Execution ->
 * Result Interpretation -> Contextual Grounded AI Response
 */
async function handleChat(req, res) {
  try {
    const {
      query: rawQuery,
      history = [],
      demographics: manualDemographics = {},
      userId,
      language = 'English',
    } = req.body;

    // Reject empty payload
    if (!rawQuery && (!manualDemographics || Object.keys(manualDemographics).length === 0)) {
      return res.status(400).json({
        status: 'error',
        message: 'Either "query" (conversational text) or "demographics" object must be provided.',
      });
    }

    // CASE 1: Natural Language Query (Real AI Text-to-SQL Pipeline)
    if (rawQuery && rawQuery.trim()) {
      const userText = rawQuery.trim();

      // Step 1: Discover & Retrieve Live Schema
      let schemaContext;
      try {
        schemaContext = await getSchemaContext();
      } catch (schemaErr) {
        console.error('❌ [Schema Retrieval Error]:', schemaErr);
        return res.status(500).json({
          status: 'error',
          error_type: 'SCHEMA_DISCOVERY_ERROR',
          message: `Failed to inspect database schema: ${schemaErr.message}`,
        });
      }

      // Step 2: AI Intent & Context Analysis + SQL Generation
      let genResult;
      try {
        genResult = await generateSqlFromPrompt(userText, history, schemaContext.schemaText);
      } catch (aiErr) {
        console.error('❌ [AI Service Error - SQL Generation]:', aiErr);
        return res.status(502).json({
          status: 'error',
          error_type: 'AI_PROVIDER_ERROR',
          message: `AI service failed during SQL generation: ${aiErr.message || 'Provider unreachable or quota exceeded.'}`,
        });
      }

      // Handle conversational / greeting / clarification intents without SQL
      if (
        genResult.intent === 'conversational' ||
        genResult.intent === 'clarification_needed' ||
        !genResult.sql ||
        !genResult.sql.trim()
      ) {
        const reply = genResult.clarification_message || genResult.explanation || 'How may I assist you with government schemes or civic resources today?';
        return res.status(200).json({
          status: 'success',
          intent: genResult.intent,
          conversational_reply: reply,
          thought: genResult.thought,
          sql: null,
          rows: [],
          row_count: 0,
          columns: [],
          execution_time_ms: 0,
          timestamp: new Date().toISOString(),
        });
      }

      // Step 3: Independent SQL Validation & Security Layer
      const valResult = validateSql(genResult.sql);
      if (!valResult.isValid) {
        console.warn('⚠️ [SQL Validation Rejected Query]:', genResult.sql, valResult.error);
        return res.status(422).json({
          status: 'error',
          error_type: 'SQL_VALIDATION_ERROR',
          message: `Generated SQL rejected by security validator: ${valResult.error}`,
          attempted_sql: genResult.sql,
          thought: genResult.thought,
          conversational_reply: `I generated a query for your request, but it could not be executed safely: ${valResult.error}`,
          timestamp: new Date().toISOString(),
        });
      }

      const validatedSql = valResult.sanitizedSql;

      // Step 4: Real Database Execution with Timeout & Isolation
      const execResult = await executeSafeQuery(validatedSql);

      if (!execResult.success) {
        console.error('❌ [Database Execution Failed]:', execResult.error);
        return res.status(500).json({
          status: 'error',
          error_type: execResult.isTimeout ? 'QUERY_EXECUTION_TIMEOUT' : 'DATABASE_EXECUTION_ERROR',
          message: execResult.error,
          sql: validatedSql,
          thought: genResult.thought,
          execution_time_ms: execResult.executionTimeMs,
          conversational_reply: execResult.isTimeout
            ? 'The database query exceeded the maximum allowed execution time (5000ms) and was canceled.'
            : `Database execution error: ${execResult.error}`,
          timestamp: new Date().toISOString(),
        });
      }

      // Step 5: Grounded Conversational Answer Generation
      let conversationalReply = '';
      try {
        conversationalReply = await generateGroundedAnswer({
          userQuery: userText,
          sql: validatedSql,
          executionResult: execResult,
          language,
        });
      } catch (answerErr) {
        console.error('❌ [AI Service Error - Grounded Interpretation]:', answerErr);
        // If interpretation fails, report accurate database summary without inventing facts
        conversationalReply = `Query executed successfully (${execResult.rowCount} rows returned in ${execResult.executionTimeMs}ms). (Note: AI summary service encountered an issue: ${answerErr.message})`;
      }

      // Step 6: Map results to schemes or service centers if relevant for UI cards
      const matchedSchemes = [];
      const matchedServiceCenters = [];
      if (Array.isArray(execResult.rows)) {
        for (const row of execResult.rows) {
          if (row.scheme_name || (row.scheme_id && row.category)) {
            matchedSchemes.push(row);
          } else if (row.center_id || (row.address && row.location_zone)) {
            matchedServiceCenters.push(row);
          }
        }
      }

      // Step 7: Log interaction to database
      let interactionId = null;
      try {
        const logSql = `
          INSERT INTO user_interactions (user_id, raw_query, extracted_payload, matched_scheme_ids)
          VALUES ($1, $2, $3::jsonb, $4::uuid[])
          RETURNING interaction_id;
        `;
        const schemeIds = matchedSchemes
          .map((s) => s.scheme_id)
          .filter(Boolean);

        const logRes = await query(logSql, [
          userId || null,
          userText,
          JSON.stringify({
            sql: validatedSql,
            thought: genResult.thought,
            rowCount: execResult.rowCount,
            executionTimeMs: execResult.executionTimeMs,
          }),
          schemeIds,
        ]);
        interactionId = logRes.rows[0]?.interaction_id;
      } catch (logErr) {
        console.warn('⚠️ [Interaction Logging Warning]:', logErr.message);
      }

      // Return comprehensive response
      return res.status(200).json({
        status: 'success',
        interaction_id: interactionId,
        conversational_reply: conversationalReply,
        sql: validatedSql,
        thought: genResult.thought,
        explanation: genResult.explanation,
        rows: execResult.rows,
        row_count: execResult.rowCount,
        columns: execResult.columns,
        execution_time_ms: execResult.executionTimeMs,
        schemes: matchedSchemes,
        service_centers: matchedServiceCenters,
        timestamp: new Date().toISOString(),
      });
    }

    // CASE 2: Structured Demographic Filter Direct Execution (No natural language text)
    // Preserves backwards compatibility for the manual demographic intake filter form
    const income = manualDemographics.annual_income != null ? Number(manualDemographics.annual_income) : null;
    const age = manualDemographics.age != null ? parseInt(manualDemographics.age, 10) : null;
    const gender = manualDemographics.gender || null;
    const familySize = manualDemographics.family_size != null ? parseInt(manualDemographics.family_size, 10) : null;
    const occupation = manualDemographics.occupation || null;
    const socialCategory = manualDemographics.social_category || null;
    const hasDisability = Boolean(manualDemographics.disability_status);
    const landholding = manualDemographics.landholding_acres != null ? Number(manualDemographics.landholding_acres) : null;
    const category = manualDemographics.category || null;

    const manualSql = `
      SELECT 
        s.scheme_id,
        s.scheme_name,
        s.description,
        s.category,
        s.total_benefit_value,
        s.required_documents,
        s.official_url
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
      ORDER BY s.total_benefit_value DESC
      LIMIT 50;
    `;

    const manualParams = [
      income,
      age,
      gender,
      familySize,
      occupation,
      socialCategory,
      hasDisability,
      landholding,
      category,
    ];

    const manualResult = await query(manualSql, manualParams);
    const matchedSchemes = manualResult.rows;

    return res.status(200).json({
      status: 'success',
      conversational_reply: `Matched ${matchedSchemes.length} scheme(s) based on your structured demographic parameters.`,
      sql: manualSql.trim(),
      rows: matchedSchemes,
      row_count: matchedSchemes.length,
      columns: Object.keys(matchedSchemes[0] || {}),
      execution_time_ms: 0,
      schemes: matchedSchemes,
      service_centers: [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [Chat Controller Uncaught Error]:', error);
    return res.status(500).json({
      status: 'error',
      error_type: 'SERVER_ERROR',
      message: 'Failed to process inquiry and generate Text-to-SQL response.',
      error: error.message,
    });
  }
}

module.exports = {
  handleChat,
};
