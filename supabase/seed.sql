-- OncoCliniq — Sample Question Seed Data
-- Run this in Supabase SQL Editor AFTER schema.sql
-- All questions are status='approved' so students can take quizzes immediately

insert into questions (id, domain, subtopic, type, difficulty, level, question, options, correct, explanation, status) values

-- ─────────────────────────────────────────────
-- BREAST CANCER (8 questions)
-- ─────────────────────────────────────────────
(
  'BC-SEED-0001', 'Breast Cancer', 'Sentinel Lymph Node Biopsy', 'mcq', 'medium', 'resident',
  'A 45-year-old woman with a 1.8 cm invasive ductal carcinoma has clinically negative axillary nodes. Which is the most appropriate axillary staging procedure?',
  '["Axillary lymph node dissection (ALND) of levels I–III", "Sentinel lymph node biopsy (SLNB)", "PET-CT scan for nodal staging", "Ultrasound-guided fine-needle aspiration of axilla"]',
  1,
  'Sentinel lymph node biopsy is the standard of care for axillary staging in clinically node-negative early breast cancer. It accurately identifies nodal status while avoiding the morbidity of full ALND (lymphoedema, shoulder dysfunction). ALND is reserved for cases where SLNB is positive and specific criteria are not met for omission.',
  'approved'
),
(
  'BC-SEED-0002', 'Breast Cancer', 'Surgical Margins', 'mcq', 'medium', 'resident',
  'According to the SSO-ASTRO consensus guideline for invasive breast cancer treated with whole-breast irradiation, what is the definition of an adequate surgical margin?',
  '["No ink on tumour (tumour not touching the inked margin)", "At least 1 mm of clear tissue around the tumour", "At least 2 mm of clear tissue around the tumour", "At least 5 mm of clear tissue around the tumour"]',
  0,
  'The 2014 SSO-ASTRO consensus defined "no ink on tumour" as an adequate margin for invasive breast cancer treated with whole-breast irradiation. Wider margins do not significantly reduce local recurrence and increase re-excision rates unnecessarily. For DCIS, a 2 mm margin is recommended.',
  'approved'
),
(
  'BC-SEED-0003', 'Breast Cancer', 'Triple Negative Breast Cancer', 'mcq', 'hard', 'fellow',
  'A 38-year-old woman is diagnosed with a 3 cm triple-negative breast cancer (ER−, PR−, HER2−). Neoadjuvant chemotherapy is planned. Which statement about pathological complete response (pCR) in TNBC is most accurate?',
  '["pCR is defined as no residual invasive cancer in the breast only", "Achieving pCR is associated with improved event-free and overall survival", "TNBC has a lower pCR rate than HER2-positive disease", "pCR eliminates the need for adjuvant capecitabine in residual disease"]',
  1,
  'In TNBC, achieving pCR (no residual invasive disease in breast and nodes — ypT0/is ypN0) is strongly associated with improved event-free survival and overall survival, a phenomenon termed "prognostic surrogate" (Cortazar et al., Lancet 2014). Patients with residual disease benefit from adjuvant capecitabine (CREATE-X trial). TNBC has a higher pCR rate than luminal subtypes.',
  'approved'
),
(
  'BC-SEED-0004', 'Breast Cancer', 'Inflammatory Breast Cancer', 'mcq', 'medium', 'resident',
  'Which of the following is the hallmark pathological finding that distinguishes inflammatory breast cancer (IBC) from locally advanced breast cancer with skin involvement?',
  '["Extensive lymphovascular invasion in the dermis", "Tumour emboli in dermal lymphatics on skin biopsy", "Erythema covering > 50% of the breast surface", "Peau d''orange appearance on clinical examination"]',
  1,
  'The pathological hallmark of IBC is tumour emboli in dermal lymphatics (dermal lymphatic invasion), which is distinct from direct skin infiltration by tumour. While clinical features (peau d''orange, erythema, rapid onset oedema) are important, a skin punch biopsy showing dermal lymphatic emboli confirms the diagnosis histologically.',
  'approved'
),
(
  'BC-SEED-0005', 'Breast Cancer', 'BRCA Mutations', 'mcq', 'hard', 'fellow',
  'A 32-year-old BRCA1 mutation carrier is newly diagnosed with unilateral early breast cancer and opts for bilateral mastectomy. What is the approximate risk reduction in contralateral breast cancer following contralateral prophylactic mastectomy (CPM)?',
  '["20–30%", "40–50%", "90–95%", "CPM has no proven risk-reduction benefit in BRCA carriers"]',
  2,
  'Contralateral prophylactic mastectomy reduces the risk of contralateral breast cancer by approximately 90–95% in BRCA1/2 mutation carriers, who face a cumulative contralateral risk of 40–60% over their lifetime. This is significantly higher than the risk reduction seen in the general population, where CPM offers much smaller absolute benefit.',
  'approved'
),
(
  'BC-SEED-0006', 'Breast Cancer', 'Breast Reconstruction', 'mcq', 'easy', 'student',
  'Which of the following is an absolute contraindication to immediate breast reconstruction after mastectomy?',
  '["Patient age > 65 years", "Planned post-mastectomy radiotherapy", "Smoker with BMI 28 kg/m²", "Need for adjuvant chemotherapy"]',
  1,
  'Post-mastectomy radiotherapy (PMRT) is the most significant contraindication to immediate implant-based reconstruction as radiation substantially increases complication rates (capsular contracture, implant failure, poor cosmesis). While it is not an absolute contraindication to all reconstruction (autologous reconstruction is more radiation-tolerant), it is generally advised to delay or use two-stage approaches. Age and chemotherapy alone are not contraindications.',
  'approved'
),
(
  'BC-SEED-0007', 'Breast Cancer', 'HER2-Positive Breast Cancer', 'mcq', 'medium', 'resident',
  'A patient completes neoadjuvant chemotherapy + trastuzumab + pertuzumab for HER2-positive breast cancer but has residual invasive disease at surgery. What is the recommended adjuvant treatment?',
  '["Continue trastuzumab to complete 1 year", "Switch to ado-trastuzumab emtansine (T-DM1) for 14 cycles", "Add pertuzumab to trastuzumab for 1 year", "Observation only after surgery"]',
  1,
  'The KATHERINE trial demonstrated that switching to T-DM1 (ado-trastuzumab emtansine) for patients with HER2-positive breast cancer who have residual disease after neoadjuvant therapy reduces the risk of recurrence or death by 50% compared with continuing trastuzumab. T-DM1 is now the standard of care in this setting.',
  'approved'
),
(
  'BC-SEED-0008', 'Breast Cancer', 'Oncoplastic Surgery', 'mcq', 'easy', 'student',
  'Oncoplastic breast-conserving surgery combines tumour excision with which of the following?',
  '["Immediate implant insertion to replace excised volume", "Plastic surgery reshaping techniques to maintain breast form", "Skin-sparing mastectomy with sentinel node biopsy", "Nipple-areola complex resection to achieve clear margins"]',
  1,
  'Oncoplastic surgery integrates oncological resection principles with plastic surgery volume displacement or replacement techniques to maintain breast shape and symmetry after wide local excision. It allows larger tumours to be excised with adequate margins while achieving acceptable cosmetic outcomes, avoiding mastectomy in selected patients.',
  'approved'
),

-- ─────────────────────────────────────────────
-- GI TUMORS (7 questions)
-- ─────────────────────────────────────────────
(
  'GI-SEED-0001', 'GI Tumors', 'Colorectal Cancer Staging', 'mcq', 'easy', 'student',
  'In the TNM staging system for colorectal cancer, which T stage describes a tumour that invades through the muscularis propria into the pericolorectal tissues?',
  '["T1", "T2", "T3", "T4a"]',
  2,
  'T3 colorectal cancer invades through the muscularis propria into pericolorectal tissues (subserosa or non-peritonealized pericolic/perirectal tissues). T2 is confined to the muscularis propria, while T4a penetrates the visceral peritoneum and T4b invades adjacent organs or structures.',
  'approved'
),
(
  'GI-SEED-0002', 'GI Tumors', 'Total Mesorectal Excision', 'mcq', 'medium', 'resident',
  'Total mesorectal excision (TME) for rectal cancer primarily reduces which of the following?',
  '["Distant metastasis rate", "Local recurrence rate", "Anastomotic leak rate", "Operative blood loss"]',
  1,
  'TME, introduced by Heald in 1982, involves sharp dissection in the embryological plane around the intact mesorectal envelope, removing all draining lymph nodes en bloc. This technique dramatically reduced local recurrence rates from ~30% to <10% in most series. It does not directly affect distant metastasis, anastomotic leak rate, or blood loss.',
  'approved'
),
(
  'GI-SEED-0003', 'GI Tumors', 'Hepatocellular Carcinoma', 'mcq', 'medium', 'resident',
  'According to the Milan criteria, which of the following patients is suitable for liver transplantation for hepatocellular carcinoma (HCC)?',
  '["Single nodule 6 cm in a Child-Pugh B patient", "Three nodules all ≤ 3 cm with no vascular invasion", "Two nodules of 4 cm and 3 cm respectively", "Single nodule 5 cm with portal vein thrombosis"]',
  1,
  'The Milan criteria for liver transplantation in HCC are: single tumour ≤ 5 cm OR up to 3 tumours each ≤ 3 cm, with no vascular invasion and no extrahepatic spread. Option B (three nodules all ≤ 3 cm, no vascular invasion) satisfies the Milan criteria. Options A (6 cm), C (4 cm nodule exceeds criteria), and D (portal vein involvement) do not qualify.',
  'approved'
),
(
  'GI-SEED-0004', 'GI Tumors', 'Pancreatic Cancer', 'mcq', 'hard', 'fellow',
  'A patient undergoes CT imaging showing a 3 cm pancreatic head mass with superior mesenteric vein (SMV) involvement ≤ 180° of the vessel wall and no arterial involvement. How is this classified?',
  '["Resectable pancreatic cancer", "Borderline resectable pancreatic cancer", "Locally advanced (unresectable) pancreatic cancer", "Metastatic pancreatic cancer"]',
  1,
  'According to NCCN and AHPBA/SSO/SSAT criteria, borderline resectable pancreatic cancer includes tumours with SMV/portal vein contact ≤ 180° (with or without impingement and narrowing), short-segment occlusion amenable to reconstruction, or tumours abutting the hepatic artery. Neoadjuvant therapy is typically recommended before surgery in this group.',
  'approved'
),
(
  'GI-SEED-0005', 'GI Tumors', 'Gastrointestinal Stromal Tumours', 'mcq', 'medium', 'resident',
  'Which molecular target is mutated in the majority (approximately 80%) of gastrointestinal stromal tumours (GISTs)?',
  '["PDGFRA", "KIT (CD117)", "BRAF V600E", "SDH complex genes"]',
  1,
  'Approximately 80% of GISTs harbour activating mutations in KIT (CD117), a tyrosine kinase receptor, making imatinib (a KIT/PDGFRA inhibitor) the cornerstone of systemic treatment. About 5–10% have PDGFRA mutations, 10–15% are wild-type (including SDH-deficient and NF1-associated), and a small subset has BRAF mutations.',
  'approved'
),
(
  'GI-SEED-0006', 'GI Tumors', 'Gastric Cancer', 'mcq', 'medium', 'resident',
  'The FLOT regimen (docetaxel, oxaliplatin, leucovorin, 5-FU) is the preferred perioperative chemotherapy for resectable gastric cancer. This is based on which landmark trial?',
  '["MAGIC trial (ECF vs surgery alone)", "FLOT4 trial (FLOT vs ECF/ECX)", "ToGA trial (trastuzumab + chemotherapy)", "CLASSIC trial (adjuvant CAPOX vs surgery alone)"]',
  1,
  'The FLOT4 trial (Al-Batran et al., Lancet 2019) demonstrated superiority of perioperative FLOT over ECF/ECX (the MAGIC regimen) in resectable gastric and gastro-oesophageal junction adenocarcinoma, with improved median overall survival (50 vs 35 months) and higher pCR rates. FLOT is now standard of care in fit patients in Western countries.',
  'approved'
),
(
  'GI-SEED-0007', 'GI Tumors', 'Colorectal Liver Metastases', 'mcq', 'hard', 'fellow',
  'Which of the following is the most important determinant of long-term survival after resection of colorectal liver metastases (CRLM)?',
  '["Number of metastases (≤ 3 vs > 3)", "Achievement of an R0 (margin-negative) resection", "Primary tumour location (colon vs rectum)", "Use of neoadjuvant chemotherapy before hepatectomy"]',
  1,
  'R0 resection — achieving tumour-free surgical margins — is the single most important predictor of long-term survival after hepatic resection for CRLM, associated with 5-year survival rates of 25–40%. While other factors (RAS mutation, number, size, and synchronous vs metachronous presentation) influence prognosis, resectability with clear margins is the primary goal. The "two-surgeon" principle aims to leave adequate future liver remnant while achieving R0.',
  'approved'
),

-- ─────────────────────────────────────────────
-- SURGICAL TECHNIQUES (7 questions)
-- ─────────────────────────────────────────────
(
  'ST-SEED-0001', 'Surgical Techniques', 'Whipple Procedure', 'mcq', 'medium', 'resident',
  'In a pancreaticoduodenectomy (Whipple procedure), which of the following structures is routinely removed?',
  '["Head of pancreas, duodenum, distal stomach, gallbladder and common bile duct", "Entire pancreas, duodenum, spleen, and left colon", "Head of pancreas and duodenum only, with preservation of the stomach", "Head and body of pancreas, duodenum, and spleen"]',
  0,
  'The classic Whipple procedure (pancreaticoduodenectomy) removes the head of the pancreas, the entire duodenum, the distal stomach (approximately 40%), the gallbladder, and the common bile duct. Reconstruction involves three anastomoses: pancreaticojejunostomy, hepaticojejunostomy, and gastrojejunostomy. The pylorus-preserving variant (PPPD) retains the entire stomach and pylorus.',
  'approved'
),
(
  'ST-SEED-0002', 'Surgical Techniques', 'Neck Dissection', 'mcq', 'medium', 'resident',
  'A radical neck dissection (RND) removes all five lymph node levels of the neck plus which three non-lymphatic structures?',
  '["Internal jugular vein, sternocleidomastoid muscle, and submandibular gland", "Internal jugular vein, sternocleidomastoid muscle, and spinal accessory nerve", "External jugular vein, trapezius muscle, and spinal accessory nerve", "Common carotid artery, sternocleidomastoid muscle, and spinal accessory nerve"]',
  1,
  'The classic radical neck dissection removes lymph node levels I–V along with the three non-lymphatic structures: internal jugular vein (IJV), sternocleidomastoid muscle (SCM), and spinal accessory nerve (CN XI). Modified radical neck dissection (MRND) preserves one or more of these structures to reduce functional morbidity. Selective neck dissection removes only the node levels at risk.',
  'approved'
),
(
  'ST-SEED-0003', 'Surgical Techniques', 'Surgical Margins', 'mcq', 'easy', 'student',
  'What does an R1 resection classification indicate in oncological surgery?',
  '["Complete macroscopic resection with microscopically negative margins", "Microscopic residual tumour at the resection margin", "Macroscopic residual tumour left in situ", "Resection not performed — systemic therapy only"]',
  1,
  'The R-classification describes the completeness of resection: R0 = no residual tumour (microscopically clear margins), R1 = microscopic residual tumour (positive margins on histopathology), R2 = macroscopic residual tumour visible to the surgeon. R0 resection is the goal of curative-intent surgery as R1 and R2 are associated with significantly higher local recurrence rates.',
  'approved'
),
(
  'ST-SEED-0004', 'Surgical Techniques', 'Minimally Invasive Surgery', 'mcq', 'medium', 'resident',
  'The COLOR II trial compared laparoscopic vs open surgery for rectal cancer. What was the primary oncological finding?',
  '["Laparoscopic TME had significantly higher local recurrence rates", "Laparoscopic TME had non-inferior locoregional recurrence rates at 3 years", "Open TME had better 5-year overall survival", "Laparoscopic surgery was abandoned due to higher conversion rates"]',
  1,
  'The COLOR II randomised trial (van der Pas et al., Lancet Oncology 2013) demonstrated that laparoscopic surgery for rectal cancer was non-inferior to open surgery in terms of locoregional recurrence at 3 years (5.0% vs 5.8%, p=0.04 for non-inferiority). Disease-free and overall survival were also comparable. Laparoscopic TME is now an accepted standard at high-volume centres.',
  'approved'
),
(
  'ST-SEED-0005', 'Surgical Techniques', 'Lymph Node Dissection', 'mcq', 'medium', 'resident',
  'What is the minimum number of lymph nodes that should be examined after colectomy for colorectal cancer to ensure adequate staging, as per most international guidelines?',
  '["6 lymph nodes", "12 lymph nodes", "20 lymph nodes", "30 lymph nodes"]',
  1,
  'A minimum of 12 lymph nodes must be examined after resection of colorectal cancer for adequate staging, as per NCCN, ESMO, and CAP guidelines. Fewer than 12 nodes is associated with stage migration (under-staging) and is linked to worse outcomes. If < 12 nodes are retrieved, pathologists should attempt re-sampling and the result should be documented.',
  'approved'
),
(
  'ST-SEED-0006', 'Surgical Techniques', 'Thyroid Surgery', 'mcq', 'easy', 'student',
  'Which nerve is most at risk of injury during thyroidectomy and, if damaged bilaterally, can cause life-threatening airway obstruction?',
  '["External branch of the superior laryngeal nerve", "Recurrent laryngeal nerve", "Hypoglossal nerve", "Glossopharyngeal nerve"]',
  1,
  'The recurrent laryngeal nerve (RLN) runs in the tracheo-oesophageal groove and innervates all intrinsic laryngeal muscles except the cricothyroid. Unilateral injury causes hoarseness; bilateral injury causes adduction of both vocal cords, resulting in stridor and potentially life-threatening airway obstruction requiring emergency tracheostomy. Routine identification (nerve dissection) of the RLN during thyroidectomy is the standard of care.',
  'approved'
),
(
  'ST-SEED-0007', 'Surgical Techniques', 'Perioperative Care', 'mcq', 'easy', 'student',
  'Enhanced Recovery After Surgery (ERAS) protocols for colorectal surgery include which of the following as a key component?',
  '["Routine nasogastric tube decompression for 48 hours post-op", "Prolonged preoperative fasting (nil by mouth from midnight)", "Early oral feeding within 24 hours of surgery", "Routine use of opioid-based epidural analgesia for 5 days"]',
  2,
  'ERAS protocols are evidence-based multimodal perioperative care pathways that reduce complications and length of stay. Key components include: carbohydrate loading until 2 hours pre-op (not prolonged fasting), avoiding routine nasogastric tubes, early mobilisation, early oral feeding (within 24 hours), multimodal opioid-sparing analgesia, and goal-directed fluid therapy. These collectively attenuate the surgical stress response.',
  'approved'
);
