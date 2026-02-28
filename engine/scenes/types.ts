/*
This file defines the shared scene rendering contract. It exists separately so
all scene implementations and the compiler can agree on one typed interface for
passing validated scene intent into visual components.
*/

import type { SceneSpec, StyleTokens } from '../../schemas/index.js';
import type React from 'react';

export interface SceneRenderProps {
  scene: SceneSpec;
  style: StyleTokens;
  fps: number;
}

export type SceneComponent = (props: SceneRenderProps) => React.JSX.Element;
