---
name: humanize-text-pl
description: Rewrite AI-generated Polish text to read as naturally human-written, bypassing AI detectors (GPTZero, ZeroGPT, Originality.ai). Applies Polish-specific word replacements, sentence rhythm variation, structural de-patterning, register correction, and tonal adjustments targeting how detectors score Polish text. Use when user says "humanizuj", "humanizuj tekst", "popraw tekst AI po polsku", "make Polish text sound human", "humanize Polish", "za bardzo brzmi jak ChatGPT", "tekst brzmi sztucznie", "rewrite Polish AI text", "usuń ton AI", or pastes Polish text that reads like typical LLM output. Also use when user asks to edit Polish text for natural voice or authenticity in the context of AI-generated content.
---

# Humanizacja tekstu AI (Polish)

Rewrite AI-generated Polish text so it reads as authentically human-written. This skill targets Polish-specific detection signals -- vocabulary, register, morphological patterns, and structural habits unique to how LLMs generate Polish.

## How AI Detectors Work on Polish Text

Detectors are less reliable on Polish than English (most are trained primarily on English corpora), but they still catch AI text through the same two core signals:

| Signal | What it measures | AI Polish score | Human Polish score |
|---|---|---|---|
| **Perplexity** | How predictable each word choice is. Polish has richer morphology, so perplexity baselines differ from English. | Low (predictable) | Higher (surprising, idiomatic) |
| **Burstiness** | Variance in sentence length and complexity. | Low (monotone "hipnotyczny rytm") | High (varied, with short punchy sentences mixed in) |

Polish-specific detection challenges:
- AI defaults to **"korpo-mowa"** (corporate-speak) and **"styl urzedowy"** (bureaucratic register) -- this uniform formality is itself a detection signal
- AI avoids **"mieć"** (to have) in favor of **"posiadać"** (to possess) -- a measurable register shift
- AI overuses **participial clauses** (imiesłowy przysłówkowe) -- stacking "...będąc..., stanowiąc..., umożliwiając..." is a strong Polish AI tell
- AI uses **nominalization** where Polish speakers use verbs: "dokonanie analizy" instead of "przeanalizować"
- Detectors produce 50-90% false positive/negative rates on Polish, so the goal is natural writing, not a detector score

## Protocol

### Step 0: Receive and Assess

1. Ask the user to paste the Polish text (or point to a file).
2. Ask: "Jaka jest grupa docelowa i gdzie tekst zostanie opublikowany?" (blog, praca akademicka, email, social media, dokumentacja).
3. Ask: "Jaki styl / ton?" (formalny-ale-ludzki, potoczny, techniczny, publicystyczny).
4. Before rewriting, internally scan for:
   - Blacklisted words from the [czarna lista](blacklist-pl.md)
   - Sentence length uniformity (3+ consecutive sentences within 5 words of each other)
   - Register mismatches (korpo-mowa in a casual blog post)
   - Participial clause stacking (imiesłowy przysłówkowe chains)
   - Nominalization patterns ("dokonanie" + noun instead of a verb)
   - "Posiadać" instead of "mieć"
   - Filler phrases ("Warto zauważyć, że...", "Nie sposób nie wspomnieć...")
   - Positivity bias / safe tone
   - Transition stacking ("Ponadto... Co więcej... Dodatkowo...")

### Step 1: Word-Level Decontamination

Replace blacklisted words with natural Polish alternatives. See [blacklist-pl.md](blacklist-pl.md). Key principles:

- **Use the simplest word.** "Użyć" not "wykorzystać". "Poprawić" not "zoptymalizować". "Ważny" not "kluczowy".
- **Prefer native Polish words over Latinate/English loans.** "Wdrożyć" not "zaimplementować". "Podejście" not "paradygmat". "Podstawa" not "fundament".
- **Restore "mieć" where AI uses "posiadać".** "Posiadać" is bureaucratic Polish -- real people say "mieć".
- **Undo nominalization.** "Dokonać analizy" -> "przeanalizować". "Dokonać wyboru" -> "wybrać". "Dokonać zakupu" -> "kupić".
- **Kill hedging filler.** Delete "Warto zauważyć, że...", "Należy podkreślić, że...", "Nie sposób nie wspomnieć o..." entirely. State the fact.
- **Flatten transitions.** "Ponadto" -> "Poza tym" or "Też". "Co więcej" -> "I jeszcze" or drop. "Niemniej jednak" -> "Ale" or "Mimo to".
- **Replace "stanowić" with "być".** "Stanowi fundament" -> "jest podstawą".

### Step 2: Register Correction (Polish-Specific)

AI Polish defaults to a bureaucratic-corporate register regardless of context. Fix this:

1. **Kill korpo-mowa.** Replace "w ramach" with "w" or "przy". Replace "w zakresie" with "co do" or "jeśli chodzi o". Replace "z uwagi na fakt, że" with "bo".
2. **Shorten prepositional circumlocutions.** "W sposób efektywny" -> "skutecznie". "Na chwilę obecną" -> "teraz". "W chwili obecnej" -> "teraz".
3. **Remove legal/admin register leaks.** Delete "niniejszy", "przedmiotowy", "powyższy"/"poniższy" (when used as pointers). Replace with "ten" or drop entirely.
4. **Match formality to audience.** If it's a blog, use "ty" not "Pan/Pani". If it's a social post, use colloquial forms. If it's academic, keep formal -- but still cut the nominalization and filler.
5. **Break participial clause chains.** "...będąc jednocześnie X, stanowiąc Y, umożliwiając Z" -> split into 2-3 separate sentences. Polish readers stumble over stacked imiesłowy.
6. **Remove assistant voice.** Delete "Oczywiście!", "Świetne pytanie!", "Z przyjemnością pomogę!", "Mam nadzieję, że to pomoże".

### Step 3: Sentence Rhythm (Burstiness)

AI Polish has "hipnotyczny rytm" -- sentences of uniform length marching forward. Break it:

1. **Never write 3+ consecutive sentences within 5 words of each other in length.** Mix short (under 8 words) with long (25+).
2. **Use sentence fragments.** "Łatwiej powiedzieć niż zrobić." "Dokładnie o to chodzi." "Warto spróbować." Fragments are natural in Polish.
3. **Vary paragraph length.** If three paragraphs are each 4-5 sentences, break one into 2 sentences and let another run to 6-7.
4. **Start sentences differently.** Not every sentence should start with a subject. Use "Dlatego...", "Mimo to...", "Zresztą...", "No i...", temporal markers, or subordinate clauses.
5. **Add rhetorical questions.** "Ale po co?" "Czy to ma sens?" "I co z tego wynika?" -- Polish readers expect these.
6. **Cap em dashes.** Maximum 2 per 500 words. Polish AI stacks them even more than English AI.

### Step 4: Structural De-Patterning

1. **Kill the generic opener.** "W dzisiejszych czasach..." / "W dobie cyfryzacji..." / "Świat, w którym żyjemy..." -- all instant flags. Start with a specific claim, question, or anecdote.
2. **Break the triple pattern.** AI gives examples in threes ("szybszy, lepszy i bardziej efektywny"). Give one, two, or four. Not three.
3. **Remove "Podsumowując" / "Reasumując".** The reader knows it's ending. Just end.
4. **Vary section lengths.** Not every section should be 3 paragraphs.
5. **Don't end every section positively.** Leave trade-offs unresolved. Acknowledge downsides without immediately qualifying them.
6. **Remove unnecessary headings.** AI adds section headers to short text that doesn't need them.
7. **Kill the "Bez... Bez... Bez..." construction.** "Bez stresu. Bez wysiłku. Bez ryzyka." is a known Polish AI pattern. Use once for effect, or rewrite entirely.
8. **Fix cultural context.** AI trained on English data sometimes inserts American/British cultural references in Polish text (Thanksgiving, 4th of July). Replace with Polish equivalents or remove.

### Step 5: Tonal Adjustment

1. **Add contractions and colloquialisms where appropriate.** "Nie jest" can sometimes become "To nie jest" or informal "Nie, to nie tak". Use spoken Polish constructions.
2. **Allow imperfection.** Start a sentence with "I" or "Ale". Add a parenthetical aside. Use "no" as a filler ("No i co z tego?").
3. **Stop synonym-cycling.** AI in Polish forces different synonyms even when repeating a word would be natural. Polish speakers repeat words -- it's normal. Don't swap "dom" for "mieszkanie" for "lokum" for "nieruchomość" when you mean the same thing.
4. **Cut the positivity bias.** AI text is relentlessly encouraging. Real Polish writing is more direct and allows scepticism.
5. **Add personal voice.** "Uważam, że..." / "Moim zdaniem..." / "Z mojego doświadczenia..." instead of distanced third-person observations.
6. **Reduce hedging.** AI Polish overuses "może" (maybe), "wydaje się, że" (it seems), "można przypuszczać" (one can assume). Replace some with confident assertions.
7. **Use "ty" (direct address).** "Jeśli chcesz poprawić..." instead of "Jeśli ktoś chce poprawić..." / "W celu poprawy..."

### Step 6: Perplexity Injection (Advanced)

Target the statistical model directly by reducing word predictability:

1. **Swap expected collocations.** "Odgrywać kluczową rolę" -> "mieć duże znaczenie" or "być ważnym". Break the phrase the language model would predict.
2. **Use domain-specific or colloquial vocabulary** where AI would use formal. "Kod" instead of "oprogramowanie". "Wrzucić na produkcję" instead of "wdrożyć rozwiązanie".
3. **Reorder clause structure.** Polish word order is flexible -- use that flexibility. Move the verb, front the object, start with a subordinate clause.
4. **Avoid excess morphological regularity.** Polish has rich inflection. AI sometimes produces suspiciously consistent case usage and verb forms. Mix perfective/imperfective naturally.

### Step 7: Final Check

Before delivering:

- [ ] Read aloud. Does any sentence sound like a corporate press release or government document? Rewrite.
- [ ] Count "kluczowy" -- should appear 0-1 times in any text under 1000 words.
- [ ] Count em dashes. More than 2 per 500 words? Cut.
- [ ] Check for 3+ same-length consecutive sentences. Break the pattern.
- [ ] Scan for remaining blacklisted words. Replace.
- [ ] Check for "posiadać" -- replace with "mieć".
- [ ] Verify factual accuracy. Humanization must not change meaning.
- [ ] Check for stacked participial clauses. Break into separate sentences.
- [ ] Confirm register matches audience from Step 0.
- [ ] Look for American/British cultural references. Replace or remove.

Present the rewritten text. Offer to adjust tone (more/less formal) or run a second pass on specific sections.

## Quick-Reference: Polish Detection Signals and Countermeasures

| Detection signal | What detectors look for | Countermeasure |
|---|---|---|
| Low perplexity | Predictable word choices, standard collocations | Collocation breaking, clause reordering, domain vocabulary |
| Low burstiness | Uniform sentence length ("hipnotyczny rytm") | Mix short/long sentences, fragments, varied paragraphs |
| Vocabulary fingerprint | "kluczowy", "kompleksowy", "zagłębiać się" | Replace with plain Polish per blacklist |
| Register uniformity | Korpo-mowa / styl urzędowy in all contexts | Match register to audience, use colloquial forms |
| Nominalization | "Dokonanie analizy" instead of "przeanalizować" | Use verbs directly |
| Participial stacking | Chains of imiesłowy przysłówkowe | Break into separate sentences |
| Copula avoidance | "Stanowić" instead of "być" | Restore "jest"/"są" |
| "Posiadać" pattern | Using "posiadać" where "mieć" is natural | Replace with "mieć" |
| Transition stacking | "Ponadto... Co więcej... Dodatkowo..." | Drop or use "Też", "I", "Poza tym" |
| Filler phrases | "Warto zauważyć", "Należy podkreślić" | Delete entirely |
| Positivity bias | Every section ends optimistically | Allow trade-offs, scepticism, unanswered questions |
| Cultural mismatch | English cultural references in Polish text | Replace with Polish context |

## Important

- **Never change the factual content.** Humanization is about form, not substance. Every claim from the original must survive the rewrite.
- **Never invent statistics, credentials, or case studies.** If adding an example, label it as hypothetical.
- **Polish morphology matters.** When replacing words, ensure correct case, gender, number, and aspect. A "humanized" text with wrong grammar is worse than the original.
- **Match the register.** Academic Polish tolerates more formality than a blog post. A Slack message is different from a whitepaper. Always calibrate to the audience from Step 0.
- **One pass is rarely enough.** After the first rewrite, re-read as if you're a detector. The most AI-sounding 2-3 sentences get a targeted second pass.
- **Don't over-humanize.** Forced slang, gratuitous colloquialisms, or artificial "mistakes" read as suspicious as the original AI text. The goal is natural, not performatively casual.
- **Detectors are unreliable on Polish (50-90% error rates).** The target is genuinely natural-sounding text, not a detector score. If the text reads well to a native Polish speaker, the job is done.
