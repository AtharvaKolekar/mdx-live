'use client';

import React, { useEffect, useRef } from 'react';
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  frontmatterPlugin,
  sandpackPlugin,
  toolbarPlugin,
  directivesPlugin,
  AdmonitionDirectiveDescriptor,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  BlockTypeSelect,
  Separator,
  InsertCodeBlock,
  ChangeCodeMirrorLanguage,
  InsertSandpack,
  InsertAdmonition,
  HighlightToggle,
  
  type MDXEditorMethods,
  type SandpackConfig,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

// Optimized Sandpack config - single preset for performance
const optimizedSandpackConfig: SandpackConfig = {
  defaultPreset: 'react',
  presets: [
    {
      label: 'React',
      name: 'react',
      meta: 'live',
      sandpackTemplate: 'react',
      sandpackTheme: 'light',
      snippetFileName: '/App.js',
      snippetLanguage: 'jsx',
      initialSnippetContent: `export default function App() {
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
    </div>
  );
}`.trim()
    }
  ]
}

interface MDXEditorComponentProps {
  content: string;
  onChange: (content: string) => void;
}

export function MDXEditorComponent({ content, onChange }: MDXEditorComponentProps) {
  const editorRef = useRef<MDXEditorMethods>(null);

  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.getMarkdown()) {
      editorRef.current.setMarkdown(content);
    }
  }, [content]);

  // Handle click to focus the editor only when not already focused
  const handleEditorClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    
    // Check if clicking on the editor area
    const editorArea = target.closest('.mdxeditor-rich-text-editor');
    
    // Skip if not clicking on editor area
    if (!editorArea) return;

    if(editorArea.contains(document.activeElement)) {
      return; // Already focused
    }
    // Only focus if not already focused and clicking outside ProseMirror but inside editor area
    if (editorRef.current) {
      event.preventDefault();
      editorRef.current.focus();
    }
  };

  return (
    <div className="h-full w-full relative" onClick={handleEditorClick}>
      <MDXEditor
        ref={editorRef}
        markdown={content}
        contentEditableClassName="prose" // prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none p-4 focus:outline-none
        onChange={onChange}
        plugins={[
          // Core plugins
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          
          // Link plugins
          linkPlugin(),
          linkDialogPlugin(),

          directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
          
          // Image plugin
          imagePlugin({
            imageUploadHandler: async (image) => {
              try {
                const formData = new FormData();
                formData.append('image', image);

                const response = await fetch('https://api.athrva.in/upload', {
                  method: 'POST',
                  body: formData,
                });

                if (!response.ok) {
                  throw new Error(`Upload failed: ${response.statusText}`);
                }

                const result = await response.json();
                
                if (result.status === 'success' && result.data && result.data.length > 0) {
                  return result.data[0].url;
                } else {
                  throw new Error('Invalid response format');
                }
              } catch (error) {
                console.error('Image upload failed:', error);
                // Fallback to a placeholder or rethrow the error
                throw error;
              }
            },
          }),
          
          // Table plugin
          tablePlugin(),
          
          // Code plugins
          codeBlockPlugin({ 
            defaultCodeBlockLanguage: 'javascript',
            codeBlockEditorDescriptors: []
          }),
          codeMirrorPlugin({
            codeBlockLanguages: {
              '': 'Plain text',
              txt: 'Text',
              js: 'JavaScript',
              jsx: 'JavaScript (React)',
              ts: 'TypeScript',
              tsx: 'TypeScript (React)',
              html: 'HTML',
              css: 'CSS',
              json: 'JSON',
            },
          }),
          
          // Source view plugin
          diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: '' }),
          
          // Frontmatter plugin
          frontmatterPlugin(),
          
          // Sandpack plugin for live code execution
          sandpackPlugin({ sandpackConfig: optimizedSandpackConfig }),
          // Toolbar plugin with responsive design
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <Separator />
                <BoldItalicUnderlineToggles />
                <CodeToggle />
                <HighlightToggle />
                <Separator />
                <ListsToggle />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <CreateLink />
                <InsertImage />
                <Separator />
                <InsertTable />
                <InsertThematicBreak />
                <Separator />
                <InsertCodeBlock />
                <InsertSandpack />
                <Separator />
                <InsertAdmonition />
              </>
            ),
          }),
        ]}
        className="h-full w-full mdxeditor-responsive"
        placeholder="Start typing your document..."
      />
    </div>
  );
}
