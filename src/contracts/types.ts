/**
 * This file defines the shared language for Publish V1 so every capability talks
 * about the same kinds of things in the same shape. We keep these contracts in one
 * place because diagram creation, plan generation, validation, and persistence all
 * need to agree on what a row, diagram, and state record actually are.
 *
 * These types are imported by the capability layer, the file IO layer, and the
 * Excalidraw integration boundary. That direction keeps business logic independent
 * from specific storage or tool details.
 */
export type VisualType =
  | "Diagram"
  | "B-Roll A (Atmospheric)"
  | "B-Roll B (Specific)"
  | "Emphasis";

/**
 * A visual plan row captures one deliberate departure from the default on-camera state.
 */
export interface PlanRow {
  id: string;
  excerpt: string;
  visualType: VisualType;
  notesArtifacts: string;
  context: string;
  sourceFile: string;
}

/**
 * Diagram records let us refine the same file over time rather than creating duplicates.
 */
export interface DiagramRecord {
  id: string;
  filename: string;
  linkedExcerpt: string;
  sourceFile: string;
  revisions: number;
  webUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * The state file is internal memory for idempotency and stable iteration.
 */
export interface PlanState {
  version: string;
  projectPath: string;
  sourceFile: string;
  essayHash: string;
  rows: PlanRow[];
  diagrams: DiagramRecord[];
  warnings: string[];
  updatedAt: string;
}

/**
 * Resolved project paths centralize every filesystem location used by Publish V1.
 */
export interface ProjectPaths {
  vaultRoot: string;
  projectRoot: string;
  artifactsDir: string;
  internalDir: string;
  visualPlanFile: string;
  stateFile: string;
  linksFile: string;
  rulesFile: string;
}

/**
 * Every capability returns a machine-readable envelope so chat workflows can react.
 */
export interface CapabilityResult {
  ok: boolean;
  message: string;
  data?: Record<string, unknown>;
  warnings?: string[];
  errors?: string[];
}

/**
 * Source passages are the intermediate unit between essay text and visual rows.
 */
export interface Passage {
  index: number;
  text: string;
}

/**
 * Excalidraw operations share one result envelope regardless of create or refine.
 */
export interface ExcalidrawOperationResult {
  content: string;
  webUrl?: string;
  warnings: string[];
}
