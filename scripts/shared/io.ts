/*
This file contains filesystem helpers for reading and writing JSON artifacts. It
is separated so CLI commands can stay focused on workflow decisions rather than
repeating low-level I/O and error handling logic.
*/

import { readFile } from 'node:fs/promises';

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const fileContent = await readFile(filePath, 'utf-8');

  // Parsing is centralized here so malformed JSON errors have one behavior path.
  return JSON.parse(fileContent) as T;
}
