type S3LogoProps = {
  height?: number;
  className?: string;
  title?: string;
};

export default function S3Logo({ height = 64, className, title = 'S3' }: S3LogoProps) {
  return (
    <svg
      role="img"
      aria-label={title}
      width={Math.round(height * 2.6)}
      height={height}
      viewBox="0 0 260 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="s3LogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--primary-500)" />
          <stop offset="100%" stopColor="var(--primary-700)" />
        </linearGradient>
        <filter id="s3SoftGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="100%" height="100%" fill="none" />

      <text
        x="8"
        y="58"
        fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Inter', 'Noto Sans'"
        fontSize="64"
        fontWeight={900}
        letterSpacing="2"
        fill="url(#s3LogoGrad)"
        filter="url(#s3SoftGlow)"
      >
        S3
      </text>

      <path
        d="M8 76 C 28 70, 48 82, 68 76 S 108 82, 128 76 S 168 82, 188 76 S 228 82, 248 76"
        stroke="url(#s3LogoGrad)"
        strokeWidth="4"
        fill="none"
        opacity="0.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
