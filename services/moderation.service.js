const axios = require('axios');

// SECURITY FEATURE #11 — Comprehensive spam keyword filter
const SPAM_KEYWORDS = [
  'whatsapp me', 'call me on', 'my number is', 'reach me on', 'send money',
  'wire transfer', 'bitcoin', 'forex', 'investment opportunity', 'follow my page',
  'click here', 'dm me', 'hit me up', 'contact me on', 'ping me', 'add me on',
  'my ig is', 'my snap is', 'my tele is', 'telegram me', 'my cash app',
  'bank transfer', 'crypto payment', 'make money', 'earn daily', 'guaranteed profit'
];

// Categories we actually block via OpenAI moderation.
// FantasyNG is 18+ — adult/sexual content between consenting adults is ALLOWED.
// We only block content that is illegal, dangerous or truly harmful.
const BLOCKED_CATEGORIES = [
  'sexual/minors',          // ZERO TOLERANCE — illegal, always blocked
  'hate',                   // Hate speech
  'hate/threatening',       // Threatening hate speech
  'harassment',             // Targeted harassment
  'harassment/threatening', // Threatening harassment
  'self-harm',              // Self-harm content
  'self-harm/intent',       // Expressed intent to self-harm
  'self-harm/instructions', // Instructions for self-harm
  'violence',               // Violent content
  'violence/graphic'        // Graphic violence
  // NOTE: 'sexual' is intentionally NOT listed here.
  // Adult content between consenting adults is normal on this platform.
  // 'sexual/minors' remains blocked with zero tolerance.
];

// SECURITY FEATURE #12 — OpenAI moderation API (adult-content aware)
const moderateText = async (text) => {
  if (!process.env.OPENAI_API_KEY) return { flagged: false };
  try {
    const r = await axios.post(
      'https://api.openai.com/v1/moderations',
      { input: text },
      { headers: { Authorization: 'Bearer ' + process.env.OPENAI_API_KEY }, timeout: 5000 }
    );
    const result = r.data.results[0];

    // Only flag if a BLOCKED category is triggered — not 'sexual'
    const flaggedHarmfulCategories = BLOCKED_CATEGORIES.filter(
      category => result.categories[category] === true
    );

    const isFlagged = flaggedHarmfulCategories.length > 0;
    if (isFlagged) {
      console.warn('[Moderation] Content blocked. Categories:', flaggedHarmfulCategories.join(', '));
    }

    return {
      flagged: isFlagged,
      flaggedCategories: flaggedHarmfulCategories,
      categories: result.categories
    };
  } catch (err) {
    // If OpenAI is down, fail open — don't block legitimate content
    console.warn('OpenAI moderation unavailable:', err.message);
    return { flagged: false };
  }
};

// SECURITY FEATURE #11 — Spam check
const checkSpam = (text) => {
  const lower = text.toLowerCase();
  const foundKeywords = SPAM_KEYWORDS.filter(kw => lower.includes(kw));
  // SECURITY FEATURE #13 — External link & phone detection
  const hasExternalLink = /https?:\/\//i.test(text);
  const hasPhoneNumber = /(\+?234|0)[789][01]\d{8}/.test(text);
  return {
    isSpam: foundKeywords.length > 0,
    hasPhoneNumber,
    hasExternalLink,
    foundKeywords
  };
};

module.exports = { moderateText, checkSpam };
