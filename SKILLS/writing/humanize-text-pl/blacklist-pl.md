# Czarna lista AI -- Polish AI Word & Phrase Blacklist

Reference for the [humanize-text-pl](SKILL.md) skill. 142 entries of words, phrases, and patterns that AI models overuse when writing in Polish, with natural replacements.

When rewriting, replace these with the suggested alternatives or delete entirely where marked.

## 1. Adjectives (Przymiotniki)

| # | AI Polish | English gloss | Replace with | Notes |
|---|-----------|---------------|-------------|-------|
| 1 | kompleksowy | comprehensive | pelny, dokladny, szeroki, gruntowny | Top AI tell in Polish |
| 2 | wszechstronny | versatile/comprehensive | szeroki, roznorodny, na wielu plaszczyznach | |
| 3 | kluczowy | key/crucial | wazny, istotny, glowny | Massively overused -- limit to 0-1 per 1000 words |
| 4 | innowacyjny | innovative | nowy, nowatorski, swiezy | |
| 5 | solidny | robust | mocny, pewny, porzadny | Calque from English "robust" |
| 6 | roburstny | robust (direct loan) | mocny, wytrzymaly, odporny | Anglicism -- avoid entirely |
| 7 | dynamiczny | dynamic | zmienny, zywy, ruchliwy | |
| 8 | efektywny | effective | skuteczny, sprawny | AI prefers Latinate form |
| 9 | optymalny | optimal | najlepszy, odpowiedni | |
| 10 | istotny | significant/essential | wazny, powazny, duzy | AI stacks "kluczowy" + "istotny" |
| 11 | fundamentalny | fundamental | podstawowy, zasadniczy | |
| 12 | niezwykle istotny | extremely important | bardzo wazny | Double intensifier = AI pattern |
| 13 | niezbedny | indispensable | potrzebny, konieczny | |
| 14 | fascynujacy | fascinating | ciekawy, interesujacy | |
| 15 | niezwykly | remarkable | osobliwy, ciekawy, nietypowy | |
| 16 | bezprecedensowy | unprecedented | niespotykany, pierwszy taki | |
| 17 | wieloaspektowy | multifaceted | zlozony, skomplikowany | |
| 18 | wielowymiarowy | multidimensional | zlozony, rozbudowany | |
| 19 | holistyczny | holistic | calosciowy, ogolny | |
| 20 | synergiczny | synergistic | wspolny, wzajemnie wzmacniajacy | Avoid entirely in casual text |
| 21 | zroznicowany | diversified | rozny, rozmaity | |
| 22 | wyrafinowany | sophisticated | dopracowany, przemyslany | |
| 23 | niebagatelny | non-trivial/considerable | duzy, spory, znaczny | |
| 24 | transparentny | transparent | przejrzysty, jasny, otwarty | Anglicism preferred by AI |
| 25 | zrownowazony | sustainable/balanced | trwaly, wywaznoy, stabilny | Context-dependent |

## 2. Verbs (Czasowniki)

| # | AI Polish | English gloss | Replace with | Notes |
|---|-----------|---------------|-------------|-------|
| 26 | zaglebiać sie (w) | delve into | wchodzic w, zajmowac sie, poznawac | Direct "delve" calque |
| 27 | wykorzystac / wykorzystywac | leverage/utilize | uzyc, skorzystac z, wziac | AI's #1 Polish verb |
| 28 | zapewnic | ensure | dac, zadbac o, pilnowac | |
| 29 | umozliwiac | enable | pozwalac, dawac mozliwosc | |
| 30 | optymalizowac | optimize | poprawic, usprawnic, ulepszyc | |
| 31 | implementowac | implement | wdrozyc, wprowadzic, zrobic | Anglicism |
| 32 | zaimplementowac | implement (perf.) | wdrozyc, dodac, zastosowac | |
| 33 | generowac | generate | tworzyc, wytwarzac, powodowac | |
| 34 | skalowac | scale | powiekszac, rozrastac, zwiekszac | |
| 35 | priorytetyzowac | prioritize | stawiac na pierwszym miejscu | |
| 36 | integrowac | integrate | laczyc, wlaczac, dolaczac | |
| 37 | analizowac | analyze | sprawdzic, przejrzec, zbadac | Overused even where "sprawdzic" suffices |
| 38 | eksplorowac | explore | badac, sprawdzac, szukac | |
| 39 | ewoluowac | evolve | zmieniac sie, rozwijac sie | |
| 40 | wzmacniac | strengthen/enhance | poprawic, wspierac | |
| 41 | odzwierciedlac | reflect | pokazywac, odpowiadac | |
| 42 | stanowic | constitute | byc, tworzyc | Bureaucratic -- restore "jest"/"sa" |
| 43 | posiadac | possess | miec | Classic "urzedowy" tell -- always replace |
| 44 | dokonac | perform/carry out | zrobic, wykonac | |
| 45 | usprawnic | streamline | poprawic, przyspieszyc | |
| 46 | odgrywac role | play a role | miec znaczenie, wplywac na | |
| 47 | przyczynic sie do | contribute to | pomoc w, wplynac na | |
| 48 | wywierac wplyw | exert influence | wplywac na | Nominalization pattern |
| 49 | dedykowac | dedicate | poswiecic, przeznaczyc | False friend / anglicism |
| 50 | adresowac (problem) | address (a problem) | rozwiazywac, zajmowac sie | Anglicism |

## 3. Nouns & Noun Phrases (Rzeczowniki)

| # | AI Polish | English gloss | Replace with | Notes |
|---|-----------|---------------|-------------|-------|
| 51 | aspekt | aspect | strona, element, czesc | |
| 52 | kontekst | context | tlo, okolicznosci, sytuacja | Overused as filler |
| 53 | perspektywa | perspective | punkt widzenia, strona | |
| 54 | paradygmat | paradigm | model, schemat, podejscie | |
| 55 | synergia | synergy | wspolpraca, wspolne dzialanie | |
| 56 | potencjal | potential | mozliwosci, szanse | |
| 57 | ekosystem | ecosystem | srodowisko, otoczenie, swiat | Used outside biology by AI |
| 58 | krajobraz | landscape (figurative) | sytuacja, stan, obraz | Calque from English |
| 59 | fundament | foundation | podstawa, baza | |
| 60 | implikacja | implication | skutek, konsekwencja, wplyw | |
| 61 | trajektoria | trajectory | kierunek, droga, przebieg | |
| 62 | ramy / ramy dzialania | framework | zasady, struktura, podejscie | |
| 63 | interesariusz | stakeholder | zainteresowany, uczestnik, strona | |
| 64 | predyspozycja | predisposition | sklonnosc, zdolnosc, talent | |
| 65 | implementacja | implementation | wdrozenie, wprowadzenie | |

## 4. Transitions & Connectors (Laczniki)

| # | AI Polish | English gloss | Replace with | Notes |
|---|-----------|---------------|-------------|-------|
| 66 | Ponadto | Furthermore | Poza tym, Tez, Oprocz tego | AI connector #1 |
| 67 | Co wiecej | Moreover | I jeszcze, Na dodatek, Tez | |
| 68 | Dodatkowo | Additionally | Tez, I, Jeszcze, A do tego | |
| 69 | Niemniej jednak | Nevertheless | Ale, Mimo to, I tak | |
| 70 | W konsekwencji | Consequently | Przez to, Wiec, Dlatego | |
| 71 | W zwiazku z tym | In connection with this | Dlatego, Wiec, No i | |
| 72 | Biorac pod uwage | Taking into account | Skoro, Jesli chodzi o | |
| 73 | W kontekscie | In the context of | Jesli chodzi o, Co do | |
| 74 | Z kolei | In turn | A, Natomiast | Overused as paragraph opener |
| 75 | Jednoczesnie | At the same time | Zarazem, Rownoczesnie, I | |
| 76 | W szczegolnosci | In particular | Zwlaszcza, Szczegolnie | |
| 77 | Warto podkreslic, ze | It's worth emphasizing | (drop and state the fact) | |
| 78 | Niezaprzeczalnie | Undeniably | Na pewno, Bez watpienia, (drop) | |
| 79 | Bez watpienia | Without a doubt | Na pewno, Jasne ze | |
| 80 | W istocie | In essence | Wlasciwie, W gruncie rzeczy | |
| 81 | Mianowicie | Namely | Czyli, To znaczy, Chodzi o | |
| 82 | Innymi slowy | In other words | Czyli, To znaczy | |
| 83 | Reasumujac | To sum up | Krotko mowiac, W skrocie | Very bureaucratic |

## 5. Filler / Hedging Phrases (Wypelniacze) -- Delete Entirely

| # | AI Polish | English gloss |
|---|-----------|---------------|
| 84 | Warto zauwazyc, ze... | It's worth noting that... |
| 85 | Warto wspomniec, ze... | It's worth mentioning that... |
| 86 | Nalezy podkreslic, ze... | It should be emphasized that... |
| 87 | Nalezy pamietac, ze... | It should be remembered that... |
| 88 | Nie sposob nie wspomniec o... | One cannot fail to mention... |
| 89 | Nie da sie ukryc, ze... | It cannot be denied that... |
| 90 | Jak juz wspomniano... | As already mentioned... |
| 91 | W tym miejscu warto... | At this point it's worth... |
| 92 | Trzeba miec na uwadze, ze... | One must keep in mind that... |
| 93 | Jest to o tyle istotne, ze... | This is significant insofar as... |
| 94 | To z kolei prowadzi do... | This in turn leads to... |
| 95 | Co niezwykle istotne... | What is extremely important... |
| 96 | Jak sie okazuje... | As it turns out... |

**Rule:** Delete these entirely and state the fact directly. "Warto zauwazyc, ze rynek rosnie" -> "Rynek rosnie."

## 6. Sentence-Opening Patterns (Schematy otwierajace) -- Rewrite

| # | AI pattern | Replace with |
|---|-----------|-------------|
| 97 | "W dzisiejszych czasach..." | "Teraz...", "Dzis...", or start with the specific claim |
| 98 | "W dobie [X]..." | "Teraz, kiedy...", "Skoro mamy..." |
| 99 | "Nie ulega watpliwosci, ze..." | (just state the claim) |
| 100 | "Jak powszechnie wiadomo..." | (if it's known, just say it) |
| 101 | "W obliczu [X]..." | "Kiedy...", "Bo...", "Przy..." |
| 102 | "Swiat, w ktorym zyjemy..." | (delete or be specific) |
| 103 | "Na przestrzeni lat..." | "Z czasem...", "Przez lata..." |
| 104 | "Wspolczesny [X]..." | "Dzisiejszy...", "Obecny..." |

## 7. Sentence-Closing Patterns (Zakonczenia) -- Rewrite or Delete

| # | AI pattern | Replace with |
|---|-----------|-------------|
| 105 | "...co stanowi fundament dalszego rozwoju." | (be specific about what happens next, or delete) |
| 106 | "...co z pewnoscia przelozy sie na..." | "...wiec pewnie..." or rephrase concretely |
| 107 | "...odgrywajac kluczowa role w..." | "...i ma duze znaczenie dla..." |
| 108 | "...otwierajac nowe perspektywy." | (delete or say what actually opens) |
| 109 | "...stanowiac tym samym..." | "...i jest..." |

## 8. Structural / Register Patterns (Wzorce strukturalne)

| # | Pattern | Description | Fix |
|---|---------|-------------|-----|
| 110 | Excessive nominalization | "Dokonanie analizy" instead of "przeanalizowac" | Use verbs directly: wybrarc, kupic, zrobic |
| 111 | Passive/impersonal overuse | "Zostalo zaobserwowane, ze..." | Use active voice: "Zauwazylem, ze..." |
| 112 | Participial clause chains | "...bedac jednoczesnie..., stanowiac..." -- stacking imiesłowy | Break into separate sentences |
| 113 | Korpo-mowa register | Formal-corporate tone in casual contexts | Match actual audience register |
| 114 | Bold-first bullet pattern | "**Kluczowy aspekt:** opis..." | Vary formatting, skip bold keywords |
| 115 | Tricolon abuse | "szybszy, lepszy i bardziej efektywny" | Use two, four, or one. Not three. |
| 116 | "Zarowno X, jak i Y" overuse | Both X and Y (used everywhere) | "X i Y", "X, ale tez Y" |
| 117 | Em-dash stacking | Multiple em dashes per sentence | Max 1-2 per paragraph |

## 9. Polish-Specific AI Quirks (Polskie specyfiki)

| # | AI behavior | Natural Polish | Notes |
|---|-------------|----------------|-------|
| 118 | "posiadac" instead of "miec" | "miec" | Always replace |
| 119 | "dokonac wyboru" instead of "wybrac" | "wybrac" | Nominalization |
| 120 | "dokonac zakupu" instead of "kupic" | "kupic" | Same pattern |
| 121 | "w sposob efektywny" instead of "skutecznie" | "skutecznie" / "dobrze" | Prepositional circumlocution |
| 122 | "na chwile obecna" instead of "teraz" | "teraz", "na razie" | |
| 123 | "w chwili obecnej" instead of "teraz" | "teraz" | |
| 124 | "w ramach" overuse | "w", "przy", "podczas" | |
| 125 | "w zakresie" overuse | "jesli chodzi o", "co do" | |
| 126 | "z uwagi na fakt, ze" instead of "bo" | "bo", "poniewaz", "skoro" | 6 words where 1 suffices |
| 127 | "celem [X] jest..." | "[X] ma...", "[X] sluzy do..." | Bureaucratic |
| 128 | "przedmiotowy" (the subject) | "ten", "omawiany", (drop) | Legal register leak |
| 129 | "niniejszy" (hereby/this) | "ten", (drop) | Legal register leak |
| 130 | "powyzszy" / "ponizszy" overuse | "ten", "opisany wyzej" | AI uses as pointers excessively |
| 131 | Using "Pan/Pani" when "ty" fits | "ty" (informal) | AI defaults to formal address |
| 132 | "Oczywiscie!" as agreement opener | (just answer the question) | AI assistant voice in Polish |
| 133 | "Swietne pytanie!" | (just answer) | Calque from English AI pattern |
| 134 | "Z przyjemnoscia pomoge!" | (just help) | Same |

## 10. Overused Intensifiers & Adverbs (Przysłówki)

| # | AI Polish | English gloss | Replace with |
|---|-----------|---------------|-------------|
| 135 | niezwykle | extremely | bardzo, naprawde, (drop) |
| 136 | niezaprzeczalnie | undeniably | na pewno, bez watpienia, (drop) |
| 137 | fundamentalnie | fundamentally | z gruntu, zasadniczo, (drop) |
| 138 | niewatpliwie | undoubtedly | na pewno, chyba, pewnie |
| 139 | zasadniczo | essentially | w gruncie rzeczy, wlasciwie |
| 140 | szczegolnie | particularly | zwlaszcza, glownie |
| 141 | znaczaco | significantly | wyraznie, duzo, mocno |
| 142 | diametralnie | diametrically | zupelnie, calkiem |

## Quick-Reference: Top 20 Instant AI Tells in Polish

If a Polish text contains 5+ of these, it's almost certainly AI-generated:

1. **"kompleksowy"** -- used where "pelny" or "szeroki" works
2. **"kluczowy"** -- used 3+ times in one text
3. **"Warto zauwazyc, ze..."** -- filler before a fact
4. **"W dzisiejszych czasach..."** -- generic opener
5. **"zaglebiać sie"** -- "delve" in Polish
6. **"wykorzystac"** as default verb -- where "uzyc" works
7. **"Ponadto" / "Co wiecej" / "Dodatkowo"** -- transition stacking
8. **"posiadac"** instead of "miec"
9. **"wieloaspektowy"** -- multifaceted, avoid entirely
10. **"ekosystem"** outside biology
11. **"Nalezy podkreslic, ze..."** -- bureaucratic filler
12. **"stanowic"** instead of "byc"
13. **"holistyczny"** -- use "calosciowy" or "ogolny"
14. **Participial clause chains** -- stacked imiesłowy przysłówkowe
15. **"dokonac + noun"** instead of a simple verb
16. **"w ramach"** overuse
17. **"Nie ulega watpliwosci, ze..."** -- false certainty opener
18. **"niezwykle istotny"** -- double intensifier
19. **"Swietne pytanie!" / "Oczywiscie!"** -- assistant voice
20. **Bold-first bullet pattern** -- "**Keyword:** explanation..." every time

## Sources

Compiled from:
- Katsin.pl: 15 red flags for spotting ChatGPT text in Polish
- Sempai.pl: AI detector accuracy testing on Polish text (2025)
- Senuto: 10-step Polish AI text humanization guide
- Reddit r/Polska: community discussion on Polish AI text tells
- Reddit r/ChatGPTPromptGenius, r/WritingWithAI: cross-language AI patterns
- Cross-mapping from English AI blacklist (humanize-text skill) to Polish equivalents
- Linguistic analysis of korpo-mowa and styl urzedowy patterns in AI output
