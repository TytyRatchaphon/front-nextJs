"use client";

import * as React from "react";
import { useRef, useEffect, useId, useState } from 'react';
import { imageUploadHandler } from '@/features/editor/components/editor_api';

// 1. ประกาศ Interface สำหรับ Props
interface TextEditorTinyProps {
  value?: string;
  onChange?: (content: string, index?: any) => void;
  height?: number | string;
  onBlur?: (content: string, index?: any) => void;
  contentSelected?: any;
}

type TinyOnChange = (content: string, index?: any) => void;

const TINYMCE_SCRIPT_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.5/tinymce.min.js';
let tinymceLoadPromise: Promise<void> | null = null;

const loadTinyMce = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('TinyMCE requires a browser'));
  if ((window as any).tinymce) return Promise.resolve();

  if (!tinymceLoadPromise) {
    tinymceLoadPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${TINYMCE_SCRIPT_SRC}"]`);
      const script = existingScript ?? document.createElement('script');

      script.async = true;
      script.src = TINYMCE_SCRIPT_SRC;
      script.addEventListener('load', () => resolve(), { once: true });
      script.addEventListener('error', () => {
        tinymceLoadPromise = null;
        reject(new Error('Failed to load TinyMCE'));
      }, { once: true });

      if (!existingScript) {
        document.head.appendChild(script);
      }
    });
  }

  return tinymceLoadPromise;
};


const TextEditorTiny: React.FC<TextEditorTinyProps> = ({ 
  value, 
  onChange, 
  height = 400, // Default height
  onBlur, 
  contentSelected 
}) => {

  const editorRef = useRef<any>(null);
  const indexRef = useRef<any>(contentSelected);
  const onChangeRef = useRef<TinyOnChange>(() => {});
  const onBlurRef = useRef(onBlur);
  const valueRef = useRef<string>(value ?? '');
  const lastSyncedContentRef = useRef<string>('');
  const [thaiWordCount, setThaiWordCount] = useState<number>(0);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [editorLoadFailed, setEditorLoadFailed] = useState(false);
  
  // Stable across SSR/client hydration and unique for each editor instance.
  const reactId = useId();
  const editorId = `tiny-editor-${reactId.replace(/:/g, '')}`;

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
    if (!editorRef.current) {
      setThaiWordCount(countThaiWords(value ?? ''));
    }
  }, [value]);

  const thaiFonts = [
    'Anakotmai', 'Athiti', 'Chakra Petch', 'Chonburi', 'Itim', 'K2D', 'Kanit',
    'Mali', 'Mitr', 'Niramit', 'Noto Sans Thai', 'Noto Serif Thai', 'Pattaya',
    'Pridi', 'Prompt', 'Sarabun', 'Sriracha', 'Taviraj', 'Trirong', 'Thasadith'
  ];

  const familyQuery = thaiFonts.map(f => f.replace(/ /g, '+')).join('&family=');
  const importUrl = `https://fonts.googleapis.com/css2?family=${familyQuery}&display=swap&subset=thai`;
  // Add Sarabun explicitly if not in list, though it is there.
  const fontFormats = thaiFonts.map(f => `${f}='${f}',sans-serif`).join(';');

  // Load TinyMCE script เมื่อ component mount
  useEffect(() => {
    let isMounted = true;

    const initializeTinyMCE = () => {
      if (!isMounted || !(window as any).tinymce) return;

      const existingEditor = (window as any).tinymce.get(editorId);
      if (existingEditor) {
        existingEditor.remove();
      }

      (window as any).tinymce.init({
        selector: `#${editorId}`,
        license_key: 'gpl',
        height: height,
        menubar: false,
        promotion: false, // Hide upgrade button
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
            if (!isMounted) {
              editor.remove();
              return;
            }

            editorRef.current = editor;
            setIsEditorReady(true);
            setEditorLoadFailed(false);

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
            onChangeRef.current(content);
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

    setIsEditorReady(false);
    setEditorLoadFailed(false);

    loadTinyMce()
      .then(() => {
        initializeTinyMCE();
      })
      .catch(() => {
        if (isMounted) {
          setEditorLoadFailed(true);
        }
      });

    return () => {
        isMounted = false;
        try {
            if ((window as any).tinymce) {
                const editor = (window as any).tinymce.get(editorId);
                if (editor) {
                    editor.remove();
                }
            }
        } catch {
        }
        editorRef.current = null;
        setIsEditorReady(false);
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

  return (
    <div>
      <textarea
        id={editorId}
        value={value ?? ''}
        onChange={(event) => {
          const content = event.target.value;
          lastSyncedContentRef.current = content;
          setThaiWordCount(countThaiWords(content));
          onChangeRef.current(content);
        }}
        onBlur={(event) => {
          if (onBlurRef.current) {
            onBlurRef.current(event.target.value, indexRef.current);
          }
        }}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-base leading-7 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
        style={{
          minHeight: typeof height === 'number' ? height : undefined,
          display: isEditorReady ? 'none' : undefined,
        }}
      />
      {!isEditorReady && (
        <p className={`mt-1 text-xs ${editorLoadFailed ? 'text-amber-600' : 'text-gray-400'}`}>
          {editorLoadFailed ? 'Editor toolbar could not load. You can still edit content in this basic text area.' : 'Loading editor toolbar...'}
        </p>
      )}
      <div className="mt-1 text-right text-xs text-gray-500">{thaiWordCount.toLocaleString('th-TH')} คำ</div>
    </div>
  );
};

export default TextEditorTiny;
