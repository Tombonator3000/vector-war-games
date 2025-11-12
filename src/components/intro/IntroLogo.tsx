/**
 * IntroLogo Component
 *
 * SVG logo component with neon synthwave styling.
 * Extracted from Index.tsx as part of refactoring effort.
 */

export const IntroLogo = () => (
  <svg
    className="intro-screen__logo"
    viewBox="0 0 1200 420"
    role="img"
    aria-labelledby="intro-logo-title intro-logo-desc"
  >
    <title id="intro-logo-title">Ironlight Accord</title>
    <desc id="intro-logo-desc">
      Neon synthwave wordmark for the Ironlight Accord grand strategy simulation.
    </desc>
    <defs>
      <linearGradient id="logo-fill" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#39ff14" />
        <stop offset="35%" stopColor="#00d9ff" />
        <stop offset="70%" stopColor="#ff00ff" />
        <stop offset="100%" stopColor="#39ff14" />
      </linearGradient>
      <linearGradient id="logo-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="rgba(0, 217, 255, 0.8)" />
        <stop offset="100%" stopColor="rgba(255, 0, 255, 0.8)" />
      </linearGradient>
      <filter id="logo-glow" x="-20%" y="-40%" width="140%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0.75 0  0 0 0 0.9 0  0 0 0 0.35 0"
          result="coloredBlur"
        />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#logo-glow)" fontFamily="'Share Tech Mono', 'Orbitron', 'Rajdhani', sans-serif" fontWeight="600">
      <text
        x="50%"
        y="35%"
        textAnchor="middle"
        fontSize={128}
        letterSpacing="0.45em"
        fill="url(#logo-fill)"
        stroke="url(#logo-stroke)"
        strokeWidth={6}
        paintOrder="stroke fill"
      >
        IRONLIGHT
      </text>
      <text
        x="50%"
        y="62%"
        textAnchor="middle"
        fontSize={144}
        letterSpacing="0.75em"
        fill="url(#logo-fill)"
        stroke="url(#logo-stroke)"
        strokeWidth={7}
        paintOrder="stroke fill"
      >
        ACCORD
      </text>
      <text
        x="50%"
        y="88%"
        textAnchor="middle"
        fontSize={96}
        letterSpacing="0.6em"
        fill="url(#logo-fill)"
        stroke="url(#logo-stroke)"
        strokeWidth={5}
        paintOrder="stroke fill"
      >
        INITIATIVE
      </text>
    </g>
  </svg>
);
