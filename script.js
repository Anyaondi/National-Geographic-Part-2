/* ============================================================
   COUNTRY EXPLORER, PART 2: ASK THE FIELD GUIDE — script.js
   STUDENT STARTER
   ------------------------------------------------------------
   Last week (Part 1) you used a GET request:
     Request -> Receive -> Parse -> Display

   Today you'll use a POST request to talk to an AI:
     User Question + Country Data -> POST to AI -> Generated Answer -> Display

   The Part 1 Country Explorer is already finished below.
   Your job: Steps 1-6. If you finish, try Steps 7-10.
   ============================================================ */

// --- Element references (Part 1 — already done) --------------
const searchBtn = document.getElementById("searchBtn");
const countryInput = document.getElementById("countryInput");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("errorMessage");
const resultCard = document.getElementById("resultCard");
const flagImg = document.getElementById("flagImg");
const countryNameEl = document.getElementById("countryName");
const capitalEl = document.getElementById("capitalValue");
const regionEl = document.getElementById("regionValue");
const populationEl = document.getElementById("populationValue");
const languagesEl = document.getElementById("languagesValue");

// Part 2 elements that are already selected for you
const fieldGuideEl = document.getElementById("fieldGuide");
const guideCountryNameEl = document.getElementById("guideCountryName");

// OpenAI's Chat Completions endpoint.
// Your key lives in secrets.js as OPENAI_API_KEY.
// secrets.js is in .gitignore, so it never gets pushed to GitHub.
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

/* ============================================================
   STEP 1: Select the Field Guide elements and connect
   the Ask button.
   ------------------------------------------------------------
   Look in index.html for these ids:
     questionInput, askBtn, guideResponse
   Then add a click event listener to the Ask button that
   calls askFieldGuide.
   ============================================================ */
// TODO: const questionInput = ...
// TODO: const askBtn = ...
// TODO: const guideResponseEl = ...
// TODO: askBtn.addEventListener(...)
const questionInput = document.getElementById("questionInput");
const askBtn = document.getElementById("askBtn");
const guideResponseEl = document.getElementById("guideResponse");

askBtn.addEventListener("click", askFieldGuide);

/* ============================================================
   STEP 2 (part 1): Create a variable to remember the country.
   Start it as null (nothing explored yet).
   ============================================================ */
// TODO: let currentCountry = ...
let currentCountry = null;

// --- Part 1: connect the Explore button (already done) --------
searchBtn.addEventListener("click", fetchCountry);

async function fetchCountry() {
  const countryName = countryInput.value.trim();
  if (!countryName) return;

  showLoading();

  try {
    const API_KEY = "rc_live_01694549e599442ba7b39f4de6b23f11"; // REST Countries v5 key (same as Part 1)
    const url =
      `https://api.restcountries.com/countries/v5?q=${encodeURIComponent(countryName)}` +
      `&response_fields=names.common,capitals,region,population,languages,flag.url_png,flag.description`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    if (!response.ok) {
      throw new Error("Country not found");
    }

    const data = await response.json();
    const objects = data.data.objects;

    if (!objects || objects.length === 0) {
      throw new Error("Country not found");
    }

    const country = objects[0];

    countryNameEl.textContent = country.names.common;
    flagImg.src = country.flag.url_png;
    flagImg.alt = country.flag.description || `Flag of ${country.names.common}`;
    capitalEl.textContent = country.capitals[0].name;
    regionEl.textContent = country.region;
    populationEl.textContent = country.population.toLocaleString();
    languagesEl.textContent = country.languages
      .map((lang) => lang.name)
      .join(", ");

    hideLoading();
    resultCard.classList.remove("hidden");
    errorEl.classList.add("hidden");

    /* ----------------------------------------------------------
       STEP 2 (part 2): Save the country and show the Field Guide.
       1. Store `country` in currentCountry
       2. Put the country's name in guideCountryNameEl
       3. Remove the "hidden" class from fieldGuideEl
       ---------------------------------------------------------- */
    // TODO
    currentCountry = country;
    guideCountryNameEl.textContent = country.names.common;
    guideCountryNameEl.textContent = `Ask me anything about ${country.names.common}.`;
    guideResponseEl.className = "guide-response";
    fieldGuideEl.classList.remove("hidden");

  } catch (error) {
    hideLoading();
    resultCard.classList.add("hidden");
    fieldGuideEl.classList.add("hidden");
    errorEl.textContent = `We couldn't find "${countryName}". Check the spelling and try again.`;
    errorEl.classList.remove("hidden");
    console.error(error);
  }
}

/* ============================================================
   STEP 3: Create askFieldGuide()
   ------------------------------------------------------------
   Inside it:
   - Read the question from questionInput (use .trim())
   - If there is no currentCountry, show
     "Explore a country first" in guideResponseEl and return
   - If the question is empty, show "Type a question first"
     and return
   ============================================================ */
async function askFieldGuide() {
  const question = questionInput.value.trim();

  if (!currentCountry) {
    guideResponseEl.textContent = "Explore a country first, then ask your question!";
    return;
  }

  if (!question) {
    guideResponseEl.textContent = "Type a question first.";
    return;
  }
  // TODO: read and validate the question
   const systemPrompt = buildSystemPrompt(currentCountry);

  // STEP 8: add the new question to the running conversation
  conversation.push({ role: "user", content: question });

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversation,
  ];

  /* ----------------------------------------------------------
     STEP 6 (part 1): loading state — show "Thinking..."
     and disable the button so it can't be double-clicked.
     ---------------------------------------------------------- */
  guideResponseEl.textContent = "Consulting the field notes...";
  guideResponseEl.className = "guide-response thinking";
  askBtn.disabled = true;

  // STEP 10: show the question as a bubble right away
  addBubble("user", question);
  questionInput.value = "";

  /* ----------------------------------------------------------
     STEP 6 (part 2): wrap the request in try/catch
     ---------------------------------------------------------- */
  try {
    /* --------------------------------------------------------
       STEP 5: Send the POST request, parse, and display.
       -------------------------------------------------------- */
        const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model: "gpt-4o", messages: messages }),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log("Raw AI response:", data); // inspect the shape!

    const reply = data.choices[0].message.content;

    // STEP 8: remember what the AI said
    conversation.push({ role: "assistant", content: reply });

    // STEP 10: answer goes into a chat bubble; the status box resets.
    // (Core version, Step 5: guideResponseEl.textContent = reply;)
    addBubble("assistant", reply);
    guideResponseEl.textContent = "Ask a follow-up question.";
    guideResponseEl.className = "guide-response";
  } catch (error) {
    console.error(error);
    // Remove the unanswered question so history stays in sync
    conversation.pop();
    guideResponseEl.textContent =
      "The Field Guide couldn't answer right now. Please try again in a moment.";
    guideResponseEl.className = "guide-response guide-error";
  } finally {
    askBtn.disabled = false;
  }
}

/* ============================================================
   STEP 4 (helper) + STEP 7: the system prompt.
   Grounding: the country facts from Part 1 go in here.
   Guardrails: the client's four requirements go in here.
   ============================================================ */
function buildSystemPrompt(country) {
  const facts = [
    `Country: ${country.names.common}`,
    `Capital: ${country.capitals[0].name}`,
    `Region: ${country.region}`,
    `Population: ${country.population.toLocaleString()}`,
    `Languages: ${country.languages.map((lang) => lang.name).join(", ")}`,
  ].join("\n");

  return `You are the National Geographic Field Guide, a friendly expert who helps visitors learn about countries.

Here are verified facts about the country the visitor is exploring:
${facts}

Rules:
1. Only answer questions about ${country.names.common}: its geography, wildlife, culture, food, history, landmarks and people.
2. If the visitor asks about something unrelated, politely steer them back to ${country.names.common}.
3. Sound like National Geographic: curious, warm and family-friendly.
4. Keep every answer under 100 words.
5. Use the verified facts above when they are relevant. If you are not sure about something, say so instead of guessing.`;
}

/* ============================================================
   STRETCH — STEP 9: suggested question chips.
   Event delegation: one listener on the container
   handles every chip button inside it.
   ============================================================ */
suggestionsEl.addEventListener("click", (event) => {
  const chip = event.target.closest(".chip");
  if (!chip) return;
  questionInput.value = chip.dataset.question;
  askFieldGuide();
});

/* ============================================================
   STRETCH — STEP 10: chat bubbles.
   textContent (not innerHTML) keeps AI text from being
   treated as HTML. Always treat AI output as untrusted.
   ============================================================ */
function addBubble(role, text) {
  const bubble = document.createElement("div");
  bubble.className = `bubble ${role}`;
  bubble.textContent = text;
  chatLogEl.appendChild(bubble);
  bubble.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// --- Part 1 helpers --------------------------------------------
function showLoading() {
  loadingEl.classList.remove("hidden");
  errorEl.classList.add("hidden");
  resultCard.classList.add("hidden");
}

function hideLoading() {
  loadingEl.classList.add("hidden");
}
