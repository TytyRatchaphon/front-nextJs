export function ReaderGlobalStyles() {
  return (
    <style jsx global>{`
      .reader-font-surface p,
      .reader-font-surface li,
      .reader-font-surface blockquote,
      .reader-font-surface pre {
        white-space: normal;
        overflow-wrap: anywhere;
        word-break: break-word;
        max-width: 100%;
      }
      .reader-font-surface,
      .reader-font-surface * {
        font-family: var(--reader-content-font-family, var(--font-sarabun), sans-serif) !important;
      }
      .reader-font-surface p {
        margin: 0 0 1.1em;
        text-indent: 2.1em;
      }
      .reader-font-surface p:last-child {
        margin-bottom: 0;
      }
      .reader-font-surface p:empty {
        margin: 0;
        text-indent: 0;
        min-height: 1em;
      }
      .reader-font-surface p > br:only-child {
        display: block;
        content: "";
        margin: 0.5em 0;
      }
      .reader-font-surface img,
      .reader-font-surface video,
      .reader-font-surface iframe {
        max-width: 100%;
        height: auto;
      }
      .bookmark-highlight {
        background: rgba(227, 28, 61, 0.14);
        transition: background-color 0.25s ease;
        border-radius: 6px;
      }
      .paragraph-tracked-current {
        position: relative;
        background: transparent;
        border-radius: 0;
      }
      .paragraph-tracked-current::before {
        content: ">";
        position: absolute;
        left: -14px;
        top: 0.05em;
        font-weight: 700;
        font-size: 0.95em;
        line-height: 1;
        pointer-events: none;
        opacity: 1;
        transition: opacity 0.18s ease;
      }
      .reader-nav-hidden .paragraph-tracked-current::before {
        opacity: 0;
      }
      .reader-theme-light .paragraph-tracked-current::before {
        color: rgba(148, 163, 184, 0.92);
      }
      .reader-theme-dark .paragraph-tracked-current::before {
        color: rgba(203, 213, 225, 0.88);
      }
      .reader-theme-light .paragraph-bookmarked {
        background: rgba(59, 130, 246, 0.08);
        border-left: 3px solid rgba(59, 130, 246, 0.55);
        border-radius: 6px;
        padding-left: 10px;
      }
      .reader-theme-dark .paragraph-bookmarked {
        background: rgba(148, 163, 184, 0.14);
        border-left: 3px solid rgba(203, 213, 225, 0.65);
        border-radius: 6px;
        padding-left: 10px;
      }
      .reader-settings-panel,
      .reader-font-select-dropdown,
      .reader-font-select-dropdown .rc-virtual-list-holder {
        overscroll-behavior: contain !important;
      }
    `}</style>
  );
}
