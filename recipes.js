/* ==========================================================================
   Quick Pot & Fry — the recipe list
   ==========================================================================

   IMPORTANT — GLUTEN CHECKS ARE NOT DONE YET
   ------------------------------------------
   This file holds ONLY the 5 starter recipes the app shows.
   More draft recipes wait in recipes-drafts.js, which the app does NOT load
   (see README.md, "How to bring a draft recipe back").

   Every recipe below ships with:
       glutenChecked: false,  checkedBy: null,  checkedDate: null
   That means NONE of them has been checked for gluten. The App Builder wrote
   these recipes as a draft. Only the recipe owner (or someone they trust) should mark a
   recipe as checked, after reading every ingredient label. See README.md,
   section "How to mark a recipe as checked".

   While a recipe is not checked, the app always shows it with an amber
   "⚠ Not checked for gluten" label, and it never appears when the
   Gluten-free filter is On.

   HOW EACH RECIPE IS WRITTEN
   --------------------------
   id           short name used in web links, e.g. #/recipe/air-fryer-salmon
   name         the title people see
   emoji        the picture on the card (we use emoji instead of photos)
   color        background color behind the emoji
   appliance    "instantPot", "airFryer", or "both" (uses both appliances)
   servings     how many people it feeds
   times        minutes for each part. The app ADDS THEM ALL UP for "Total":
                  prep      chopping and measuring
                  preheat   air fryer warm-up
                  buildUp   Instant Pot coming up to pressure (an estimate,
                            it takes longer when the pot is fuller)
                  cook      the actual cooking
                  release   letting the Instant Pot pressure out
                  finish    resting, crisping, or other last steps
   glutenChecked  true only after a real person checked every label
   checkedBy      the name of the person who checked (must not be empty)
   checkedDate    the date they checked, written "YYYY-MM-DD" (a real date, not in the future)
                  A recipe shows green ONLY when all three are filled in correctly.
   containsGluten false ONLY for a recipe with no known gluten as written.
                  true for a recipe that contains gluten as written.
                  Anything other than exactly false (true, "false", missing)
                  counts as contains-gluten, so the recipe can NEVER show green.
   shortName    (optional) short name for timer chips and alarms, e.g. "Chili"
   glutenNote   which ingredients most need a label check
   crossContact reminder to wash shared pots and tools (shown in "Before you cook")
   familyNote   (optional) a short practical tip for cooking for a toddler,
                e.g. how spicy it is or how to cut it up
   familyNoteStep (optional) the step number (1 = first step) where the
                toddler tip is shown in the cooking view
   ingredients  list of { item, amount }
   steps        list of { text } — add timer: { minutes, label } for a timed step
   ========================================================================== */

window.RECIPES = [
  {
    id: "ip-chicken-taco-rice-bowls",
    shortName: "Taco bowls",
    name: "Instant Pot Chicken Taco Rice Bowls",
    emoji: "🌮",
    color: "#FCE3C8",
    appliance: "instantPot",
    servings: 4,
    times: { prep: 4, buildUp: 8, cook: 8, release: 5 },
    containsGluten: false,
    glutenChecked: false, checkedBy: null, checkedDate: null,
    crossContact: "Wash the pot, basket and tools well if they were used for foods with gluten.",
    glutenNote: "No packaged taco seasoning: use the single spices listed. Use plain chicken thighs, not self-basting, marinated or pre-seasoned. Check labels on canned tomatoes & each spice",
    familyNote: "Mild as written (ancho is a mild chile). Shred the chicken finely for little ones; add any hot sauce (check label) only to grown-up bowls. Use less salt for the toddler: season adult plates at the table",
    familyNoteStep: 6,
    ingredients: [
      { item: "Boneless chicken thighs, plain (not self-basting or pre-seasoned)", amount: "1½ lb" },
      { item: "Plain long-grain white rice (not a flavored mix)", amount: "1½ cups" },
      { item: "Water", amount: "1½ cups" },
      { item: "Canned diced tomatoes, no salt added (check label)", amount: "14 oz can" },
      { item: "Ground cumin (single spice, check label)", amount: "2 tsp" },
      { item: "Ground ancho chile, mild (single spice, check label; not taco seasoning)", amount: "1 tsp" },
      { item: "Garlic powder (single spice, check label)", amount: "1 tsp" },
      { item: "Salt", amount: "¾ tsp" },
      { item: "Lime", amount: "1" }
    ],
    steps: [
      { text: "Add the water, rice, tomatoes, spices and salt to the pot. Stir, then lay the chicken on top." },
      { text: "Lock the lid, set the valve to Sealing, and pressure cook on High for 8 minutes.", timer: { minutes: 8, label: "Pressure cook on High" } },
      { text: "Let the pressure come down on its own for 5 minutes.", timer: { minutes: 5, label: "Natural release" } },
      { text: "Carefully turn the valve to Venting to let the rest of the steam out. Keep your hands away from the steam." },
      { text: "Check the thickest piece of chicken reads 165°F; if not, seal and cook 2–3 more minutes." },
      { text: "Shred the chicken with two forks, stir it into the rice, and squeeze lime over the top." }
    ]
  },
  {
    id: "ip-sweet-potato-chili",
    shortName: "Chili",
    name: "Instant Pot Sweet Potato Chili",
    emoji: "🍠",
    color: "#F6D3B5",
    appliance: "instantPot",
    servings: 4,
    times: { prep: 8, buildUp: 10, cook: 8, release: 4 },
    containsGluten: false,
    glutenChecked: false, checkedBy: null, checkedDate: null,
    crossContact: "Wash the pot, basket and tools well if they were used for foods with gluten.",
    glutenNote: "No packaged chili powder or spice blend: single spices only. Check labels on canned beans, tomatoes & each spice",
    familyNote: "Mild. Mash the beans and sweet potato for the toddler's portion; cut sweet potato small. Optional: add heat to adult bowls at the table (check hot sauce label). Use less salt for the toddler: season adult plates at the table",
    familyNoteStep: 6,
    ingredients: [
      { item: "Sweet potatoes, in small ½-inch cubes", amount: "2 medium" },
      { item: "Onion, chopped", amount: "1" },
      { item: "Canned black beans, no salt added (check label)", amount: "2 cans (15 oz)" },
      { item: "Canned crushed tomatoes, no salt added (check label)", amount: "28 oz can" },
      { item: "Water", amount: "1 cup" },
      { item: "Ground cumin (single spice, check label)", amount: "2 tsp" },
      { item: "Sweet paprika (single spice, check label)", amount: "1 tsp" },
      { item: "Salt", amount: "¾ tsp" }
    ],
    steps: [
      { text: "Drain the beans and rinse them well in a strainer." },
      { text: "Pour the water into the pot first, then add the onion, sweet potatoes, rinsed beans, spices and salt." },
      { text: "Spoon the crushed tomatoes on top. Do not stir, so they don't burn on the bottom." },
      { text: "Lock the lid, set the valve to Sealing, and pressure cook on High for 8 minutes.", timer: { minutes: 8, label: "Pressure cook on High" } },
      { text: "Let the pressure come down on its own for 4 minutes, then carefully vent the rest.", timer: { minutes: 4, label: "Natural release" } },
      { text: "Stir well. Check the sweet potato is soft. Season adult plates at the table." }
    ]
  },
  {
    id: "ip-lentil-soup",
    shortName: "Lentil soup",
    name: "Instant Pot Lentil & Veggie Soup",
    emoji: "🥣",
    color: "#E8DCC4",
    appliance: "instantPot",
    servings: 6,
    times: { prep: 8, buildUp: 12, cook: 10, release: 10 },
    containsGluten: false,
    glutenChecked: false, checkedBy: null, checkedDate: null,
    crossContact: "Wash the pot, basket and tools well if they were used for foods with gluten.",
    glutenNote: "Uses water, not store broth. Sort and rinse the lentils well; choose lentils labeled gluten-free if possible. Check labels on canned tomatoes & cumin",
    familyNote: "Mild. Let the toddler's portion cool, then mash it or cut the vegetables small. Use less salt for the toddler: season adult plates at the table",
    familyNoteStep: 5,
    ingredients: [
      { item: "Dry brown lentils, labeled gluten-free if possible (check label)", amount: "1½ cups" },
      { item: "Onion, chopped", amount: "1" },
      { item: "Carrots, chopped small", amount: "2" },
      { item: "Celery, chopped", amount: "2 stalks" },
      { item: "Garlic, minced", amount: "3 cloves" },
      { item: "Canned diced tomatoes, no salt added (check label)", amount: "14 oz can" },
      { item: "Water", amount: "6 cups" },
      { item: "Ground cumin (single spice, check label)", amount: "1½ tsp" },
      { item: "Salt", amount: "1 tsp" },
      { item: "Lemon", amount: "1" }
    ],
    steps: [
      { text: "Sort and rinse the lentils well: spread them on a plate, pick out any stones or stray grains, then rinse in a strainer." },
      { text: "Add everything except the lemon to the pot and stir." },
      { text: "Lock the lid, set the valve to Sealing, and pressure cook on High for 10 minutes.", timer: { minutes: 10, label: "Pressure cook on High" } },
      { text: "Let the pressure come down on its own for 10 minutes, then carefully vent the rest.", timer: { minutes: 10, label: "Natural release" } },
      { text: "Check the carrots are fully soft; if not, seal and cook 2 more minutes. Stir in the lemon juice. Season adult plates at the table." }
    ]
  },
  {
    id: "af-salmon-broccoli",
    shortName: "Salmon",
    name: "Air Fryer Salmon & Broccoli",
    emoji: "🐟",
    color: "#DDEBF5",
    appliance: "airFryer",
    servings: 2,
    times: { prep: 5, preheat: 3, cook: 10 },
    containsGluten: false,
    glutenChecked: false, checkedBy: null, checkedDate: null,
    crossContact: "Wash the pot, basket and tools well if they were used for foods with gluten.",
    glutenNote: "Check label on dried dill",
    familyNote: "Mild. Remove any bones and flake the fish for the toddler. Cut the broccoli small and make sure it is soft. Use less salt for the toddler: season adult plates at the table",
    familyNoteStep: 4,
    ingredients: [
      { item: "Salmon fillets (about 6 oz each)", amount: "2" },
      { item: "Broccoli, cut into small florets", amount: "1 head" },
      { item: "Olive oil", amount: "1 tbsp" },
      { item: "Lemon", amount: "1" },
      { item: "Fresh garlic, minced", amount: "2 cloves" },
      { item: "Salt", amount: "¼ tsp" },
      { item: "Black pepper", amount: "¼ tsp" },
      { item: "Dried dill (single herb, check label)", amount: "1 tsp" }
    ],
    steps: [
      { text: "Preheat the air fryer to 400°F.", timer: { minutes: 3, label: "Preheat to 400°F" } },
      { text: "Toss the broccoli with half the oil and a pinch of salt. Rub the salmon with the rest of the oil, garlic, dill, salt and pepper." },
      { text: "Put the salmon and broccoli in the basket in one layer and air fry at 400°F for 10 minutes.", timer: { minutes: 10, label: "Air fry at 400°F" } },
      { text: "Check the salmon reads 145°F inside and flakes easily, and the broccoli is soft. If the broccoli is still firm, steam the toddler's portion for a few minutes instead of air frying it longer. Squeeze lemon over everything and serve." }
    ]
  },
  {
    id: "af-crispy-chicken-thighs",
    shortName: "Chicken thighs",
    name: "Air Fryer Crispy Chicken Thighs",
    emoji: "🍗",
    color: "#F8E7B9",
    appliance: "airFryer",
    servings: 4,
    times: { prep: 5, preheat: 3, cook: 14 },
    containsGluten: false,
    glutenChecked: false, checkedBy: null, checkedDate: null,
    crossContact: "Wash the pot, basket and tools well if they were used for foods with gluten.",
    glutenNote: "No packaged chicken seasoning or spice blend: single spices only. Use plain chicken, not self-basting or pre-seasoned. Check labels on paprika & garlic powder",
    familyNote: "Mild (smoked paprika is not hot). Cut into small pieces for the toddler and trim off crisp edges. Use less salt for the toddler: season adult plates at the table",
    familyNoteStep: 5,
    ingredients: [
      { item: "Boneless, skinless chicken thighs, plain (not self-basting or pre-seasoned)", amount: "1½ lb" },
      { item: "Olive oil", amount: "1 tbsp" },
      { item: "Smoked paprika (single spice, check label)", amount: "1½ tsp" },
      { item: "Garlic powder (single spice, check label)", amount: "1 tsp" },
      { item: "Salt", amount: "½ tsp" },
      { item: "Black pepper", amount: "½ tsp" }
    ],
    steps: [
      { text: "Preheat the air fryer to 400°F.", timer: { minutes: 3, label: "Preheat to 400°F" } },
      { text: "Pat the chicken dry. Rub it with the oil, paprika, garlic powder, salt and pepper." },
      { text: "Put the thighs in the basket in one layer and air fry at 400°F for 7 minutes.", timer: { minutes: 7, label: "Air fry at 400°F" } },
      { text: "Flip the thighs and air fry 7 minutes more.", timer: { minutes: 7, label: "Air fry, second side" } },
      { text: "Check the thickest piece reads 165°F inside; if not, air fry 2–3 more minutes. Rest 2 minutes, then serve." }
    ]
  }
];
