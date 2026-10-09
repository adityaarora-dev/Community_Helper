const { query } = require('../config/db');

/**
 * GET /api/schemes
 * Returns all government welfare schemes with their associated eligibility rules.
 */
async function getAllSchemes(req, res) {
  try {
    const sql = `
      SELECT 
        s.scheme_id,
        s.scheme_name,
        s.description,
        s.category,
        s.total_benefit_value,
        s.required_documents,
        s.official_url,
        s.created_at,
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
      LEFT JOIN eligibility_rules r ON s.scheme_id = r.scheme_id
      ORDER BY s.total_benefit_value DESC;
    `;

    const result = await query(sql);
    return res.status(200).json({
      status: 'success',
      count: result.rows.length,
      schemes: result.rows,
    });
  } catch (error) {
    console.error('❌ [Scheme Controller Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve government schemes.',
      error: error.message,
    });
  }
}

/**
 * GET /api/schemes/:schemeId
 * Returns a single scheme by ID with its rules.
 */
async function getSchemeById(req, res) {
  try {
    const { schemeId } = req.params;
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
      LEFT JOIN eligibility_rules r ON s.scheme_id = r.scheme_id
      WHERE s.scheme_id = $1;
    `;

    const result = await query(sql, [schemeId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Scheme not found.' });
    }

    return res.status(200).json({
      status: 'success',
      scheme: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', error: error.message });
  }
}

/**
 * GET /api/service-centers
 * Returns civic facilitation centers, optionally filtered by ?zone=
 */
async function getServiceCenters(req, res) {
  try {
    const { zone } = req.query;
    let sql = `SELECT * FROM service_centers`;
    const params = [];

    if (zone && zone !== 'All Zones') {
      sql += ` WHERE location_zone ILIKE $1`;
      params.push(`%${zone}%`);
    }

    sql += ` ORDER BY name ASC;`;

    const result = await query(sql, params);
    return res.status(200).json({
      status: 'success',
      count: result.rows.length,
      service_centers: result.rows,
    });
  } catch (error) {
    console.error('❌ [Service Centers Controller Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve service centers.',
      error: error.message,
    });
  }
}

module.exports = {
  getAllSchemes,
  getSchemeById,
  getServiceCenters,
};
