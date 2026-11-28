'use client';

import { useState, useCallback } from 'react';

export type OrgLogoKey = 'smk' | 'pmi' | 'pmr';

interface LogoItem {
  key: OrgLogoKey;
  src: string;
  alt: string;
}

const ALL_LOGOS: LogoItem[] = [
  { key: 'smk', src: '/logo-smk.png', alt: 'Logo SMKN 1 Pringgabaya' },
  { key: 'pmi', src: '/logo-pmi.png', alt: 'Logo Palang Merah Indonesia' },
  { key: 'pmr', src: '/logo-pmr.png', alt: 'Logo PMR Wira SMKN 1 Pringgabaya' },
];

interface OrgLogosProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  shape?: 'rounded' | 'circle';
  onlyPmr?: boolean;
  logos?: OrgLogoKey[];
  variant?: 'badges' | 'grouped';
  className?: string;
}

const BADGE_SIZE_CLASSES: Record<NonNullable<OrgLogosProps['size']>, string> = {
  xs: 'w-7 h-7 p-1',
  sm: 'w-9 h-9 p-1.5',
  md: 'w-12 h-12 p-1.5',
  lg: 'w-14 h-14 p-2',
};

const GROUPED_IMG_CLASSES: Record<NonNullable<OrgLogosProps['size']>, string> = {
  xs: 'w-5 h-5',
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-11 h-11',
};

export function OrgLogos({
  size = 'md',
  shape = 'rounded',
  onlyPmr = false,
  logos,
  variant = 'badges',
  className = '',
}: OrgLogosProps) {
  const [hiddenKeys, setHiddenKeys] = useState<Record<string, boolean>>({});

  const markHidden = useCallback((key: OrgLogoKey) => {
    setHiddenKeys((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);

  const targetKeys: OrgLogoKey[] = onlyPmr
    ? ['pmr']
    : logos && logos.length > 0
      ? logos
      : ['smk', 'pmi', 'pmr'];

  const visibleLogos = targetKeys
    .map((k) => ALL_LOGOS.find((item) => item.key === k))
    .filter((item): item is LogoItem => Boolean(item) && !hiddenKeys[item!.key]);

  if (visibleLogos.length === 0) return null;

  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';

  if (variant === 'grouped') {
    return (
      <div
        className={`inline-flex items-center justify-center gap-2.5 px-3 py-2 ${shapeClass} !bg-white border border-slate-200/90 dark:border-white/30 shadow-sm select-none ${className}`}
      >
        {visibleLogos.map((logo, idx) => (
          <div key={logo.key} className="inline-flex items-center gap-2.5">
            {idx > 0 && <span className="h-5 w-px bg-slate-200" aria-hidden="true" />}
            <img
              ref={(el) => {
                if (el && el.complete && el.naturalWidth === 0) {
                  markHidden(logo.key);
                }
              }}
              src={logo.src}
              alt={logo.alt}
              title={logo.alt}
              draggable={false}
              onError={() => markHidden(logo.key)}
              className={`${GROUPED_IMG_CLASSES[size]} object-contain shrink-0`}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center gap-2.5 select-none ${className}`}>
      {visibleLogos.map((logo) => (
        <div
          key={logo.key}
          title={logo.alt}
          className={`${BADGE_SIZE_CLASSES[size]} ${shapeClass} !bg-white border border-slate-200/90 dark:border-white/30 shadow-sm flex items-center justify-center shrink-0`}
        >
          <img
            ref={(el) => {
              if (el && el.complete && el.naturalWidth === 0) {
                markHidden(logo.key);
              }
            }}
            src={logo.src}
            alt={logo.alt}
            draggable={false}
            onError={() => markHidden(logo.key)}
            className="w-full h-full object-contain"
          />
        </div>
      ))}
    </div>
  );
}