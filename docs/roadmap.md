# Press — Product Roadmap

This document defines the versioned milestones for Press. The product consists of two modules:

- **Write module** — Helps Shomo get from idea to finished essay. The essay is the atomic unit from which everything else is derived.
- **Publish module** — Takes the finished essay and turns it into published content across all platforms — video and written — with minimal manual effort.

Both modules live under a single product. The Write module feeds into the Publish module. Together, they represent the complete pipeline from idea to published.

---

## V1: Visual Plan Generator

**Module:** Publish

**What ships:** An AI agent workflow in Shomo's Obsidian + code editor setup that reads a finished essay and generates a visual plan — a shot-by-shot table specifying what should appear on screen and when during the video. Diagrams are auto-generated via Excalidraw MCP. B-roll entries include search terms and pre-filled YouTube URLs. Emphasis moments are flagged per the visual trigger ruleset.

**What Shomo gets:** Video assembly becomes execution, not decision-making. He opens Descript with a plan instead of a blank canvas.

**Spec:** `spec-v1-visual-plan.md`
**Trigger rules:** `visual-trigger-ruleset.md`

---

## V1.5: Obsidian-First Zero-Terminal Publish UX

**Module:** Publish (usability hardening)

**What ships:** A private Obsidian plugin first-party shell that exposes one-click Press actions directly in command palette: install/repair, connect services, ready check, update, rollback, diagram actions, visual plan generation, and article draft package generation. Agent wiring is hardened across Codex/Claude/Warp root files and `_system` wiring contract with explicit preflight rules. Ready check outputs a binary status (`READY` or `NOT READY`) plus one clear first fix action.

**What Shomo gets:** No terminal is required for normal daily workflow. Setup, recovery, and upgrades happen inside Obsidian, and publish handoff drafts for article interfaces can be generated in one action.

**Spec:** `spec-v1.5-obsidian-first.md`  
**Requirements:** `functional-requirements-v1.5.md`

---

## V2: Essay Engine + Descript Bridge + Written Track Publisher

**Modules:** Write (V1) + Publish (iteration)

Three things ship together:

### Write Module V1 — Essay Engine
A five-phase workflow that takes Shomo from idea to finished essay: Discovery → Convergence → Assembly → Refinement → Handoff. Includes a defined creative vault structure (two separate vaults — creative and personal — under a shared parent), an inbox for zero-friction capture, a dashboard for tracking all active projects at a glance, and system behaviors for crux monitoring, self-contained unit detection, brevity enforcement, and pruned material preservation.

**Spec:** `spec-v2-write-module.md`

### Descript Bridge
Pushes the visual plan directly into Descript as timeline markers, comments, or arrangement commands. This depends on what Descript's API allows — technical research is required before scoping. If the Descript API does not support this, this component is deprioritized and the visual plan table remains the primary interface.

### Written Track Publisher
Automated formatting and publishing of the essay to Substack, LessWrong, and X Articles. Handles markdown-to-platform conversion, image embedding, and formatting edge cases (e.g., image captions that don't exist on all platforms). Metadata generation (titles, descriptions, tags) is included.

**What Shomo gets:** The essay-writing process is supported by AI. The visual plan reaches Descript without manual translation (if API allows). Written content is formatted and ready to publish on all three platforms from one action.

---

## V3: Metadata & Publishing Automation

**Module:** Publish (iteration)

**What ships:** Full automated publishing pipeline. Metadata generation for all platforms (YouTube, Substack, LessWrong, X Articles). Preview workflow — Shomo sees draft links for every output before anything goes live. One-trigger publish across all platforms.

**What Shomo gets:** The gap between "done" and "live" is closed. No more logging into each platform separately. Preview, approve, publish.

---

## V4: Remotion Integration

**Module:** Publish (new primitive)

**What ships:** Animated content generation via Remotion MCP. Three validated use cases:
- Progressive concept illustration — animations that build on screen as Shomo narrates, matching the verbal development of an idea.
- Immersive world-building — animated scenes that create atmosphere.
- Abstract visualization — concepts that benefit from motion rather than static diagrams.

Remotion enters the visual trigger ruleset as a new trigger type. The agent decides when animation serves the essay better than a static diagram or B-roll.

**What Shomo gets:** A new visual primitive that makes videos more dynamic without adding manual production work.

---

## V5: Full Video Assembly

**Module:** Publish (culmination)

**What ships:** Automated video arrangement. The system takes all primitives — Shomo's recording, generated diagrams, Remotion animations, sourced B-roll, emphasis captions — and assembles the final video according to the visual plan. No manual editing in Descript or any other tool.

**What Shomo gets:** The complete happy path. Shomo writes the essay, records the narration, and triggers publish. The system generates all visual artifacts, assembles the video, formats the written content, generates metadata, and publishes everywhere. Shomo previews and approves. One trigger, everything live.

---

## V6: In-Vault Product UX (No Terminal-First Install)

**Module:** Platform experience (cross-module)

**What ships:** Press installation, wiring, health checks, and stable-channel updates become in-vault actions callable from agent chat while Obsidian is open. The product no longer requires terminal-first setup for normal users. Press verifies prerequisites, self-wires `_system` files, and provides one-click update and rollback guidance directly in the writing environment.

**What Shomo gets:** Onboarding and maintenance feel native to the creative workflow. He can install, repair, and upgrade Press without leaving Obsidian.

---

## Milestone Summary

| Version | What Ships | Module |
|---------|-----------|--------|
| V1 | Visual Plan Generator | Publish |
| V1.5 | Obsidian-first install/connect/check/update/rollback + article draft package handoff | Publish |
| V2 | Essay Engine V1 + Descript Bridge + Written Track Publisher | Write + Publish |
| V3 | Metadata & Publishing Automation + Preview Workflow | Publish |
| V4 | Remotion Integration | Publish |
| V5 | Full Video Assembly + Full Pipeline | Publish |
| V6 | In-vault install, wiring, health checks, and updates | Platform experience |
