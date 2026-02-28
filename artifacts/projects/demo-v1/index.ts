/*
This module exposes typed demo artifacts by validating bundled JSON through the
same schemas used in runtime flows. It exists so tests and compositions can rely
on strongly typed defaults instead of loose JSON import inference.
*/

import projectJson from './project.spec.json';
import styleJson from './style.tokens.json';
import {
  projectSpecSchema,
  styleTokensSchema,
  type ProjectSpec,
  type StyleTokens,
} from '../../../schemas/index.js';

export const demoProject: ProjectSpec = projectSpecSchema.parse(projectJson);
export const demoStyleTokens: StyleTokens = styleTokensSchema.parse(styleJson);
