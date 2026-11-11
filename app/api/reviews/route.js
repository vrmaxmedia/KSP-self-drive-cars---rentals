import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/* =====================================================================
   SETTINGS (speed & model)
   ===================================================================== */
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash'; // Stable working model
const PARALLEL_CALLS = 2;      
const MAX_ROUNDS = 2;          
const CALL_TIMEOUT_MS = 12000; 
const MAX_OUTPUT_TOKENS = 300;
const HISTORY_SIZE = 60;       

/* =====================================================================
   BUSINESS PACK (KSP Self Drive Cars)
   ===================================================================== */
const PRODUCT_WORD = 'car';

const SEO_KEYWORDS = [
  'best self drive cars in pune',
  'car rental in wagholi',
  'ksp self drive cars',
  'self drive fortuner in pune',
  'affordable car rental pune',
  'self drive car near pune airport',
  'monthly car rental in pune',
  'luxury car rental pune',
];

const TOPICS = {
  condition: {
    id: 'condition',
    text: 'the car condition: clean mint condition, spotless, well-maintained, smooth driving and AC working perfectly',
    must: /condition|clean|spotless|maintain|smooth|car|gadi|saaf|new|fresh/i,
  },
  service: {
    id: 'service',
    text: 'the service and staff: polite, cooperative, quick verification, and smooth doorstep delivery',
    must: /service|staff|polite|cooperative|delivery|doorstep|help|team|behavior/i,
  },
  pricing: {
    id: 'pricing',
    text: 'the price and deposit: fair pricing, transparent rules, and instant security deposit refund with no hidden charges',
    must: /price|rate|deposit|refund|transparent|charge|money|paise|sasta|value/i,
  },
  trip: {
    id: 'trip',
    text: 'the road trip: comfortable outstation trip, smooth highway drive, perfect for family journey',
    must: /trip|journey|drive|family|outstation|highway|travel|mahabaleshwar|mumbai/i,
  },
  booking: {
    id: 'booking',
    text: 'the booking process: very easy online booking, quick response, and hassle-free pickup and drop',
    must: /booking|process|easy|quick|pickup|drop|hassle|fast/i,
  },
};

const ALL_TOPICS = ['condition', 'service', 'pricing', 'trip', 'booking'];

const CHIPS = {
  'Clean & Maintained': { id: 'chip_clean', text: 'the car was very clean and well-maintained', must: /clean|condition|maintain|smooth|car|saaf/i },
  'Doorstep Delivery': { id: 'chip_delivery', text: 'they provided quick doorstep delivery at the right time', must: /delivery|doorstep|time|home/i },
  'Smooth Booking': { id: 'chip_booking', text: 'the booking process was smooth and easy', must: /booking|process|easy|quick|fast/i },
  'Affordable Pricing': { id: 'chip_price', text: 'the rental rates were affordable with no hidden fees', must: /price|rate|affordable|budget|charge|money/i },
  'Instant Refund': { id: 'chip_refund', text: 'got the security deposit refunded instantly without any delay', must: /refund|deposit|instant|immediate|money/i },
  'Polite Staff': { id: 'chip_staff', text: 'the staff was very polite and supportive throughout', must: /staff|polite|cooperative|help|team|behavior/i },
  'Outstation Trips': { id: 'chip_trip', text: 'took the car for an outstation trip and it performed amazingly', must: /trip|journey|drive|outstation|highway|travel/i },
  'No Hidden Charges': { id: 'chip_hidden', text: 'transparent policies with absolutely no hidden charges', must: /transparent|hidden|charge|honest|clear/i },
};

const PERSONAS = [
  { id: 'frequent', text: 'a frequent traveler who rents cars often, compares KSP favorably to others' },
  { id: 'family', text: 'a family person who rented an SUV for a family road trip outside Pune' },
  { id: 'professional', text: 'a young IT professional from Pune who rented a car for a weekend getaway' },
  { id: 'practical', text: 'a highly practical customer who was happy about transparent pricing and quick refund' },
  { id: 'firsttimer', text: 'a first-time self-drive renter who had a smooth and stress-free experience' },
];

const WRITING_STYLES = [
  'neat spelling and proper grammar',
  'casual WhatsApp-style typing, relaxed',
  'all small letters, casual typing, no capital letters',
  'simple and slightly rough, one tiny spelling slip is fine',
];

const HINGLISH_LEVELS = [
  'mostly Hindi words, only a few English words like car, service, booking',
  'half Hindi, half English words',
  'Hindi grammar but many common English words mixed in',
];

const OPENERS = [
  'start directly with the recent trip you took with their car',
  'start directly by mentioning which car you rented',
  'start directly with the final conclusion (great service, best in Pune)',
  'start in the middle of a thought casually about the booking process',
  'start with how many days you rented the car for',
];

const ENDINGS = [
  'end with a small thanks or appreciation',
  'end by saying you would recommend them to friends and family',
  'end by saying you will rent from here again',
  'end with a short plain remark about the deal',
  'just stop naturally after your last point, no wrap-up line',
];

const BUYER_LINES = [
  'You rented it for a weekend trip.',
  'You rented it for a family function.',
  'You rented it for outstation travel.',
  'You rented it for office commute.',
];

const EXAMPLES = {
  ENGLISH: [
    'Rented a car for a weekend trip, vehicle was super clean and delivery was right on time',
    'Very smooth booking process, no hidden charges and security deposit was refunded immediately',
    'Car condition was excellent, drove all the way without any trouble, highly reliable service',
  ],
  HINGLISH: [
    'gadi ekdum saaf thi aur time par deliver kar di, trip bahut achhi rahi',
    'booking process ekdum easy tha, koi hidden charge nahi liya aur deposit bhi turant wapas mil gaya',
    'family ke sath bahar gaye the, car ki condition zabardast thi, sabko pasand aayi',
  ],
};

/* =====================================================================
   ENGINE
   ===================================================================== */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const chance = (p) => Math.random() < p;
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

function pickWeighted(items) {
  const total = items.reduce((s, i) => s + i.w, 0);
  let r = Math.random() * total;
  for (const i of items) {
    if ((r -= i.w) <= 0) return i;
  }
  return items[0];
}

const LENGTHS = [
  { w: 12, lines: 1, min: 7,  max: 11, rule: 'ONE short line, 7 to 10 words' },
  { w: 16, lines: 2, min: 13, max: 21, rule: 'TWO lines, 14 to 20 words' },
  { w: 30, lines: 3, min: 21, max: 31, rule: 'THREE lines, 22 to 30 words' },
  { w: 28, lines: 4, min: 30, max: 42, rule: 'FOUR lines, 32 to 40 words' },
  { w: 14, lines: 5, min: 40, max: 52, rule: 'FIVE lines, 42 to 50 words' },
];

function chooseLength(recent, minLines = 1) {
  const lens = recent.map((r) => r.lines).filter(Boolean);
  const l1 = lens[lens.length - 1];
  const l2 = lens[lens.length - 2];
  let pool = LENGTHS.filter((x) => x.lines >= minLines);

  if (l1 && l1 === l2) {
    const f = pool.filter((x) => x.lines !== l1);
    if (f.length) pool = f;
  }
  return pickWeighted(pool);
}

function choosePersona(recent) {
  const last = recent.map((r) => r.voice).filter(Boolean).slice(-4);
  const pool = PERSONAS.filter((v) => !last.includes(v.id));
  return pick(pool.length ? pool : PERSONAS);
}

function chooseTopic(recent) {
  const last = recent.map((r) => r.topic).filter(Boolean).slice(-2);
  const pool = ALL_TOPICS.filter((t) => !last.includes(t));
  return TOPICS[pick(pool.length ? pool : ALL_TOPICS)];
}

function chosenChips(body) {
  const labels = Array.isArray(body.selectedChips) ? body.selectedChips : [];
  return labels.filter((l) => typeof l === 'string' && CHIPS[l]).slice(0, 3).map((l) => ({ label: l, ...CHIPS[l] }));
}

function chooseFrom(list, key, recent, n = 3) {
  const last = recent.map((r) => r[key]).filter((v) => v !== undefined && v !== null).slice(-n);
  const pool = list.filter((x) => !last.includes(x));
  return pick(pool.length ? pool : list);
}

const BANNED_OPENINGS = [
  'Great', 'Best', 'Amazing', 'Excellent', 'Highly recommend', 'Bhai', 'Superb', 'Awesome', 'The staff here',
  'Outstanding', 'Fantastic', 'Wonderful', 'Perfect', 'Must visit', 'Trust me',
  'बहुत अच्छा', 'सबसे अच्छा', 'लाजवाब',
];

const AI_PHRASES = /seamless|hassle[- ]free|top[- ]notch|look no further|go-to|game[- ]changer|one[- ]stop|unparalleled|exceptional|impeccable|commendable|must[- ]visit|highly recommended|hands down|truly|delighted|kudos|—|–/i;

const DANGLING = new Set([
  'to', 'aur', 'ki', 'ke', 'ka', 'se', 'me', 'mein', 'par', 'pe', 'ko', 'toh',
  'and', 'but', 'the', 'a', 'an', 'of', 'in', 'on', 'for', 'with', 'at', 'that',
  'so', 'if', 'or', 'because', 'jo', 'jab', 'agar', 'lekin', 'ya', 'jaise', 'kyunki',
]);

const HINDI_WORDS = new Set([
  'hai', 'hain', 'nahi', 'nahin', 'bahut', 'bohot', 'bhot', 'mera', 'meri', 'mere', 'mujhe', 'hume',
  'aur', 'ki', 'ke', 'ka', 'ko', 'se', 'par', 'pe', 'tha', 'thi', 'kiya', 'mila', 'mil', 'gaya', 'gayi',
  'liya', 'wala', 'wale', 'jo', 'kaafi', 'accha', 'acha', 'achha', 'sach', 'yahan', 'yaha', 'kar', 'karke', 'raha',
  'rahe', 'rahi', 'laga', 'lagi', 'bilkul', 'ekdum', 'sab', 'kuch', 'koi', 'phir', 'fir', 'bhi', 'toh', 'lekin',
  'isliye', 'abhi', 'dekh', 'dekha', 'diya', 'dikhaya', 'samjhaya', 'sahi', 'dukaan', 'dukan', 'aap', 'aapne',
  'paise', 'kam', 'jyada', 'zyada', 'badhiya', 'mast', 'yaar', 'mein', 'yeh', 'ye', 'woh', 'wo', 'ne', 'hu', 'hun', 'tak', 'wahan', 'sabse',
]);

const HISTORY = []; 
const HITS = new Map(); 

const openingOf = (text) => text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean).slice(0, 3).join(' ');
const wordSet = (t) => new Set(t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2));

function tooSimilar(text, recentOpenings) {
  const open = openingOf(text);
  if (recentOpenings.includes(open)) return true;
  const ws = wordSet(text);
  for (const h of HISTORY) {
    if (h.open === open) return true;
    let inter = 0;
    for (const w of ws) if (h.ws.has(w)) inter++;
    const union = ws.size + h.ws.size - inter || 1;
    if (inter / union > 0.45) return true;
  }
  return false;
}

function remember(text) {
  HISTORY.push({ open: openingOf(text), ws: wordSet(text) });
  while (HISTORY.length > HISTORY_SIZE) HISTORY.shift();
}

function rateLimited(request) {
  const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const arr = (HITS.get(ip) || []).filter((t) => now - t < 5 * 60 * 1000);
  arr.push(now);
  HITS.set(ip, arr);
  if (HITS.size > 2000) {
    for (const [k, v] of HITS) if (!v.some((t) => now - t < 5 * 60 * 1000)) HITS.delete(k);
  }
  return arr.length > 25; 
}

function cleanReview(text) {
  return text
    .replace(/^["'`\s]+|["'`\s]+$/g, '')
    .replace(/\s*\n+\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\.{2,}/g, ' ')
    .replace(/\.\s+/g, ', ')
    .replace(/\.+$/g, '')
    .replace(/,\s*,/g, ',')
    .trim();
}

function fixCutOff(text) {
  let parts = text.trim().replace(/[,\-\s]+$/g, '').split(/\s+/);
  while (parts.length > 6) {
    const last = parts[parts.length - 1].toLowerCase().replace(/[^a-z]/g, '');
    if (!DANGLING.has(last)) break;
    parts.pop();
    parts = parts.join(' ').replace(/[,\-\s]+$/g, '').split(/\s+/);
  }
  return parts.join(' ');
}

function looksCutOff(text) {
  const last = text.split(/\s+/).pop().toLowerCase().replace(/[^a-z]/g, '');
  return DANGLING.has(last) || /[,\-]$/.test(text.trim());
}

function hindiCount(text) {
  return text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter((w) => HINDI_WORDS.has(w)).length;
}

function languageOk(text, language, words) {
  const h = hindiCount(text);
  if (language === 'HINGLISH') return h >= Math.max(2, Math.floor(words * 0.15));
  return h <= 2;
}

function startsBanned(text) {
  const t = text.trim().toLowerCase();
  return BANNED_OPENINGS.some((b) => t.startsWith(b.toLowerCase()));
}

function buildPrompt(body, recent) {
  const language = body.language === 'HINDI' ? 'HINGLISH' : 'ENGLISH';
  const businessName = String(body.businessName || 'KSP Self Drive Cars').slice(0, 120);
  const category = String(body.category || 'Car Rental Agency').slice(0, 200);
  const city = String(body.city || 'Wagholi, Pune').slice(0, 120);

  let chips = chosenChips(body);
  const minLines = chips.length >= 3 ? 4 : chips.length === 2 ? 3 : 1;
  const length = chooseLength(recent, minLines);
  const persona = choosePersona(recent);
  const topic = chips.length
    ? { id: chips[0].id, text: chips[0].text, must: chips[0].must }
    : chooseTopic(recent);
  const extraChips = chips.slice(1);
  const opener = chooseFrom(OPENERS, 'opener', recent, 3);
  const ending = chooseFrom(ENDINGS, 'ending', recent, 2);
  const style = pick(WRITING_STYLES);
  const hinglishLevel = pick(HINGLISH_LEVELS);
  const buyerLine = chance(0.5) ? pick(BUYER_LINES) + ' ' : '';

  const longEnough = length.lines >= 3;
  const mentionName = chance(0.3);
  const useEmoji = chance(0.05);

  const recentSeo = recent.map((r) => r.seo).filter(Boolean).slice(-8);
  const seoPool = SEO_KEYWORDS.filter((k) => !recentSeo.includes(k));
  const seo = chance(0.3) ? pick(seoPool.length ? seoPool : SEO_KEYWORDS) : null;

  const languageBlock =
    language === 'HINGLISH'
      ? `LANGUAGE (MOST IMPORTANT): Write in HINGLISH = Hindi sentences typed in English/Roman letters, like a customer on WhatsApp. Level: ${hinglishLevel}. Grammar must be Hindi (hai, tha, kiya, mila, nahi, bahut, aur etc.). Never write a full Devanagari script.`
      : `LANGUAGE (MOST IMPORTANT): Write in simple natural English like an Indian customer. Do not use Hindi words.`;

  const examples = shuffle(EXAMPLES[language]).slice(0, 3).map((e) => `- ${e}`).join('\n');

  const prompt = `${languageBlock}

You are ${persona.text}. ${buyerLine}You rented a car from this agency and are writing a Google Maps review.
Business: ${businessName} (${city}) | ${category}

Tone samples from other customers (only for feel, never copy words):
${examples}

THIS REVIEW:
- Main topic: ${topic.text}. The review must clearly be about this.
${extraChips.length ? `- ALSO naturally cover these points (all of them): ${extraChips.map((c) => c.text).join('; ')}.` : '- Stick to the main topic only.'}
- Writing style: ${style}.
- Opening: ${opener}.
${longEnough ? `- Ending: ${ending}.` : ''}
- Length: ${length.rule}. Stay inside this range.
${mentionName ? `- Mention the brand "${businessName}" once, naturally.` : '- Do not repeat the full brand name.'}
${seo ? `- If it fits naturally, include the phrase "${seo}".` : ''}
${useEmoji ? '- One emoji at the very end is allowed.' : '- No emojis.'}

HARD RULES:
- ONE single paragraph. No line breaks, bullets or title.
- Do NOT use a full stop (.) anywhere. Use commas, "aur"/"and", or just flow.
- Never start with: ${BANNED_OPENINGS.join(', ')}.
- Sound like a real customer, not an advertisement. No hashtags, keyword stuffing, no dashes. Avoid polished marketing words (seamless, hassle-free, top-notch, exceptional).
- End with a COMPLETE thought. Never stop mid-sentence.
- Output only the review text.`.replace(/\n{3,}/g, '\n\n').replace(/\n\n(- )/g, '\n$1');

  return { prompt, length, persona, topic, extraChips, opener, ending, seo, language };
}

async function callGemini(apiKey, payload, signal) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    }
  );
  const data = await res.json();
  return { res, data };
}

async function attempt(apiKey, body, recent, signal) {
  const built = buildPrompt(body, recent);
  const { prompt, length, persona, topic, extraChips, opener, ending, seo, language } = built;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: `Write the review for ${body.businessName} now.` }] }],
    systemInstruction: { parts: [{ text: prompt }] },
    generationConfig: {
      temperature: 1.0,
      topP: 0.95,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  try {
    let { res, data } = await callGemini(apiKey, payload, signal);

    if (!res.ok && /thinking/i.test(data?.error?.message || '')) {
      delete payload.generationConfig.thinkingConfig;
      ({ res, data } = await callGemini(apiKey, payload, signal));
    }
    if (!res.ok) return { ok: false, error: data?.error?.message || 'Gemini API request failed.' };

    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const raw = parts.filter((p) => !p.thought).map((p) => p.text || '').join('');
    const review = fixCutOff(cleanReview(raw));
    const words = review.split(/\s+/).filter(Boolean).length;

    if (!review) return { ok: false, error: 'Empty response from Gemini.' };
    if (candidate?.finishReason === 'MAX_TOKENS') return { ok: false, error: 'Response was cut off.' };
    if (looksCutOff(review)) return { ok: false, error: 'Review ended mid-sentence.' };
    if (words > length.max + 8) return { ok: false, error: 'Review too long.' };
    if (words < Math.floor(length.min * 0.75)) return { ok: false, error: 'Review too short.' };
    if (/[ऀ-ॿ]/.test(review)) return { ok: false, error: 'Devanagari used.' };
    if (AI_PHRASES.test(review)) return { ok: false, error: 'Robotic phrase used.' };
    if (startsBanned(review)) return { ok: false, error: 'Banned opening used.' };
    if (!languageOk(review, language, words)) return { ok: false, error: 'Wrong language style.' };
    if (!topic.must.test(review)) return { ok: false, error: 'Review missed the selected topic.' };
    if (extraChips.some((c) => !c.must.test(review))) return { ok: false, error: 'Review missed a selected keyword.' };
    const recentOpenings = recent.map((r) => r.open).filter(Boolean);
    if (tooSimilar(review, recentOpenings)) return { ok: false, error: 'Too similar to an earlier review.' };

    return {
      ok: true,
      review,
      meta: {
        lines: length.lines,
        voice: persona.id,
        topic: topic.id,
        opener,
        ending,
        seo: seo || null,
        open: openingOf(review),
      },
    };
  } catch (e) {
    return { ok: false, error: e?.name === 'AbortError' ? 'aborted' : e?.message || 'Request failed.', aborted: e?.name === 'AbortError' };
  }
}

function firstValid(tasks) {
  return new Promise((resolve) => {
    let pending = tasks.length;
    let firstError = null;
    for (const t of tasks) {
      t.then((r) => {
        if (r.ok) return resolve(r);
        if (!r.aborted && !firstError) firstError = r.error;
        if (--pending === 0) resolve({ ok: false, error: firstError || 'Failed to generate review draft.' });
      });
    }
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key not configured.' }, { status: 500 });
    }
    if (rateLimited(request)) {
      return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
    }

    const recent = (Array.isArray(body.recentLengths) ? body.recentLengths : [])
      .filter((r) => r && typeof r === 'object')
      .slice(-6);

    let lastError = 'Failed to generate review draft.';

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);

      const winner = await firstValid(
        Array.from({ length: PARALLEL_CALLS }, () => attempt(apiKey, body, recent, controller.signal))
      );

      clearTimeout(timer);
      controller.abort(); 

      if (winner.ok) {
        remember(winner.review);
        return NextResponse.json({ review: winner.review, meta: winner.meta });
      }
      lastError = winner.error;
    }

    throw new Error(lastError);
  } catch (error) {
    console.error('API Review Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate review draft.' },
      { status: 500 }
    );
  }
}
