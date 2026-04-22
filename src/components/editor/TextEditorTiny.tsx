import * as React from "react";
import { useRef, useEffect, useState } from 'react';
import { imageUploadHandler } from '@/components/editor/editor_api';

// 1. ประกาศ Interface สำหรับ Props
interface TextEditorTinyProps {
  value?: string;
  onChange?: (content: string, index?: any) => void;
  height?: number | string;
  onBlur?: (content: string, index?: any) => void;
  contentSelected?: any;
}

type TinyOnChange = (content: string, index?: any) => void;



const TextEditorTiny: React.FC<TextEditorTinyProps> = ({ 
  value, 
  onChange, 
  height = 400, // Default height
  onBlur, 
  contentSelected 
}) => {

  const editorRef = useRef<any>(null);
  const indexRef = useRef<any>(contentSelected);
  const scriptLoadedRef = useRef<boolean>(false);
  const onChangeRef = useRef<TinyOnChange>(() => {});
  const onBlurRef = useRef(onBlur);
  const valueRef = useRef<string>(value ?? '');
  const lastSyncedContentRef = useRef<string>('');
  const [thaiWordCount, setThaiWordCount] = useState<number>(0);
  
  // Use a unique ID for each instance
  const [editorId] = useState(() => `tiny-editor-${Math.random().toString(36).substr(2, 9)}`);

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

  const familyQuery = thaiFonts.map(f => f.replace(/ /g, '+')).join('&family=');
  const importUrl = `https://fonts.googleapis.com/css2?family=${familyQuery}&display=swap&subset=thai`;
  // Add Sarabun explicitly if not in list, though it is there.
  const fontFormats = thaiFonts.map(f => `${f}='${f}',sans-serif`).join(';');

  // Load TinyMCE script เมื่อ component mount
  useEffect(() => {
    const initializeTinyMCE = () => {
      if (!(window as any).tinymce) return;

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
            editorRef.current = editor;

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

    if (!scriptLoadedRef.current) {
      if ((window as any).tinymce) {
        initializeTinyMCE();
        scriptLoadedRef.current = true;
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.5/tinymce.min.js';
        script.async = true;
        script.onload = () => {
          scriptLoadedRef.current = true;
          initializeTinyMCE();
        };
        script.onerror = () => {
        };
        document.head.appendChild(script);
      }
    }

    return () => {
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
      <textarea id={editorId} style={{ visibility: 'hidden' }} />
      <div className="mt-1 text-right text-xs text-gray-500">{thaiWordCount.toLocaleString('th-TH')} คำ</div>
    </div>
  );
};

export default TextEditorTiny;
