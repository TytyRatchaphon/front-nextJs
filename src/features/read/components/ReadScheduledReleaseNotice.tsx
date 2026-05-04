import {
  formatScheduledPublishDate,
  formatScheduledPublishTime,
} from "../readerContentUtils";

type ReadScheduledReleaseNoticeProps = {
  scheduledPublishAt: Date | null;
  scheduledReleaseCountdown: string | null;
  currentBgKey?: string;
  compact?: boolean;
};

export function ReadScheduledReleaseNotice({
  scheduledPublishAt,
  scheduledReleaseCountdown,
  currentBgKey,
  compact = false,
}: ReadScheduledReleaseNoticeProps) {
  if (!scheduledPublishAt) return null;

  const scheduledPanelTheme = currentBgKey === "dark"
    ? {
        panelBg: "linear-gradient(180deg, rgba(32,32,36,0.98) 0%, rgba(24,24,28,0.98) 100%)",
        panelBorder: "rgba(255,255,255,0.08)",
        chipBg: "rgba(227,28,61,0.14)",
        chipText: "#fda4af",
        text: "#f9fafb",
        muted: "#a1a1aa",
        accentBg: "rgba(255,255,255,0.04)",
        accentBorder: "rgba(255,255,255,0.08)",
      }
    : currentBgKey === "sepia"
      ? {
          panelBg: "linear-gradient(180deg, rgba(248,242,230,0.98) 0%, rgba(243,235,219,0.98) 100%)",
          panelBorder: "#e7d9bf",
          chipBg: "#f8e2d7",
          chipText: "#b45309",
          text: "#5b4636",
          muted: "#8b735c",
          accentBg: "rgba(255,255,255,0.45)",
          accentBorder: "#eadbc2",
        }
      : {
          panelBg: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,248,248,0.98) 100%)",
          panelBorder: "#f3d4d7",
          chipBg: "#fff1f2",
          chipText: "#be123c",
          text: "#1f2937",
          muted: "#6b7280",
          accentBg: "#fff8f8",
          accentBorder: "#f7d7db",
        };

  if (compact) {
    return (
      <div
        className="mx-auto max-w-md rounded-2xl border px-4 py-4 text-left shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
        style={{
          background: scheduledPanelTheme.panelBg,
          borderColor: scheduledPanelTheme.panelBorder,
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em]"
              style={{
                backgroundColor: scheduledPanelTheme.chipBg,
                color: scheduledPanelTheme.chipText,
              }}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              กำหนดเผยแพร่
            </div>
            <p className="mt-3 text-sm font-semibold" style={{ color: scheduledPanelTheme.text }}>
              เปิดอ่าน {formatScheduledPublishDate(scheduledPublishAt)} เวลา {formatScheduledPublishTime(scheduledPublishAt)} น.
            </p>
            <p className="mt-1 text-xs" style={{ color: scheduledPanelTheme.muted }}>
              ตอนนี้ยังไม่ถึงเวลาเผยแพร่ แต่สามารถปลดล็อกแบบตอนล่วงหน้าได้
            </p>
          </div>
          {scheduledReleaseCountdown && (
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{
                backgroundColor: scheduledPanelTheme.chipBg,
                color: scheduledPanelTheme.chipText,
              }}
            >
              <span className="h-2 w-2 rounded-full bg-current" />
              {scheduledReleaseCountdown}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div
        className="mx-auto max-w-xl rounded-[28px] border px-6 py-7 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
        style={{
          background: scheduledPanelTheme.panelBg,
          borderColor: scheduledPanelTheme.panelBorder,
        }}
      >
        <div
          className="mx-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em]"
          style={{
            backgroundColor: scheduledPanelTheme.chipBg,
            color: scheduledPanelTheme.chipText,
          }}
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          กำหนดเผยแพร่
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium" style={{ color: scheduledPanelTheme.muted }}>
            ตอนนี้ยังไม่เปิดให้อ่าน
          </p>
          <div className="mt-3 flex items-end justify-center gap-2">
            <span className="text-[2rem] font-semibold leading-none" style={{ color: scheduledPanelTheme.text }}>
              {formatScheduledPublishTime(scheduledPublishAt)}
            </span>
            <span className="pb-1 text-sm font-medium" style={{ color: scheduledPanelTheme.muted }}>
              น.
            </span>
          </div>
          <p className="mt-2 text-sm" style={{ color: scheduledPanelTheme.muted }}>
            เผยแพร่วันที่ {formatScheduledPublishDate(scheduledPublishAt)} เวลาไทย
          </p>
        </div>

        <div
          className="mt-5 rounded-2xl border px-4 py-4"
          style={{
            backgroundColor: scheduledPanelTheme.accentBg,
            borderColor: scheduledPanelTheme.accentBorder,
          }}
        >
          <p className="text-sm font-medium" style={{ color: scheduledPanelTheme.text }}>
            ระบบจะเปิดตอนนี้ให้อ่านอัตโนมัติเมื่อถึงเวลา
          </p>
          {scheduledReleaseCountdown && (
            <div
              className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{
                backgroundColor: scheduledPanelTheme.chipBg,
                color: scheduledPanelTheme.chipText,
              }}
            >
              <span className="h-2 w-2 rounded-full bg-current" />
              {scheduledReleaseCountdown}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
