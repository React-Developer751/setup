import type { WebsiteContent } from './finalPrompt'

// "japanese restaurant", "south indian cafe": the cuisine the person named replaces the pack's generic menu cards
const CUISINES: Record<string, { cards: [string, string][]; line: string }> = {
  japanese: { line: 'Japanese kitchen: sushi, ramen and grilled plates made to order.', cards: [['Sushi And Rolls', 'Fresh rolls and nigiri cut to order.'], ['Ramen And Noodles', 'Rich broths and noodles, made hot to order.'], ['Grilled Plates', 'Teriyaki and yakitori straight off the grill.'], ['Bento Boxes', 'A tidy lunch with rice, a main and sides.']] },
  chinese: { line: 'Chinese kitchen: noodles, momos and wok-fired plates made to order.', cards: [['Noodles And Fried Rice', 'Wok-tossed and served hot.'], ['Momos And Dim Sum', 'Steamed or fried, with a sharp dip.'], ['Soups And Starters', 'Hot and sour, manchow and crisp starters.'], ['Gravy Mains', 'Rich gravies to go with rice or noodles.']] },
  italian: { line: 'Italian kitchen: wood-fired pizza, fresh pasta and tiramisu.', cards: [['Wood Fired Pizza', 'Thin base, a blistered crust and fresh toppings.'], ['Fresh Pasta', 'Cooked al dente with sauces made in the kitchen.'], ['Antipasti And Salads', 'Small plates to start the table.'], ['Tiramisu And Desserts', 'A sweet end, made in house.']] },
  'north indian': { line: 'North Indian kitchen: tandoor, rich gravies and fresh breads.', cards: [['Tandoor Specials', 'Kebabs and tikkas from the clay oven.'], ['Rich Gravies', 'Dal makhani, paneer and slow-cooked curries.'], ['Fresh Breads', 'Naan, kulcha and roti, hot from the tandoor.'], ['Biryani And Rice', 'Fragrant rice, layered and slow cooked.']] },
  'south indian': { line: 'South Indian kitchen: crisp dosas, fluffy idlis and filter coffee.', cards: [['Dosa Varieties', 'Crisp and thin, with chutneys and sambar.'], ['Idli And Vada', 'Soft, fresh and served hot.'], ['Meals On Banana Leaf', 'A full spread of rice, curries and sides.'], ['Filter Coffee', 'Strong, frothy and made the traditional way.']] },
  mexican: { line: 'Mexican kitchen: tacos, burritos and fresh salsa.', cards: [['Tacos', 'Soft or crisp, filled to order.'], ['Burritos And Bowls', 'Rice, beans and fillings, your way.'], ['Nachos And Quesadillas', 'Made to share.'], ['Salsas And Guacamole', 'Fresh every day.']] },
  thai: { line: 'Thai kitchen: curries, noodles and bright fresh herbs.', cards: [['Thai Curries', 'Green, red and yellow, in coconut milk.'], ['Pad Thai And Noodles', 'Wok-fired with a squeeze of lime.'], ['Salads And Starters', 'Light, sharp and fresh.'], ['Rice Dishes', 'Basil, pineapple and fried rice.']] },
  korean: { line: 'Korean kitchen: bibimbap, fried chicken and barbecue.', cards: [['Bibimbap', 'Rice, vegetables and a spicy sauce.'], ['Korean Fried Chicken', 'Crisp, glazed and served hot.'], ['Barbecue Plates', 'Marinated and grilled at the table.'], ['Kimchi And Sides', 'Small plates to go with every meal.']] },
  french: { line: 'French kitchen: croissants, quiche and classic plates.', cards: [['Fresh Croissants', 'Buttery and baked each morning.'], ['Quiche And Savouries', 'Light plates for lunch.'], ['Classic Mains', 'Slow-cooked and plated with care.'], ['Patisserie', 'Tarts and eclairs, made in house.']] },
  lebanese: { line: 'Lebanese kitchen: hummus, shawarma and fresh pita.', cards: [['Mezze Platters', 'Hummus, baba ganoush and tabbouleh to share.'], ['Shawarma And Wraps', 'Carved to order and rolled hot.'], ['Grills', 'Skewers off the charcoal.'], ['Fresh Pita', 'Baked in house.']] },
  chai: { line: 'Chai tapri: kadak chai, bun maska and snacks served hot.', cards: [['Kadak Masala Chai', 'Brewed strong with ginger, cardamom and milk.'], ['Bun Maska And Toast', 'Soft, buttery and made to go with chai.'], ['Pakoda And Samosa', 'Fried fresh through the evening.'], ['Cutting Chai', 'Small cups for a quick break.']] },
  american: { line: 'American kitchen: burgers, fries and thick shakes.', cards: [['Burgers', 'Juicy patties on fresh buns.'], ['Fries And Sides', 'Crisp, hot and salted.'], ['Wings And Ribs', 'Smoky, sticky and made to share.'], ['Shakes', 'Thick and cold.']] },
}
const FOOD = /\b(?:tapri|chai|tea stall|restaurants?|cafes?|caf[eé]|diner|eatery|bistro|kitchen|dhaba)\b/i

const upperFirst = (t: string) => t.replace(/\b\w/g, (c) => c.toUpperCase())

export function withCuisine(content: WebsiteContent, prompt: string): WebsiteContent {
  if (!FOOD.test(prompt)) return content
  const key = /\b(?:tapri|chai|tea stall)\b/i.test(prompt) ? 'chai' : Object.keys(CUISINES).find((k) => new RegExp(`\\b${k}\\b`, 'i').test(prompt))
  if (!key) return content
  const { cards, line } = CUISINES[key]
  const filled = cards.map(([title, text]) => ({ title, text }))
  const rest = content.features.items.slice(filled.length)
  return {
    ...content,
    // the pack's menu stats ("Veg, non veg") and the kit's "from the oven" do not belong to another cuisine
    stats: key === 'chai' ? [{ value: 'Hot', label: 'Served fresh' }, { value: 'Kadak', label: 'Masala chai' }, { value: 'Quick', label: 'Takeaway' }] : [{ value: 'Fresh', label: 'Cooked to order' }, { value: upperFirst(key), label: 'Kitchen' }, { value: 'Family', label: 'Friendly seating' }],
    hero: { ...content.hero, subtitle: key !== 'chai' && line.length + content.hero.subtitle.length < 215 && !/oven/i.test(content.hero.subtitle) ? `${line} ${content.hero.subtitle}` : line },
    features: { ...content.features, items: [...filled, ...rest].slice(0, Math.max(filled.length, content.features.items.length)) },
  }
}
