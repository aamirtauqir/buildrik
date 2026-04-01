/**
 * AIPromptLibrary - Centralizes AI tone instructions and content type prompts
 * @module services/ai/AIPromptLibrary
 * @license BSD-3-Clause
 */

export type ContentType =
  | "headline"
  | "paragraph"
  | "tagline"
  | "cta"
  | "description"
  | "bullet-points"
  | "faq"
  | "testimonial"
  | "bio"
  | "meta-description"
  | "social-post"
  | "email-subject"
  | "email-body"
  | "feature-list"
  | "pricing-description"
  | "team-bio";

export type ToneType =
  | "professional"
  | "casual"
  | "friendly"
  | "formal"
  | "playful"
  | "urgent"
  | "inspirational"
  | "technical"
  | "conversational"
  | "authoritative"
  | "empathetic"
  | "witty";

export type LayoutStyle =
  | "modern"
  | "minimal"
  | "bold"
  | "elegant"
  | "corporate"
  | "creative"
  | "tech"
  | "ecommerce";

export type ImageSize = "small" | "medium" | "large" | "square" | "wide" | "tall";

export type ImageStyle =
  | "photo"
  | "illustration"
  | "3d"
  | "abstract"
  | "minimalist"
  | "vintage"
  | "futuristic";

export type ProgrammingLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "html"
  | "css"
  | "react"
  | "vue"
  | "sql";

export type CodeStyle = "concise" | "verbose" | "documented" | "minimal";

/** Content type suggestions */
export const CONTENT_TYPES: Record<ContentType, { label: string; description: string }> = {
  headline: { label: "Headline", description: "Attention-grabbing title" },
  paragraph: { label: "Paragraph", description: "Body text content" },
  tagline: { label: "Tagline", description: "Short memorable phrase" },
  cta: { label: "Call to Action", description: "Button or action text" },
  description: { label: "Description", description: "Product or service description" },
  "bullet-points": { label: "Bullet Points", description: "List of key points" },
  faq: { label: "FAQ", description: "Question and answer pair" },
  testimonial: { label: "Testimonial", description: "Customer review" },
  bio: { label: "Bio", description: "Person or company biography" },
  "meta-description": { label: "Meta Description", description: "SEO meta text" },
  "social-post": { label: "Social Post", description: "Social media content" },
  "email-subject": { label: "Email Subject", description: "Email subject line" },
  "email-body": { label: "Email Body", description: "Email content" },
  "feature-list": { label: "Feature List", description: "Product features with benefits" },
  "pricing-description": { label: "Pricing Description", description: "Pricing plan details" },
  "team-bio": { label: "Team Bio", description: "Team member biography" },
};

/** Tone suggestions */
export const TONES: Record<ToneType, { label: string; emoji: string }> = {
  professional: { label: "Professional", emoji: "💼" },
  casual: { label: "Casual", emoji: "😊" },
  friendly: { label: "Friendly", emoji: "👋" },
  formal: { label: "Formal", emoji: "🎩" },
  playful: { label: "Playful", emoji: "🎉" },
  urgent: { label: "Urgent", emoji: "⚡" },
  inspirational: { label: "Inspirational", emoji: "✨" },
  technical: { label: "Technical", emoji: "🔧" },
  conversational: { label: "Conversational", emoji: "💬" },
  authoritative: { label: "Authoritative", emoji: "📢" },
  empathetic: { label: "Empathetic", emoji: "❤️" },
  witty: { label: "Witty", emoji: "😄" },
};

export const TONE_INSTRUCTIONS: Record<ToneType, string> = {
  professional: "Business-appropriate, clear, concise. Credibility and expertise focused.",
  casual: "Relaxed, conversational. Contractions OK. Approachable and simple.",
  friendly: "Warm, welcoming. Inclusive language (we, you). Personable.",
  formal: "Sophisticated, proper grammar. Respectful. Official communications.",
  playful: "Fun, lighthearted. Creative wordplay. Energetic with personality.",
  urgent: "Action-oriented, time-sensitive. Create FOMO. Important and immediate.",
  inspirational: "Uplifting, motivational. Emotive language. Focus on possibilities.",
  technical: "Precise, industry-specific. Detailed and accurate. Expert audience.",
  conversational: "Direct dialogue. Rhetorical questions. Natural, casual transitions.",
  authoritative: "Confident, expert voice. Declarative statements. Back claims with specifics.",
  empathetic: "Understanding, compassionate. Acknowledge challenges. Supportive and caring.",
  witty: "Clever humor, wordplay. Smart but not condescending. Balance wit with clarity.",
};

export const CONTENT_TYPE_PROMPTS: Record<ContentType, (topic: string) => string> = {
  headline: (topic) =>
    `Create a compelling, attention-grabbing headline about: ${topic}. ` +
    "The headline should be concise (under 10 words), impactful, and make readers want to learn more.",

  paragraph: (topic) =>
    `Write a well-structured paragraph about: ${topic}. ` +
    "Include a clear topic sentence, supporting details, and smooth flow. Aim for 3-5 sentences.",

  tagline: (topic) =>
    `Create a memorable tagline or slogan for: ${topic}. ` +
    "It should be catchy, under 8 words, and capture the essence of the brand/product.",

  cta: (topic) =>
    `Write a compelling call-to-action for: ${topic}. ` +
    "Use action verbs, create urgency, and clearly communicate the value of taking action.",

  description: (topic) =>
    `Write a product or service description for: ${topic}. ` +
    "Highlight key features, benefits, and what makes it unique. Be specific and persuasive.",

  "bullet-points": (topic) =>
    `Create a list of 4-6 bullet points about: ${topic}. ` +
    "Each point should be concise, start with an action verb or key benefit, and add unique value.",

  faq: (topic) =>
    `Generate a frequently asked question and detailed answer about: ${topic}. ` +
    "Format as Q: [question] A: [answer]. Address common concerns or curiosities.",

  testimonial: (topic) =>
    `Write a realistic customer testimonial for: ${topic}. ` +
    "Include specific details about the experience, results achieved, and emotional impact. " +
    "Make it sound authentic and relatable. Format with the testimonial text followed by a name.",

  bio: (topic) =>
    `Write a professional biography for: ${topic}. ` +
    "Include background, expertise, achievements, and personality. Third person voice, 2-3 paragraphs.",

  "meta-description": (topic) =>
    `Write an SEO-optimized meta description for: ${topic}. ` +
    "Keep it under 155 characters, include relevant keywords, and compel clicks from search results.",

  "social-post": (topic) =>
    `Create an engaging social media post about: ${topic}. ` +
    "Make it shareable, include a hook, and end with engagement prompt. Suggest relevant hashtags.",

  "email-subject": (topic) =>
    `Write an email subject line for: ${topic}. ` +
    "Make it compelling, under 50 characters, and improve open rates. Avoid spam trigger words.",

  "email-body": (topic) =>
    `Write email body content for: ${topic}. ` +
    "Include a greeting, clear message, value proposition, and call-to-action. Keep it scannable.",

  "feature-list": (topic) =>
    `Create a feature list for: ${topic}. ` +
    "List 4-6 key features, each with a benefit statement explaining why it matters to users. " +
    "Format as: Feature Name: Brief description of the benefit.",

  "pricing-description": (topic) =>
    `Write compelling pricing plan descriptions for: ${topic}. ` +
    "Include plan name, key features, target audience, and value proposition. " +
    "Make each tier clearly differentiated and justify the price point.",

  "team-bio": (topic) =>
    `Write a team member biography for: ${topic}. ` +
    "Include their role, expertise, background, and a personal touch (hobby or fun fact). " +
    "Keep it professional yet personable. 2-3 sentences.",
};

/**
 * Builds an enhanced prompt by combining content type instructions,
 * tone presets, and the user's topic.
 *
 * Optimized to reduce token usage while maintaining quality.
 */
export function buildEnhancedPrompt(
  topic: string,
  contentType: ContentType,
  tone: ToneType
): string {
  const contentPrompt = CONTENT_TYPE_PROMPTS[contentType]?.(topic) || topic;
  const toneInstruction = TONE_INSTRUCTIONS[tone];

  // Compact format to reduce tokens
  return toneInstruction ? `${contentPrompt}\n\nTone: ${toneInstruction}` : contentPrompt;
}

/**
 * Type guard to check if a string is a valid ContentType
 */
export function isValidContentType(type: string): type is ContentType {
  return type in CONTENT_TYPE_PROMPTS;
}

/**
 * Type guard to check if a string is a valid ToneType
 */
export function isValidTone(tone: string): tone is ToneType {
  return tone in TONE_INSTRUCTIONS;
}
