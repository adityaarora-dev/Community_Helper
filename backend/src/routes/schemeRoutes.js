const express = require('express');
const router = express.Router();
const { getAllSchemes, getSchemeById, getServiceCenters } = require('../controllers/schemeController');

router.get('/schemes', getAllSchemes);
router.get('/schemes/:schemeId', getSchemeById);
router.get('/service-centers', getServiceCenters);

module.exports = router;
