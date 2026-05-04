import Image from 'next/image';

export type CurrencyIconType = string | null | undefined;

export interface CurrencyIconSettings {
  coin?: string | null;
  coupon?: string | null;
  freecoin?: string | null;
  flower?: string | null;
  heart?: string | null;
  exp?: string | null;
  fast_ticket?: string | null;
  stamp?: string | null;
  rp?: string | null;
}

type CurrencyIconFallback = CurrencyIconType | false | null;

const DEFAULT_CURRENCY_ICONS: Record<string, string> = {
  coin: '/images/e-coin.png',
  coupon: '/images/gacha.png',
  freecoin: '/images/money-bag.png',
  flower: '/images/flower.png',
  heart: '/images/heart.png',
  exp: '/images/exp.png',
  fast_ticket: '/images/fast_ticket.png',
  stamp: '/images/stamp.png',
  rp: '/images/rp.png',
};

export const normalizeCurrencyType = (type: CurrencyIconType) => {
  const normalized = String(type ?? '').trim().toLowerCase();

  if (normalized === 'current_rp') return 'rp';
  if (normalized === 'getcoin') return 'coin';
  if (normalized === 'getfreecoin') return 'freecoin';

  return normalized;
};

export const getCurrencyIconSrc = (
  type: CurrencyIconType,
  settings?: CurrencyIconSettings | null,
  fallback: CurrencyIconFallback = 'coin',
) => {
  const normalizedType = normalizeCurrencyType(type);
  const iconMap: Record<string, string | null | undefined> = {
    coin: settings?.coin || DEFAULT_CURRENCY_ICONS.coin,
    coupon: settings?.coupon || DEFAULT_CURRENCY_ICONS.coupon,
    freecoin: settings?.freecoin || DEFAULT_CURRENCY_ICONS.freecoin,
    flower: settings?.flower || DEFAULT_CURRENCY_ICONS.flower,
    heart: settings?.heart || DEFAULT_CURRENCY_ICONS.heart,
    exp: settings?.exp || DEFAULT_CURRENCY_ICONS.exp,
    fast_ticket: settings?.fast_ticket || DEFAULT_CURRENCY_ICONS.fast_ticket,
    stamp: settings?.stamp || DEFAULT_CURRENCY_ICONS.stamp,
    rp: settings?.rp || DEFAULT_CURRENCY_ICONS.rp,
  };

  const directIcon = iconMap[normalizedType];
  if (directIcon) return directIcon;

  if (!fallback) return null;

  const fallbackType = normalizeCurrencyType(fallback);
  return iconMap[fallbackType] || null;
};

interface CurrencyIconProps {
  type: CurrencyIconType;
  settings?: CurrencyIconSettings | null;
  size?: number;
  fallback?: CurrencyIconFallback;
  alt?: string;
  className?: string;
}

export default function CurrencyIcon({
  type,
  settings,
  size = 18,
  fallback = 'coin',
  alt,
  className = 'object-contain inline-block',
}: CurrencyIconProps) {
  const src = getCurrencyIconSrc(type, settings, fallback);

  if (!src) return null;

  return (
    <Image
      src={src}
      alt={alt ?? (normalizeCurrencyType(type) || 'currency')}
      width={size}
      height={size}
      className={className}
      unoptimized
    />
  );
}
