'use client';
import prose from "@tailwindcss/typography";
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
  type MDXEditorMethods,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

// Sample Sandpack config for demonstration
const virtuosoSampleSandpackConfig = {
  files: {
    '/App.js': {
      code: `export default function App() {
  return <h1>Hello Sandpack!</h1>;
}`,
      active: true,
    },
  },
  template: 'react',
};

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

  return (
    <div className="h-full w-full relative">
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
          
          // Image plugin
          imagePlugin({
            imageUploadHandler: async (image) => {
              // For now, return a placeholder URL
              // In a real app, you'd upload to a service like Cloudinary
              return Promise.resolve('/placeholder-image.jpg');
            },
          }),
          
          // Table plugin
          tablePlugin(),
          
          // Code plugins
          codeBlockPlugin({ defaultCodeBlockLanguage: 'javascript' }),
          codeMirrorPlugin({
            codeBlockLanguages: {
              js: 'JavaScript',
              javascript: 'JavaScript',
              ts: 'TypeScript',
              typescript: 'TypeScript',
              tsx: 'TypeScript (React)',
              jsx: 'JavaScript (React)',
              css: 'CSS',
              html: 'HTML',
              json: 'JSON',
              markdown: 'Markdown',
              python: 'Python',
              bash: 'Bash',
              sql: 'SQL',
            },
          }),
          
          // Source view plugin
          diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: '' }),
          
          // Frontmatter plugin
          frontmatterPlugin(),
          
          // Sandpack plugin for live code execution
          sandpackPlugin({ sandpackConfig: virtuosoSampleSandpackConfig }),
          
          // Toolbar plugin with responsive design
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <Separator />
                <BoldItalicUnderlineToggles />
                <CodeToggle />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <CreateLink />
                <InsertImage />
                <Separator />
                <ListsToggle />
                <Separator />
                <InsertTable />
                <InsertThematicBreak />
                <Separator />
                <InsertCodeBlock />
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
