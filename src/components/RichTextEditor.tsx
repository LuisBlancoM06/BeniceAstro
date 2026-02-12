import { useState, useRef, useCallback, useEffect } from 'react';

interface RichTextEditorProps {
  initialContent?: string;
  name?: string;
  placeholder?: string;
  'client:load'?: boolean;
  'client:idle'?: boolean;
  'client:visible'?: boolean;
}

export default function RichTextEditor({
  initialContent = '',
  name = 'description',
  placeholder = 'Escribe la descripción del producto...',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  // Sincronizar contenido con el input hidden
  const syncContent = useCallback(() => {
    if (editorRef.current && hiddenInputRef.current) {
      hiddenInputRef.current.value = editorRef.current.innerHTML;
    }
  }, []);

  // Detectar formatos activos en la posición del cursor
  const updateActiveFormats = useCallback(() => {
    const formats = new Set<string>();
    if (document.queryCommandState('bold')) formats.add('bold');
    if (document.queryCommandState('italic')) formats.add('italic');
    if (document.queryCommandState('underline')) formats.add('underline');
    if (document.queryCommandState('insertUnorderedList')) formats.add('ul');
    if (document.queryCommandState('insertOrderedList')) formats.add('ol');

    const block = document.queryCommandValue('formatBlock');
    if (block === 'h2' || block === 'H2') formats.add('h2');
    if (block === 'h3' || block === 'H3') formats.add('h3');

    setActiveFormats(formats);
  }, []);

  // Ejecutar un comando de formato
  const execCommand = useCallback(
    (command: string, value?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, value);
      syncContent();
      updateActiveFormats();
    },
    [syncContent, updateActiveFormats],
  );

  // Insertar enlace
  const insertLink = useCallback(() => {
    const url = prompt('URL del enlace:');
    if (url) {
      execCommand('createLink', url);
    }
  }, [execCommand]);

  // Cargar contenido inicial
  useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.innerHTML = initialContent;
      syncContent();
    }
  }, [initialContent, syncContent]);

  const btnClass = (format: string) =>
    `p-1.5 rounded transition-colors ${
      activeFormats.has(format)
        ? 'bg-purple-100 text-purple-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 bg-gray-50 border-b border-gray-200">
        {/* Headings */}
        <button
          type="button"
          title="Título (H2)"
          className={btnClass('h2')}
          onClick={() => execCommand('formatBlock', 'H2')}
        >
          <span className="text-xs font-bold w-5 h-5 flex items-center justify-center">H2</span>
        </button>
        <button
          type="button"
          title="Subtítulo (H3)"
          className={btnClass('h3')}
          onClick={() => execCommand('formatBlock', 'H3')}
        >
          <span className="text-xs font-bold w-5 h-5 flex items-center justify-center">H3</span>
        </button>
        <button
          type="button"
          title="Párrafo"
          className="p-1.5 rounded text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          onClick={() => execCommand('formatBlock', 'P')}
        >
          <span className="text-xs font-bold w-5 h-5 flex items-center justify-center">P</span>
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Formato inline */}
        <button type="button" title="Negrita" className={btnClass('bold')} onClick={() => execCommand('bold')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
          </svg>
        </button>
        <button type="button" title="Cursiva" className={btnClass('italic')} onClick={() => execCommand('italic')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h4m-2 0l-4 16m0 0h4" />
          </svg>
        </button>
        <button type="button" title="Subrayado" className={btnClass('underline')} onClick={() => execCommand('underline')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v7a5 5 0 0010 0V4M5 20h14" />
          </svg>
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Listas */}
        <button type="button" title="Lista con viñetas" className={btnClass('ul')} onClick={() => execCommand('insertUnorderedList')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            <circle cx="2" cy="6" r="1" fill="currentColor" />
            <circle cx="2" cy="12" r="1" fill="currentColor" />
            <circle cx="2" cy="18" r="1" fill="currentColor" />
          </svg>
        </button>
        <button type="button" title="Lista numerada" className={btnClass('ol')} onClick={() => execCommand('insertOrderedList')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Enlace */}
        <button type="button" title="Insertar enlace" className="p-1.5 rounded text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors" onClick={insertLink}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>

        {/* Limpiar formato */}
        <button
          type="button"
          title="Limpiar formato"
          className="p-1.5 rounded text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors ml-auto"
          onClick={() => execCommand('removeFormat')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[200px] px-4 py-3 text-gray-800 focus:outline-none prose prose-sm max-w-none
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1
          [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5
          [&_a]:text-purple-600 [&_a]:underline"
        data-placeholder={placeholder}
        onInput={() => {
          syncContent();
          updateActiveFormats();
        }}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
      />

      {/* Hidden input para enviar con el formulario */}
      <input type="hidden" ref={hiddenInputRef} name={name} defaultValue={initialContent} />

      {/* Estilos para placeholder */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
