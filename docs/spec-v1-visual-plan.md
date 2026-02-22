# Press — Publish Module — V1: Visual Plan Generator

## Product Vision

The Publish module turns a finished essay into fully published content — video and written — with minimal manual intervention from Shomo.

The ideal end state: Shomo writes the essay, records himself reading it on camera, and triggers a single "publish" command. The system handles everything else. It generates visual artifacts (diagrams, animations), assembles the video from primitives, creates metadata for every platform, formats the essay for each written platform, and publishes everywhere. Before anything goes live, Shomo gets preview links to check each output. He approves, and it ships.

That is the north star. Every version shipped moves closer to it.

### The Happy Path (Full Vision)

1. **Shomo writes the essay in Obsidian.** This is the only creative labor. AI assists with research and brainstorming, but the ideas and voice are his. (Supported by the Write module — separate scope.)
2. **Shomo tells the system to publish.** A single action — a command, a button, whatever the interface turns out to be. This is the moment the publishing workflow begins.
3. **The system generates visual artifacts.** It reads the essay, applies the visual trigger ruleset, and creates what it needs: diagrams via Excalidraw, and in the future, animated sequences via Remotion. Artifacts are stored locally in the essay folder.
4. **Shomo reviews and approves the artifacts.** The diagrams, the animations, the visual plan. He iterates with the AI if something is off.
5. **Shomo records the narration.** He reads the essay on camera. This is the only manual production step. He gives the system the recording.
6. **The system assembles the video.** It takes all the primitives — Shomo's recording, the generated diagrams, sourced B-roll, emphasis captions — and arranges them according to the visual plan. No manual editing.
7. **The system generates metadata.** Titles, descriptions, tags for every platform — YouTube, Substack, LessWrong, X Articles. Derived from the essay.
8. **The system formats the written content.** The same essay, correctly formatted for each written platform, with diagrams embedded in the right places.
9. **Shomo previews everything.** The system provides links to check each output before it goes live — video, Substack draft, LessWrong draft, X Article draft.
10. **Shomo triggers publish.** One action. Everything goes live.

### Vision: Remotion and Animated Content

Remotion is a future primitive that can replace or augment static diagrams. Three use cases identified:

- **Progressive concept illustration.** Instead of a static diagram appearing all at once, the animation builds on screen as Shomo narrates — introducing components and relationships one by one, matching the verbal development of the idea.
- **Immersive world-building.** Animated scenes that create atmosphere. Shomo is talking about walking in the woods; the screen shows an animated figure walking through a forest. Not literal illustration — ambient immersion.
- **Abstract visualization.** Concepts that don't reduce to a diagram but benefit from motion — flows, transformations, tensions.

This is a research and experimentation track. It enters the product when the Remotion MCP integration is validated and the visual quality meets the bar. It does not block any earlier milestone.

---

## V1 Scope: The Visual Plan Generator

### What It Is

An AI agent workflow within Shomo's existing Obsidian + code editor setup. It reads a finished essay and generates a visual plan — a shot-by-shot guide that tells Shomo exactly what should appear on screen and when, so that video assembly becomes pure execution with no creative decisions left to make.

V1 lives as a CLAUDE.md and a rules file at the vault root. Shomo already uses AI coding agents with Obsidian. This is another tool in that workflow.

### What Problem It Solves

Today, Shomo opens Descript with a finished recording and makes visual decisions ad hoc — what goes on screen, when, for how long. There is no plan. Descript becomes a decision-making environment instead of an assembly environment. Sessions that should take 30 minutes take hours.

The visual plan moves all those decisions upstream, into a structured document Shomo can review and lock before ever opening Descript.

### The Workflow

1. Essay is done in Obsidian.
2. Shomo tells the agent to generate the visual plan.
3. The agent reads the essay, applies the visual trigger ruleset (defined in `visual-trigger-ruleset.md`), and generates `visual-plan.md` in the essay's folder.
4. For any diagram triggers, the agent calls the Excalidraw MCP to auto-generate diagrams and saves them in the essay folder.
5. Shomo reviews the visual plan table. He iterates with the AI — adjusting triggers, swapping types, adding or removing entries.
6. Shomo locks the plan.
7. Shomo opens Descript (or his video editor) and uses the visual plan as his assembly guide. The excerpt markers let him search directly in Descript's transcript to jump to the right position on the timeline.

### The Default Rule

**The default state is Shomo on camera.** The viewer sees his face unless the visual plan specifies a departure. Every entry in the visual plan is a departure from this default. Anything not in the table = Shomo talking.

### The Visual Trigger Ruleset

The trigger rules that govern what the agent flags and how it responds are defined in a separate document: `visual-trigger-ruleset.md`. This allows the ruleset to evolve independently of this spec.

### The Output: Visual Plan Table

The visual plan is a markdown table in `visual-plan.md`, placed in the essay's folder. It contains only departures from default. Four columns:

| Excerpt | Visual Type | Notes & Artifacts | Context |
|---------|------------|-------------------|----------|
| "The thing about discipline...architecture of your day" | Diagram | `diagram-01.excalidraw` — shows relationship between discipline, habits, and environment design | Core argument |
| "Consider what Kubrick does...the symmetry tells you" | B-Roll A (Atmospheric) | Search: `kubrick cinematography symmetry shots` — [YouTube](https://youtube.com/results?search_query=kubrick+cinematography+symmetry+shots) — Descript stock: `kubrick symmetry film` — Look for: slow, composed shots with centered framing | Film analysis |
| "In the 2019 Joe Rogan episode...that exact moment" | B-Roll B (Specific) | Source: Joe Rogan Experience #1299 with Annie Jacobsen, ~42:00 — Search: `joe rogan annie jacobsen area 51` — [YouTube](https://youtube.com/results?search_query=joe+rogan+annie+jacobsen+area+51) — Descript stock: `joe rogan podcast interview` | Podcast reference |
| "Discipline is not willpower. It is infrastructure." | Emphasis | Captions on dark screen. Emphasis type: Thesis reframe. | Thesis |

**Column definitions:**

- **Excerpt:** The opening few words and closing few words of the passage during which this visual should be on screen. Format: `"opening words...closing words"`. Kept short — just enough to be a unique search string in the essay text or in Descript's transcript. This serves as the start and end marker for the visual's duration.
- **Visual Type:** One of: `Diagram`, `B-Roll A (Atmospheric)`, `B-Roll B (Specific)`, `Emphasis`.
- **Notes & Artifacts:** Everything Shomo needs to act on this entry. File references for diagrams. Search terms, pre-filled YouTube URLs, Descript stock search terms, and sourcing guidance for both types of B-roll. Brief context for emphasis moments.
- **Context:** A short AI-generated orientation label describing what is happening in this part of the essay. Not a section heading (essays may not have sections). Examples: "Opening hook," "Core argument," "Film analysis," "Conclusion." Helps Shomo find his place at a glance.

### Acceptance Criteria

1. Given a finished essay in an Obsidian folder, the agent generates a `visual-plan.md` file in the same folder.
2. The visual plan is a 4-column markdown table following the format defined above.
3. The table contains only departures from the default (Shomo on camera). Passages with no visual departure do not appear.
4. Excerpt markers use the opening few words and closing few words of each passage, short enough to be readable in a table but unique enough to return a single match when searched in the essay text or a Descript transcript. They define the start and end of the visual's duration.
5. For every Diagram entry, the agent has called the Excalidraw MCP and generated a diagram file in the essay folder. The Notes column references the filename.
6. For every B-Roll A entry, the Notes column contains: search terms, a pre-filled YouTube search URL, a Descript stock library search term, and a brief description of what kind of imagery to look for.
7. For every B-Roll B entry, the Notes column names the specific source and moment, and where possible also provides: search terms, a pre-filled YouTube search URL, and a Descript stock library search term.
8. For every Emphasis entry, the Notes column states which emphasis pattern applies (thesis, conclusion, reframe, provocation, or distillation) as defined in the trigger ruleset.
9. The Context column contains a short orientation label for every entry.
10. The agent applies the emphasis criteria as defined in the trigger ruleset — only sentences that are "landings, not climbs."
11. Shomo can review the visual plan and iterate with the AI — requesting changes, additions, or removals — before locking.

### What V1 Does NOT Do

- Does not push markers or instructions to Descript.
- Does not assemble the video.
- Does not generate metadata.
- Does not publish to any platform.
- Does not format or publish the written track.
- Does not generate Remotion animations.
- Does not assist with essay writing (that is the Write module — separate scope).
