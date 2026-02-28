/*
This registry maps treatment identifiers to concrete scene components. It is the
translation layer between data-level intent and executable visual logic, which is
why compiler and renderer code route through this file instead of importing each
scene implementation directly.
*/

import type { SceneSpec } from '../../schemas/index.js';
import type { SceneComponent } from './types.js';
import { AbstractGeometricScene } from './abstract-geometric-scene.js';
import { ComparisonSplitScene } from './comparison-split-scene.js';
import { ConceptNetworkScene } from './concept-network-scene.js';
import { KineticTypographyScene } from './kinetic-typography-scene.js';
import { TextEmphasisCardScene } from './text-emphasis-card-scene.js';

const registry: Record<SceneSpec['treatmentType'], SceneComponent> = {
  'kinetic-typography': KineticTypographyScene,
  'concept-network': ConceptNetworkScene,
  'comparison-split': ComparisonSplitScene,
  'abstract-geometric': AbstractGeometricScene,
  'text-emphasis-card': TextEmphasisCardScene,
};

export function resolveSceneComponent(treatmentType: SceneSpec['treatmentType']): SceneComponent {
  return registry[treatmentType];
}
