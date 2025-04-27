"use client";

import { useEffect } from 'react';
import { RichTextEditor as MantineRTE, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Box, Typography, Paper } from '@mui/material';
import { MantineProvider } from '@mantine/core';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  minHeight?: number;
}

const RichTextEditor = ({
  value,
  onChange,
  label,
  placeholder = 'Enter text here...',
  error = false,
  helperText,
  minHeight = 200
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Link
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  // Update editor content if value changes externally
  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  return (
    <MantineProvider>
      <Box sx={{ mb: 2 }}>
        {label && (
          <Typography 
            variant="body2" 
            color={error ? 'error' : 'text.secondary'}
            sx={{ mb: 1, fontWeight: 500 }}
          >
            {label}
          </Typography>
        )}
        
        <Paper 
          variant="outlined" 
          sx={{ 
            overflow: 'hidden',
            borderColor: error ? 'error.main' : 'divider',
            '&:hover': {
              borderColor: error ? 'error.main' : 'text.primary',
            },
            '&:focus-within': {
              borderColor: error ? 'error.main' : 'primary.main',
              borderWidth: '2px',
            }
          }}
        >
          <div style={{ minHeight: minHeight }}>
            <MantineRTE 
              editor={editor}
            >
              <MantineRTE.Toolbar sticky stickyOffset={0}>
                <MantineRTE.ControlsGroup>
                  <MantineRTE.Bold />
                  <MantineRTE.Italic />
                  <MantineRTE.Underline />
                  <MantineRTE.Strikethrough />
                  <MantineRTE.ClearFormatting />
                  <MantineRTE.Highlight />
                  <MantineRTE.Code />
                </MantineRTE.ControlsGroup>

                <MantineRTE.ControlsGroup>
                  <MantineRTE.H1 />
                  <MantineRTE.H2 />
                  <MantineRTE.H3 />
                  <MantineRTE.H4 />
                </MantineRTE.ControlsGroup>

                <MantineRTE.ControlsGroup>
                  <MantineRTE.Blockquote />
                  <MantineRTE.Hr />
                  <MantineRTE.BulletList />
                  <MantineRTE.OrderedList />
                </MantineRTE.ControlsGroup>

                <MantineRTE.ControlsGroup>
                  <MantineRTE.Link />
                  <MantineRTE.Unlink />
                </MantineRTE.ControlsGroup>
              </MantineRTE.Toolbar>

              <MantineRTE.Content />
            </MantineRTE>
          </div>
        </Paper>
        
        {helperText && (
          <Typography 
            variant="caption" 
            color={error ? 'error' : 'text.secondary'} 
            sx={{ mt: 0.5, ml: 1 }}
          >
            {helperText}
          </Typography>
        )}
      </Box>
    </MantineProvider>
  );
};

export default RichTextEditor; 