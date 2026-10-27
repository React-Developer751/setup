// What a person types before exporting (their phone, address, website address) must not be able to break or inject into the exported files.
import { loadGeneratorModule } from './lib/load-generator.mjs'

let pass = 0
const fail = []
const ok = (c, n) => (c ? (pass += 1) : fail.push(n))

globalThis.document = { styleSheets: [] }
const { generateLibraryPage } = await loadGeneratorModule('library/generateLibraryPage.ts')
const { libraryWithDetails, safeSiteUrl, xmlEscape } = await loadGeneratorModule('library/exportDetails.ts')

const lib = generateLibraryPage('dental clinic called Smile Care in Pune', 3, 'better')
const contentOf = (code) => JSON.parse(code.slice(code.indexOf('const content = ') + 'const content = '.length, code.indexOf('\n}\n', code.indexOf('const content = ')) + 2))

// the code of the page keeps its shape for any value
for (const address of ['12 "Rose" Lane', 'Shop 4, \\Mall\\ Road', '}; alert(1); ({"', "O'Neil Street\nSecond line", '$& $1 $$']) {
  const out = libraryWithDetails(lib, { address })
  let parsed
  try {
    parsed = contentOf(out.code)
  } catch {
    parsed = undefined
  }
  ok(parsed?.contact.address === address && out.content.contact.address === address, `the address ${JSON.stringify(address)} stays a value of the content`)
}
const phone = libraryWithDetails(lib, { phone: '98765 43210', email: 'a"b@x.com' })
ok(contentOf(phone.code).contact.phone === '98765 43210' && contentOf(phone.code).contact.email === 'a"b@x.com', 'phone and e-mail are replaced as JSON values')
// an empty old value never makes the new value appear between all letters
const empty = { ...lib, content: { ...lib.content, contact: { ...lib.content.contact, phone: '' } } }
ok(libraryWithDetails(empty, { phone: '555' }).code.length < lib.code.length + 2000, 'an empty old phone does not explode the code')
// a short old value is not replaced everywhere in the code
const short = { ...lib, code: lib.code, content: { ...lib.content, contact: { ...lib.content.contact, phone: '12' } } }
ok(!libraryWithDetails(short, { phone: 'XXXXXXXX' }).code.includes('XXXXXXXX') || libraryWithDetails(short, { phone: 'XXXXXXXX' }).code.split('XXXXXXXX').length <= 2, 'a short old value is replaced as a field only')

// the website address
ok(safeSiteUrl('https://www.shop.com/', 'F') === 'https://www.shop.com', 'a trailing slash goes')
ok(safeSiteUrl('https://x.com/"><script>alert(1)</script>', 'F') !== 'F' && !safeSiteUrl('https://x.com/"><script>alert(1)</script>', 'F').includes('<'), 'markup in the address is percent-encoded')
ok(safeSiteUrl('javascript:alert(1)', 'F') === 'F' && safeSiteUrl('ftp://x.com', 'F') === 'F' && safeSiteUrl('not an address', 'F') === 'F' && safeSiteUrl(undefined, 'F') === 'F', 'only http(s) addresses are used')
ok(safeSiteUrl('https://x.com/p?a=1&b=2#top', 'F') === 'https://x.com/p', 'a query and a fragment are dropped')
ok(xmlEscape('a&b<c>"d"') === 'a&amp;b&lt;c&gt;&quot;d&quot;', 'XML text is escaped')

console.log(`export-safety: ${pass} checks passed, ${fail.length} failed`)
if (fail.length) {
  console.log(fail.map((f) => ` - ${f}`).join('\n'))
  process.exit(1)
}
