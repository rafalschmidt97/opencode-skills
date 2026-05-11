---
name: humanize-text
description: Rewrite AI-generated text to read as naturally human-written, bypassing AI detectors (GPTZero, Originality.ai, Turnitin). Applies word-level replacements, sentence rhythm variation, structural de-patterning, and tonal adjustments grounded in how detection algorithms actually score text. Use when user says "humanize", "make this sound human", "rewrite to pass AI detection", "remove AI tone", "humanize AI text", "make less robotic", "AI detector", "sounds too much like ChatGPT", "rewrite naturally", or pastes text that reads like typical LLM output. Also use when user asks to edit text for "voice", "authenticity", or "natural tone" in the context of AI-generated content.
---

# Humanize AI Text

Rewrite AI-generated English text so it reads as authentically human-written. This skill is grounded in how AI detectors actually work and targets the specific signals they measure.

## How AI Detectors Work (Why This Matters)

Detectors measure two core signals. Every rewrite rule below targets one or both.

| Signal | What it measures | AI text score | Human text score |
|---|---|---|---|
| **Perplexity** | How predictable each word choice is under a language model. Low = the model would have picked the same words. | Low (predictable) | High (surprising) |
| **Burstiness** | Variance in sentence length and complexity across the document. Low = uniform rhythm. | Low (monotone) | High (varied) |

Advanced detectors (Originality.ai) also use trained discriminative classifiers -- transformer models fine-tuned on millions of labeled human/AI samples. These pick up on subtler patterns: copula avoidance ("serves as" instead of "is"), positivity bias, structural formulae, and model-specific vocabulary fingerprints ("aidiolects").

The rewrite protocol below attacks all layers: vocabulary, rhythm, structure, and tone.

## Protocol

### Step 0: Receive and Assess

1. Ask the user to paste the AI-generated text (or point to a file).
2. Ask: "What's the target audience and where will this be published?" (blog, academic paper, email, social post, documentation -- the register matters).
3. Ask: "Any specific voice or style I should match?" (formal-but-human, conversational, technical-casual, etc.)
4. Read the text. Before rewriting, internally identify:
   - Flagged words/phrases from the [blacklist](blacklist.md)
   - Sentence length uniformity (measure: are 3+ consecutive sentences within 5 words of each other?)
   - Structural formulae (intro-body-challenges-future pattern, triple examples, "In conclusion")
   - Em-dash count (more than 2 per 500 words is a flag)
   - Positivity bias (does every section end on an upbeat note?)
   - Copula avoidance (count "serves as", "stands as", "represents" vs simple "is"/"are")

### Step 1: Word-Level Decontamination

Replace every instance of blacklisted words/phrases with plain-language alternatives. See [blacklist.md](blacklist.md) for the full list. Key principles:

- **Use the simplest word that works.** "Use" not "utilize". "Help" not "facilitate". "Important" not "paramount".
- **Prefer Anglo-Saxon roots over Latinate.** "Start" over "commence". "Get" over "obtain". "Show" over "demonstrate".
- **Kill hedging filler.** Delete "it's worth noting that", "it's important to remember", "in today's digital age" entirely. State the fact.
- **Restore copulas.** Replace "serves as", "stands as", "represents", "marks" with "is" or "are" where that's what's meant.
- **Flatten transitions.** "Furthermore" -> "Also" or just start the sentence. "Consequently" -> "So". "Nevertheless" -> "But" or "Still". Or drop the transition word and let the connection be implicit.

### Step 2: Sentence Rhythm (Burstiness Injection)

AI text has uniform sentence length. Humans don't write that way. Apply these rules:

1. **Never write 3+ consecutive sentences within 5 words of each other in length.** After two medium sentences, drop in a short one (under 8 words) or a long one (25+ words).
2. **Open at least 20% of sentences with something other than Subject-Verb.** Use prepositional phrases, temporal markers, subordinate clauses, or single-word starters.
3. **Include at least one sentence fragment per 300 words.** Not a typo -- fragments are human. "Easier said than done." "Exactly the problem." "Worth a shot."
4. **Vary paragraph length.** If three paragraphs are each 4-5 sentences, break one into 2 sentences and let another run to 6-7.
5. **Ban em-dash overuse.** Maximum 2 em dashes per 500 words. Replace the rest with commas, parentheses, colons, periods, or restructure the sentence.

### Step 3: Structural De-Patterning

AI follows rigid templates. Break them.

1. **Kill the "Challenges and Future Prospects" formula.** If the text has a section that starts "Despite its [positive words], [subject] faces challenges..." followed by vague optimism, rewrite it as a direct statement of trade-offs.
2. **Break the triple-example pattern.** AI gives examples in threes. Sometimes give one strong example. Sometimes give two. Sometimes five. Never default to three.
3. **Remove "In conclusion" / "To summarize" / "In summary".** The reader can feel when it's ending. Just end.
4. **Vary section lengths.** If every section is 3 paragraphs, make one section 1 paragraph and another 5.
5. **Don't open with a grand statement.** "In today's rapidly evolving landscape..." is an instant flag. Start with a specific claim, a question, or an anecdote.
6. **Remove unnecessary headings.** AI adds section headers to prose that doesn't need them. If the text is under 800 words, consider removing all headings.
7. **Don't end every section positively.** Leave some tensions unresolved. Acknowledge downsides without immediately qualifying them away.

### Step 4: Tonal Adjustment

1. **Add contractions.** "It is" -> "It's". "Do not" -> "Don't". "Cannot" -> "Can't". Match the register -- academic text uses fewer, blog posts use more.
2. **Inject first-person where appropriate.** "One might argue" -> "I'd argue" or just make the argument directly. Remove the distancing.
3. **Allow imperfection.** A sentence that starts with "And" or "But". A parenthetical aside. An admission of uncertainty ("I'm not sure this is the best framing, but...").
4. **Cut the positivity bias.** AI text is relentlessly encouraging. Real writing includes doubt, trade-offs, and "this might not work for everyone."
5. **Remove press-release tone.** Replace promotional framing ("this groundbreaking approach") with neutral description ("this approach").
6. **Use "you" and "I" instead of "one" and "individuals".** Direct address reads human.
7. **Drop the assistant voice.** Remove any trace of "I hope this helps", "feel free to", "great question", "certainly".

### Step 5: Perplexity Injection (Advanced)

This step targets the statistical model directly. Detectors measure how predictable your word choices are. Increase unpredictability without sacrificing clarity:

1. **Swap expected words for valid synonyms that a language model wouldn't rank first.** Where AI would write "significant impact", write "real effect" or "actual difference". Where AI writes "crucial role", write "big part".
2. **Use domain-specific or colloquial terms** where a generalist LLM would use formal ones. "Codebase" instead of "software system". "Ship it" instead of "deploy the solution". Match the audience's actual vocabulary.
3. **Reorder clause structure.** Instead of "While X is important, Y matters more", try "Y matters more. X is secondary." or "People focus on X, but Y is where the leverage is."
4. **Break collocations.** AI leans on common word pairs. "Foster innovation" -> "encourage new ideas" or "push teams to experiment". "Drive engagement" -> "get people involved" or "make people care".

### Step 6: Final Check

Before delivering the rewritten text:

- [ ] Read aloud (mentally). Does any sentence sound like it came from a corporate press release? Rewrite it.
- [ ] Count em dashes. More than 2 per 500 words? Cut them.
- [ ] Check for 3+ same-length consecutive sentences. Break the pattern.
- [ ] Scan for any remaining blacklisted words. Replace.
- [ ] Verify factual accuracy. Humanization must not change meaning.
- [ ] Check that the text doesn't feel "over-humanized" -- forced slang or excessive informality is its own red flag.
- [ ] Confirm the tone matches what the user requested in Step 0.

Present the rewritten text. Offer to adjust tone (more/less formal) or run a second pass on specific sections.

## Quick-Reference: Detection Signals and Countermeasures

| Detection signal | What detectors look for | Countermeasure |
|---|---|---|
| Low perplexity | Predictable word choices | Synonym swaps, collocation breaking, clause reordering |
| Low burstiness | Uniform sentence lengths | Mix short/long sentences, fragments, varied paragraphs |
| Vocabulary fingerprint | Overuse of "delve", "tapestry", "multifaceted", etc. | Replace with plain-language alternatives per blacklist |
| Structural formula | Intro-body-challenges-future pattern | Vary section count/length, cut formulaic closings |
| Copula avoidance | "Serves as" instead of "is" | Restore simple "is"/"are" |
| Em-dash overuse | Em dashes as universal connector | Cap at 2 per 500 words |
| Positivity bias | Every section ends optimistically | Leave tensions unresolved, state trade-offs directly |
| Perfect grammar | No fragments, no "And" openers | Allow deliberate imperfections matching register |
| Transition stacking | "Furthermore... Moreover... Additionally..." | Drop transition words or use "also", "and", "but" |
| Negative parallelism | "It's not X, it's Y" pattern | Rewrite as direct statements |

## Important

- **Never change the factual content.** Humanization is about form, not substance. If a claim is made in the original, it must survive the rewrite unchanged.
- **Never invent statistics, credentials, or case studies.** If adding an example, label it as hypothetical.
- **Match the register.** Academic text tolerates fewer contractions and fragments than a blog post. A Slack message is different from a whitepaper. Always calibrate to the audience from Step 0.
- **One pass is rarely enough.** After the first rewrite, re-read the output as if you're a detector. The most AI-sounding 2-3 sentences should get a targeted second pass.
- **Word replacement alone is insufficient.** Research shows that vocabulary alone predicts AI authorship at ~70% accuracy, but structural uniformity and tonal flatness are what push detection scores over the threshold. All six steps matter.
- **Do not over-humanize.** Forced casualness, gratuitous slang, or artificial "mistakes" read as suspicious as the original AI text. The goal is natural, not performatively casual.
