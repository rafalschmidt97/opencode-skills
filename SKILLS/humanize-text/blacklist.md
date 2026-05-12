# AI Word & Phrase Blacklist

Reference for the [humanize-text](SKILL.md) skill. Every entry below has been documented as appearing at elevated frequency in LLM output compared to human writing. Frequency multipliers (where available) are from cross-model studies comparing AI output to human baselines.

When rewriting, replace these with the suggested alternatives or delete entirely where marked.

## Tier 1: Strongest AI Signals (10x+ overuse vs human text)

| Word/Phrase | Frequency vs Human | Replace With |
|---|---|---|
| delve / delve into | 48x | dig into, explore, examine, look at |
| tapestry | 35x | mix, combination, collection, range |
| multifaceted | 28x | complex, layered, varied, many-sided |
| nuanced | 22x | subtle, detailed, fine-grained, specific |
| it's worth noting that | 31x | (delete -- state the fact directly) |
| it's important to note | 27x | (delete) |
| in today's digital age | 24x | (delete) |
| in the realm of | 22x | in, within, for |
| it is important to understand | 20x | (delete -- just explain) |
| foster innovation | 20x | encourage new ideas, push experimentation |
| landscape (metaphorical) | 19x | field, space, world, area, market |
| this is particularly true | 18x | especially |
| drive engagement | 18x | get people involved, increase participation |
| comprehensive | 17x | full, complete, thorough |
| harness the power of | 17x | use |
| pivotal | 16x | key, critical, important |
| navigate the complexities | 16x | deal with, handle, work through |
| unlock the potential | 15x | make the most of, take advantage of |
| furthermore | 15x | also, plus, and |
| one might argue that | 15x | (just make the argument) |
| elevate your | 14x | improve, boost, raise |
| crucial | 14x | important, key, necessary |
| moreover | 14x | also, on top of that |
| it goes without saying | 14x | (don't say it -- or just say it) |
| empower individuals | 13x | help people |
| leverage (verb) | 13x | use, take advantage of |
| robust | 12x | strong, solid, reliable, sturdy |
| resonate with audiences | 12x | connect with people |
| additionally | 12x | also, and |
| at the end of the day | 12x | ultimately, in practice |
| a testament to | 11x | proof of, shows that |
| streamline | 11x | simplify, speed up, cut steps from |
| in an era where | 11x | now that, since |
| consequently | 11x | so, as a result |
| shed light on | 10x | explain, show, clarify |
| utilize | 10x | use |
| facilitate | 10x | help, enable, support |
| when it comes to | 10x | for, with, regarding |
| nevertheless | 10x | still, but, even so |

## Tier 2: High-Signal Words (5-9x overuse)

| Word/Phrase | Replace With |
|---|---|
| endeavor | effort, attempt, try |
| paramount | most important, top priority |
| in conclusion | (delete -- just conclude) |
| to summarize | (delete -- just summarize) |
| that being said | but, still, however |
| with that in mind | so, given that |
| in light of this | because of this, so |
| on the other hand | but, however |
| generally speaking | usually, in most cases |
| arguably | (remove or rephrase) |

## Tier 3: Flagged Verbs

Replace with plain alternatives:

| AI Verb | Human Alternative(s) |
|---|---|
| amplify | increase, boost, grow |
| augment | add to, expand |
| bolster | support, strengthen |
| captivate | grab, interest, hold attention |
| conceptualize | think through, design, plan |
| craft / crafting | make, write, build, create |
| cultivate | build, develop, grow |
| elevate | raise, improve |
| embark | start, begin |
| empower | give power to, enable, let |
| enhance | improve |
| enrich | improve, add value to |
| excel | do well, succeed |
| flourish | grow, thrive, do well |
| glean | gather, learn, pick up |
| harness | use, apply |
| hinder | block, slow, prevent |
| hone | sharpen, improve, practice |
| illuminate | explain, clarify, show |
| maximize | get the most from |
| navigate | handle, deal with, work through |
| optimize | improve, tune, make better |
| refine | improve, polish, adjust |
| revolutionize | change, transform, reshape |
| showcase | show, display, present |
| strive | try, work toward, aim |
| supercharge | boost, speed up |
| tailor | adjust, customize, fit |
| transcend | go beyond, exceed |
| transform | change, reshape |
| turbocharge | speed up, accelerate |
| underscore | stress, highlight, emphasize |
| unleash | release, unlock, free |
| unlock | open up, enable, access |
| unveil | reveal, show, announce |

## Tier 4: Flagged Adjectives/Adverbs

| AI Adjective | Human Alternative(s) |
|---|---|
| actionable | practical, usable |
| adept | skilled, good at |
| agile | flexible, quick |
| arduous | hard, tough, demanding |
| burgeoning | growing, expanding |
| captivating | interesting, engaging |
| commendable | good, solid, praiseworthy |
| compelling | strong, convincing |
| cutting-edge | latest, new, advanced |
| data-driven | based on data |
| dynamic | active, changing |
| enlightening | useful, eye-opening |
| esteemed | respected |
| ever-evolving | changing, shifting |
| exemplary | excellent, strong |
| formidable | impressive, serious |
| fundamental | basic, core |
| game-changing | major, significant (or be specific) |
| granular | detailed, fine-grained |
| groundbreaking | new, original, first-of-its-kind |
| holistic | whole, complete, full-picture |
| impactful | effective, meaningful |
| innovative | new, original |
| invaluable | very useful, essential |
| mission-critical | essential, vital |
| next-generation | new, updated, latest |
| notable | worth mentioning, significant |
| paramount | most important |
| pervasive | widespread, common |
| profound | deep, significant |
| remarkable | impressive, unusual, surprising |
| relentless | constant, persistent |
| scalable | growable, expandable |
| seamless | smooth, easy |
| significant | big, important, meaningful |
| state-of-the-art | latest, modern, current best |
| stellar | excellent, outstanding |
| substantial | large, considerable |
| transformative | major, reshaping |
| unparalleled | unique, unmatched, best |
| undeniable | clear, obvious |
| vibrant | active, lively |
| vital | important, necessary |
| well-crafted | well-made, polished |

## Tier 5: Flagged Nouns

| AI Noun | Human Alternative(s) |
|---|---|
| bandwidth | capacity, time, availability |
| complexity | difficulty, nuance |
| deliverables | outputs, results, work product |
| domain expertise | knowledge, experience in [field] |
| efficiency | speed, output-per-effort |
| epicenter | center, heart |
| foray | attempt, first try |
| implications | effects, consequences, what this means |
| insights | findings, observations, takeaways |
| iteration | version, cycle, round |
| kaleidoscope | range, variety, mix |
| linchpin | key part, foundation |
| milestone | marker, checkpoint, achievement |
| paradigm | model, approach, framework |
| plethora | many, a lot, plenty |
| realm | area, field, space |
| roadmap | plan, outline |
| stakeholders | people involved, decision-makers, [name the group] |
| synergy | combined effect, teamwork |
| throughput | output, processing speed |
| touchpoint | interaction, contact point |
| treasure trove | collection, rich source |

## Tier 6: Filler Phrases (Delete Entirely)

These add no information. Remove them and state the point directly.

- it's worth noting that
- it's important to note
- it's important to remember
- important to consider
- it is important to understand
- in today's digital age / modern age / era
- in the realm of
- in today's rapidly evolving market
- in a world where
- in the dynamic world of
- welcome to the world of
- generally speaking
- broadly speaking
- based on the information provided
- cannot be overstated
- ever wondered
- picture this
- let's dive in
- let's break this down
- let's unpack this
- here's the kicker
- here's the thing
- think of it as
- imagine a world where

## Tier 7: Sentence Patterns to Avoid

These structural patterns are strong AI signals regardless of vocabulary:

| Pattern | Example | Fix |
|---|---|---|
| "It's not X, it's Y" | "It's not about posting more. It's about posting smarter." | State Y directly. Drop the X framing. |
| "It's not just X. It's Y." | "It's not just speed. It's consistency." | "Consistency matters more than speed." |
| "Not because X. But because Y." | "Not because it's easy. But because it works." | "It works. That's the reason." |
| "No X. No Y. Just Z." | "No theory. No fluff. Just execution." | (Rewrite as a single direct statement) |
| Staccato triplets | "Focused. Aligned. Measurable." | Use a normal sentence with these as adjectives. |
| "And the X? Y." | "And the fix? Better briefs." | "Better briefs fix this." |
| "The result? / The outcome?" | "The result? Higher engagement." | "Engagement went up." |
| Triple examples | Always three bullet points or three cases | Give one strong example, or two, or four. Not three. |

## Tier 8: AI Response / Assistant Phrases

Remove all traces of the "helpful assistant" voice:

- certainly
- of course!
- great question!
- I hope this helps
- feel free to reach out / ask
- here are / here is / here's (as an opener)
- that's a great point
- absolutely
- I'd be happy to help

## Tier 9: Copula Substitutions (Restore "is"/"are")

AI avoids simple "is"/"are" in favor of more "impressive" alternatives. Restore the copula:

| AI writes | Human writes |
|---|---|
| serves as | is |
| stands as | is |
| represents | is (when describing identity, not symbolism) |
| marks | is |
| constitutes | is, makes up |
| functions as | is, works as |
| acts as | is (unless describing temporary/role-play situation) |

Research (Geng & Trotta 2024) documented a >10% drop in "is"/"are" usage in academic papers after LLM adoption, with no prior trend. Detectors now track this.

## Tier 10: Em-Dash Usage Rules

AI uses em dashes as a universal connector. Humans use them sparingly and deliberately.

**Rule: Maximum 2 em dashes per 500 words.**

When removing excess em dashes, replace with:
- **Comma** (for parenthetical asides): "The team -- which had grown quickly -- needed structure" -> "The team, which had grown quickly, needed structure"
- **Colon** (for explanations): "One thing mattered -- speed" -> "One thing mattered: speed"
- **Period** (for emphasis): "She knew the answer -- but hesitated" -> "She knew the answer. But she hesitated."
- **Parentheses** (for tangential info): "The framework -- originally built for mobile -- now supports web" -> "The framework (originally built for mobile) now supports web"

## Tier 11: Transition Replacements

| AI Transition | Human Alternative |
|---|---|
| Furthermore | Also / And / Plus |
| Moreover | Also / On top of that / And |
| Additionally | Also / And |
| Consequently | So / Because of this |
| Nevertheless | But / Still / Even so |
| Notwithstanding | Despite / Even with |
| Accordingly | So |
| Hence | So / That's why |
| Thereby | Which / This |
| Therefore | So |
| Thus | So / This means |
| In essence | Really / Basically |
| In effect | Really / Basically |
| In particular | Especially |
| Specifically | (often deletable -- just be specific) |
| Notably | (often deletable -- just note it) |
| In other words | Put differently / Meaning |
| As such | So |
| To put it simply | (delete -- just say it simply) |
| From a broader perspective | Zooming out / More broadly |

## Sources

Compiled from:
- GPTZero perplexity/burstiness research
- Originality.ai detection methodology
- ContentBeta: 300+ AI words list (2026)
- ScienceEditingExperts: 348-word AI red flags study
- Embryo.com: cross-model AI word analysis
- Grammarly: common AI words catalog
- TheHumanizeAI.pro: 47 words with frequency multipliers
- Geng & Trotta (2024): copula frequency in academic writing (arXiv:2404.08627)
- Kobak et al. (2025): excess vocabulary in biomedical literature (Science Advances)
- Wikipedia: Signs of AI writing (community field guide)
- Reddit r/ChatGPT, r/WritingWithAI, r/freelanceWriters community discussions
