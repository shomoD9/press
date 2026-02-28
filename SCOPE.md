# Press Scope

This document defines the product scope boundaries for Press and locks what each version is responsible for.

## Guiding Intent

Press exists to produce world-class programmatic animation that matches the quality and depth of the script. Animation is the dominant language. The system must prioritize taste, clarity, motion quality, and visual intelligence over decoration or trend effects.

## Scope Lock

### V1: Programmatic Animation Engine (Core)

V1 is focused on one thing: the best possible animation engine for high-fidelity, opinionated motion graphics.

In scope for V1:
- Beat-driven animation generation with premium motion craft
- Rich, minimalistic visual design language and motion grammar
- Scene-level iteration loop for refining animation quality
- Deterministic rendering pipeline for generated animation
- Agent-driven workflow between user, engine, and agent

Out of scope for V1:
- Programmatic sourcing of external movie clips/frames
- Marketplace/source integrations for clip retrieval
- Stock-footage workflows

### V2: Full Workflow With User-Provided Non-Animation Inputs

V2 expands workflow breadth while preserving V1 quality priorities.

In scope for V2:
- End-to-end workflow using the animation engine as the primary output mode
- User-provided supporting materials (clips, gifs, screenshots/frames, audio, etc.)
- Supporting frame/scene inserts where the user explicitly provides the source files
- Center-screen caption moments for emphasis/conclusion when creatively appropriate

Hard constraint for V2:
- No stock footage.

### V3: Programmatic Clip/Frame Sourcing

V3 introduces external sourcing and retrieval of clips/frames through programmatic integrations.

In scope for V3:
- Programmatic retrieval interfaces for scenes/clips/frames
- Integration with subscription sources and APIs where needed
- Automated ingest of retrieved media into Press workflow
- Metadata tracking needed for operational use

Deferred to V3 development phase:
- Vendor/source research and source selection
- Licensing/compliance policy details per vendor
- Cost/performance tradeoffs across providers

## Cross-Version Quality Standard

The quality bar is constant across all versions:
- Animation quality is premium, smooth, intentional, and authored
- Visuals never compensate for writing weakness; they clarify and elevate meaning
- Visual metaphors are semantically precise and tastefully executed
- Motion and composition must feel crafted by a real motion designer

## Priority Hierarchy (Locked)

1. Programmatic animation (primary)
2. User-provided scene/frame inserts (secondary)
3. Center-screen captions for selected rhetorical moments (tertiary)

Stock footage is excluded from V1 and V2 by scope.
