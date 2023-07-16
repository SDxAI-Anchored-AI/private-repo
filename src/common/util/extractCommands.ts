import { CmdRunProdia } from '~/modules/prodia/prodia.client';
import { CmdRunGenerateImage } from '~/modules/generate_image/generate_image.client';
import { CmdRunReact } from '~/modules/aifn/react/react';
import { CmdRunSearch } from '~/modules/google/search.client';

export const commands = [...CmdRunGenerateImage, ...CmdRunProdia, ...CmdRunSearch, ...CmdRunReact];

export interface SentencePiece {
  type: 'text' | 'cmd';
  value: string;
}

/**
 * Sentence to pieces (must have a leading slash) from the provided text
 * Used by rendering functions, as well as input processing functions.
 */
export function extractCommands(input: string): SentencePiece[] {
  const regexFromTags = commands.map((tag) => `^\\${tag} `).join('\\b|') + '\\b';
  const pattern = new RegExp(regexFromTags, 'g');
  const result: SentencePiece[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input)) !== null) {
    if (match.index !== lastIndex) result.push({ type: 'text', value: input.substring(lastIndex, match.index) });
    result.push({ type: 'cmd', value: match[0].trim() });
    lastIndex = pattern.lastIndex;

    // Remove the space after the matched tag
    if (input[lastIndex] === ' ') lastIndex++;
  }

  if (lastIndex !== input.length) result.push({ type: 'text', value: input.substring(lastIndex) });

  return result;
}
