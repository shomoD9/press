# Press — Visual Trigger Ruleset

This document defines the rules the AI agent applies when reading a finished essay and generating the visual plan. It is designed to evolve independently of the product spec.

The trigger ruleset is referenced by the Publish module spec (`spec-v1-visual-plan.md`) and by the CLAUDE.md at the vault root.

---

## The Default

**The default state is Shomo on camera.** The viewer sees his face unless a trigger fires. Every trigger below defines a departure from this default. Any passage in the essay that does not match a trigger = Shomo talking on screen. These passages do not appear in the visual plan table.

---

## Trigger 1: Diagram

**When it fires:** The essay explains a relationship, a system, a model, a process, or any structural concept — something where a visual representation aids comprehension. The key signal is that the text describes how things connect, flow, depend on, or relate to each other.

**What the agent does:**
- Triggers the Excalidraw MCP to auto-generate a diagram representing the concept.
- Saves the diagram file in the essay folder with a sequential name (`diagram-01.excalidraw`, `diagram-02.excalidraw`, etc.).
- Adds an entry to the visual plan table referencing the diagram file.

**What Shomo does:** Reviews the diagram. Tweaks in Excalidraw if needed.

---

## Trigger 2: B-Roll Type A — Atmospheric

**When it fires:** The essay is doing world-building around a cultural artifact — discussing a film, book, historical period, or cultural moment in a general, immersive way. The visual does not need to match Shomo's words precisely. The goal is atmosphere, not illustration. The signal is that the essay is evoking a world rather than referencing a specific moment.

**What the agent does:**
- Generates search terms for relevant atmospheric imagery.
- Provides in the Notes column:
  - Search terms (plain text).
  - A YouTube search URL with terms pre-filled.
  - A Descript stock library search term for copy-pasting.
  - A brief note on what kind of imagery to look for (tone and feel, not specifics).

**What Shomo does:** Grabs what looks right from the search results.

---

## Trigger 3: B-Roll Type B — Specific Reference

**When it fires:** The essay names a specific external thing — a particular film scene, a podcast episode, a news clip, a trailer, a named moment, a specific person's statement. Shomo already knows what it is. The signal is a proper noun or a specific, identifiable moment being referenced.

**What the agent does:**
- Names the exact source and the specific moment or clip in the Notes column.
- Where possible, also provides:
  - Search terms (plain text).
  - A YouTube search URL with terms pre-filled.
  - A Descript stock library search term for copy-pasting.
- Not all specific references will have useful search terms (e.g., a personal anecdote or an obscure source). The agent provides them when they would be helpful and omits them when they would not.

**What Shomo does:** Pulls the clip he already knows about, using the search aids if helpful.

---

## Trigger 4: Emphasis — Captions on Dark Screen

**When it fires:** The essay hits a "landing" — a sentence that is an arrival, not a climb. Most of the essay is building: connecting ideas, presenting evidence, developing a chain of reasoning. That is the climb. Periodically, the argument arrives somewhere. That is the landing. Captions on a dark screen exist to say to the viewer: "Stop. This is the point."

### Emphasis Patterns

Five patterns qualify as emphasis moments:

**Thesis declaration.** The sentence where the essay states what it is actually arguing. Usually appears early in the piece, sometimes restated near the end. This is the essay's central claim.

**Conclusion after a chain.** The "therefore" after extended reasoning. The essay has walked through a sequence of premises or observations, and now delivers the payoff. The sentence that begins a new thought after that buildup.

**Reframe.** The essay takes something the reader assumed was one thing and flips it. The moment of inversion. The reader's model of the topic shifts.

**Provocation.** A sentence designed to challenge or unsettle. Something the viewer might disagree with, and that is the point. It earns the visual pause.

**Distillation.** A complex idea compressed into a single clean sentence. The kind of line someone would screenshot and share. If it works completely ripped from context, it is a distillation.

### What Does NOT Qualify

- Transitions between ideas.
- Setup sentences that serve a later payoff.
- Evidence, examples, or illustrations of a point made elsewhere.
- Definitions (unless they function as reframes in disguise).
- Rhetorical questions.
- Any sentence that is *serving* another sentence rather than standing on its own.

### Density Guidance

There is no hard upper limit on emphasis moments per essay. However, the agent should be aware that overuse kills the effect. Dark screen moments are powerful because they are relatively rare. If the visual plan has emphasis triggers in consecutive passages or clustered heavily in one section, the agent should flag this and reconsider which ones are true landings versus which are merely important sentences in a climb.

**What the agent does:**
- Flags the exact sentence(s) as an emphasis entry.
- Notes which emphasis pattern applies in the Notes column.

**What Shomo does:** Reviews during visual plan iteration. Approves, adjusts, or removes.

---

## Ruleset Evolution

This ruleset is a living document. As Shomo produces more videos and develops stronger instincts about what works, triggers can be added, modified, or removed. The visual plan spec does not need to change when the ruleset evolves — only this file needs to be updated.

Possible future additions:
- Remotion animation trigger (when Remotion MCP integration is validated).
- Audience-facing text overlays (quotes, statistics, key terms).
- Transition cues between major sections.
