# Training prompts for the two AIs

Made by `node scripts/export-training-prompts.mjs` (run it again after the generator gets new niches). The generator is the same in both: 99 business packs (niches), 20 business types (themes), 25 design styles, 25 colour families.

| file | for | what it holds |
|---|---|---|
| `website-types.json` | both | the catalogue: every kind of website, its services, keywords, design styles, colour families |
| `content-ai/system-prompt.md` | content AI | the rules and the exact JSON shape of a content pack |
| `content-ai/prompts.jsonl` | content AI | 99 business prompts + 20 fallback prompts (one line each: id, user_requests, prompt) |
| `content-ai/hinglish-and-hindi.jsonl` | content AI | the same businesses asked in Hinglish and in Hindi |
| `image-ai/system-prompt.md` | image AI | the picture rules (sizes, no text, same style) |
| `image-ai/prompts.jsonl` | image AI | per business: hero, about, 6 gallery, 6 card, 3 team and a background picture, each with size and palette |
| `image-ai/themes.jsonl` | image AI | the same for the 20 business types (for a business with no pack) |
| `image-ai/design-styles.jsonl` | image AI | the look of each of the 25 design styles, to combine with any picture prompt |

How to train: give the system prompt first, then each line's `prompt` (content) or each slot's `prompt` (image), and keep the answers that follow the rules (the content AI's answer can be checked with `node scripts/check-niches.mjs`). The `user_requests` are the sentences a person will really type for that business: use them as the inputs the AI must answer well.
