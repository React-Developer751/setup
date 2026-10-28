// Text banks for the dummy data of a multi-page site. They are written to fit ANY business, so a blog post
// about a law firm and one about a bakery can share the same honest, plain advice. Business-specific words
// are woven in from the lexicon by siteData.ts.

export type LocaleId = 'global' | 'in' | 'us' | 'uk' | 'ae'

// ───────────── people ─────────────
export const FIRST_NAMES: Record<'indian' | 'western' | 'world', string[]> = {
  indian: [
    'Aarav', 'Vihaan', 'Aditya', 'Arjun', 'Rohan', 'Kabir', 'Ishaan', 'Karan', 'Rahul', 'Siddharth', 'Ananya', 'Diya',
    'Meera', 'Priya', 'Riya', 'Saanvi', 'Kavya', 'Neha', 'Isha', 'Tara', 'Nisha', 'Pooja', 'Sneha', 'Aditi',
  ],
  western: [
    'Oliver', 'Liam', 'Noah', 'Ethan', 'Lucas', 'Daniel', 'Henry', 'Jack', 'Emma', 'Olivia', 'Sophia', 'Isla',
    'Grace', 'Chloe', 'Hannah', 'Maya', 'Zoe', 'Nora', 'Ruby', 'Clara', 'Owen', 'Leo', 'Ivy', 'Ella',
  ],
  world: [
    'Mei', 'Omar', 'Elena', 'Amara', 'Yuki', 'Kofi', 'Layla', 'Mateo', 'Sana', 'Hiro', 'Nia', 'Tariq',
    'Lucia', 'Jin', 'Zara', 'Mateus', 'Aisha', 'Dmitri', 'Camila', 'Idris', 'Noor', 'Felix', 'Anika', 'Santiago',
  ],
}

export const LAST_NAMES: Record<'indian' | 'western' | 'world', string[]> = {
  indian: ['Sharma', 'Mehta', 'Patel', 'Gupta', 'Reddy', 'Iyer', 'Nair', 'Singh', 'Kapoor', 'Joshi', 'Bose', 'Desai', 'Malhotra', 'Khanna', 'Chopra', 'Verma'],
  western: ['Carter', 'Bennett', 'Foster', 'Hughes', 'Morgan', 'Reed', 'Wallace', 'Bailey', 'Fraser', 'Collins', 'Hayes', 'Murray', 'Ellis', 'Parker', 'Webb', 'Stone'],
  world: ['Tanaka', 'Haddad', 'Rossi', 'Nwosu', 'Kim', 'Okafor', 'Silva', 'Moreau', 'Khan', 'Novak', 'Mensah', 'Costa', 'Nguyen', 'Ivanov', 'Ahmed', 'Lopez'],
}

/** Extra roles used when a business type has fewer than six of its own. */
export const EXTRA_ROLES = [
  'Operations Manager', 'Customer Care Lead', 'Head of Quality', 'Office Manager', 'Senior Specialist', 'Project Coordinator',
  'Client Partner', 'Team Lead',
]

/** One-line bios. They never use he / she, so they fit any name. {first} {brand} {n} {noun} are filled in. */
export const BIO_PATTERNS = [
  '{first} has been with {brand} for {n} years and cares most about getting the details right.',
  '{first} joined to work on {noun} and stayed for the people.',
  '{first} brings {n} years of experience and a calm, practical approach.',
  '{first} is the person to talk to about {noun}.',
  '{first} believes good work starts with listening, and it shows.',
  'With {n} years behind the scenes, {first} keeps everything running smoothly at {brand}.',
]

// ───────────── blog ─────────────
export const INTRO_PATTERNS = [
  'At {brand}, we spend a lot of time thinking about {noun}. This is a short guide to what we have learned along the way.',
  'People often ask us about {noun}. Here is how we think about it at {brand}, in plain language.',
  'There is no single secret to {noun}, but a few ideas keep proving themselves. We have collected them here.',
  'If you are getting started with {noun}, this article is for you. No jargon, just practical steps.',
  'Over the years, {brand} has seen what works and what does not when it comes to {noun}. Here is the short version.',
]

export const CONCLUSION_PATTERNS = [
  'That is the whole idea: keep it simple, stay consistent and keep improving. If you would like to talk it through, the team at {brand} is happy to help.',
  'None of this is complicated, but it does take patience. Questions? Get in touch with {brand} and we will gladly help.',
  'Start small, pay attention and adjust as you go. We would love to hear how it works out for you.',
  'Take what is useful, leave the rest, and make it your own. And if you get stuck, {brand} is only a message away.',
]

/** Sections that read well for any business: a heading and a paragraph. {subject} is the business, e.g. "organic green tea cafe". */
export const BLOG_SECTIONS: [string, string][] = [
  ['Start with the basics', 'Before anything else, get the simple things right. Most problems we see come from skipping a step that looked too obvious to matter.'],
  ['Small habits add up', 'The biggest improvements rarely come from one dramatic change. They come from small, consistent habits repeated week after week until they become the way you work.'],
  ['Listen before you decide', 'Ask the people who actually use {subject}. Five honest conversations will teach you more than a month of guessing.'],
  ['Quality is a decision', 'Quality is not an accident. It shows up when someone decides to check one more time, to say no to a shortcut and to finish the job properly.'],
  ['Keep it simple', 'Complexity is easy to add and hard to remove. When in doubt, choose the option that a new customer could understand in ten seconds.'],
  ['Measure what matters', 'Pick two or three numbers that reflect real progress and watch them regularly. Anything else is usually noise.'],
  ['Plan for the ordinary days', 'Anyone can perform on a good day. What defines a business is how it behaves on an ordinary Tuesday, when nobody is watching.'],
  ['Learn from mistakes', 'Everyone makes mistakes. What matters is how quickly you notice, how openly you talk about it and what you change afterwards.'],
  ['Invest in your people', 'Good tools help, but good people make the difference. Give them time to learn, room to ask questions and a reason to care.'],
  ['Be honest about limits', 'Saying "we cannot do that" builds more trust than promising everything. Clear limits make the things you do promise believable.'],
  ['Think long term', 'Short-term wins feel good, but the work that lasts is built slowly. Ask whether a decision will still look right in three years.'],
  ['Make it easy to start', 'Most people never begin because the first step feels heavy. Remove friction, explain what happens next and let them take one small step.'],
  ['Consistency beats intensity', 'A steady effort that you can keep up will beat a burst of energy that burns out. Choose a pace you can hold.'],
  ['Share what you know', 'Teaching others is the fastest way to understand your own work. Write it down, explain it simply and invite questions.'],
]

export const BLOG_QUOTES = [
  'Do the simple thing, and do it well.',
  'Good work is quiet until you notice it is missing.',
  'Slow is smooth, and smooth becomes fast.',
  'Take care of the details and the big picture takes care of itself.',
  'A small step today is worth more than a perfect plan tomorrow.',
  'People remember how you made them feel.',
  'Make it work, make it right, then make it better.',
  'Consistency is quiet, but it always shows.',
]

// ───────────── FAQ and reviews ─────────────
export const GENERIC_FAQ: [string, string][] = [
  ['How can I contact you?', 'Use the contact page, call us during opening hours or send a message. We reply within one working day.'],
  ['Where are you located?', 'You can find our address and opening hours on the contact page.'],
  ['What payment methods do you accept?', 'We accept cards, bank transfer and cash. Details are confirmed when you book or order.'],
  ['Can I change or cancel my booking?', 'Yes. Let us know as early as you can and we will sort it out without fuss.'],
  ['Do you offer discounts?', 'We run seasonal offers and loyalty rewards. Subscribe to our newsletter to hear about them first.'],
  ['Is my information safe?', 'We only ask for what we need and never share your details with third parties.'],
  ['How do I leave feedback?', 'We read every message. Use the contact form or reply to any of our emails.'],
  ['Do you work with first-time customers?', 'Absolutely. Most of our customers started as first-timers, and we are happy to guide you.'],
]

export const GENERIC_QUOTES = [
  'Friendly, professional and genuinely helpful from start to finish.',
  'I have recommended {brand} to everyone I know.',
  'Exactly what I was looking for, and the team made it effortless.',
  'Great communication and no surprises. Worth every penny.',
  'They went the extra mile and it really showed.',
  'Consistently excellent. I would not go anywhere else.',
  'Quick to respond, easy to work with, and the results speak for themselves.',
  'A pleasure to deal with. Highly recommended.',
]

export const GENERIC_ROLES = ['Happy customer', 'Returning customer', 'Local resident', 'Business owner', 'First-time customer']

// ───────────── contact ─────────────
export const STREETS: Record<LocaleId, string[]> = {
  global: ['Main Street', 'Market Road', 'Station Road', 'Park Avenue'],
  in: ['MG Road', 'Linking Road', 'Station Road', 'Residency Road', 'Park Street', 'Nehru Marg'],
  us: ['Main Street', 'Oak Avenue', 'Maple Street', 'Broadway', 'Market Street'],
  uk: ['High Street', 'Church Lane', 'King Street', 'Station Road', 'Victoria Road'],
  ae: ['Sheikh Zayed Road', 'Al Wasl Road', 'Jumeirah Beach Road', 'Al Khaleej Road'],
}

export const CITIES: Record<LocaleId, string[]> = {
  global: ['Your City'],
  in: ['Mumbai 400001', 'Pune 411001', 'Bengaluru 560001', 'Hyderabad 500001', 'Delhi 110001', 'Chennai 600001'],
  us: ['Austin, TX 73301', 'Denver, CO 80202', 'Portland, OR 97201', 'Chicago, IL 60601'],
  uk: ['London EC1A 1BB', 'Manchester M1 1AE', 'Bristol BS1 4DJ', 'Leeds LS1 1BA'],
  ae: ['Dubai', 'Abu Dhabi', 'Sharjah'],
}

/** Cities that can be named in a prompt, with the rest of their address line. */
export const KNOWN_CITIES: Record<string, { locale: LocaleId; line: string }> = {
  mumbai: { locale: 'in', line: 'Mumbai 400001' },
  pune: { locale: 'in', line: 'Pune 411001' },
  bangalore: { locale: 'in', line: 'Bengaluru 560001' },
  bengaluru: { locale: 'in', line: 'Bengaluru 560001' },
  hyderabad: { locale: 'in', line: 'Hyderabad 500001' },
  delhi: { locale: 'in', line: 'Delhi 110001' },
  chennai: { locale: 'in', line: 'Chennai 600001' },
  kolkata: { locale: 'in', line: 'Kolkata 700001' },
  jaipur: { locale: 'in', line: 'Jaipur 302001' },
  ahmedabad: { locale: 'in', line: 'Ahmedabad 380001' },
  surat: { locale: 'in', line: 'Surat 395001' },
  lucknow: { locale: 'in', line: 'Lucknow 226001' },
  indore: { locale: 'in', line: 'Indore 452001' },
  noida: { locale: 'in', line: 'Noida 201301' },
  udaipur: { locale: 'in', line: 'Udaipur 313001' },
  chandigarh: { locale: 'in', line: 'Chandigarh 160017' },
  kota: { locale: 'in', line: 'Kota 324001' },
  goa: { locale: 'in', line: 'Goa 403001' },
  panaji: { locale: 'in', line: 'Panaji 403001' },
  nagpur: { locale: 'in', line: 'Nagpur 440001' },
  bhopal: { locale: 'in', line: 'Bhopal 462001' },
  patna: { locale: 'in', line: 'Patna 800001' },
  ranchi: { locale: 'in', line: 'Ranchi 834001' },
  kochi: { locale: 'in', line: 'Kochi 682001' },
  cochin: { locale: 'in', line: 'Cochin 682001' },
  thiruvananthapuram: { locale: 'in', line: 'Thiruvananthapuram 695001' },
  coimbatore: { locale: 'in', line: 'Coimbatore 641001' },
  madurai: { locale: 'in', line: 'Madurai 625001' },
  visakhapatnam: { locale: 'in', line: 'Visakhapatnam 530001' },
  vizag: { locale: 'in', line: 'Vizag 530001' },
  vadodara: { locale: 'in', line: 'Vadodara 390001' },
  rajkot: { locale: 'in', line: 'Rajkot 360001' },
  jodhpur: { locale: 'in', line: 'Jodhpur 342001' },
  ajmer: { locale: 'in', line: 'Ajmer 305001' },
  kanpur: { locale: 'in', line: 'Kanpur 208001' },
  varanasi: { locale: 'in', line: 'Varanasi 221001' },
  agra: { locale: 'in', line: 'Agra 282001' },
  amritsar: { locale: 'in', line: 'Amritsar 143001' },
  ludhiana: { locale: 'in', line: 'Ludhiana 141001' },
  jalandhar: { locale: 'in', line: 'Jalandhar 144001' },
  dehradun: { locale: 'in', line: 'Dehradun 248001' },
  shimla: { locale: 'in', line: 'Shimla 171001' },
  mysore: { locale: 'in', line: 'Mysore 570001' },
  mysuru: { locale: 'in', line: 'Mysuru 570001' },
  mangalore: { locale: 'in', line: 'Mangalore 575001' },
  guwahati: { locale: 'in', line: 'Guwahati 781001' },
  bhubaneswar: { locale: 'in', line: 'Bhubaneswar 751001' },
  raipur: { locale: 'in', line: 'Raipur 492001' },
  ghaziabad: { locale: 'in', line: 'Ghaziabad 201001' },
  faridabad: { locale: 'in', line: 'Faridabad 121001' },
  thane: { locale: 'in', line: 'Thane 400601' },
  nashik: { locale: 'in', line: 'Nashik 422001' },
  aurangabad: { locale: 'in', line: 'Aurangabad 431001' },
  meerut: { locale: 'in', line: 'Meerut 250001' },
  allahabad: { locale: 'in', line: 'Allahabad 211001' },
  prayagraj: { locale: 'in', line: 'Prayagraj 211001' },
  jammu: { locale: 'in', line: 'Jammu 180001' },
  srinagar: { locale: 'in', line: 'Srinagar 190001' },
  rishikesh: { locale: 'in', line: 'Rishikesh 249201' },
  haridwar: { locale: 'in', line: 'Haridwar 249401' },
  pondicherry: { locale: 'in', line: 'Pondicherry 605001' },
  puducherry: { locale: 'in', line: 'Puducherry 605001' },
  gurgaon: { locale: 'in', line: 'Gurugram 122001' },
  gurugram: { locale: 'in', line: 'Gurugram 122001' },
  london: { locale: 'uk', line: 'London EC1A 1BB' },
  manchester: { locale: 'uk', line: 'Manchester M1 1AE' },
  bristol: { locale: 'uk', line: 'Bristol BS1 4DJ' },
  leeds: { locale: 'uk', line: 'Leeds LS1 1BA' },
  austin: { locale: 'us', line: 'Austin, TX 73301' },
  chicago: { locale: 'us', line: 'Chicago, IL 60601' },
  seattle: { locale: 'us', line: 'Seattle, WA 98101' },
  boston: { locale: 'us', line: 'Boston, MA 02108' },
  dubai: { locale: 'ae', line: 'Dubai' },
  sharjah: { locale: 'ae', line: 'Sharjah' },
}
