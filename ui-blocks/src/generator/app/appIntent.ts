// Does the first prompt ask for a login and a dashboard? Only then the site gets the demo app from the start; otherwise it never does (it can still be asked for later in the chat).
// "gym website with login and dashboard" -> on;  "website for an analytics dashboard tool" -> nothing (the dashboard is what the business sells);  "without login" -> off.

const LOGIN = String.raw`(?:log\s*-?\s*in|login|sign\s*-?\s*in|signin|member(?:'?s)?\s+(?:area|login|portal)|user\s+(?:login|panel|accounts?|area)|admin\s+(?:panel|login|area)|customer\s+(?:portal|login|area)|client\s+(?:portal|login|area)|student\s+(?:portal|login)|account\s+area)`
const DASH = String.raw`(?:dashboard|control\s+panel)`
const REG = String.raw`(?:(?:register|registration|sign\s*-?\s*up|signup)\s+(?:page|system|screen|flow))`
const CUE = String.raw`(?:with|and|plus|aur|also|including|include|having|add|adding|ke\s+saath|saath|bhi|chahiye|chaiye|chahie|chahta|chahti|banao|bana\s+do|rakho|rakhna|dena|do)`
// the dashboard (or a login) as the product of the business, not as a part of the website: "dashboard software", "login system for ..."
const PRODUCT = String.raw`(?:\s+(?:software|tool|tools|app|apps|saas|platform|product|template|templates|design|designs|ui|kit)\b)`

const WANT = new RegExp(`(?<![\\p{L}])(?:${LOGIN}|${REG})(?![\\p{L}])|(?<![\\p{L}])${CUE}\\s+(?:a\\s+|an\\s+|the\\s+|user\\s+|admin\\s+|member\\s+|customer\\s+)?${DASH}(?![\\p{L}])|(?<![\\p{L}])${DASH}\\s+(?:ke\\s+saath|saath|bhi|chahiye|chaiye|chahie|add)(?![\\p{L}])`, 'iu')
const PRODUCT_RE = new RegExp(`${DASH}${PRODUCT}`, 'iu')
const NEGATIVE = new RegExp(`(?<![\\p{L}])(?:without|no|bina|mat|nahi|not|skip|don'?t\\s+(?:add|need|want))\\s+(?:any\\s+|a\\s+|an\\s+|the\\s+)?(?:${LOGIN}|${DASH}|${REG}|register|sign\\s*up)|(?:${LOGIN}|${DASH}|register|sign\\s*up)\\s+(?:nahi|mat|ki\\s+zarurat\\s+nahi|not\\s+needed|is\\s+not\\s+needed|not\\s+required)`, 'iu')

/** 'on': the prompt asks for it; 'off': it says no; undefined: it says nothing about it */
export function appIntent(prompt: string): 'on' | 'off' | undefined {
  if (NEGATIVE.test(prompt)) return 'off'
  const text = prompt.replace(PRODUCT_RE, ' ')
  return WANT.test(text) ? 'on' : undefined
}

const WORDS = String.raw`(?:${LOGIN}|${REG}|register|registration|sign\s*-?\s*up|signup|${DASH})`
const STRIP = new RegExp(`(?:\\s*(?:,|/|\\b(?:with|without|and|plus|aur|also|including|include|having|bina|no|not|ke\\s+saath|saath|bhi)\\b))?\\s*(?:any\\s+|a\\s+|an\\s+|the\\s+)?${WORDS}(?:\\s*(?:/|,|&|\\band\\b|\\baur\\b)\\s*${WORDS})*(?:\\s+(?:pages?|panel|area|system|screen|ke\\s+saath|saath|bhi|chahiye|chaiye|add\\s+karo|jodo|ke|nahi|mat))*`, 'giu')

/** the prompt without the words about the demo app, so that "login" and "dashboard" are never taken for the business, a service or a name */
export function stripAppRequest(prompt: string): string {
  if (appIntent(prompt) !== 'on' && !NEGATIVE.test(prompt)) return prompt
  return prompt.replace(STRIP, ' ').replace(/\s+([,.;:])/g, '$1').replace(/\s{2,}/g, ' ').replace(/[,;]\s*$/, '').trim()
}
