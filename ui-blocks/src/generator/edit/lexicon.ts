// The words people use to talk about a website, in English, Hinglish (Hindi in English letters) and Hindi: sections, pages, colours,
// tones, texts and the verbs of a request. Used by the edit parser (understand.ts).
import type { SectionKey, Tone } from './edits'

/** a term matches as a whole word (Devanagari and Latin alike; `\b` does not work for Devanagari) */
export const wordRegex = (terms: string[]) => new RegExp(`(?<![\\p{L}\\p{M}\\p{N}])(?:${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+')).join('|')})(?![\\p{L}\\p{M}\\p{N}])`, 'iu')

export const SECTION_TERMS: Record<SectionKey, string[]> = {
  stats: ['stats', 'statistics', 'stat', 'numbers', 'counters', 'counter', 'achievements', 'figures', 'metrics', 'ankde', 'आंकड़े', 'numbers section', 'स्टैट्स'],
  marquee: ['marquee', 'ticker', 'scrolling strip', 'scrolling text', 'scrolling words', 'moving text', 'keyword strip', 'keywords strip', 'keywords bar', 'keyword bar', 'मार्की', 'running text', 'scroll strip', 'sliding text'],
  features: ['features', 'सेवाओं', 'सेवाएँ', 'सेवाएं', 'feature', 'services', 'service', 'offerings', 'what we do', 'menu', 'programs', 'program', 'classes', 'treatments', 'courses', 'products', 'seva', 'सेवाएं', 'sevayein', 'facilities', 'फीचर्स', 'सर्विसेज', 'सेवा'],
  about: ['about us', 'about', 'our story', 'who we are', 'story', 'hamare baare mein', 'hamare bare me', 'hamare baare me', 'parichay', 'हमारे बारे में', 'about section', 'अबाउट', 'एबाउट', 'हमारे बारे', 'अबाउट अस'],
  steps: ['how it works', 'process', 'steps', 'working', 'our process', 'kaise kaam karta hai', 'how we work', 'timeline', 'स्टेप्स', 'स्टेप'],
  gallery: ['gallery', 'photos', 'photo', 'pictures', 'picture', 'images', 'image', 'pics', 'pic', 'portfolio', 'tasveer', 'tasveeren', 'tasvire', 'photo gallery', 'फोटो', 'तस्वीरें', 'work samples', 'गैलरी', 'फोटोज'],
  pricing: ['pricing', 'prices', 'price', 'plans', 'plan', 'packages', 'package', 'rates', 'rate', 'fees', 'fee', 'daam', 'dam', 'membership', 'memberships', 'pricing plans', 'cost', 'costs', 'कीमत', 'rate card', 'प्राइसिंग', 'प्लान', 'प्लान्स', 'दाम', 'रेट'],
  team: ['team', 'staff', 'our people', 'people', 'doctors', 'coaches', 'chefs', 'trainers', 'employees', 'meet the team', 'members', 'teachers', 'टीम', 'our team', 'स्टाफ', 'कर्मचारी'],
  testimonials: ['testimonials', 'testimonial', 'reviews', 'review', 'feedback', 'ratings', 'rating', 'what customers say', 'customer reviews', 'clients say', 'praise', 'customer feedback', 'रिव्यू', 'रिव्यूज', 'रिव्यूज़', 'रिव्यूज़', 'testimonial section', 'टेस्टिमोनियल', 'समीक्षा', 'ग्राहक समीक्षा'],
  blog: ['blog', 'blogs', 'news', 'articles', 'article', 'journal', 'posts', 'updates', 'latest news', 'ब्लॉग', 'खबरें', 'लेख'],
  faq: ['faq', 'faqs', 'questions', 'common questions', 'q&a', 'q and a', 'sawal', 'sawaal', 'frequently asked questions', 'frequently asked', 'सवाल', 'एफएक्यू', 'अक्सर पूछे जाने वाले सवाल'],
  cta: ['cta', 'call to action', 'call-to-action', 'banner', 'get started banner', 'action banner', 'bottom banner', 'cta banner', 'cta section', 'सीटीए'],
  contact: ['contact', 'contact form', 'contact us', 'get in touch', 'sampark', 'contact section', 'संपर्क', 'कॉन्टैक्ट', 'कांटेक्ट', 'कांटेक्ट फॉर्म'],
}

/** sections that have a page of their own in a multi-page site: the page key for each */
export const PAGE_OF_SECTION: Partial<Record<SectionKey, 'about' | 'services' | 'pricing' | 'team' | 'gallery' | 'blog' | 'faq'>> = {
  pricing: 'pricing',
  team: 'team',
  gallery: 'gallery',
  blog: 'blog',
  faq: 'faq',
  features: 'services',
  about: 'about',
}

/** colour words -> hex (the table of EDIT_SPEC.md) */
export const COLOR_HEX: Record<string, string> = {
  red: '#dc2626', orange: '#ea580c', yellow: '#eab308', green: '#16a34a', teal: '#0d9488', blue: '#2563eb', navy: '#1e3a8a', purple: '#7c3aed',
  pink: '#ec4899', brown: '#92400e', black: '#000000', white: '#ffffff', gray: '#6b7280', grey: '#6b7280', gold: '#ca8a04', golden: '#ca8a04',
  maroon: '#991b1b', 'sky blue': '#0ea5e9', skyblue: '#0ea5e9', lime: '#84cc16', cyan: '#06b6d4', violet: '#8b5cf6', indigo: '#4f46e5', magenta: '#c026d3',
  peach: '#fb923c', olive: '#65a30d', coral: '#f87171', crimson: '#dc2626', turquoise: '#0d9488', lavender: '#8b5cf6', beige: '#d6c7a1', silver: '#9ca3af',
  // Hinglish
  gulbi: '#ec4899', lal: '#dc2626', laal: '#dc2626', neela: '#2563eb', nila: '#2563eb', neeli: '#2563eb', hara: '#16a34a', hari: '#16a34a', peela: '#eab308', peeli: '#eab308',
  kala: '#000000', kaala: '#000000', kali: '#000000', safed: '#ffffff', safaid: '#ffffff', gulabi: '#ec4899', narangi: '#ea580c', jamuni: '#7c3aed',
  baingani: '#7c3aed', bhura: '#92400e', sunehri: '#ca8a04', aasmani: '#0ea5e9', asmani: '#0ea5e9', kesari: '#ea580c', dhoosar: '#6b7280',
  // more names (English)
  mint: '#2dd4a7', 'mint green': '#2dd4a7', emerald: '#059669', 'forest green': '#166534', forest: '#166534', 'bottle green': '#14532d', 'dark green': '#166534', 'light green': '#4ade80',
  sage: '#84a98c', jade: '#00a86b', 'olive green': '#65a30d', 'lime green': '#84cc16', 'royal blue': '#1d4ed8', cobalt: '#0047ab', sapphire: '#0f52ba', 'navy blue': '#1e3a8a',
  'baby blue': '#93c5fd', 'ice blue': '#bae6fd', 'powder blue': '#93c5fd', aqua: '#06b6d4', 'sea green': '#0d9488', denim: '#1e40af', 'midnight blue': '#172554', midnight: '#172554',
  charcoal: '#374151', 'dark gray': '#374151', 'dark grey': '#374151', 'light gray': '#9ca3af', 'light grey': '#9ca3af', slate: '#475569',
  marigold: '#f59e0b', mustard: '#ca8a04', amber: '#f59e0b', saffron: '#f97316', rust: '#b45309', copper: '#b45309', bronze: '#a16207', terracotta: '#c2410c', brick: '#b91c1c', 'brick red': '#b91c1c',
  burgundy: '#7f1d1d', wine: '#7f1d1d', ruby: '#be123c', cherry: '#be123c', scarlet: '#dc2626', 'dark red': '#991b1b', tomato: '#ef4444', salmon: '#fb7185', 'hot pink': '#ec4899',
  'baby pink': '#f9a8d4', 'light pink': '#f9a8d4', rose: '#f43f5e', blush: '#fda4af', fuchsia: '#d946ef', plum: '#7e22ce', 'dark purple': '#6b21a8', orchid: '#c084fc', lilac: '#c4b5fd', 'light purple': '#c4b5fd',
  chocolate: '#78350f', coffee: '#78350f', 'dark brown': '#78350f', sand: '#d4a373', khaki: '#a3a380', apricot: '#fdba74', lemon: '#facc15', 'light orange': '#fb923c', 'dark orange': '#c2410c', 'light yellow': '#fde047',
  peacock: '#0f766e', 'peacock blue': '#0f766e', 'bright blue': '#3b82f6', 'electric blue': '#2563eb', 'neon green': '#22c55e',
  // more names (Hinglish)
  haldi: '#eab308', mehendi: '#65a30d', gerua: '#ea580c', pista: '#86efac', tota: '#22c55e', badami: '#a16207', firozi: '#06b6d4', rani: '#db2777', sindoori: '#dc2626', neelam: '#1d4ed8', mor: '#0f766e',
  // Hindi
  लाल: '#dc2626', नीला: '#2563eb', हरा: '#16a34a', पीला: '#eab308', काला: '#000000', सफेद: '#ffffff', गुलाबी: '#ec4899', नारंगी: '#ea580c', बैंगनी: '#7c3aed', भूरा: '#92400e', सुनहरा: '#ca8a04', आसमानी: '#0ea5e9',
}

/** names that are also everyday words: they count as a colour only when the person talks about colours, buttons or the theme */
export const RISKY_COLORS = new Set(['wine', 'rose', 'sage', 'amber', 'mint', 'plum', 'ruby', 'jade', 'sand', 'rust', 'copper', 'bronze', 'brick', 'cherry', 'lemon', 'coffee', 'chocolate', 'salmon', 'tomato', 'mustard', 'denim', 'slate', 'blush', 'orchid', 'haldi', 'mor', 'rani', 'peacock', 'midnight', 'forest', 'coral', 'olive', 'lime', 'khaki', 'lilac', 'apricot'])

export const TONE_TERMS: Record<Tone, string[]> = {
  warmer: ['warmer', 'गर्म', 'warm', 'garam', 'garm', 'warm colors', 'warm colours', 'गर्म'],
  cooler: ['cooler', 'ठंडे', 'cool', 'thanda', 'thandi', 'thande', 'cool colors', 'cool colours', 'ठंडे'],
  vibrant: ['vibrant', 'brighter', 'bright', 'colourful', 'colorful', 'vivid', 'bold colors', 'bold colours', 'punchy', 'more colour', 'more color', 'saturated', 'rangeen', 'chatak', 'chatakdar', 'jyada colorful'],
  muted: ['muted', 'soft', 'softer', 'pastel', 'subtle', 'calm', 'calmer', 'toned down', 'tone down', 'less bright', 'halka rang', 'soft colors', 'soft colours'],
  darker: ['darker', 'गहरे', 'गहरा', 'deeper', 'gehra', 'gehre', 'gehri', 'dark shade', 'dark shades', 'गहरा'],
  lighter: ['lighter', 'हल्के', 'हल्का', 'halka', 'halke', 'halki', 'light shade', 'light shades', 'paler', 'हल्का'],
}

export const COLOR_NOUNS = ['colour', 'color', 'colours', 'colors', 'rang', 'rangs', 'shade', 'shades', 'theme', 'palette', 'रंग']

/** the words of a request */
export const VERBS = {
  remove: ['remove', 'nikaal', 'nikaal do', 'must go', 'zaroorat nahi', 'zarurat nahi', 'ki zaroorat nahi', 'kill', 'scrap the', 'strike', 'delete', 'hide', 'drop', 'get rid of', 'take out', 'take off', 'cut', 'skip', 'erase', 'discard', 'eliminate', 'hata', 'hatao', 'hata do', 'hatado', 'hatana', 'hata de', 'hataiye', 'nikal', 'nikalo', 'nikal do', 'mita', 'mitao', 'mita do', 'delete karo', 'band karo', 'हटा', 'हटाओ', 'हटा दो', 'हटाइए', 'हटाएं', 'निकाल', 'निकालो', 'मिटा', 'मिटाओ', 'डिलीट', 'हटा दें'],
  add: ['add', 'how about', 'is missing', 'would help', 'dikhane hain', 'new page', 'naya page', 'nayi page', 'new section', 'we need', 'missing', 'show', 'include', 'insert', 'put', 'create', 'bring', 'append', 'daal', 'daalo', 'dal', 'dalo', 'daal do', 'jodo', 'jod do', 'jod', 'dikhao', 'dikha do', 'lagao', 'laga do', 'banao', 'bana do', 'chahiye', 'want', 'need', 'enable', 'add karo', 'जोड़', 'जोड़ो', 'जोड़ें', 'डालो', 'डाल दो', 'दिखाओ', 'लगाओ', 'शामिल', 'ऐड'],
  negate: ["don't", 'dont', 'do not', 'no need', 'not needed', 'nahi chahiye', 'nahi chaiye', 'nhi chahiye', 'mat', 'without', 'bina', 'not want', "don't want", 'dont want', 'no ', 'नहीं चाहिए', 'नहीं चाहिये', 'मत'],
  rename: ['rename', 'call it', 'name it', 'naam', 'nam', 'name', 'नाम', 'called', 'brand name', 'rename it'],
  replace: ['replace', 'swap', 'substitute', 'instead of', 'ki jagah', 'ki jagah par', 'ke badle', 'jagah', 'की जगह', 'ko ... kar', 'change all'],
  undo: ['undo', 'undoo', 'undone', 'ctrl+z', 'ctrl z', 'one step back', 'step back', 'reverse that', 'reverse it', 'change it back', 'bring back the old', 'liked it before', 'scrap the last', 'scrap that', 'last edit', 'last wala change', 'jaisa pehle tha', 'peeche jao', 'back karo', 'last change hata', 'pichla change', 'cancel the last', 'go back', 'revert', 'wapas', 'wapis', 'pehle jaisa', 'pehle wala', 'back to before', 'previous', 'cancel that', 'take that back', 'undo karo', 'वापस', 'पहले जैसा', 'last change', 'pichla', 'pichli', 'pichhla', 'पिछला', 'पहले जैसा करो'],
  redo: ['redo', 'bring back what', 'just undid', 'what i undid', 'wapas laga do jo undo', 'do it again', 'i want that change back', 'put that change back', 'go forward', 'again please', 'फिर से लगाओ', 'take back the undo', 'cancel the undo', 'reodo', 're-do', 'ctrl y', 'ctrl+y', 'apply it again', 'apply again', 'bring that change back', 'bring the change back', 'reapply', 'reinstate', 'restore what', 'step forward', 'one step forward', 'aage badho', 'aage jao', 'phir se wahi', 'same change again', 'repeat that', 'do that again', 'one more time', 'ek baar aur lagao', 'phir se apply', 'change phir se', 'wo change wapas', 'wo wapas chahiye', 'wahi wapas', 'put the change back', 'रीडू', 'phir se', 'phir se lagao', 'dobara lagao', 'fir se lagao', 'bring it back', 'wapas lagao', 'apply again', 'put it back', 'dubara', 'दोबारा लगाओ'],
  reset: ['reset', 'शुरू से', 'सब कुछ पहले जैसा', 'सब पहले जैसा', 'restore defaults', 'default settings', 'jaisa shuru me tha', 'jaisa shuru mein tha', 'pehle jaisa sab', 'delete all my edits', 'wipe all', 'fresh start', 'all edits cancel', 'cancel everything', 'revert to the first', 'first version', 'sab kuch pehle', 'back to default', 'default par', 'default pe', 'back to original', 'wapas original', 'factory', 'sab changes', 'saare changes', 'sare changes', 'all changes', 'start over', 'start from scratch', 'original', 'sab changes hata', 'sab changes', 'sab hata do', 'sab kuch hata', 'clear all', 'remove all changes', 'undo everything', 'revert everything', 'sab wapas', 'सब हटा', 'discard all changes', 'सब कुछ हटा दो', 'रीसेट', 'default pe', 'default par', 'sab kuch pehle jaisa'],
}

export const FIELD_TERMS: Record<'heroTitle' | 'heroSubtitle' | 'heroButton' | 'featuresTitle' | 'aboutTitle' | 'ctaTitle' | 'contactTitle', string[]> = {
  heroButton: ['button', 'buttons', 'cta button', 'main button', 'hero button', 'btn', 'button text', 'button label', 'बटन', 'button ka text', 'button par'],
  heroSubtitle: ['subtitle', 'small text below headline', 'small text below the headline', 'text below headline', 'line below the heading', 'under the main heading', 'under the headline', 'under the heading', 'neeche wali line', 'line below headline', 'smaller line', 'sub title', 'subheading', 'sub heading', 'sub-heading', 'tagline', 'slogan', 'description', 'strapline', 'intro line', 'subline', 'caption', 'line below', 'text below the heading', 'text under the heading', 'text under headline', 'सबटाइटल'],
  heroTitle: ['headline', 'big line on top', 'big line', 'top line', 'main line on top', 'main headline', 'main heading', 'heading', 'main title', 'hero title', 'hero heading', 'hero text', 'hero headline', 'title', 'title of the page', 'page title', 'page heading', 'top heading', 'main line', 'main text', 'big heading', 'big text', 'हेडिंग', 'हेडलाइन', 'टाइटल'],
  featuresTitle: ['features title', 'features heading', 'services title', 'services heading', 'service heading', 'services section title', 'offerings title', 'menu title', 'menu heading'],
  aboutTitle: ['about title', 'about heading', 'about us title', 'about us heading', 'about section title', 'story title', 'about section heading'],
  ctaTitle: ['cta title', 'cta heading', 'banner title', 'banner heading', 'banner text', 'cta text', 'call to action title', 'call to action text', 'bottom banner text'],
  contactTitle: ['contact title', 'contact heading', 'contact us title', 'contact us heading', 'contact section title', 'contact section heading'],
}

export const TIER_TERMS = {
  normal: ['simple', 'simpel', 'simplify', 'simplified', 'simplest', 'normal', 'too much', 'tone it down', 'tone down', 'less fancy', 'toned down', 'bare', 'simpler', 'basic', 'minimal', 'plain', 'short', 'shorter', 'clean', 'sadha', 'sada', 'simple rakho', 'light weight', 'lightweight', 'less', 'compact', 'lean', 'सिंपल', 'सादा'],
  premium: ['premium', 'top quality', 'high quality', 'big company', 'bade brand', 'corporate', 'dizain premium', 'richer', 'upmarket', 'polish', 'polished', 'classy', 'classier', 'class', 'luxe', 'लग्ज़री', 'लग्जरी', 'लक्ज़री', 'upscale', 'sophisticated', 'stunning', 'luxury', 'luxurious', 'rich', 'fancy', 'fancier', 'pro', 'professional', 'high end', 'high-end', 'high class', 'expensive', 'grand', 'elegant', 'shandar', 'shaandaar', 'zabardast', 'bhari', 'prm', 'पर्सनल', 'प्रीमियम', 'full', 'complete', 'detailed', 'loaded'],
  better: ['better', 'sundar', 'khoobsurat', 'kuch aur sundar', 'amateur', 'fix the design', 'थोड़ा और अच्छा', 'अच्छा', 'upgrade karo', 'design upgrade', 'improve the design', 'nicer', 'improve', 'improved', 'upgrade', 'medium', 'bit more', 'thoda aur', 'thoda better', 'behtar', 'acha', 'accha', 'good looking', 'more polished'],
}

export const MOTION_TERMS = {
  topic: ['animation', 'animashun', 'animasion', 'fade-in', 'fade in', 'slide in', 'slide', 'animate the', 'movement', 'alive', 'hilta dulta', 'hilta-dulta', 'animated', 'static', 'distracting', 'एनिमेशन', 'मूवमेंट', 'animations', 'animated', 'motion', 'movement', 'effects', 'effect', 'transitions', 'transition', 'animate', 'एनीमेशन', 'एनिमेशन', 'fade', 'fade in', 'scroll effects', 'hover effects', 'एनिमेशन'],
  off: ['no', 'distracting', 'बंद', 'static', 'band', 'still', 'freeze', 'calm it down to nothing', 'stop', 'remove', 'disable', 'turn off', 'switch off', 'off', 'band', 'bina', 'without', 'nahi', 'mat', 'none', 'kill', 'static', 'freeze', 'zero', 'hatao', 'hata', 'बंद', 'हटाओ', 'नहीं'],
  subtle: ['less', 'dial down', 'slight', 'कम', 'enough', 'calm it down', 'calm', 'cut down', 'keep light', 'light', 'too much', 'kam karo', 'dheema', 'little', 'slight', 'subtle', 'kam', 'halka', 'halki', 'light', 'gentle', 'minimal', 'reduce', 'tone down', 'thoda', 'smooth', 'calm', 'soft'],
  rich: ['more', 'जोड़ो', 'ज़्यादा', 'ज्यादा', 'animated', 'badha do', 'badhao', 'crank up', 'on karo', 'on kar', 'feel alive', 'nicely', 'turn on', 'enable', 'chalu', 'rich', 'zyada', 'jyada', 'lots', 'add', 'full', 'heavy', 'maximum', 'max', 'extra', 'fancy', 'bahut', 'plenty', 'increase', 'wow', 'dynamic', 'lively', 'bold'],
}

/** parts of the page that can get a colour of their own, besides the sections (SECTION_TERMS) */
export const TARGET_TERMS: Record<'header' | 'hero' | 'footer', string[]> = {
  header: ['header', 'navbar', 'nav bar', 'nav', 'navigation', 'navigation bar', 'top bar', 'topbar', 'menu bar', 'top menu', 'हेडर', 'नेवबार'],
  hero: ['hero', 'hero section', 'first screen', 'top section', 'main section', 'first section', 'landing section', 'pehla section', 'पहला हिस्सा', 'हीरो', 'हीरो सेक्शन'],
  footer: ['footer', 'bottom bar', 'bottom section', 'last section', 'footer section', 'फुटर', 'neeche wala hissa'],
}

/** "a colour that goes with the main colour" */
export const HARMONY_TERMS = {
  complementary: ['complementary', 'complement', 'opposite colour', 'opposite color', 'opposite', 'contrasting', 'contrast colour', 'contrast color', 'ulta colour', 'ulta color', 'ulta rang', 'contrast'],
  analogous: ['analogous', 'matching', 'match', 'goes with', 'go with', 'suits', 'harmonious', 'neighbouring', 'similar colour', 'similar color', 'milta julta', 'matching colour'],
  triadic: ['triadic', 'three colour', 'three color', 'triad'],
  split: ['split complementary', 'split-complementary', 'split'],
}

/** the second colour of the palette */
export const SECOND_COLOR_TERMS = ['second colour', 'second color', 'secondary colour', 'secondary color', 'secondary', 'alt colour', 'alt color', 'dusra rang', 'dusra colour', 'dusra color', 'highlight colour', 'highlight color', 'accent two']

/** words that say "a colour like this thing" */
export const LIKE_WORDS = ['jaisa', 'jaise', 'jaisi', 'like', 'colour of', 'color of', 'rang of', 'shade of', 'inspired by', 'vibe', 'tone of', 'ka rang', 'ke jaisa', 'ke jaise']

/** things, places and moods that stand for a colour: "ocean", "sunset", "like Spotify", "trustworthy" (they count only when colours are the topic) */
export const THING_COLORS: Record<string, string> = {
  // nature
  ocean: '#0e7490', sea: '#0284c7', sky: '#38bdf8', river: '#0891b2', lake: '#0e7490', water: '#0ea5e9', ice: '#7dd3fc', snow: '#e0f2fe', cloud: '#94a3b8',
  sunset: '#f97316', sunrise: '#fb923c', dawn: '#fdba74', dusk: '#7c3aed', fire: '#ef4444', flame: '#f97316', lava: '#dc2626', ember: '#ea580c',
  forest: '#166534', jungle: '#15803d', grass: '#22c55e', leaf: '#16a34a', leaves: '#16a34a', moss: '#4d7c0f', garden: '#22c55e', nature: '#16a34a', tree: '#15803d', bamboo: '#65a30d',
  earth: '#92400e', soil: '#78350f', mud: '#78350f', clay: '#b45309', desert: '#d4a373', dune: '#d4a373', beach: '#fcd34d', stone: '#78716c', rock: '#57534e', mountain: '#475569',
  night: '#1e1b4b', midnight: '#172554', galaxy: '#4c1d95', moon: '#cbd5e1', star: '#facc15', sun: '#facc15', sunshine: '#facc15', gold: '#ca8a04',
  // food, flowers, things
  chai: '#a16207', tea: '#a16207', coffee: '#78350f', chocolate: '#78350f', honey: '#f59e0b', mango: '#f59e0b', banana: '#facc15', orange: '#ea580c', lemon: '#facc15', lime: '#84cc16',
  strawberry: '#e11d48', cherry: '#be123c', grape: '#7e22ce', grapes: '#7e22ce', blueberry: '#4338ca', pomegranate: '#be123c', watermelon: '#f43f5e', mint: '#2dd4a7', chilli: '#dc2626', turmeric: '#eab308', spinach: '#15803d', pumpkin: '#ea580c', carrot: '#f97316',
  rose: '#f43f5e', lotus: '#f472b6', jasmine: '#fef08a', marigold: '#f59e0b', lavender: '#8b5cf6', sunflower: '#facc15', orchid: '#c084fc', tulip: '#e11d48',
  diamond: '#7dd3fc', emerald: '#059669', ruby: '#be123c', sapphire: '#0f52ba', pearl: '#e5e7eb', copper: '#b45309', silver: '#9ca3af', steel: '#64748b', iron: '#475569',
  // Hinglish
  samundar: '#0284c7', aasman: '#38bdf8', ped: '#15803d', patta: '#16a34a', mitti: '#92400e', aag: '#ef4444', suraj: '#facc15', chand: '#cbd5e1', gulab: '#f43f5e', kamal: '#f472b6', shahad: '#f59e0b', dhoop: '#facc15',
  // moods (only with colour words: "trustworthy colours")
  trustworthy: '#2563eb', trust: '#2563eb', reliable: '#1d4ed8', energetic: '#ea580c', energy: '#ea580c', friendly: '#f59e0b', fresh: '#16a34a', natural: '#16a34a', eco: '#16a34a', organic: '#4d7c0f',
  romantic: '#e11d48', playful: '#d946ef', royal: '#6d28d9', youthful: '#06b6d4', medical: '#0d9488', techy: '#4f46e5', festive: '#ea580c', peaceful: '#0d9488', serious: '#1e3a8a', happy: '#facc15', cheerful: '#facc15',
  // brands
  'coca-cola': '#f40009', cocacola: '#f40009', coke: '#f40009', pepsi: '#004b93', facebook: '#1877f2', whatsapp: '#25d366', instagram: '#e4405f', spotify: '#1db954', netflix: '#e50914', amazon: '#ff9900',
  flipkart: '#2874f0', paytm: '#00baf2', phonepe: '#5f259f', zomato: '#e23744', swiggy: '#fc8019', starbucks: '#00704a', mcdonalds: '#ffc72c', "mcdonald's": '#ffc72c', ikea: '#0058a3', youtube: '#ff0000',
  linkedin: '#0a66c2', twitter: '#1d9bf0', google: '#4285f4', airbnb: '#ff5a5f', jio: '#0a2885', airtel: '#e40000', myntra: '#ff3f6c', tata: '#1e3a8a', ola: '#facc15', slack: '#4a154b', tiktok: '#fe2c55', snapchat: '#fffc00', pinterest: '#e60023', ferrari: '#dc2626', cadbury: '#4c1d95', amul: '#dc2626', lenskart: '#0ea5e9', nykaa: '#fc2779', bata: '#dc2626',
}
