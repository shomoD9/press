/*
This component centralizes headline/subline rendering so text hierarchy remains
cohesive across scene treatments. It is separated to avoid duplicating spacing,
weight, and tracking rules in every scene file.
*/

import React from 'react';
import type { StyleTokens } from '../../schemas/index.js';

interface TypographyBlockProps {
  style: StyleTokens;
  headline?: string;
  subline?: string;
  align?: 'left' | 'center';
}

export function TypographyBlock({
  style,
  headline,
  subline,
  align = 'left',
}: TypographyBlockProps): React.JSX.Element {
  const textAlign = align;

  return (
    <div
      style={{
        maxWidth: 980,
        textAlign,
      }}
    >
      {headline ? (
        <h1
          style={{
            margin: 0,
            color: style.palette.foreground,
            fontFamily: style.typography.displayFamily,
            fontWeight: style.typography.weightBold,
            letterSpacing: `${style.typography.trackingTight}px`,
            lineHeight: 1.06,
            fontSize: 88,
          }}
        >
          {headline}
        </h1>
      ) : null}
      {subline ? (
        <p
          style={{
            marginTop: 24,
            marginBottom: 0,
            color: style.palette.muted,
            fontFamily: style.typography.bodyFamily,
            fontWeight: style.typography.weightRegular,
            letterSpacing: `${style.typography.trackingNormal}px`,
            lineHeight: 1.35,
            fontSize: 34,
          }}
        >
          {subline}
        </p>
      ) : null}
    </div>
  );
}
