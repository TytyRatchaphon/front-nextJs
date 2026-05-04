import Image from 'next/image';
import Link from 'next/link';
import AmountPill from '@/components/utility/AmountPill';
import FreeCoinPill from '@/components/utility/FreeCoinPill';
import StampPill from '@/components/utility/StampPill';
import RPPill from '@/components/utility/RPPill';
import FastTicketPill from '@/components/utility/FastTicketPill';
import UserRankShowcase from '@/features/user/components/UserRankShowcase';

interface StoreBalanceBannerProps {
  user: any;
  settings: any;
  avatarError: boolean;
  onAvatarError: () => void;
}

export function StoreBalanceBanner({ user, settings, avatarError, onAvatarError }: StoreBalanceBannerProps) {
  const balance = {
    coin: user?.coin ?? 0,
    flower: user?.flower ?? 0,
    heart: user?.heart ?? 0,
    stamp: user?.stamp ?? 0,
    exp_point: user?.exp ?? 0,
    free_coin: user?.freecoin ?? 0,
    rp: user?.current_rp ?? 0,
    fast_ticket: user?.fast_ticket ?? 0
  };

  const rawAvatar = user?.img ?? (user as any)?.profileImage ?? '';
  const avatarSrc = (() => {
    if (!rawAvatar || rawAvatar === 'null' || rawAvatar === 'undefined') {
      return '/images/default-avatar.png';
    }
    if (rawAvatar.startsWith('http') || rawAvatar.startsWith('data:') || rawAvatar.startsWith('/')) {
      return rawAvatar.replace('http:', 'https:');
    }
    if (rawAvatar.startsWith('img/')) {
      return `https://img.enjoybook.co/${rawAvatar}`;
    }
    return `https://img.enjoybook.co/img/profile/${rawAvatar}`;
  })();

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <div className="relative min-h-[148px] overflow-hidden rounded-[30px] border border-[#f0d9d4] bg-[linear-gradient(135deg,_#ffffff,_#fff9f7_55%,_#fff1ed)] shadow-[0_20px_42px_-34px_rgba(239,68,68,0.22)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,234,228,0.95),_transparent_35%),radial-gradient(circle_at_right,_rgba(255,243,239,0.9),_transparent_30%)]" />
        <div className="absolute -right-10 top-2 h-24 w-24 rounded-full bg-[#ffe5de] blur-3xl" />
        <div className="absolute bottom-0 left-16 h-16 w-16 rounded-full bg-[#fff0ea] blur-2xl" />

        <div className="relative z-10 flex h-full flex-col justify-center gap-3.5 p-3.5 md:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-stone-200 bg-white/90 px-2 py-1 shadow-sm">
              <div className="relative h-7 w-7 overflow-hidden rounded-full border border-stone-200 bg-stone-100">
                <Image
                  src={avatarError ? '/images/default-avatar.png' : avatarSrc}
                  alt={user?.fullname || 'Enjoybook user'}
                  fill
                  className="object-cover"
                  onError={onAvatarError}
                />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-stone-500">Store</p>
                <p className="truncate text-[11px] font-semibold text-stone-800 md:text-xs">
                  {user?.fullname || 'Enjoybook Member'}
                </p>
              </div>
            </div>

            <Link
              href="/wallet/history"
              className="inline-flex items-center gap-2 self-start rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-medium text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 hover:text-stone-950 md:text-xs"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
              <span>ประวัติการชำระ</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <AmountPill
              amount={balance.coin}
              icon={settings?.coin || '/images/e-coin.png'}
            />
            <FreeCoinPill amount={balance.free_coin} />
            <StampPill amount={balance.stamp} />
            <RPPill amount={balance.rp} />
            <FastTicketPill amount={balance.fast_ticket} />
          </div>
        </div>
      </div>

      <UserRankShowcase variant="compact" className="lg:self-start" />
    </div>
  );
}
