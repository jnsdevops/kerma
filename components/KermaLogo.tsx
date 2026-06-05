// ═══════════════════════════════════════════
// KERMA · Logo Component
// K Convergence — Nubian gold point
// Concept: routes converging to a single
// optimal decision point (Kerma marketplace)
// ═══════════════════════════════════════════

import React from 'react';
import Svg, { Rect, Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface KermaLogoProps {
  size?: number;
  rounded?: boolean;
  variant?: 'color' | 'white' | 'dark';
}

export function KermaLogo({ size = 34, rounded = true, variant = 'color' }: KermaLogoProps) {
  const r = rounded ? size * 0.22 : 0;
  const scale = size / 64;

  const bgColor = variant === 'color' ? '#0A6B4B' : variant === 'white' ? 'rgba(255,255,255,0.15)' : '#1A1714';
  const markColor = variant === 'dark' ? '#0A6B4B' : '#FFFFFF';
  const goldColor = '#C8882A';

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* Background */}
      <Rect width="64" height="64" rx={r} fill={bgColor} />

      {/* K vertical stem */}
      <Rect x="18" y="14" width="7" height="36" rx="3.5" fill={markColor} />

      {/* K upper diagonal — route from top-right */}
      <Path
        d="M25 32 L46 14"
        stroke={markColor}
        strokeWidth="7"
        strokeLinecap="round"
      />

      {/* K lower diagonal — route to bottom-right */}
      <Path
        d="M25 32 L46 50"
        stroke={markColor}
        strokeWidth="7"
        strokeLinecap="round"
      />

      {/* Gold convergence point — the Kerma marketplace */}
      <Circle cx="25" cy="32" r="5" fill={goldColor} />
    </Svg>
  );
}

// Round avatar version for Astride agent
export function AstrideAvatar({ size = 38 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#0A6B4B" />
          <Stop offset="100%" stopColor="#1A9E72" />
        </LinearGradient>
      </Defs>
      <Rect width="64" height="64" rx="32" fill="url(#grad)" />
      <Rect x="18" y="14" width="7" height="36" rx="3.5" fill="white" />
      <Path d="M25 32 L46 14" stroke="white" strokeWidth="7" strokeLinecap="round" />
      <Path d="M25 32 L46 50" stroke="white" strokeWidth="7" strokeLinecap="round" />
      <Circle cx="25" cy="32" r="5" fill="#C8882A" />
    </Svg>
  );
}
