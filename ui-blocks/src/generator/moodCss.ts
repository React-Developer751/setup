// The extra rules of the five designs that were read from live translation-service sites (moods.ts: clinic-mesh, plum-ivory, trust-navy, violet-glow,
// cream-coral). The stored components keep their code; these rules restyle them: rounder cards with a ring and a soft shadow, pill buttons, backdrops
// behind the first screen, tinted cards. Design and colour only: no text is touched. Light-mode decorations are guarded with :not(.dark).
import type { MoodId } from './moods'

type Base = { radius: string; ring: string; shadow: string; heading: string; pill?: boolean }

const CARD = '.rounded-lg,.rounded-xl,.rounded-2xl,.rounded-md'
const BUTTON = ':is(a,button):is(.bg-primary,.bg-brand,.bg-indigo-500,.bg-indigo-600,.bg-blue-500,.bg-blue-600)'
const INNER = '[data-gen-theme] [data-role]:not([data-role=nav]):not([data-role=hero])'

const base = (b: Base) => `[data-gen-theme] :is(h1,h2,h3){letter-spacing:${b.heading}}
[data-gen-theme] [data-role]:not([data-role=nav]) :is(${CARD}){border-radius:${b.radius}}
${INNER} .bg-white:is(${CARD}){box-shadow:0 0 0 1px ${b.ring},${b.shadow}}
[data-gen-theme]:not(.dark) [data-ref] .bg-white{background-color:#ffffff}
[data-gen-theme] .ref-cta-box :is(h2,p,li,a:not(.bg-white)){color:#ffffff}
[data-gen-theme] .ref-cta-box a.bg-white{color:#111111}${b.pill === false ? '' : `\n[data-gen-theme] ${BUTTON}{border-radius:9999px}`}`

/** pastel tints that cycle over the cards of a grid */
const tints = (colors: string[], to = '#ffffff') =>
  colors.map((c, i) => `[data-gen-theme]:not(.dark) [data-role]:not([data-role=nav]):not([data-role=hero]) .grid > .bg-white:nth-child(${colors.length}n+${i + 1}){background-image:linear-gradient(145deg,${c},${to} 78%)}`).join('\n')

/** a fine wave pattern, like the security lines of a certificate (white lines, very faint) */
const WAVES = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='48' viewBox='0 0 160 48'%3E%3Cpath d='M0 16Q40-4 80 16T160 16' fill='none' stroke='%23ffffff' stroke-opacity='.07'/%3E%3Cpath d='M0 28Q40 8 80 28T160 28' fill='none' stroke='%23ffffff' stroke-opacity='.06'/%3E%3Cpath d='M0 40Q40 20 80 40T160 40' fill='none' stroke='%23ffffff' stroke-opacity='.05'/%3E%3C/svg%3E")`


/** what every picture-led design shares: the text on the picture is white, the buttons are rectangles or pills of their own, the tiles have no card frame */
const SHOW = `[data-gen-theme] .show-hero,[data-gen-theme] .show-hero :is(h1,p,span,a){color:#ffffff}
[data-gen-theme] .show-hero-scrim{background:linear-gradient(to top,rgba(0,0,0,.5),rgba(0,0,0,.05) 60%)}
[data-gen-theme] .show-btn{font-weight:600;transition:opacity .2s,background .2s}
[data-gen-theme] .show-tile figcaption span:first-child{color:inherit}
[data-gen-theme] [data-ref=show-tiles] .bg-gray-200{background:transparent}`

const CSS: Record<string, string> = {
  'clinic-mesh': `${base({ radius: '1.5rem', ring: 'rgba(188,209,202,.55)', shadow: '0 14px 34px -18px rgba(13,110,99,.35)', heading: '-0.03em' })}
[data-gen-theme]:not(.dark) [data-role=hero]{background-image:radial-gradient(60% 70% at 10% 8%,#b7f0e2 0,transparent 62%),radial-gradient(55% 60% at 90% 18%,#cfe0ff 0,transparent 64%),radial-gradient(50% 60% at 55% 100%,#e6dcff 0,transparent 66%)}
${tints(['#dff7ee', '#e3efff', '#ece4ff', '#ffeede', '#e6f7da', '#ffe4e8'])}
[data-gen-theme] .ref-cta-box{background-image:linear-gradient(135deg,#0a574e,#12897b);color:#fff}`,
  'plum-ivory': `${base({ radius: '1rem', ring: 'rgba(160,92,124,.18)', shadow: '0 10px 26px -18px rgba(43,23,34,.45)', heading: '-0.025em' })}
[data-gen-theme] [data-role=hero]{background-image:${WAVES}}
[data-gen-theme]:not(.dark) ${BUTTON}{background-color:#2b1722;color:#fff}
[data-gen-theme] [data-role=hero] [data-slot=title] span{color:#e8c1d3}
[data-gen-theme] [data-role=hero] [data-slot=eyebrow]{color:#e8c1d3}
[data-gen-theme] .ref-cta-box{background-image:linear-gradient(135deg,#150a11,#3e2233),${WAVES};color:#fff}`,
  'trust-navy': `${base({ radius: '1.25rem', ring: 'rgba(0,48,120,.12)', shadow: '0 12px 28px -18px rgba(0,48,120,.45)', heading: '-0.03em' })}
[data-gen-theme]:not(.dark) [data-role=hero]{background-image:radial-gradient(70% 60% at 88% 0,#d5e5f2 0,transparent 70%),radial-gradient(40% 40% at 0 100%,#eaf3ff 0,transparent 70%)}
[data-gen-theme]:not(.dark) [data-role]:not([data-role=nav]):not([data-role=hero]) .grid > .bg-white{background-image:linear-gradient(180deg,#eaf3ff,#ffffff 62%)}
[data-gen-theme] .ref-cta-box{background-image:linear-gradient(135deg,#0b1b2e,#003078 72%,#012169);color:#fff}`,
  'violet-glow': `${base({ radius: '1.25rem', ring: 'rgba(91,33,230,.14)', shadow: '0 16px 36px -18px rgba(91,33,230,.45)', heading: '-0.035em' })}
[data-gen-theme]:not(.dark) [data-role=hero]{background-image:radial-gradient(60% 60% at 8% 4%,#ebe3ff 0,transparent 62%),radial-gradient(50% 55% at 92% 10%,#ffe0f0 0,transparent 64%),radial-gradient(45% 50% at 60% 100%,#d9f5fb 0,transparent 66%)}
[data-gen-theme] ${BUTTON}{background-image:linear-gradient(90deg,#5b21e6,#ec4899)}
${tints(['#f1ebff', '#ffe9f4', '#e2f8fd', '#f1ebff', '#ffe9f4', '#e2f8fd'])}
[data-gen-theme] .ref-cta-box{background-image:linear-gradient(120deg,#4713c2,#5b21e6 46%,#ec4899);color:#fff}`,
  'cream-coral': `${base({ radius: '1.25rem', ring: 'rgba(236,228,216,.9)', shadow: '0 16px 36px -20px rgba(27,13,68,.4)', heading: '-0.035em' })}
[data-gen-theme]:not(.dark) [data-role=hero]{background-image:radial-gradient(52% 60% at 92% 0,#ffe5da 0,transparent 70%),radial-gradient(40% 45% at 0 100%,#efe6ff 0,transparent 70%)}
[data-gen-theme] .ref-cta-box{background-image:radial-gradient(60% 90% at 88% 0,rgba(109,61,242,.5) 0,transparent 70%),#0e0b1f;color:#fff}`,
  'maison-noir': `${SHOW}
[data-gen-theme] :is(h1,h2,h3){letter-spacing:.14em}
[data-gen-theme] .show-hero-inner{min-height:90vh}
[data-gen-theme] .show-hero h1{font-size:clamp(1.3rem,2.6vw,2.2rem);font-weight:600;text-transform:uppercase;letter-spacing:.14em}
[data-gen-theme] .show-hero [data-slot=subtitle]{font-size:.8rem;letter-spacing:.04em}
[data-gen-theme] .show-btn{border-radius:0;font-size:.75rem;letter-spacing:.2em;text-transform:uppercase}
[data-gen-theme] .show-hero [data-slot=button2]{display:none}
[data-gen-theme] .show-hero .show-btn-primary{background:#fff;color:#000}
[data-gen-theme] .show-hero-scrim{background:linear-gradient(to top,rgba(0,0,0,.42),rgba(0,0,0,0) 55%)}
[data-gen-theme] [data-ref=show-tiles] .grid{gap:0}
[data-gen-theme] [data-ref=show-tiles] [data-slot=tile-title]{font-size:.75rem;letter-spacing:.22em}
[data-gen-theme] .show-cta h2{font-size:clamp(1.5rem,3vw,2.4rem);text-transform:uppercase;letter-spacing:.14em}
[data-gen-theme] .show-cta .show-btn-primary{background:#000;color:#fff}`,
  'film-editorial': `${SHOW}
[data-gen-theme] :is(h1,h2,h3){letter-spacing:.2em;font-weight:300}
[data-gen-theme] .show-hero{margin:0 .5rem}
[data-gen-theme] .show-hero-inner{min-height:80vh;align-items:flex-start;text-align:left;justify-content:flex-end}
[data-gen-theme] .show-hero h1{font-size:clamp(1.4rem,3vw,2.6rem);font-weight:300;text-transform:uppercase;letter-spacing:.24em}
[data-gen-theme] .show-btn{border-radius:0;font-size:.75rem;letter-spacing:.22em;text-transform:uppercase;font-weight:500}
[data-gen-theme] .show-hero [data-slot=button2]{display:none}
[data-gen-theme] [data-ref=show-tiles] .grid{gap:.5rem;padding:0 .5rem}
[data-gen-theme] [data-ref=show-tiles] [data-slot=tile-title]{font-weight:400;letter-spacing:.24em}
[data-gen-theme] .show-cta h2{font-weight:300;text-transform:uppercase;letter-spacing:.2em;font-size:clamp(1.4rem,3vw,2.4rem)}
[data-gen-theme] .show-cta .show-btn-primary{background:#111;color:#fff}`,
  'atelier-3d': `${SHOW}
[data-gen-theme] :is(h1,h2,h3){letter-spacing:-.035em;font-weight:300}
[data-gen-theme] .show-hero{margin:12px;border-radius:28px}
[data-gen-theme] .show-hero-inner{min-height:80vh;align-items:flex-start;text-align:left}
[data-gen-theme] .show-hero h1{font-weight:300;font-size:clamp(2.4rem,6vw,5.5rem);letter-spacing:-.04em}
[data-gen-theme] .show-btn{border-radius:9999px;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase}
[data-gen-theme] .show-hero .show-btn-primary{background:#0b0c14;color:#fff}
[data-gen-theme] .show-hero .show-btn-second{background:#fff;border-color:#fff;color:#0b0c14}
[data-gen-theme] [data-ref=show-tiles] .grid{gap:12px;padding:0 12px}
[data-gen-theme] [data-ref=show-tiles] [data-slot=tile] > div{border-radius:20px}
[data-gen-theme] .show-cta .show-btn-primary{background:#1a2ffb;color:#fff}
[data-gen-theme] .show-cta h2{font-weight:300;font-size:clamp(2.4rem,6vw,5rem);letter-spacing:-.04em}`,
  'apple-tile': `${SHOW}
[data-gen-theme] :is(h1,h2,h3){letter-spacing:-.03em}
[data-gen-theme] .show-hero{background:#000}
[data-gen-theme] .show-hero-inner{min-height:86vh;justify-content:flex-start;padding-top:5rem}
[data-gen-theme] .show-hero-img{object-position:bottom;object-fit:cover}
[data-gen-theme] .show-hero-scrim{background:linear-gradient(to bottom,#000 0,rgba(0,0,0,.35) 45%,rgba(0,0,0,0) 80%)}
[data-gen-theme] .show-hero h1{font-weight:600;font-size:clamp(2.4rem,5.5vw,4.5rem);letter-spacing:-.035em}
[data-gen-theme] .show-btn{border-radius:9999px;font-weight:500;font-size:1rem;padding:.6rem 1.3rem}
[data-gen-theme] .show-hero .show-btn-primary,[data-gen-theme] .show-stack .show-btn-primary,[data-gen-theme] .show-cta .show-btn-primary{background:#0071e3;color:#fff}
[data-gen-theme] .show-hero .show-btn-second{border-color:#2997ff;color:#2997ff}
[data-gen-theme] .show-stack .show-btn-second{border-color:#0071e3;color:#0071e3}
[data-gen-theme] .show-stack article:nth-child(even) .show-btn-second{border-color:#2997ff;color:#2997ff}
[data-gen-theme] .show-stack article{margin-bottom:12px;border-radius:0}
[data-gen-theme] .show-stack img{border-radius:18px 18px 0 0}
[data-gen-theme] .show-cta h2{font-weight:600;letter-spacing:-.035em}`,
  'techno-black': `${SHOW}
[data-gen-theme] :is(h1,h2,h3){letter-spacing:.06em;text-transform:uppercase}
[data-gen-theme] .show-hero{background:#000}
[data-gen-theme] .show-hero-inner{min-height:86vh;align-items:flex-start;text-align:left;justify-content:flex-end}
[data-gen-theme] .show-hero-scrim{background:radial-gradient(60% 55% at 50% 38%,rgba(255,255,255,.14),rgba(0,0,0,.2) 65%,rgba(0,0,0,.75))}
[data-gen-theme] .show-hero-img{filter:grayscale(.85) contrast(1.1)}
[data-gen-theme] .show-hero h1{font-size:clamp(1.6rem,4vw,3.2rem);font-weight:700;text-transform:uppercase;letter-spacing:.06em}
[data-gen-theme] .show-btn{border-radius:0;background:transparent!important;border:1px solid #f1f2f2!important;color:#f1f2f2!important;font-size:.78rem;letter-spacing:.14em;text-transform:uppercase}
[data-gen-theme] .show-btn-primary{border-color:#ff5a1f!important;color:#ff5a1f!important}
[data-gen-theme] .show-stack article{background:#000!important;color:#f1f2f2!important;border-top:1px solid #2b2b2b}
[data-gen-theme] .show-stack article:nth-child(even){background:#0e0e0e!important}
[data-gen-theme] .show-stack img{filter:grayscale(.85) contrast(1.1);border:1px solid #2b2b2b}
[data-gen-theme] .show-cta h2{text-transform:uppercase;letter-spacing:.06em;font-size:clamp(1.8rem,4vw,3.4rem)}`,
  'showroom-white': `${SHOW}
[data-gen-theme] :is(h1,h2,h3){letter-spacing:-.02em;font-weight:500}
[data-gen-theme] .show-hero-inner{min-height:92vh;display:grid;grid-template-rows:auto auto auto 1fr;justify-items:center;padding-top:6rem}
[data-gen-theme] .show-hero-inner > div{align-self:end}
[data-gen-theme] .show-hero-scrim{background:linear-gradient(to bottom,rgba(0,0,0,.35),rgba(0,0,0,0) 40%,rgba(0,0,0,.25))}
[data-gen-theme] .show-hero h1{font-weight:500;font-size:clamp(2rem,4.2vw,3.5rem)}
[data-gen-theme] .show-btn{border-radius:4px;min-width:14rem;font-size:.875rem;font-weight:500;padding:.7rem 1.5rem}
[data-gen-theme] .show-hero .show-btn-primary,[data-gen-theme] .show-stack .show-btn-primary,[data-gen-theme] .show-cta .show-btn-primary{background:#3e6ae1;color:#fff}
[data-gen-theme] .show-hero .show-btn-second{background:rgba(255,255,255,.92);border-color:transparent;color:#171a20}
[data-gen-theme] .show-stack .show-btn-second{border-color:currentColor}
[data-gen-theme] .show-stack img{border-radius:4px}
[data-gen-theme] .show-cta h2{font-weight:500}`,
  'noir-lab': `${SHOW}
[data-gen-theme] :is(h1,h2,h3){letter-spacing:-.045em}
[data-gen-theme] .show-hero{background:#000}
[data-gen-theme] .show-hero-inner{min-height:92vh;align-items:flex-start;text-align:left;justify-content:flex-end}
[data-gen-theme] .show-hero-scrim{background:linear-gradient(to top,rgba(0,0,0,.8),rgba(0,0,0,.1) 65%)}
[data-gen-theme] .show-hero-img{filter:contrast(1.08) saturate(.8)}
[data-gen-theme] .show-hero h1{font-weight:500;font-size:clamp(2.6rem,8vw,8rem);line-height:.95;letter-spacing:-.05em}
[data-gen-theme] .show-btn{background:transparent!important;border:0!important;border-bottom:1px solid #e8e8e8!important;border-radius:0;padding:.3rem 0;color:#e8e8e8!important;text-transform:uppercase;letter-spacing:.22em;font-size:.72rem}
[data-gen-theme] .show-row{transition:background .25s}
[data-gen-theme] .show-row:hover{background:rgba(255,255,255,.05)}
[data-gen-theme] .show-cta h2{font-weight:500;font-size:clamp(2.4rem,7vw,7rem);letter-spacing:-.05em;line-height:.95}
[data-gen-theme] .show-cta .show-btn{color:#e8e8e8!important;border-bottom-color:#e8e8e8!important}`,
  'blush-serif': `${SHOW}
[data-gen-theme] :is(h1,h2,h3){letter-spacing:-.02em;font-weight:400}
[data-gen-theme] .show-type-hero h1{font-family:var(--font-serif);font-weight:400;font-size:clamp(3rem,10.5vw,10.5rem);line-height:.88;letter-spacing:-.035em}
[data-gen-theme] .show-type-hero .show-strip{border-radius:2px}
[data-gen-theme] .show-link{font-size:.72rem;letter-spacing:.2em}
[data-gen-theme] [data-ref=show-tiles] .grid{gap:1.5rem;padding:0 1.5rem 1.5rem}
[data-gen-theme] [data-ref=show-tiles] [data-slot=tile] > div{aspect-ratio:3/4;border-radius:2px}
[data-gen-theme] [data-ref=show-tiles] [data-slot=tile-title]{font-family:var(--font-serif);font-size:1.7rem;font-weight:400;letter-spacing:-.01em;text-transform:none}
[data-gen-theme] [data-ref=show-tiles] h2{font-family:var(--font-serif);font-size:2.4rem;text-transform:none;letter-spacing:-.02em;font-weight:400}
[data-gen-theme] .show-cta h2{font-family:var(--font-serif);font-weight:400;font-size:clamp(2.8rem,8vw,7.5rem);letter-spacing:-.035em;line-height:.92}
[data-gen-theme] .show-cta .show-btn{border-radius:0;background:#212121;color:#efded9}`,
  'neon-arcade': `${SHOW}
[data-gen-theme] :is(h1,h2,h3){letter-spacing:-.03em}
[data-gen-theme] .show-hero{background:#140a2e}
[data-gen-theme] .show-hero-scrim{background:linear-gradient(to top,rgba(20,10,46,.9),rgba(20,10,46,.15) 65%)}
[data-gen-theme] .show-hero h1{font-weight:700;font-size:clamp(2.6rem,7vw,6.5rem);text-shadow:0 0 28px rgba(255,79,216,.55)}
[data-gen-theme] .show-btn{border-radius:9999px;font-weight:700}
[data-gen-theme] .show-hero .show-btn-primary{background:#ff4fd8;color:#140a2e;box-shadow:0 0 24px rgba(255,79,216,.6)}
[data-gen-theme] .show-hero .show-btn-second{border-color:#22d3ee;color:#22d3ee}
[data-gen-theme] [data-ref=show-tiles] .grid{gap:20px;padding:0 20px 20px}
[data-gen-theme] [data-ref=show-tiles] [data-slot=tile] > div{border-radius:28px;box-shadow:0 0 0 2px #ff4fd8,0 0 26px rgba(255,79,216,.4)}
[data-gen-theme] .show-cta .show-btn-primary{background:#ff4fd8;color:#140a2e;box-shadow:0 0 24px rgba(255,79,216,.6)}
[data-gen-theme] .show-cta h2{font-weight:700;text-shadow:0 0 30px rgba(34,211,238,.45)}`,
  'studio-index': `${SHOW}
[data-gen-theme] :is(h1,h2,h3){letter-spacing:-.045em}
[data-gen-theme] .show-type-hero h1{font-weight:500;font-size:clamp(2.8rem,10vw,10rem);line-height:.9;letter-spacing:-.05em}
[data-gen-theme] .show-link{font-size:.72rem;letter-spacing:.2em}
[data-gen-theme] .show-row{transition:padding .25s}
[data-gen-theme] .show-row:hover{padding-left:1rem}
[data-gen-theme] .show-row:hover [data-slot=row-title]{font-style:italic}
[data-gen-theme] .show-cta h2{font-weight:500;font-size:clamp(2.6rem,8vw,8rem);line-height:.92;letter-spacing:-.05em}
[data-gen-theme] .show-cta .show-btn{border-radius:0;background:#0a0a0a;color:#fff;letter-spacing:.2em;text-transform:uppercase;font-size:.72rem}`,
}

/** the extra rules of a design mood for the library engine ('' for the other moods) */
export const moodCss = (id: MoodId | undefined): string => (id ? (CSS[id] ?? '') : '')
