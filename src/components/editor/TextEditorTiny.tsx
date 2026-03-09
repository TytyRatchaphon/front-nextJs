import React, { useRef, useEffect, useState } from 'react';
import { imageUploadHandler } from '@/components/editor/editor_api';

declare global {
  interface Window {
    tinymce?: any;
    __tinymceLoadPromise?: Promise<void>;
  }
}

interface TextEditorTinyProps {
  value?: string;
  onChange?: (content: string, index?: any) => void;
  height?: number | string;
  onBlur?: (content: string, index?: any) => void;
  contentSelected?: any;
}

const TINYMCE_SCRIPT_ID = 'tinymce-cdn-script';
const TINYMCE_SCRIPT_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.5/tinymce.min.js';

const ensureTinyMceLoaded = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.tinymce) return Promise.resolve();
  if (window.__tinymceLoadPromise) return window.__tinymceLoadPromise;

  window.__tinymceLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(TINYMCE_SCRIPT_ID) as HTMLScriptElement | null;

    if (existing) {
      if (window.tinymce) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load TinyMCE script')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = TINYMCE_SCRIPT_ID;
    script.src = TINYMCE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load TinyMCE script'));
    document.head.appendChild(script);
  });

  return window.__tinymceLoadPromise;
};

const TextEditorTiny: React.FC<TextEditorTinyProps> = ({
  value,
  onChange,
  height = 400,
  onBlur,
  contentSelected
}) => {
  const editorRef = useRef<any>(null);
  const indexRef = useRef<any>(contentSelected);
  const onChangeRef = useRef(onChange || (() => {}));
  const onBlurRef = useRef(onBlur);
  const valueRef = useRef<string>(value ?? '');
  const lastSyncedContentRef = useRef<string>('');

  const [thaiWordCount, setThaiWordCount] = useState<number>(0);
  const [editorFailed, setEditorFailed] = useState<boolean>(false);

  const [editorId] = useState(() => `tiny-editor-${Math.random().toString(36).slice(2, 11)}`);

  const countThaiWords = (html: string) => {
    if (typeof window === 'undefined') return 0;
    const temp = document.createElement('div');
    temp.innerHTML = html || '';
    const text = (temp.textContent || temp.innerText || '').trim();
    if (!text) return 0;

    try {
      const SegmenterCtor = (Intl as any).Segmenter;
      if (typeof SegmenterCtor === 'function') {
        const segmenter = new SegmenterCtor('th', { granularity: 'word' });
        let count = 0;
        for (const segment of segmenter.segment(text)) {
          if (segment?.isWordLike) count += 1;
        }
        return count;
      }
    } catch {
    }

    const compact = text.replace(/\s+/g, ' ').trim();
    return compact ? compact.split(' ').length : 0;
  };

  useEffect(() => {
    indexRef.current = contentSelected;
  }, [contentSelected]);

  useEffect(() => {
    onChangeRef.current = onChange || (() => {});
  }, [onChange]);

  useEffect(() => {
    onBlurRef.current = onBlur;
  }, [onBlur]);

  useEffect(() => {
    valueRef.current = value ?? '';
  }, [value]);

  const thaiFonts = [
    'Anakotmai', 'Athiti', 'Chakra Petch', 'Chonburi', 'Itim', 'K2D', 'Kanit',
    'Mali', 'Mitr', 'Niramit', 'Noto Sans Thai', 'Noto Serif Thai', 'Pattaya',
    'Pridi', 'Prompt', 'Sarabun', 'Sriracha', 'Taviraj', 'Trirong', 'Thasadith'
  ];

  const familyQuery = thaiFonts.map((f) => f.replace(/ /g, '+')).join('&family=');
  const importUrl = `https://fonts.googleapis.com/css2?family=${familyQuery}&display=swap&subset=thai`;
  const fontFormats = thaiFonts.map((f) => `${f}='${f}',sans-serif`).join(';');

  useEffect(() => {
    let cancelled = false;

    const initializeTinyMCE = () => {
      if (!window.tinymce) return;

      const existingEditor = window.tinymce.get(editorId);
      if (existingEditor) {
        existingEditor.remove();
      }

      window.tinymce.init({
        selector: `#${editorId}`,
        license_key: 'gpl',
        height,
        menubar: false,
        promotion: false,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'help'
        ],
        toolbar:
          'undo redo | fontsize fontfamily | bold italic backcolor forecolor | ' +
          'alignleft aligncenter alignright alignjustify | link | image | ' +
          'bullist numlist outdent indent | blocks | removeformat',
        font_family_formats: fontFormats,
        branding: false,
        statusbar: false,
        automatic_uploads: true,
        images_upload_handler: imageUploadHandler,
        content_style: `
          @import url('${importUrl}');
          body {
            font-family: 'Sarabun', sans-serif;
            font-size: 20px;
          }
        `,
        setup: (editor: any) => {
          editor.on('init', () => {
            if (cancelled) return;

            editorRef.current = editor;
            setEditorFailed(false);

            const initialContent = valueRef.current || '';
            editor.setContent(initialContent);
            lastSyncedContentRef.current = initialContent;
            setThaiWordCount(countThaiWords(initialContent));
          });

          editor.addShortcut('ctrl+h', 'Open replace dialog', () => {
            editor.execCommand('SearchReplace');
          });

          editor.on('change keyup paste undo redo', () => {
            const content = editor.getContent();
            lastSyncedContentRef.current = content;
            setThaiWordCount(countThaiWords(content));
            onChangeRef.current(content, indexRef.current);
          });

          editor.on('blur', () => {
            const content = editor.getContent();
            if (onBlurRef.current) {
              onBlurRef.current(content, indexRef.current);
            }
          });
        }
      });
    };

    const boot = async () => {
      try {
        await ensureTinyMceLoaded();
        if (cancelled) return;

        initializeTinyMCE();

        setTimeout(() => {
          if (!cancelled && !editorRef.current) initializeTinyMCE();
        }, 250);

        setTimeout(() => {
          if (!cancelled && !editorRef.current) setEditorFailed(true);
        }, 1000);
      } catch {
        if (!cancelled) setEditorFailed(true);
      }
    };

    boot();

    return () => {
      cancelled = true;
      try {
        if (window.tinymce) {
          const editor = window.tinymce.get(editorId);
          if (editor) editor.remove();
        }
      } catch {
      }
      editorRef.current = null;
    };
  }, [editorId, fontFormats, height, importUrl]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || value === undefined) return;

    const incoming = value || '';
    if (incoming !== lastSyncedContentRef.current) {
      editor.setContent(incoming);
      lastSyncedContentRef.current = incoming;
      setThaiWordCount(countThaiWords(incoming));
    }
  }, [value]);

  if (editorFailed) {
    return (
      <div>
        <textarea
          id={editorId}
          className="w-full min-h-[400px] border border-gray-200 rounded p-3"
          value={valueRef.current}
          onChange={(e) => {
            const content = e.target.value;
            valueRef.current = content;
            lastSyncedContentRef.current = content;
            setThaiWordCount(countThaiWords(content));
            onChangeRef.current(content, indexRef.current);
          }}
        />
        <div className="mt-1 text-right text-xs text-gray-500">{thaiWordCount.toLocaleString('th-TH')} คำ</div>
      </div>
    );
  }

  return (
    <div>
      <textarea id={editorId} style={{ visibility: 'hidden' }} />
      <div className="mt-1 text-right text-xs text-gray-500">{thaiWordCount.toLocaleString('th-TH')} คำ</div>
    </div>
  );
};

export default TextEditorTiny;
