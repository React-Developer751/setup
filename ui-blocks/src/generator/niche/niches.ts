// The hand-written niche packs (src/data/niches/batch-*.json; format and rules: NICHE_SPEC.md; checked by `npm run check:niches`).
import batchA from '../../data/niches/batch-a.json'
import batchB from '../../data/niches/batch-b.json'
import batchC from '../../data/niches/batch-c.json'
import batchD from '../../data/niches/batch-d.json'
import batchE from '../../data/niches/batch-e.json'
import batchF from '../../data/niches/batch-f.json'
import batchG from '../../data/niches/batch-g.json'
import batchH from '../../data/niches/batch-h.json'
import type { Niche } from './types'

export const NICHES = [...batchA, ...batchB, ...batchC, ...batchD, ...batchE, ...batchF, ...batchG, ...batchH] as unknown as Niche[]
