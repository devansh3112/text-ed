import React from 'react'
import { Editor as MonacoEditor } from '@monaco-editor/react'

interface EditorProps {
  value: string
  onChange: (value: string) => void
  roomId?: string | null
}

const Editor: React.FC<EditorProps> = ({ value, onChange }) => {
  return (
    <div className="h-[calc(100vh-200px)] border border-gray-700 rounded">
      <MonacoEditor
        height="100%"
        defaultLanguage="typescript"
        theme="vs-dark"
        value={value}
        onChange={(value) => onChange(value || '')}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: false,
          automaticLayout: true,
        }}
      />
    </div>
  )
}

export default Editor 