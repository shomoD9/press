# Press — Write Module — V1: Essay Engine

## What It Is

The Write module takes Shomo from a raw idea to a finished essay. It enforces a defined process with clear phases, maintains a consistent folder structure, and actively pushes Shomo toward shipping the shortest possible self-contained piece.

## What Problem It Solves

Shomo's essay creation process is currently haphazard. Discovery is addictive — he explores threads endlessly without a clear signal to stop. There is no defined sequence of phases, no folder structure, no progress tracking, and no mechanism to detect when enough material exists to ship. The result: essays take far longer than they should, material bloats beyond what a single piece needs, and the gap between "interesting idea" and "published essay" stays wide.

The Write module solves this by:
- Enforcing a phase-based workflow with clear transitions.
- Maintaining a folder structure so Shomo always knows where things are.
- Monitoring for self-contained units during Discovery and actively prompting Shomo to write.
- Watching for an emerging crux and surfacing it before Shomo has to go looking.
- Enforcing brevity during Assembly so drafts come out tight, not bloated.
- Preserving pruned material as seeds for future essays so nothing is lost.
- Making progress visible — Shomo always knows what phase he's in and what comes next.

## Core Design Principle

The Write module is a convergence accelerator, not a research environment. It permits exploration, but its primary job is to detect when Shomo has enough material for a self-contained essay and push him toward finishing and shipping it. The shortest possible coherent essay is always the target. Comprehensive treatment of a topic is achieved by shipping multiple short pieces, not by writing one long one.

---

## The Happy Path

### Phase 1: Discovery

Shomo has an idea. He starts a new essay project and gives it a working title. The system creates a properly structured folder for it.

Shomo works with AI in iterative loops. Expression and exploration are fused — he dumps thoughts, AI theorizes and conjectures deeply, AI asks clarifying questions, Shomo answers, new threads emerge. This repeats across multiple threads, each covering a different subtopic. Three modes of discovery happen, sometimes within the same session:

**Thread exploration.** Shomo has a question or hypothesis. AI theorizes, researches, and conjectures deeply on it. Shomo follows up with reactions and further questions. They iterate until the thread is thoroughly explored. The result is saved as a thread doc.

**Self-probing.** AI asks Shomo questions. Shomo answers. AI integrates the answers into an expanding theory document, then asks more questions. This pulls ideas out of Shomo's head that he didn't know he had. The result is saved as a probing doc.

**Deep research.** Rare. Shomo sends AI off to independently and broadly research a topic using deep research capabilities. The result is saved as a research doc.

All three modes produce documents that accumulate in the essay's `discovery/` folder. A typical essay generates 5–10 of these across different subtopics.

**While Discovery is happening, the system is doing two things in the background:**

1. **Watching for crux emergence.** The system reads across all discovery docs and looks for patterns — a through-line connecting multiple threads, a recurring insight, a core tension. When it spots one, it surfaces an observation to Shomo: *"A through-line I'm noticing: X seems to connect threads 1, 3, and 5."* This is not a decision — it's a nudge. Shomo can accept it as the crux, note it, or dismiss it.

2. **Watching for self-contained units.** The system looks for subsets of discovery material that already form a complete, standalone argument. The moment it finds one, it delivers a **one-line essay prompt** — a concise, interesting framing derived from Shomo's own material. Example: *"Why discipline is an architecture problem, not a willpower problem."* If Shomo accepts, the system moves to Convergence. If he declines, Discovery continues. The system errs on the side of prompting early — Shomo can always say no.

### Phase 2: Convergence

Shomo pauses Discovery. Two things get defined:

**The crux.** The core insight — the distilled theorem, axiom, or explanation that the essay is built around. This may have emerged during Discovery (and the system already surfaced it), or Shomo defines it here consciously.

**The objective.** What the essay does with the crux — the narrative purpose. Examples: explain the concept directly, walk the reader through the investigation, address a specific problem, narrate the rabbit hole of discovery.

Both are recorded in a `crux.md` file in the essay folder. Both can shift later during Assembly — the system accommodates this. If they change, `crux.md` is updated and Assembly re-runs against the new direction.

### Phase 3: Assembly

The system reads all discovery docs against the crux and objective and produces output for Shomo.

**What the system does:**
- Reads every doc in `discovery/`.
- Evaluates each piece of material: does it directly serve the crux and objective?
- Prunes everything that doesn't. Pruned material is moved to `Seeds/` at the vault root, tagged with notes about what it came from and what future essay it might contribute to.
- Structures the remaining material into a coherent narrative.
- Enforces brevity: no tangents, no adjacent-but-irrelevant points, no bloat. If a passage doesn't serve the crux and objective, it is cut regardless of how interesting it is.

**Two paths, Shomo's choice:**
1. **Outline mode.** The system produces a structured outline — the argument's skeleton. Shomo writes the full essay himself from the outline.
2. **Draft mode.** The system produces a complete first draft. Shomo edits it into the final version.

Output is saved in the `drafts/` directory.

### Phase 4: Refinement

Shomo edits the draft (or writes from the outline). The system assists with:

- **Brevity enforcement.** Flagging sections that drift from the crux, sentences that don't serve the argument, passages that could be tighter.
- **Coherence checks.** Noting where the flow of thought breaks — where a reader would lose the thread.
- **Self-containedness validation.** Confirming the essay stands on its own without requiring external context.

Shomo has final say on voice, style, and what stays. The essay is done when Shomo decides it meets his bar: something he would be proud to show his smartest friends and put his signature on.

The final essay is saved as `essay.md` in the essay folder root.

### Phase 5: Handoff

The essay is complete. Shomo triggers Publish. The Write module's job is over. The Publish module (visual plan generation, video assembly, written track publishing) takes it from here.

---

## Vault Structure

Shomo's Obsidian setup consists of two separate vaults under a shared parent directory:

```
obsidian/
├── creative/          # Creative vault — all publishable work
└── personal/          # Personal vault — life context, identity, reflections
```

Both are separate Obsidian vaults. When an agent needs both contexts, it is pointed at the `obsidian/` parent. Day-to-day, Shomo works in one vault at a time. The personal vault's internal structure is a separate project — it is not defined here.

### Creative Vault Structure

```
creative/
│
├── _system/
│   ├── CLAUDE.md                   # Agent briefing — how to understand and work with this vault
│   ├── vault-map.md                # Plain-language description of the folder structure and its logic
│   ├── dashboard.md                # All active projects: phase, crux status, next steps
│   └── visual-trigger-ruleset.md   # Trigger rules for visual plan generation (Publish module)
│
├── _inbox/
│   └── (raw captures — thoughts, quotes, ideas, anything. System routes them later.)
│
├── Essays/
│   └── [essay-slug]/
│       ├── discovery/              # All thread, probing, and research docs
│       │   ├── thread-01.md
│       │   ├── thread-02.md
│       │   ├── probe-01.md
│       │   └── research-01.md
│       ├── drafts/                 # Outlines and draft iterations
│       │   ├── outline.md
│       │   ├── draft-01.md
│       │   └── draft-02.md
│       ├── artifacts/              # Diagrams, images, visual plan
│       │   ├── visual-plan.md
│       │   ├── diagram-01.excalidraw
│       │   └── diagram-02.excalidraw
│       ├── crux.md                 # Crux and objective declaration
│       ├── status.md               # Current phase, progress, next steps
│       └── essay.md                # The finished essay (final artifact)
│
├── Commentary/
│   └── [essay-slug]/
│       └── (same internal structure as Essays)
│
├── Fiction/
│   └── (Shomo's own structure — not managed by Press)
│
├── Seeds/
│   └── [seed-slug].md              # Pruned material and future essay ideas
│
└── Archive/
    └── [essay-slug]/               # Completed project folders, moved here after publishing
        └── (full project folder preserved as-is)
```

### Folder Definitions

**`_system/`** — Agent-readable infrastructure files. The underscore prefix sorts it to the top and signals "this is infrastructure, not content." Every new agent that touches the vault reads `CLAUDE.md` and `vault-map.md` first to understand the vault's structure and how to work within it.

**`_system/CLAUDE.md`** — Agent briefing. Describes the vault, Shomo's workflow, and how agents should behave.

**`_system/vault-map.md`** — Plain-language description of the folder structure, what each folder is for, and how to navigate the vault. This is the orientation document for any agent or tool.

**`_system/dashboard.md`** — A plain markdown file containing a table of all active essay and commentary projects. For each project: working title, current phase (Discovery / Convergence / Assembly / Refinement / Done), whether crux is locked, whether objective is locked, any pending self-contained unit prompts, and a brief note on what's next. The system keeps this current. Shomo checks it to see the state of everything at one glance.

**`_system/visual-trigger-ruleset.md`** — The trigger rules for the Publish module's visual plan generation. Lives here because it applies across all essays, not to any single project.

**`_inbox/`** — Zero-friction capture point. Shomo dumps any thought, quote, idea, or observation here with no decisions about where it belongs. The system routes inbox items later: if an item relates to an existing essay project, it moves to that project's `discovery/` folder. If it's a standalone idea, it goes to `Seeds/` or becomes a new project. If it's personal (reflections, letters, life notes), it moves to the personal vault. The inbox should be empty by the end of each work session — not because Shomo files things, but because the system does.

**`Essays/`** — Active and in-progress philosophical and theoretical essay projects. Each essay gets its own folder named by slug.

**`Commentary/`** — Active and in-progress world-immersion commentary projects (films, books, cultural artifacts). Same internal structure as Essays. The distinction is categorical — it helps Shomo and agents understand the type of content — not structural.

**`[essay-slug]/`** — The self-contained workspace for one piece. Named by Shomo or auto-generated from the working title.

**`[essay-slug]/discovery/`** — All raw material from Phase 1. Files are prefixed by type (`thread-`, `probe-`, `research-`) and numbered sequentially. All files are markdown.

**`[essay-slug]/drafts/`** — Assembly and Refinement output. Sequential numbering tracks iterations. Outlines also live here.

**`[essay-slug]/artifacts/`** — All generated visual material. Diagrams from Excalidraw, the visual plan from the Publish module, and any other media. This is where the Publish module looks when it runs.

**`[essay-slug]/crux.md`** — Records the crux (core insight) and objective (narrative purpose). Updated if they shift during Assembly. This is what the Assembly phase reads to know what to optimize for.

**`[essay-slug]/status.md`** — Tracks the essay's current state:
- Current phase (Discovery / Convergence / Assembly / Refinement / Done).
- Count of discovery docs generated.
- Whether crux is locked (yes/no, with the crux statement if yes).
- Whether objective is locked (yes/no, with the objective if yes).
- Self-contained unit prompts surfaced and their status (accepted/declined).
- Current draft iteration number.
- Notes on what's next.

**`[essay-slug]/essay.md`** — The final output. Exists only after Refinement is complete. This is the file the Publish module reads.

**`Fiction/`** — Shomo's fiction work. Not managed by Press. Shomo maintains its own internal structure independently.

**`Seeds/`** — Pruned material from Assembly plus standalone ideas not yet ready to become projects. Each seed file contains the material itself plus a system-generated note about where it came from and what kind of essay it might contribute to. When Shomo starts a new essay, browsing Seeds is a natural starting point.

**`Archive/`** — Completed work. Once an essay is published across all platforms, the entire project folder moves here from `Essays/` or `Commentary/`. This keeps the active workspaces clean — only in-progress projects live in `Essays/` and `Commentary/`. The full folder is preserved as-is inside Archive.

---

## System Behaviors (Active Throughout)

### Folder Structure Enforcement
When Shomo starts a new essay, the system creates the folder with all subdirectories. When a discovery session produces a doc, the system saves it with the correct prefix and number. Shomo never has to decide where a file goes.

### Inbox Routing
Items in `_inbox/` are routed by the system. Related to an existing project → that project's `discovery/`. New standalone idea → `Seeds/` or a new project. Personal content → personal vault. The inbox should be empty by end of session.

### Dashboard Maintenance
`_system/dashboard.md` is kept current. It reflects the state of every active project. Updated after every significant action across any project.

### Progress Visibility
Each project's `status.md` is kept current. Shomo can check it to see the state of a single project in detail. For the state of everything at once, Shomo checks `dashboard.md`.

### Crux Monitoring
During Discovery, the system reads across all docs in `discovery/` and watches for emerging patterns. When it detects a potential through-line, it surfaces this to Shomo as an observation. Shomo can accept it as the crux, note it for later, or dismiss it.

### Self-Contained Unit Detection
The system actively looks for subsets of the discovery material that form complete, standalone arguments. When it finds one, it delivers a one-line essay prompt. This is the primary shipping pressure mechanism. The system errs on the side of prompting early rather than too late.

### Pruned Material Preservation
Nothing is deleted. Material cut during Assembly is moved to `Seeds/` with context about where it came from and what it might become. The system may also proactively suggest creating seed files during Discovery if it notices threads diverging from the main essay's direction.

### Brevity Enforcement
Active during Assembly and Refinement. During Assembly, the system produces drafts that are structurally tight — no tangents, no bloat. During Refinement, the system flags drift when Shomo edits. The target is always the shortest essay that fully expresses the crux.

---

## Acceptance Criteria

1. When Shomo initiates a new essay, the system creates a correctly structured folder in the appropriate category (Essays or Commentary) with all required subdirectories and files.
2. Discovery docs are saved in `discovery/` with the correct type prefix and sequential numbering.
3. During Discovery, the system monitors accumulating material and surfaces one-line essay prompts when it detects a viable self-contained unit.
4. During Discovery, the system monitors for crux emergence and surfaces observations about potential through-lines across threads.
5. Shomo can define the crux and objective, and the system records them in `crux.md`.
6. The crux and objective can be updated at any point, and the system accommodates the change.
7. During Assembly, the system reads all `discovery/` docs against the crux and objective, prunes irrelevant material, and produces either an outline or a complete draft based on Shomo's choice.
8. Pruned material is saved to `Seeds/` with context about its origin and potential future use.
9. Assembly output enforces brevity — no tangents, no material that doesn't directly serve the crux and objective.
10. During Refinement, the system flags sections that drift, break coherence, or could be tighter.
11. `status.md` is kept current and accurately reflects the essay's phase, progress, and next steps.
12. `dashboard.md` reflects the state of all active projects and is kept current.
13. Items in `_inbox/` are routed to the appropriate location by the system.
14. The finished essay is saved as `essay.md` in the essay folder root.
15. Completed projects are moved to `Archive/` after publishing.

## What V1 Does NOT Do

- Does not generate the visual plan (that is the Publish module).
- Does not publish to any platform.
- Does not generate metadata.
- Does not handle recording or video production.
- Does not auto-detect the "best" crux — it surfaces candidates, but Shomo decides.
- Does not auto-publish when the essay is done — Shomo explicitly triggers handoff.
- Does not organize the personal vault (separate project).
