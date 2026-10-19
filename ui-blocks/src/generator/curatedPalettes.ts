// Hand-picked colour pairs (a main colour and a second colour that goes with it), the way a designer would choose them.
// The colour brain (colorBrain.ts) takes one of these for most sites and works the page colours (tinted backgrounds, text, borders, dark mode)
// out of it; the formula is the fallback. Add your own lines here: [name, main hex, second hex, the business types it suits].
import type { ThemeKey } from './themes'

export type Curated = { name: string; accent: string; alt: string; themes: (ThemeKey | 'any')[] }

type Row = [string, string, string, (ThemeKey | 'any')[]]
const ROWS: Row[] = [
  ['Midnight Indigo', '#4f46e5', '#f59e0b', ['modern_tech', 'education', 'general_business']],
  ['Ocean Teal', '#0d9488', '#f97316', ['healthcare', 'travel_tourism', 'general_business', 'beauty_wellness']],
  ['Sunset Coral', '#e11d48', '#fb923c', ['playful_vibrant', 'food_dining', 'fashion_retail']],
  ['Royal Violet', '#7c3aed', '#ec4899', ['creative_studio', 'modern_tech', 'events_wedding']],
  ['Forest Sage', '#15803d', '#ca8a04', ['organic_nature', 'nonprofit', 'pets_animals']],
  ['Burnt Terracotta', '#c2410c', '#0f766e', ['food_dining', 'home_services', 'real_estate']],
  ['Navy and Gold', '#1e3a8a', '#d4a017', ['professional_services', 'luxury_minimal', 'real_estate']],
  ['Berry Blush', '#be185d', '#7c3aed', ['beauty_wellness', 'fashion_retail', 'events_wedding']],
  ['Fresh Lime', '#4d7c0f', '#0ea5e9', ['bold_fitness', 'organic_nature', 'pets_animals']],
  ['Crimson Amber', '#b91c1c', '#f59e0b', ['bold_fitness', 'automotive', 'food_dining']],
  ['Sky Fresh', '#0284c7', '#14b8a6', ['healthcare', 'education', 'home_services']],
  ['Plum Rose', '#86198f', '#fb7185', ['beauty_wellness', 'events_wedding', 'creative_studio']],
  ['Mint and Indigo', '#059669', '#6366f1', ['healthcare', 'modern_tech', 'general_business']],
  ['Amber and Cobalt', '#b45309', '#1d4ed8', ['food_dining', 'home_services', 'luxury_minimal']],
  ['Slate Cyan', '#0e7490', '#e11d48', ['modern_tech', 'professional_services', 'automotive']],
  ['Peach and Violet', '#ea580c', '#7c3aed', ['playful_vibrant', 'food_dining', 'education']],
  ['Emerald and Gold', '#047857', '#d97706', ['luxury_minimal', 'nonprofit', 'travel_tourism']],
  ['Magenta Pop', '#c026d3', '#06b6d4', ['creative_studio', 'playful_vibrant', 'fashion_retail']],
  ['Ink Blue and Orange', '#1d4ed8', '#f97316', ['general_business', 'professional_services', 'automotive']],
  ['Rose and Bronze', '#be123c', '#b45309', ['beauty_wellness', 'events_wedding', 'luxury_minimal']],
  ['Teal and Coral', '#0f766e', '#fb7185', ['beauty_wellness', 'healthcare', 'pets_animals']],
  ['Cobalt and Lemon', '#2563eb', '#eab308', ['education', 'modern_tech', 'general_business']],
  ['Burgundy and Teal', '#881337', '#0d9488', ['luxury_minimal', 'food_dining', 'fashion_retail', 'events_wedding']],
  ['Moss and Terracotta', '#4d7c0f', '#c2410c', ['organic_nature', 'home_services', 'pets_animals']],
  ['Indigo Pink', '#4338ca', '#f472b6', ['creative_studio', 'modern_tech', 'playful_vibrant']],
  ['Lagoon and Sun', '#0891b2', '#f59e0b', ['travel_tourism', 'beauty_wellness', 'pets_animals']],
  ['Copper and Navy', '#9a3412', '#1e40af', ['automotive', 'home_services', 'real_estate']],
  ['Violet and Green', '#6d28d9', '#16a34a', ['beauty_wellness', 'education', 'creative_studio']],
  ['Tangerine and Petrol', '#c2410c', '#0e7490', ['food_dining', 'travel_tourism', 'automotive']],
  ['Ruby and Graphite', '#be123c', '#334155', ['fashion_retail', 'luxury_minimal', 'professional_services']],
  ['Turquoise and Plum', '#0d9488', '#a21caf', ['creative_studio', 'beauty_wellness', 'playful_vibrant']],
  ['Sapphire and Mint', '#1d4ed8', '#10b981', ['healthcare', 'modern_tech', 'professional_services']],
  ['Golden Olive', '#a16207', '#166534', ['organic_nature', 'food_dining', 'luxury_minimal']],
  ['Candy and Blue', '#db2777', '#2563eb', ['playful_vibrant', 'education', 'fashion_retail']],
  ['Charcoal Orange', '#ea580c', '#1f2937', ['bold_fitness', 'automotive', 'home_services']],
  ['Sea Green and Sky', '#16a34a', '#0ea5e9', ['nonprofit', 'organic_nature', 'healthcare']],
  ['Aubergine and Lime', '#701a75', '#65a30d', ['creative_studio', 'beauty_wellness', 'fashion_retail']],
  ['Steel Blue and Amber', '#0369a1', '#f59e0b', ['professional_services', 'home_services', 'travel_tourism']],
  ['Poppy and Teal', '#e11d48', '#0d9488', ['food_dining', 'events_wedding', 'fashion_retail']],
  ['Violet and Gold', '#5b21b6', '#eab308', ['luxury_minimal', 'events_wedding', 'education']],
  ['Cedar and Spruce', '#92400e', '#0f766e', ['luxury_minimal', 'food_dining', 'real_estate']],
  ['Electric Indigo', '#6366f1', '#06b6d4', ['modern_tech', 'creative_studio', 'general_business']],
  ['Dusty Rose and Teal', '#9f1239', '#115e59', ['beauty_wellness', 'events_wedding', 'fashion_retail']],
  ['Spring Green and Pink', '#3f6212', '#db2777', ['organic_nature', 'playful_vibrant', 'nonprofit']],
  ['Deep Sea and Peach', '#155e75', '#fb923c', ['travel_tourism', 'healthcare', 'pets_animals']],
  ['Blush and Navy', '#be185d', '#1e3a8a', ['events_wedding', 'fashion_retail', 'beauty_wellness']],
  ['Saffron and Indigo', '#b45309', '#4f46e5', ['food_dining', 'nonprofit', 'education', 'any']],
  ['Peacock', '#0f766e', '#4f46e5', ['beauty_wellness', 'creative_studio', 'any']],
  ['Cherry and Cream Blue', '#dc2626', '#2563eb', ['bold_fitness', 'playful_vibrant', 'automotive']],
  ['Pine and Rust', '#166534', '#c2410c', ['organic_nature', 'home_services', 'real_estate']],
]

export const CURATED: Curated[] = ROWS.map(([name, accent, alt, themes]) => ({ name, accent, alt, themes }))

/** the palettes that suit a business type (those marked for any business too) */
export const curatedFor = (theme: ThemeKey): Curated[] => CURATED.filter((p) => p.themes.includes(theme) || p.themes.includes('any'))
