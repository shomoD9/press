# Press Functional Requirements — V1.5

Version: v1.5  
Date: February 24, 2026  
Owner: Shomo

## Functional Requirements (Plain Language, Non-Technical)

Any agent you use should immediately understand your vault rules and workflow without you explaining them each time.  
You should install Press from inside Obsidian in one click.  
You should connect required services (like Excalidraw) in a simple guided flow, not by manual setup.  
You should be able to ask in normal language, and the system should do the right action automatically.  
The system should always put files in the correct project folder (artifacts) without you managing paths.  
Diagram edits should happen in place by default, so iteration is clean and not duplicated.

If something is missing (connection, permission, login), the system should detect it and give one clear fix action.  
You should have a single “ready check” button/command that the agent can run to says clearly: ready or not ready.  
You should have one-click update and one-click rollback.  
The behavior should be consistent across agent tools (Codex, Claude, Warp, others).  
The system should never touch unrelated folders or files.  
Every action should end with a clear result: what was created/updated and where it is.  
Errors should be human-readable, short, and actionable.  
First-time onboarding should be guided, with example prompts provided.

## External Dependencies We Must Guarantee Work

Obsidian vault access.  
Agent access to your vault instructions.  
Excalidraw service connection.  
Account/auth permissions for connected services.  
Local file permissions.  
Internet access when web-sync/link features are needed.

## “In Stone” Acceptance Standard

New user can install from Obsidian, generate first diagram, push to article interfaces in under 3 minutes.  
No terminal usage required for normal use.  
No manual JSON creation by the agent in diagram flow.  
Same natural-language prompt works across supported agents.  
Updates do not break existing projects.
