# Vault Information Architecture — Reference for Press

> This file describes how Shomo's Obsidian vault is structured.
> Press reads from and writes to this vault. This is the contract.
> Last synced from vault: 2026-02-25

---

## Vault Location

```
/Users/shomo/Library/Mobile Documents/iCloud~md~obsidian/Documents/master/
```

Single Obsidian vault. Everything lives here.

---

## Structure (Press-relevant subset)

```
vault/
├── _system/
│   ├── vault-map.md                    # Full structure reference
│   └── registry.md                     # Unified project index — THE source of truth
│
├── _inbox/                             # Zero-friction capture
│   └── YYYY-MM-DD.md                   # Items routed by agent to project folders
│
├── write/
│   ├── _system/
│   │   ├── CLAUDE.md                   # Writing-specific agent instructions
│   │   ├── vault-map.md               # Writing folder structure
│   │   └── visual-trigger-ruleset.md  # Trigger rules for visual plan generation
│   │
│   ├── Essays/
│   │   └── [essay-slug]/
│   │       ├── _working-context.md             # Remember: next steps + session log
│   │       ├── crux.md                 # Central argument/tension
│   │       ├── status.md               # Phase + current state
│   │       ├── discovery/              # Thread, probing, and research docs
│   │       ├── drafts/                 # Draft iterations (d1.md, d2.md, ...)
│   │       ├── artifacts/              # Diagrams, visual plan, media
│   │       └── essay.md                # Final version (only when done)
│   │
│   ├── Commentary/
│   │   └── [slug]/ (same structure as Essays)
│   │
│   ├── Fiction/                        # Not managed by Press
│   ├── Seeds/                          # Pruned material + standalone ideas
│   ├── Published/                      # Written form live; video pending
│   ├── Archive/                        # All intended formats published
│   │
│   └── ideas/                          # Knowledge base
│       ├── concepts/                   # Concept wiki — [[linked]]
│       ├── thinkers/                   # Minimal stubs
│       ├── books/                      # Reading notes
│       └── unpublished/                # Completed, not published by choice
│
└── _brand/                             # Brand identity (voice, visual, guidelines)
```

---

## Key Convention: `_working-context.md`

Every project folder contains `_working-context.md`. This is the Remember data layer.

```markdown
## Next
- (Shomo's next steps — captured before walking away. Optional.)

## Log
### YYYY-MM-DD — [Agent name] session
- What was done
- What changed
```

**Rules for Press:**
- If Press does something (generates artifact, modifies project state), it logs one line to `_working-context.md` immediately. Extremely brief.
- The `## Next` section is Shomo-written. Press reads it but does not write to it.
- The `## Log` section is append-only. Most recent entry first.
- No context derivation on startup. Just read what's there.

---

## Key Convention: `_system/registry.md`

Single source of truth for all active projects. Structured markdown table.

| Field | Meaning |
|-------|---------|
| Project | Slug or display name |
| Type | `essay`, `commentary`, `fiction`, `code`, `reflection` |
| Path | Relative path from vault root |
| Phase | Discovery → Convergence → Assembly → Refinement → Done |
| Priority | 🔴 High, 🟡 Medium, 🟢 Low |
| Campaign | Writing, Building, Reflect |
| Next Step | One-line immediate action |

**Rules for Press:**
- When Press changes a project's phase, it updates both `status.md` and `registry.md`.
- When Press creates a new project folder, it adds a row to the registry.
- When Press archives a project, it moves the row to the Archived section.

---

## Writing Phases

| Phase | Meaning | Press involvement |
|-------|---------|-------------------|
| **Discovery** | Raw exploration — threads, probing, research | Write module monitors for crux + self-contained units |
| **Convergence** | Crux and objective defined | Write module records in `crux.md` |
| **Assembly** | Building drafts from discovery material | Write module produces outline or draft in `drafts/` |
| **Refinement** | Polishing and tightening | Write module flags drift |
| **Done** | Ready for publish | Handoff to Publish module |

---

## How Press Interacts With the Vault

### Write Module (V2)
- Creates project folders in `Essays/` or `Commentary/` with full structure
- Saves discovery docs in `discovery/` with type prefix (`thread-`, `probe-`, `research-`)
- Writes crux and objective to `crux.md`
- Produces drafts in `drafts/`
- Moves pruned material to `Seeds/`
- Updates `status.md` and `_system/registry.md` on phase changes
- Appends to `_working-context.md` after every action
- Routes `_inbox/` items to relevant project folders

### Publish Module (V1+)
- Reads finished essay from `essay.md` in project folder
- Writes visual plan to `artifacts/visual-plan.md`
- Writes generated diagrams to `artifacts/`
- References `visual-trigger-ruleset.md` from `write/_system/`

---

## Three-Tool KMS Context

Press is one of three tools Shomo is building:

| Tool | Purpose | How it relates to Press |
|------|---------|------------------------|
| **Press** | Accelerate writing + automate publishing | THIS PROJECT |
| **Resume** | Visual project board — context resumption on new tab | Resume shows project status; Press updates project phase |
| **Remember** | Per-project breadcrumb trail + next-steps | `_context.md` is Remember's data layer; Press writes to it |

These three tools share the vault as their information substrate. The vault's folder conventions, `_context.md` files, and `_system/registry.md` are the shared contracts.
