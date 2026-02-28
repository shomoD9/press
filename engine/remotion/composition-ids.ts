/*
This file stores stable composition identifiers shared across preview and render
workflows. We isolate these constants to avoid importing composition modules in
CLI code paths that only need IDs.
*/

export const PRESS_COMPOSITION_ID = 'PressProject';
export const PRESS_SCENE_COMPOSITION_ID = 'PressScene';
