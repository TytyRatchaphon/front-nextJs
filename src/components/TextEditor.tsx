"use client";

import React, { useRef, useEffect, useState } from 'react';
// import imageUploadHandler from './editor_api';

declare global {
  interface Window {
    tinymce?: any;
  }
}

type TextEditorProps = {
  value?: string;
  onChange?: (content: string) => void;
  height?: number;
  onBlur?: () => void;
  onInit?: (editor: any) => void;
};

const TextEditor = ({ value, onChange, height, onInit }: TextEditorProps) => {
  const editorRef = useRef<any>(null);
  const scriptLoadedRef = useRef(false);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const thaiFonts = [
    'Anakotmai','Athiti','Chakra Petch','Chonburi','Itim','K2D','Kanit',
    'Mali','Mitr','Niramit','Noto Sans Thai','Noto Serif Thai','Pattaya',
    'Pridi','Prompt','Sarabun','Sriracha','Taviraj','Trirong','Thasadith'
  ];

  const familyQuery = thaiFonts.map(f => f.replace(/ /g, '+')).join('&family=');
  const importUrl = `https://fonts.googleapis.com/css2?family=${familyQuery}&display=swap&subset=thai`;

  const fontFormats = thaiFonts.map(f => `${f}='${f}',sans-serif`).join(';');

  // safe access to localStorage (avoid SSR crash)
  const savedFont = (typeof window !== 'undefined' && localStorage.getItem('tinymceFontFamily')) || `Sarabun,sans-serif`;
  const savedSize = (typeof window !== 'undefined' && localStorage.getItem('tinymceFontSize')) || '20px';

  const initializeTinyMCE = () => {
    if ((window as any).tinymce) {
      if ((window as any).tinymce.get('my-editor')) {
        (window as any).tinymce.get('my-editor').remove();
      }

      (window as any).tinymce.init({
        selector: '#my-editor',
        license_key: 'gpl',
        height: height || 400,
        menubar: false,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'help', 'wordcount'
        ],
        toolbar:
          'undo redo | fontsize fontfamily  | bold italic backcolor forecolor | lineheight | ' +
          'alignleft aligncenter alignright alignjustify | link  image | ' +
          'bullist numlist outdent indent | blocks | removeformat',

        font_family_formats: fontFormats,
        branding: false,
        automatic_uploads: true,
        // images_upload_handler: imageUploadHandler,
        content_style: `@import url('${importUrl}'); body { font-family: ${savedFont}; font-size: ${savedSize}; }`,

        remove_trailing_brs: true,
        remove_linebreaks: false,
        convert_newlines_to_brs: false,
        extended_valid_elements: 'p[style|align]',
        paste_remove_styles: true,
        paste_remove_spans: true,
        paste_strip_class_attributes: 'all',
        remove_empty: false,
        remove_empty_spans: false,
        merge_empty_spans: false,

        setup: (editor: any) => {
          onInit?.(editor);

          editor.on('ExecCommand', (e: any) => {
            if (e.command === 'FontName') {
              localStorage.setItem('tinymceFontFamily', e.value);
            }
            if (e.command === 'FontSize') {
              localStorage.setItem('tinymceFontSize', e.value);
            }
          });

          editor.on('init', () => {
            editorRef.current = editor;
            setIsEditorReady(true);
          });

          editor.addShortcut('ctrl+h', 'Open replace dialog', () => {
            editor.execCommand('SearchReplace');
          });

          editor.on('change keyup paste undo redo', () => {
            const content: string = editor.getContent();
            onChange?.(content);
          });

          editor.on('keydown', (e: any) => {
            if (e.keyCode === 8) {
              const sel = editor.selection.getRng();
              const container = sel.startContainer;
              const offset = sel.startOffset;
              if (container.nodeType === Node.TEXT_NODE && offset > 0) {
                // You can use editor.fire('DeletedChar', { char: charToDelete }) if needed
              }
            }
          });
        }
      });
    }
  };

  useEffect(() => {
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
          console.error('Failed to load TinyMCE script');
        };
        document.head.appendChild(script);
      }
    } else {
      initializeTinyMCE();
    }

    return () => {
      if ((window as any).tinymce && (window as any).tinymce.get('my-editor')) {
        (window as any).tinymce.get('my-editor').remove();
      }
    };
  }, []);

  useEffect(() => {
    if (isEditorReady && editorRef.current && value !== editorRef.current.getContent()) {
      editorRef.current.setContent(value || '');
    }
  }, [value, isEditorReady]);

  return (
    <div>
      <textarea id="my-editor" />
    </div>
  );
};

export default TextEditor;
