const fs = require('fs');
const OpenAI = require('openai');

// ===== CONFIG =====
const BATCH_SIZE = 30;
const MODEL = "llama-3.1-8b-instant";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const NAV_FILE = "khaadi/output/navigation_v3.json";
const CAT_FILE = "khaadi/output/categories.json";
const OCC_FILE = "khaadi/output/occasions.json";
const OUTPUT_FILE = "khaadi/output/navigation_v4.json";

// ===== LOAD FILES =====
const navigation = JSON.parse(fs.readFileSync(NAV_FILE, "utf-8"));
const categories = JSON.parse(fs.readFileSync(CAT_FILE, "utf-8")).categories;
const occasions = JSON.parse(fs.readFileSync(OCC_FILE, "utf-8")).occasions;


// =====================================================
// 1️⃣ DETERMINISTIC RULES FIRST
// =====================================================

const STRUCTURE_WORDS = [
  "2_piece", "3_piece", "kurta", "kameez", "shirt", "pants", "shalwar",
  "dupatta", "shawl", "stole", "cape",
  "tailored", "stitched", "ready_to_wear", "fabrics", "unstitched",
  "sale", "flat", "just_in", "restock", "best_sellers", "new_in"
];

function normalize(str) {
  return str.toLowerCase().replace(/-/g, "_");
}

function deterministicClassify(nodeKey) {
  const key = normalize(nodeKey);

  // Match occasions anywhere in full key
  const matchedOccasions = occasions.filter(o =>
    key.includes(normalize(o))
  );

  // Match categories anywhere in full key
  const matchedCategories = categories.filter(c =>
    key.includes(normalize(c))
  );

  if (matchedOccasions.length || matchedCategories.length) {
    return {
      mapped_categories: matchedCategories,
      new_categories: [],
      mapped_occasions: matchedOccasions,
      new_occasions: []
    };
  }

  // If nothing matched → send to AI
  return null;
}


// =====================================================
// 2️⃣ SPLIT DETERMINISTIC VS AI NODES
// =====================================================

const deterministicResults = {};
const aiNodes = [];

for (const [key, value] of Object.entries(navigation)) {
  const result = deterministicClassify(key);

  if (result !== null) {
    deterministicResults[key] = result;
  } else {
    aiNodes.push({ key, label: value.label });
  }
}


// =====================================================
// 3️⃣ BATCH AI NODES
// =====================================================

function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

console.log("Total nodes:", Object.keys(navigation).length);
console.log("Deterministic:", Object.keys(deterministicResults).length);
console.log("Sent to AI:", aiNodes.length);

const batches = chunkArray(aiNodes, BATCH_SIZE);


// =====================================================
// 4️⃣ PROMPT
// =====================================================

function buildPrompt(batch) {
  return `
You are a STRICT taxonomy classifier for Pakistani women's fashion brands.

IMPORTANT:
We are classifying NAVIGATION NODES from a fashion website.

Your job is ONLY to:
1) Map nodes to existing categories (from provided list)
2) Map nodes to existing occasions (from provided list)
3) Suggest a new category/occasion ONLY if it clearly represents a real fashion style or real-life event

-------------------------------------------------------
🚫 ABSOLUTE EXCLUSION RULES (IGNORE THESE COMPLETELY)
-------------------------------------------------------

If the node represents ANY of the following, return EMPTY ARRAYS:

SUIT STRUCTURE / PIECES:
- 2 piece, two piece
- 3 piece, three piece
- kurta, kameez, shirt, top, blouse, tunic
- pant, pants, shalwar, trouser
- dupatta, shawl, stole, cape

STITCH TYPES:
- ready to wear
- ready-to-wear
- rtw
- tailored
- stitched
- fabrics
- unstitched

NAVIGATION / MARKETING / STRUCTURE:
- sale
- flat
- just_in
- new_in
- restock
- best_sellers
- numeric discounts (30, 35, 40, 50, 70 etc.)
- generic collection names
- lookbook
- studio
- marketing slogans
- decorative phrases
- brand campaign names

If it FEELS like product structure, garment part, stitching type, discount, navigation, or marketing → RETURN EMPTY ARRAYS.

DO NOT classify garment types.
DO NOT classify stitching types.
DO NOT classify discount nodes.
DO NOT classify navigation structure.
DO NOT classify product components.

-------------------------------------------------------
✅ WHAT YOU ARE ALLOWED TO CLASSIFY
-------------------------------------------------------

ONLY classify if it clearly represents:

1) A fashion style category
   (formal, casual, festive, luxury, party-wear, etc.)

OR

2) A Pakistani cultural/religious/life event
   (eid, ramadan, mehndi, nikah, wedding, etc.)

Global events are allowed ONLY if commonly celebrated in Pakistan.

If a node contains an existing occasion word 
(e.g. ramadan, eid, mehndi, nikah, wedding)
you MUST map it to that occasion.
If a node refers to a sub-event, synonym, or related term of any listed occasion (e.g., iftar → ramadan), you MUST map it to the exact parent occasion from the provided list and MUST NOT create a new occasion.

-------------------------------------------------------
⚠️ NEW CATEGORY RULE
-------------------------------------------------------

Only create a new category or new occasion if:
- It clearly represents a REAL fashion style
OR
- It clearly represents a REAL cultural/religious/life event

DO NOT convert navigation keys into categories.
DO NOT invent categories from structure words.
If uncertain → return empty arrays.

-------------------------------------------------------

Return STRICT JSON only.

Format:
{
  "node_key": {
    "mapped_categories": [],
    "new_categories": [],
    "mapped_occasions": [],
    "new_occasions": []
  }
}

Existing Categories:
${JSON.stringify(categories)}

Existing Occasions:
${JSON.stringify(occasions)}

Nodes:
${JSON.stringify(batch)}
`;
}


// =====================================================
// 5️⃣ AI CALL
// =====================================================

async function classifyBatch(batch) {
  const prompt = buildPrompt(batch);

  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0,
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Return ONLY valid JSON." },
        { role: "user", content: prompt }
      ]
    });

    return JSON.parse(response.choices[0].message.content);

  } catch (err) {
    console.error("API Error:", err);
    return {};
  }
}


// =====================================================
// 6️⃣ MAIN
// =====================================================

async function run() {

  // Start with deterministic results
  let allResults = { ...deterministicResults };

  // Run AI only for remaining nodes
  for (let i = 0; i < batches.length; i++) {
    console.log(`Processing batch ${i + 1}/${batches.length}`);
    const result = await classifyBatch(batches[i]);
    allResults = { ...allResults, ...result };
  }

  // Merge back into navigation
  for (const key in navigation) {
    const result = allResults[key] || {
      mapped_categories: [],
      new_categories: [],
      mapped_occasions: [],
      new_occasions: []
    };

    navigation[key] = {
      ...navigation[key],
      ...result
    };
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(navigation, null, 2));

  console.log("✅ Classification complete.");
}

run();