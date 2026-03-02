import React, { useRef, useEffect, useState, useCallback } from 'react';
import { imageUploadHandler } from '@/components/editor/editor_api';

// 1. ประกาศ Interface สำหรับ Props
interface TextEditorTinyProps {
  value?: string;
  onChange: (content: string, index: any) => void;
  height?: number | string;
  onBlur?: (content: string, index: any) => void;
  contentSelected?: any;
}



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
  const [isEditorReady, setIsEditorReady] = useState<boolean>(false);
  
  // Use a unique ID for each instance
  const [editorId] = useState(() => `tiny-editor-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    indexRef.current = contentSelected;
  }, [contentSelected]);

  const thaiFonts = [
    'Anakotmai', 'Athiti', 'Chakra Petch', 'Chonburi', 'Itim', 'K2D', 'Kanit',
    'Mali', 'Mitr', 'Niramit', 'Noto Sans Thai', 'Noto Serif Thai', 'Pattaya',
    'Pridi', 'Prompt', 'Sarabun', 'Sriracha', 'Taviraj', 'Trirong', 'Thasadith'
  ];

  const familyQuery = thaiFonts.map(f => f.replace(/ /g, '+')).join('&family=');
  const importUrl = `https://fonts.googleapis.com/css2?family=${familyQuery}&display=swap&subset=thai`;
  // Add Sarabun explicitly if not in list, though it is there.
  const fontFormats = thaiFonts.map(f => `${f}='${f}',sans-serif`).join(';');

  // ฟังก์ชันสำหรับ initialize TinyMCE
  const initializeTinyMCE = useCallback(() => {
    // ใช้ (window as any).tinymce แทน window.tinymce
    if ((window as any).tinymce) {
      
      const existingEditor = (window as any).tinymce.get(editorId);
      if (existingEditor) {
        existingEditor.remove();
      }

      // สร้าง editor ใหม่
      (window as any).tinymce.init({
        selector: `#${editorId}`,
        license_key: 'gpl',
        height: height,
        menubar: false,
        promotion: false, // Hide upgrade button
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'help', 'wordcount'
        ],
        toolbar:
          'undo redo | fontsize fontfamily | bold italic backcolor forecolor | ' +
          'alignleft aligncenter alignright alignjustify | link | image | ' +
          'bullist numlist outdent indent | blocks | removeformat',

        font_family_formats: fontFormats,
        branding: false,
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
            setIsEditorReady(true);
            
            // Set initial content if value exists
            if (value) {
                editor.setContent(value);
            }
          });

          editor.addShortcut('ctrl+h', 'Open replace dialog', () => {
            editor.execCommand('SearchReplace');
          });

          editor.on('change keyup paste undo redo', () => {
            const content = editor.getContent();
            onChange(content, indexRef.current);
          });

          editor.on('blur', () => {
            const content = editor.getContent();
            if (onBlur) {
                onBlur(content, indexRef.current);
            }
          });
        }
      });
    }
  }, [editorId, fontFormats, height, importUrl, onBlur, onChange, value]);

  // Load TinyMCE script เมื่อ component mount
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
        };
        document.head.appendChild(script);
      }
    } else {
      initializeTinyMCE();
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
        setIsEditorReady(false);
    };
  }, [editorId, initializeTinyMCE]);

  useEffect(() => {
    if (isEditorReady && editorRef.current && value !== undefined && value !== editorRef.current.getContent()) {
      editorRef.current.setContent(value || '');
    }
  }, [value, isEditorReady]);

  return (
    <div>
      <textarea id={editorId} style={{ visibility: 'hidden' }} />
    </div>
  );
};

export default TextEditorTiny;
