require('dotenv').config();
const { pool, query } = require('../config/db');
const { invalidateSchemaCache } = require('../services/schemaService');

const newSchemes = [
  {
    scheme_name: 'PM Fasal Bima Yojana (Crop Insurance)',
    category: 'Agriculture & Farming',
    total_benefit_value: 45000,
    location_zone: 'Central Zone',
    description: 'Comprehensive crop loss and damage insurance protection for farmers covering non-preventable natural risks from pre-sowing to post-harvest.',
    required_documents: 'Land records (Khasra/Khatauni), Sowing certificate, Aadhaar, Bank passbook',
    official_url: 'https://pmfby.gov.in',
    rules: [{ max_income: 300000, target_occupation: 'Farmer', max_landholding: 10 }]
  },
  {
    scheme_name: 'Kisan Urja Suraksha (PM-KUSUM Solar Pump)',
    category: 'Clean Energy, Environment & Sanitation',
    total_benefit_value: 125000,
    location_zone: 'North Zone',
    description: 'Subsidies up to 60% for installing standalone solar agriculture pumps and solarising grid-connected farm pumps.',
    required_documents: 'Land ownership papers, Electricity connection bill, Aadhaar, Bank account',
    official_url: 'https://pmkusum.mnre.gov.in',
    rules: [{ max_income: 400000, target_occupation: 'Farmer', min_age: 21, max_age: 70, max_landholding: 5 }]
  },
  {
    scheme_name: 'Paramparagat Krishi Vikas Yojana (Organic Farming)',
    category: 'Agriculture & Farming',
    total_benefit_value: 50000,
    location_zone: 'East Zone',
    description: 'Financial support per hectare for organic farming cluster formation, certification, and eco-friendly soil health management.',
    required_documents: 'Land possession proof, Soil health card, Aadhaar, Farmer group registration',
    official_url: 'https://pgsindia-ncof.gov.in',
    rules: [{ target_occupation: 'Farmer', min_age: 18, max_landholding: 15 }]
  },
  {
    scheme_name: 'Soil Health Card Incentive Scheme',
    category: 'Agriculture & Farming',
    total_benefit_value: 5000,
    location_zone: 'West Zone',
    description: 'Free soil nutrient testing and micronutrient supplement vouchers to improve crop productivity and preserve soil fertility.',
    required_documents: 'Farm land tax receipt, Aadhaar Card',
    official_url: 'https://soilhealth.dac.gov.in',
    rules: [{ target_occupation: 'Farmer' }]
  },
  {
    scheme_name: 'Pradhan Mantri Matsya Sampada Yojana (Fisheries)',
    category: 'Agriculture & Farming',
    total_benefit_value: 180000,
    location_zone: 'South Zone',
    description: 'Capital investment subsidy for modern fishing boats, bio-floc ponds, cold storage chains, and aquaculture training.',
    required_documents: 'Fisherfolk registration ID, Lease/water body agreement, Bank account',
    official_url: 'https://pmmsy.dof.gov.in',
    rules: [{ min_age: 18, max_age: 65, target_occupation: 'Fisherman' }]
  },
  {
    scheme_name: 'Jan Aushadhi Medical Assistance Scheme',
    category: 'Healthcare & Medical Support',
    total_benefit_value: 12000,
    location_zone: 'North Zone',
    description: 'Vouchers and discounts up to 90% on essential quality generic medicines for chronic ailments through Pradhan Mantri Jan Aushadhi Kendras.',
    required_documents: 'Prescription from registered medical practitioner, Income declaration, Aadhaar',
    official_url: 'https://janaushadhi.gov.in',
    rules: [{ max_income: 250000 }]
  },
  {
    scheme_name: 'Pradhan Mantri Matru Vandana Yojana (Maternity Support)',
    category: 'Women Empowerment & Child Welfare',
    total_benefit_value: 6000,
    location_zone: 'Central Zone',
    description: 'Direct cash transfer incentive for pregnant women and lactating mothers for health checkups and adequate nutritional care.',
    required_documents: 'Mother and Child Protection (MCP) card, Aadhaar of both spouses, Bank account',
    official_url: 'https://pmmvy.wcd.gov.in',
    rules: [{ target_gender: 'Female', min_age: 19, max_age: 45 }]
  },
  {
    scheme_name: 'National Leprosy Eradication Disability Welfare',
    category: 'Differently-Abled & Rehabilitation',
    total_benefit_value: 36000,
    location_zone: 'East Zone',
    description: 'Monthly subsistence allowance and reconstructive surgery rehabilitation aid for persons affected by leprosy and severe mobility impairments.',
    required_documents: 'Medical certificate from civil surgeon, Disability certificate, Aadhaar',
    official_url: 'https://nlep.nic.in',
    rules: [{ requires_disability: true }]
  },
  {
    scheme_name: 'National Dialysis Service Assistance',
    category: 'Healthcare & Medical Support',
    total_benefit_value: 80000,
    location_zone: 'South Zone',
    description: 'Completely free hemodialysis sessions in district government hospitals for Below Poverty Line (BPL) kidney patients.',
    required_documents: 'BPL ration card, Nephrology diagnosis report, Hospital referral, Aadhaar',
    official_url: 'https://nhm.gov.in',
    rules: [{ max_income: 120000, target_social_category: 'BPL' }]
  },
  {
    scheme_name: 'Mission Indradhanush Child Immunisation Grant',
    category: 'Healthcare & Medical Support',
    total_benefit_value: 4000,
    location_zone: 'West Zone',
    description: 'Nutritional support kit and financial transport allowance for mothers completing full 12-vaccine childhood immunisation cycles.',
    required_documents: 'Child birth certificate, Immunisation tracking card, Mother Aadhaar',
    official_url: 'https://www.nhp.gov.in/mission-indradhanush',
    rules: [{ target_gender: 'Female', max_age: 35 }]
  },
  {
    scheme_name: 'Pradhan Mantri Awas Yojana - Gramin (Rural Pucca Housing)',
    category: 'Housing & Infrastructure',
    total_benefit_value: 130000,
    location_zone: 'East Zone',
    description: 'Grant assistance for homeless rural families living in kutcha or dilapidated homes to construct disaster-resilient pucca houses.',
    required_documents: 'SECC 2011 deprivation proof, Land ownership/allotment letter, Bank account',
    official_url: 'https://pmayg.nic.in',
    rules: [{ max_income: 180000, min_family_size: 2 }]
  },
  {
    scheme_name: 'Affordable Rental Housing Complexes (ARHCs)',
    category: 'Housing & Infrastructure',
    total_benefit_value: 48000,
    location_zone: 'North Zone',
    description: 'Subsidised rental urban housing units for migrant labourers, street vendors, and industrial factory workers near work sites.',
    required_documents: 'Urban migrant worker identity card, Employer verification, Aadhaar',
    official_url: 'https://arhc.mohua.gov.in',
    rules: [{ max_income: 300000, target_occupation: 'Daily Wage Worker' }]
  },
  {
    scheme_name: 'Credit Linked Subsidy Scheme for Middle Income (CLSS)',
    category: 'Housing & Infrastructure',
    total_benefit_value: 230000,
    location_zone: 'West Zone',
    description: 'Interest rate subsidy of 4% on home loans up to ₹9 Lakhs for purchasing or constructing a first residential home.',
    required_documents: 'Income tax return, Property purchase agreement, Non-homeowner affidavit',
    official_url: 'https://pmayuclap.gov.in',
    rules: [{ max_income: 600000, min_age: 21, max_age: 65 }]
  },
  {
    scheme_name: 'Pradhan Mantri Ujjwala Yojana 2.0 (LPG Connection)',
    category: 'Clean Energy, Environment & Sanitation',
    total_benefit_value: 3200,
    location_zone: 'Central Zone',
    description: 'Deposit-free LPG cooking gas connection with free first cylinder refill and gas stove for women in poor households.',
    required_documents: 'Ration card, Aadhaar, Bank account details',
    official_url: 'https://pmuy.gov.in',
    rules: [{ target_gender: 'Female', min_age: 18, max_income: 200000 }]
  },
  {
    scheme_name: 'PM Surya Ghar: Muft Bijli Yojana (Rooftop Solar)',
    category: 'Clean Energy, Environment & Sanitation',
    total_benefit_value: 78000,
    location_zone: 'South Zone',
    description: 'Capital subsidy for installing 2kW to 3kW residential rooftop solar panels to provide up to 300 units of free monthly electricity.',
    required_documents: 'Electricity consumer bill, Roof ownership proof, Bank account',
    official_url: 'https://pmsuryaghar.gov.in',
    rules: [{ min_age: 21 }]
  },
  {
    scheme_name: 'National Means-cum-Merit Scholarship (NMMSS)',
    category: 'Education & Scholarships',
    total_benefit_value: 12000,
    location_zone: 'East Zone',
    description: 'Annual financial scholarship of ₹12,000 for meritorious students from economically weaker sections to prevent class 8 dropouts.',
    required_documents: 'Class 7 mark sheet (min 55%), Parental income certificate, School bonafide',
    official_url: 'https://scholarships.gov.in',
    rules: [{ max_income: 350000, min_age: 12, max_age: 16 }]
  },
  {
    scheme_name: 'PM Vidya Lakshmi Higher Education Loan Subsidy',
    category: 'Education & Scholarships',
    total_benefit_value: 350000,
    location_zone: 'North Zone',
    description: 'Full interest subsidy during study period on education loans up to ₹7.5 Lakhs for students pursuing professional degrees.',
    required_documents: 'College admission offer letter, Fee breakdown structure, 10+2 marksheet',
    official_url: 'https://www.vidyalakshmi.co.in',
    rules: [{ min_age: 17, max_age: 28, max_income: 450000 }]
  },
  {
    scheme_name: 'Pragati Scholarship Scheme for Girl Students (Technical Degree)',
    category: 'Education & Scholarships',
    total_benefit_value: 50000,
    location_zone: 'South Zone',
    description: '₹50,000 per year assistance for tuition fees and study materials for girls admitted to AICTE approved technical colleges.',
    required_documents: 'AICTE admission letter, Family income certificate, Class 12 marksheet',
    official_url: 'https://www.aicte-india.org',
    rules: [{ target_gender: 'Female', min_age: 17, max_age: 25, max_income: 800000 }]
  },
  {
    scheme_name: 'Begum Hazrat Mahal National Scholarship',
    category: 'Tribal & Minority Affairs',
    total_benefit_value: 10000,
    location_zone: 'West Zone',
    description: 'Merit scholarship for minority community girl students studying in Classes 9 to 12.',
    required_documents: 'Minority self-declaration, Previous class marksheet (50%+), School certificate',
    official_url: 'https://bhmnsma-scholarship.gov.in',
    rules: [{ target_gender: 'Female', min_age: 13, max_age: 19, max_income: 200000, target_social_category: 'SC/ST/OBC' }]
  },
  {
    scheme_name: 'National Overseas Scholarship for SC Students',
    category: 'Education & Scholarships',
    total_benefit_value: 1500000,
    location_zone: null,
    description: 'Financial assistance covering total tuition fees, living allowances, and international travel for Masters and PhD studies abroad.',
    required_documents: 'Foreign university admission letter, Caste certificate, Valid Passport, Income proof',
    official_url: 'https://nosmsje.gov.in',
    rules: [{ min_age: 21, max_age: 35, max_income: 800000, target_social_category: 'SC/ST/OBC' }]
  },
  {
    scheme_name: 'Stand-Up India Scheme for Women & SC/ST',
    category: 'MSME, Small Business & Artisans',
    total_benefit_value: 500000,
    location_zone: 'Central Zone',
    description: 'Collateral-free composite bank loans between ₹10 Lakhs and ₹1 Crore for setting up greenfield enterprises in manufacturing, services, or trading.',
    required_documents: 'Project report, Business PAN, Address proof, Caste/gender declaration',
    official_url: 'https://www.standupmitra.in',
    rules: [{ min_age: 18, target_gender: 'Female' }]
  },
  {
    scheme_name: 'Mahila Coir Yojana (Self-Employment)',
    category: 'Women Empowerment & Child Welfare',
    total_benefit_value: 40000,
    location_zone: 'South Zone',
    description: '75% subsidy on spinning ratts and coir processing machinery for trained rural women artisans.',
    required_documents: 'Training completion certificate, Residence certificate, Bank passbook',
    official_url: 'https://coirboard.gov.in',
    rules: [{ target_gender: 'Female', min_age: 18, max_income: 180000 }]
  },
  {
    scheme_name: "Prime Minister Employment Generation Programme (PMEGP)",
    category: 'MSME, Small Business & Artisans',
    total_benefit_value: 250000,
    location_zone: 'West Zone',
    description: 'Credit-linked margin money subsidy up to 35% for establishing micro-enterprises and non-farm rural self-employment units.',
    required_documents: 'Detailed project report (DPR), Educational certificate (Class 8 pass), Aadhaar',
    official_url: 'https://www.kviconline.gov.in/pmegp',
    rules: [{ min_age: 18, max_income: 500000 }]
  },
  {
    scheme_name: 'PM Vishwakarma Scheme (Traditional Artisans)',
    category: 'MSME, Small Business & Artisans',
    total_benefit_value: 65000,
    location_zone: 'North Zone',
    description: 'Skill training with ₹500/day stipend, ₹15,000 modern toolkit grant, and collateral-free enterprise credit at 5% interest for 18 artisan trades.',
    required_documents: 'Trade certification, Aadhaar, Active mobile number, Bank account',
    official_url: 'https://pmvishwakarma.gov.in',
    rules: [{ min_age: 18, target_occupation: 'Artisan' }]
  },
  {
    scheme_name: 'Deendayal Antyodaya Yojana - NRLM (SHG Revolving Fund)',
    category: 'Financial Inclusion & Rural Credit',
    total_benefit_value: 150000,
    location_zone: 'East Zone',
    description: 'Low-interest institutional credit and revolving fund grants to Women Self-Help Groups (SHGs) for rural micro-livelihoods.',
    required_documents: 'SHG resolution book, Member KYC records, Bank account details',
    official_url: 'https://aajeevika.gov.in',
    rules: [{ target_gender: 'Female', min_family_size: 3, max_income: 200000 }]
  },
  {
    scheme_name: 'Indira Gandhi National Old Age Pension Scheme (IGNOAPS)',
    category: 'Senior Citizens & Social Security',
    total_benefit_value: 12000,
    location_zone: 'Central Zone',
    description: 'Monthly social security pension for BPL senior citizens aged 60 years and above.',
    required_documents: 'Age proof (Birth certificate/Voter ID), BPL card, Aadhaar, Bank passbook',
    official_url: 'https://nsap.nic.in',
    rules: [{ min_age: 60, max_age: 110, max_income: 100000, target_social_category: 'BPL' }]
  },
  {
    scheme_name: 'Atal Pension Yojana (Guaranteed Monthly Pension)',
    category: 'Senior Citizens & Social Security',
    total_benefit_value: 60000,
    location_zone: 'North Zone',
    description: 'Government co-contribution scheme providing lifelong guaranteed pension between ₹1,000 to ₹5,000 per month from age 60 for unorganised sector workers.',
    required_documents: 'Savings bank account with auto-debit consent, Aadhaar',
    official_url: 'https://www.npscra.nsdl.co.in',
    rules: [{ min_age: 18, max_age: 40 }]
  },
  {
    scheme_name: 'Rashtriya Vayoshri Yojana (Assisted Living Devices for Seniors)',
    category: 'Senior Citizens & Social Security',
    total_benefit_value: 25000,
    location_zone: 'South Zone',
    description: 'Free assisted-living physical aids (wheelchairs, hearing aids, spectacles, walking sticks) for senior citizens from BPL families.',
    required_documents: 'BPL ration card or income certificate under ₹1.5L, Medical prescription, Age proof',
    official_url: 'https://socialjustice.gov.in',
    rules: [{ min_age: 60, max_income: 150000 }]
  },
  {
    scheme_name: 'Divyangjan Swavlamban Scheme (Concessional Business Loan)',
    category: 'Differently-Abled & Rehabilitation',
    total_benefit_value: 100000,
    location_zone: 'West Zone',
    description: 'Concessional interest loans with 20% capital subsidy for persons with disabilities to set up retail, computer, or tailoring enterprises.',
    required_documents: 'Disability certificate (UDID card with 40%+ disability), Business plan, Aadhaar',
    official_url: 'https://nhfdc.nic.in',
    rules: [{ requires_disability: true, min_age: 18, max_age: 60, max_income: 300000 }]
  },
  {
    scheme_name: 'ADIP Scheme (Free Tricycles & Prosthetics)',
    category: 'Differently-Abled & Rehabilitation',
    total_benefit_value: 30000,
    location_zone: 'East Zone',
    description: 'Completely free distribution of sophisticated aids, motorized tricycles, braille kits, and cochlear implants to divyang individuals.',
    required_documents: 'UDID Card (40%+ disability), Income certificate below ₹2.4 Lakhs, Aadhaar',
    official_url: 'https://adip.alimco.in',
    rules: [{ requires_disability: true, max_income: 240000 }]
  },
  {
    scheme_name: 'PM Van Dhan Yojana (Tribal Enterprise & Forest Produce)',
    category: 'Tribal & Minority Affairs',
    total_benefit_value: 150000,
    location_zone: 'Central Zone',
    description: 'Value-addition and primary processing infrastructure grant for tribal gatherers forming Self-Help Groups around Minor Forest Produce (MFP).',
    required_documents: 'ST certificate, Forest dweller gram sabha proof, Bank account',
    official_url: 'https://trifed.tribal.gov.in',
    rules: [{ target_social_category: 'SC/ST/OBC', min_age: 18 }]
  },
  {
    scheme_name: 'Eklavya Model Residential Schools Scholarship',
    category: 'Tribal & Minority Affairs',
    total_benefit_value: 45000,
    location_zone: 'East Zone',
    description: 'Complete boarding, lodging, uniform, and textbook scholarship for Scheduled Tribe children studying in classes 6 to 12.',
    required_documents: 'ST certificate, Domicile certificate, Previous school marksheet',
    official_url: 'https://emrs.tribal.gov.in',
    rules: [{ target_social_category: 'SC/ST/OBC', min_age: 10, max_age: 18, max_income: 250000 }]
  },
  {
    scheme_name: 'Nai Roshni (Leadership Development for Minority Women)',
    category: 'Tribal & Minority Affairs',
    total_benefit_value: 15000,
    location_zone: 'North Zone',
    description: 'Community leadership training, legal awareness, and digital literacy stipends for women from notified minority communities.',
    required_documents: 'Minority self-certification, Residence proof, Bank account',
    official_url: 'https://nairoshni-moma.gov.in',
    rules: [{ target_gender: 'Female', min_age: 18, max_age: 65, max_income: 250000 }]
  },
  {
    scheme_name: 'Jal Jeevan Mission: Rural Household Tap Water Subsidy',
    category: 'Clean Energy, Environment & Sanitation',
    total_benefit_value: 15000,
    location_zone: 'Central Zone',
    description: '100% subsidized piped potable tap water installation and community water quality monitoring support for rural households.',
    required_documents: 'Gram Panchayat residential proof, Aadhaar Card',
    official_url: 'https://jaljeevanmission.gov.in',
    rules: [{ min_family_size: 2 }]
  },
  {
    scheme_name: 'Swachh Bharat Mission - Gramin (Individual Latrine Grant)',
    category: 'Clean Energy, Environment & Sanitation',
    total_benefit_value: 12000,
    location_zone: 'East Zone',
    description: 'Direct financial incentive of ₹12,000 for constructing a twin-pit toilet in rural households without sanitary facilities.',
    required_documents: 'Geotagged toilet construction photo, Bank passbook, Aadhaar',
    official_url: 'https://swachhbharatmission.gov.in',
    rules: [{ max_income: 200000 }]
  },
  {
    scheme_name: 'FAME India Phase II (Electric Two-Wheeler Subsidy)',
    category: 'Clean Energy, Environment & Sanitation',
    total_benefit_value: 22000,
    location_zone: 'West Zone',
    description: 'Purchase incentive on certified advanced battery electric two-wheelers and three-wheelers to cut transport emissions.',
    required_documents: 'Valid Driving License, Address proof, Vehicle purchase invoice',
    official_url: 'https://fame2.heavyindustries.gov.in',
    rules: [{ min_age: 18 }]
  },
  {
    scheme_name: 'Khelo India National Sports Talent Scholarship',
    category: 'Skill Development & Youth Employment',
    total_benefit_value: 600000,
    location_zone: 'North Zone',
    description: 'Annual financial assistance of ₹5 Lakhs per year for 8 years to talented young athletes identified in national sports championships.',
    required_documents: 'State/National tournament participation certificate, Age proof, Medical fitness',
    official_url: 'https://kheloindia.gov.in',
    rules: [{ min_age: 10, max_age: 21 }]
  },
  {
    scheme_name: 'National Apprenticeship Promotion Scheme (NAPS)',
    category: 'Skill Development & Youth Employment',
    total_benefit_value: 36000,
    location_zone: 'South Zone',
    description: '25% stipend reimbursement (up to ₹1,500/month) plus ₹7,500 basic training cost sharing for youth undertaking industry apprenticeships.',
    required_documents: 'ITI/Diploma or 10th pass certificate, Apprenticeship contract, Bank details',
    official_url: 'https://www.apprenticeshipindia.gov.in',
    rules: [{ min_age: 16, max_age: 30 }]
  },
  {
    scheme_name: 'Startup India Seed Fund Scheme (SISFS)',
    category: 'MSME, Small Business & Artisans',
    total_benefit_value: 2000000,
    location_zone: null,
    description: 'Up to ₹20 Lakhs grant for proof of concept and prototype development, and up to ₹50 Lakhs convertible debentures for DPIIT-recognized startups.',
    required_documents: 'DPIIT Recognition certificate, Business pitch deck, Incorporated company PAN',
    official_url: 'https://seedfund.startupindia.gov.in',
    rules: [{ min_age: 18 }]
  },
  {
    scheme_name: 'PM Mudra Yojana - Shishu Loan (Small Street Business)',
    category: 'Financial Inclusion & Rural Credit',
    total_benefit_value: 50000,
    location_zone: 'South Zone',
    description: 'Zero collateral micro-loan up to ₹50,000 at competitive bank interest rates for small fruit/vegetable sellers, artisans, and barbers.',
    required_documents: 'Business location proof, Voter ID/Aadhaar, Quotation for machinery/stock',
    official_url: 'https://www.mudra.org.in',
    rules: [{ min_age: 18, max_income: 300000 }]
  },
  {
    scheme_name: 'PM Mudra Yojana - Kishor Loan (Enterprise Growth)',
    category: 'Financial Inclusion & Rural Credit',
    total_benefit_value: 500000,
    location_zone: 'West Zone',
    description: 'Collateral-free business credit from ₹50,000 to ₹5 Lakhs for expanding existing small shops, workshops, and repair centers.',
    required_documents: '6 months bank statement, Business registration proof, Balance sheet / sales estimate',
    official_url: 'https://www.mudra.org.in',
    rules: [{ min_age: 21, max_age: 65 }]
  },
  {
    scheme_name: 'Kisan Credit Card (KCC) Subsidised Crop Loan',
    category: 'Financial Inclusion & Rural Credit',
    total_benefit_value: 300000,
    location_zone: 'Central Zone',
    description: 'Short-term crop production loan up to ₹3 Lakhs at concessional 4% interest rate with prompt repayment incentive for cultivators.',
    required_documents: 'Land possession certificate, Cropping pattern declaration, Aadhaar',
    official_url: 'https://agricoop.nic.in',
    rules: [{ min_age: 18, max_age: 75, target_occupation: 'Farmer', max_landholding: 25 }]
  }
];

async function seed() {
  console.log('🌱 Starting 50-Scheme Database Expansion...');
  const countRes = await query('SELECT count(*) FROM govt_schemes');
  const currentCount = parseInt(countRes.rows[0].count, 10);
  console.log(`Current scheme count in database: ${currentCount}`);

  let insertedCount = 0;
  for (const s of newSchemes) {
    // Check if scheme with same name already exists
    const existing = await query('SELECT scheme_id FROM govt_schemes WHERE scheme_name = $1', [s.scheme_name]);
    if (existing.rows.length > 0) {
      console.log(`  ⏩ Skipping already existing scheme: "${s.scheme_name}"`);
      continue;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const insResult = await client.query(
        `INSERT INTO govt_schemes (scheme_name, category, total_benefit_value, location_zone, description, required_documents, official_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING scheme_id`,
        [s.scheme_name, s.category, s.total_benefit_value, s.location_zone, s.description, s.required_documents, s.official_url]
      );
      const schemeId = insResult.rows[0].scheme_id;

      for (const r of s.rules) {
        await client.query(
          `INSERT INTO eligibility_rules (scheme_id, max_income, min_age, max_age, target_gender, min_family_size, target_occupation, target_social_category, requires_disability, max_landholding)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            schemeId,
            r.max_income || null,
            r.min_age || null,
            r.max_age || null,
            r.target_gender || null,
            r.min_family_size || null,
            r.target_occupation || null,
            r.target_social_category || null,
            Boolean(r.requires_disability),
            r.max_landholding || null
          ]
        );
      }
      await client.query('COMMIT');
      insertedCount++;
      console.log(`  ✅ Inserted [${s.category}] "${s.scheme_name}" (Zone: ${s.location_zone || 'National'})`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`  ❌ Failed to insert "${s.scheme_name}":`, err.message);
    } finally {
      client.release();
    }
  }

  invalidateSchemaCache();
  const finalCountRes = await query('SELECT count(*) FROM govt_schemes');
  console.log(`\n🎉 Seed completed! Newly inserted: ${insertedCount}. Total schemes in DB: ${finalCountRes.rows[0].count}`);
  await pool.end();
  process.exit(0);
}

seed().catch(err => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});
