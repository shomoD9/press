/*
This file is the executable Remotion entrypoint. It is intentionally tiny so the
runtime always boots through one obvious root registration path.
*/

import { registerRoot } from 'remotion';
import { RemotionRoot } from './root.js';

registerRoot(RemotionRoot);
