// Hand-picked colour pairs (a main colour and a second colour that goes with it), the way a designer would choose them.
// The colour brain (colorBrain.ts) takes one of these for most sites and works the page colours (tinted backgrounds, text, borders, dark mode)
// out of it; the formula is the fallback. Add your own lines here: [name, main hex, second hex, the business types it suits].
import type { ThemeKey } from './themes'

export type Curated = { name: string; accent: string; alt: string; themes: (ThemeKey | 'any')[] }

type Row = [string, string, string, (ThemeKey | 'any')[]]
const ROWS: Row[] = [
  ['Midnight Indigo', '#4f46e5', '#f59e0b', ['modern_tech', 'education', 'general_business']],
  ['Ocean Teal', '#0d9488', '#f97316', ['healthcare', 'travel_tourism', 'general_business', 'beauty_wellness']],
  ['Burnt Terracotta', '#c2410c', '#0f766e', ['food_dining', 'home_services', 'real_estate']],
  ['Navy and Gold', '#1e3a8a', '#d4a017', ['professional_services', 'luxury_minimal', 'real_estate']],
  ['Crimson Amber', '#b91c1c', '#f59e0b', ['bold_fitness', 'automotive', 'food_dining']],
  ['Sky Fresh', '#0284c7', '#14b8a6', ['healthcare', 'education', 'home_services']],
  ['Amber and Cobalt', '#b45309', '#1d4ed8', ['food_dining', 'home_services', 'luxury_minimal']],
  ['Slate Cyan', '#0e7490', '#e11d48', ['modern_tech', 'professional_services', 'automotive']],
  ['Emerald and Gold', '#047857', '#d97706', ['luxury_minimal', 'nonprofit', 'travel_tourism']],
  ['Ink Blue and Orange', '#1d4ed8', '#f97316', ['general_business', 'professional_services', 'automotive']],
  ['Rose and Bronze', '#be123c', '#b45309', ['beauty_wellness', 'events_wedding', 'luxury_minimal']],
  ['Teal and Coral', '#0f766e', '#fb7185', ['beauty_wellness', 'healthcare', 'pets_animals']],
  ['Burgundy and Teal', '#881337', '#0d9488', ['luxury_minimal', 'food_dining', 'fashion_retail', 'events_wedding']],
  ['Indigo Pink', '#4338ca', '#f472b6', ['creative_studio', 'modern_tech', 'playful_vibrant']],
  ['Lagoon and Sun', '#0891b2', '#f59e0b', ['travel_tourism', 'beauty_wellness', 'pets_animals']],
  ['Copper and Navy', '#9a3412', '#1e40af', ['automotive', 'home_services', 'real_estate']],
  ['Tangerine and Petrol', '#c2410c', '#0e7490', ['food_dining', 'travel_tourism', 'automotive']],
  ['Ruby and Graphite', '#be123c', '#334155', ['fashion_retail', 'luxury_minimal', 'professional_services']],
  ['Golden Olive', '#a16207', '#166534', ['organic_nature', 'food_dining', 'luxury_minimal']],
  ['Charcoal Orange', '#ea580c', '#1f2937', ['bold_fitness', 'automotive', 'home_services']],
  ['Steel Blue and Amber', '#0369a1', '#f59e0b', ['professional_services', 'home_services', 'travel_tourism']],
  ['Poppy and Teal', '#e11d48', '#0d9488', ['food_dining', 'events_wedding', 'fashion_retail']],
  ['Cedar and Spruce', '#92400e', '#0f766e', ['luxury_minimal', 'food_dining', 'real_estate']],
  ['Electric Indigo', '#6366f1', '#06b6d4', ['modern_tech', 'creative_studio', 'general_business']],
  ['Dusty Rose and Teal', '#9f1239', '#115e59', ['beauty_wellness', 'events_wedding', 'fashion_retail']],
  ['Deep Sea and Peach', '#155e75', '#fb923c', ['travel_tourism', 'healthcare', 'pets_animals']],
  ['Blush and Navy', '#be185d', '#1e3a8a', ['events_wedding', 'fashion_retail', 'beauty_wellness']],
  ['Saffron and Indigo', '#b45309', '#4f46e5', ['food_dining', 'nonprofit', 'education', 'any']],
  ['Pine and Rust', '#166534', '#c2410c', ['organic_nature', 'home_services', 'real_estate']],
  // clean pairs added for the business types that lost their loud ones: a neighbour or a muted opposite, never two strong colours a third of the wheel apart
  ['Tomato and Cream', '#c4321a', '#e1b872', ['playful_vibrant', 'food_dining', 'fashion_retail']],
  ['Sunny Orange and Teal', '#c2570c', '#2f857f', ['playful_vibrant', 'food_dining', 'education', 'pets_animals']],
  ['Bubblegum and Berry', '#be2a63', '#8e3aa6', ['playful_vibrant', 'beauty_wellness', 'fashion_retail']],
  ['Sky and Sunshine', '#1971c2', '#d9a21b', ['education', 'playful_vibrant', 'pets_animals', 'general_business']],
  ['Grass and Sun', '#2b8a3e', '#d99a14', ['pets_animals', 'nonprofit', 'education', 'organic_nature']],
  ['Ocean and Coral', '#0b6f80', '#f08080', ['travel_tourism', 'healthcare', 'beauty_wellness', 'playful_vibrant']],
  ['Navy and Sky', '#1c4e8a', '#4a9fe0', ['professional_services', 'education', 'general_business', 'modern_tech']],
  ['Teal and Mint', '#0b7a75', '#5fbfa9', ['healthcare', 'beauty_wellness', 'general_business']],
  ['Indigo and Cyan', '#4150c9', '#1593a8', ['modern_tech', 'creative_studio', 'education']],
  ['Rust and Sand', '#b0451a', '#d4b483', ['home_services', 'food_dining', 'real_estate']],
  ['Emerald and Mint', '#0a7c5a', '#7cc9a8', ['organic_nature', 'nonprofit', 'healthcare', 'beauty_wellness']],
  ['Plum and Orchid', '#7a2a7f', '#c47cc9', ['beauty_wellness', 'creative_studio', 'events_wedding', 'fashion_retail']],
]

export const CURATED: Curated[] = ROWS.map(([name, accent, alt, themes]) => ({ name, accent, alt, themes }))

/** the palettes that suit a business type (those marked for any business too) */
export const curatedFor = (theme: ThemeKey): Curated[] => CURATED.filter((p) => p.themes.includes(theme) || p.themes.includes('any'))
