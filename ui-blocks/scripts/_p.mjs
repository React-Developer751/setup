import { loadGeneratorModule } from './lib/load-generator.mjs'
import fs from 'node:fs'
const { generateWebsite } = await loadGeneratorModule('generateWebsite.ts')
const words = fs.readFileSync('/tmp/biz.txt','utf8').split('\n').filter(Boolean)
const out=[]
for (const w of words) { const s=generateWebsite('website for '+w, 3); out.push({w, theme:s.themeKey, niche:s.niche??null}) }
fs.writeFileSync('/tmp/ours.json', JSON.stringify(out))
const dflt=out.filter(o=>o.theme==='general_business'&&!o.niche).length
console.log('ours: general_business without niche:', dflt, 'of', out.length)
