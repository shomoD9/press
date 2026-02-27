# Press v2 — Systematic Video Production Engine

## Problem

Creators who write well and think deeply face a brutal bottleneck when turning a finished essay into a video worth watching. The manual path — hiring motion designers — is slow, expensive, and unpredictable. The automated path — AI video generators, slideshow tools — produces flat, generic content no tasteful creator would publish.

There is no tool that programmatically produces premium motion graphics videos from a script with the fidelity of a professional editor and the speed of software. Press fills that gap.

## Scope

**In:**
- Script analysis and beat list generation from essay text + time-coded voiceover audio
- Visual metaphor proposal per beat (LLM-powered, context-aware, drawn from asset library)
- Beat list curation interface: approve, redirect with natural language, or request alternative proposals
- Programmatic video composition from a user-provided design system and asset library
- Scene-by-scene review and iteration on rendered output
- Timeline-level fine-tuning: animation timing, element positioning, transitions, text overlays
- Design system ingestion: color palette, typography, motion rules, layout principles
- Asset library management with semantic tagging
- Final render to MP4

**Out:**
- AI-generated imagery (no diffusion-model visuals — the engine builds, not generates)
- Brand or visual identity definition (user brings their own design system)
- Music, sound design, or audio mixing (user adds music independently)
- Script writing or voiceover adaptation
- Voiceover generation (user records their own audio)
- Multi-platform format cuts (YouTube long-form only)
- Multi-user features, collaboration, or sharing

## Core Concepts

### The Beat System

The beat list is the central abstraction — the contract between what the essay says and what the video shows. The engine analyzes the script and breaks it into beats, where each beat is a short segment of narration (typically 5–15 seconds) assigned:

- **Narration text** for that segment
- **Core concept** being communicated
- **Visual treatment type**: kinetic typography, animated diagram, icon composition, map, comparison layout, data visualization, full-bleed text card, abstract geometric animation, or other treatment from the available vocabulary
- **Visual metaphor**: what the concept looks like concretely (e.g., "scarcity" → a container shrinking, "network effects" → nodes multiplying and connecting)
- **Pacing intent**: hold, flow, quick cut, breathing room

The beat list is where taste lives. If the beat list is right, rendering is mechanical. The engine's first proposal must already be good — contextually appropriate, not generic, not literal.

### Programmatic Visual Metaphors

The engine maps abstract ideas to concrete animated visuals. It does this by:

1. Understanding the concept in the narration (LLM-powered analysis)
2. Proposing a visual metaphor appropriate to the concept
3. Mapping that metaphor to available assets and composition patterns from the user's library

The user curates: approve the proposal, redirect it with a natural language description ("show this as a network contracting, not a bar chart"), or ask for a different suggestion. One proposal at a time, not multiple options.

### Cinematic Motion & Design

The design system enforces premium feel across every frame. This means: deliberate easing curves, weighted animation, smooth interpolation, professional typography, and consistent visual language. Every element enters, moves, and exits with intention. No slideshow energy. No cheap transitions. The engine's motion vocabulary is defined by the design system — it does not improvise outside those rules.

## User Flow

### Setup (once, updated as needed)

1. User provides a **design system**: color palette, typography (fonts, sizing, hierarchy), motion rules (easing curves, animation durations, enter/exit behaviors, parallax intensity), and layout principles (margins, safe zones, grid, text placement).
2. User provides an **asset library**: icons, symbols, textures, illustrations, backgrounds, shapes. Each asset is tagged with semantic meaning so the engine knows what concept it represents ("growth," "network," "time," "conflict," etc.).
3. The engine stores these as the active visual vocabulary for all future videos. Both are updated independently at any time.

### Per Video

**Step 1 — Input.** User provides essay text and voiceover audio with word-level timestamps (from any transcription service). The essay is the narration spoken verbatim. The video is treated as one continuous flow — no structural sections or segment breaks.

**Step 2 — Beat List Generation.** The engine analyzes the script and produces a beat list. A typical 10-minute video yields 40–80 beats.

**Step 3 — Beat List Curation.** User reviews the beat list in a scannable interface (not rendered video — text and visual intent only). The workflow is scan-and-stop: most beats are approved without deliberation. For beats that need attention, the user can:
- Approve (the default, fastest action)
- Change the visual treatment type
- Redirect the metaphor with a natural language description
- Request an alternative proposal from the engine

**Step 4 — Render.** The engine composes the full video: building motion graphics from the design system and asset library, synced to the voiceover timing. All visuals are programmatically constructed — nothing is AI-generated.

**Step 5 — Scene-by-Scene Review.** User watches the rendered draft scene by scene. Most scenes pass. For scenes that don't land, the user gives direction in natural language ("this feels too rushed," "the icon doesn't convey the idea," "swap to a timeline layout") and the engine re-renders only that scene.

**Step 6 — Timeline Fine-Tuning.** Once scenes are locked, the user can open the timeline for granular adjustments: animation timing, element positioning and sizing, transition behavior, text overlay content and placement, visual element swaps. This layer is for surgical precision on specific moments — most videos won't need heavy use of it.

**Step 7 — Export.** Final render to MP4. User adds music and publishes independently.

## Visual Treatment Vocabulary

The engine should be capable of composing at minimum these treatment types per beat:

- Kinetic typography (words and phrases animated, emphasized, revealed)
- Animated diagrams (flowcharts, trees, networks, cause-and-effect chains)
- Data visualizations (charts, graphs, animated timelines)
- Icon and symbol compositions (abstract concepts as animated symbolic arrangements)
- Maps and geographic elements (animated paths, region highlights)
- Comparison and juxtaposition layouts (split screen, before/after, versus)
- Full-bleed text cards (emphasis moments, key phrases)
- Abstract geometric animation (shapes, patterns, motion as pure visual texture)
- Background systems (gradients, textures, particles, ambient motion for depth)
- Camera movements (zoom, pan, parallax — even within 2D compositions)

Text-on-screen (pulling key phrases from narration as visual text overlays) is a per-beat decision controlled in the beat list — not a global setting.

## Success Criteria

1. A user with a finished essay and recorded voiceover can produce a publish-ready video draft within a single focused session — under 2 hours including all review and iteration.
2. The first rendered draft is good enough that most scenes require no revision. The beat list curation step catches direction problems before expensive rendering happens.
3. The visual output is indistinguishable in quality from work produced by a professional motion graphics editor working within the same design system.
4. The engine's visual metaphor proposals demonstrate genuine contextual understanding — they are appropriate to the content, not generic or crudely literal.

## Acceptance Criteria

- [ ] Engine accepts essay text + voiceover audio with word-level timestamps as input
- [ ] Engine produces a beat list with visual treatment type, visual metaphor, and pacing intent per beat
- [ ] User can approve, redirect (via natural language), or request alternative proposals for each beat
- [ ] Engine renders composed motion graphics video synced to voiceover timing
- [ ] All rendered visuals are built from the user-provided design system and asset library — no AI-generated imagery
- [ ] User can review and iterate on individual scenes without re-rendering the entire video
- [ ] User can make timeline-level adjustments to animation timing, element positioning, transitions, and text
- [ ] Design system is configurable: color palette, typography, motion rules, layout principles
- [ ] Asset library supports semantic tagging; the engine selects assets based on concept relevance
- [ ] Motion graphics exhibit professional-grade animation: deliberate easing, weighted motion, smooth interpolation
- [ ] Final output renders to MP4

## Open Questions

1. What rendering technology best supports programmatic composition at premium motion quality? [Coding agent to decide]
2. What is the optimal beat granularity — fixed duration, sentence-level, or dynamically determined by script analysis? [Coding agent to decide, user to validate feel]
3. How should the design system and asset library be structured as input formats? [Coding agent to decide]
4. Should the curation and review interface be web-based, desktop, or terminal? [Coding agent to decide based on iteration speed]
5. How should the LLM visual metaphor proposer interface with the asset library — direct matching, abstract-then-match, or hybrid? [Coding agent to decide]
6. What intermediate representation should the approved beat list compile to before video composition? [Coding agent to decide]
7. What level of timeline editor complexity is needed for v1 vs. what can be deferred? [To be scoped during implementation]
