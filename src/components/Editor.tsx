import React, { useRef, useEffect, useState } from 'react'
import { Editor as MonacoEditor, OnMount } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { socket } from '../socket'

interface User {
  name: string
  color: string
}

interface EditorProps {
  value: string
  onChange: (value: string) => void
  roomId?: string | null
  userName?: string
  users?: User[]
  readOnly?: boolean
}

interface RemoteCursor {
  name: string
  color: string
  position: monaco.Position
}

const LANGUAGES = [
  { label: 'Python', value: 'python' },
  { label: 'C++', value: 'cpp' },
  { label: 'C', value: 'c' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'SQL', value: 'sql' },
  { label: 'Java', value: 'java' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'JSON', value: 'json' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'Shell', value: 'shell' },
]

const THEMES = [
  { label: 'Dark', value: 'vs-dark' },
  { label: 'Light', value: 'light' },
]

const Editor: React.FC<EditorProps> = ({ value, onChange, userName, users, readOnly }) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const remoteCursors = useRef<Record<string, RemoteCursor>>({})
  const decorations = useRef<string[]>([])
  const [language, setLanguage] = useState('python')
  const [theme, setTheme] = useState('vs-dark')
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [locked, setLocked] = useState(false)

  // Handle local cursor move and broadcast
  useEffect(() => {
    if (!editorRef.current || !userName) return
    const editor = editorRef.current
    const handler = () => {
      const pos = editor.getPosition()
      if (pos) {
        socket.emit('cursor-move', { name: userName, position: pos })
      }
    }
    editor.onDidChangeCursorPosition(handler)
    return () => {
      editor.onDidChangeCursorPosition(() => {})
    }
  }, [userName])

  // Listen for remote cursor moves
  useEffect(() => {
    socket.on('cursor-move', (data: { name: string; position: monaco.Position }) => {
      if (!editorRef.current || !users) return
      if (data.name === userName) return
      const user = users.find(u => u.name === data.name)
      if (!user) return
      remoteCursors.current[data.name] = {
        name: data.name,
        color: user.color,
        position: data.position
      }
      updateDecorations()
    })
    return () => {
      socket.off('cursor-move')
    }
  }, [users, userName])

  // Typing indicator (who's typing)
  useEffect(() => {
    socket.on('user-typing', (name: string) => {
      if (name !== userName) {
        setTypingUser(name)
        setTimeout(() => setTypingUser(null), 1500)
      }
    })
    return () => { socket.off('user-typing') }
  }, [userName])

  // Update decorations for remote cursors
  function updateDecorations() {
    if (!editorRef.current) return
    const decs: monaco.editor.IModelDeltaDecoration[] = Object.values(remoteCursors.current).map(cursor => ({
      range: new monaco.Range(cursor.position.lineNumber, cursor.position.column, cursor.position.lineNumber, cursor.position.column),
      options: {
        className: '',
        afterContentClassName: '',
        isWholeLine: false,
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        beforeContentClassName: '',
        glyphMarginClassName: '',
        overviewRuler: {
          color: cursor.color,
          position: monaco.editor.OverviewRulerLane.Full
        },
        // Show a colored border/cursor
        inlineClassName: `remote-cursor-${cursor.name.replace(/[^a-zA-Z0-9]/g, '')}`
      }
    }))
    decorations.current = editorRef.current.deltaDecorations(decorations.current, decs)
  }

  // On mount, inject CSS for remote cursors
  const handleMount: OnMount = (editor) => {
    editorRef.current = editor
    if (users) {
      users.forEach(user => {
        const className = `.remote-cursor-${user.name.replace(/[^a-zA-Z0-9]/g, '')}`
        if (!document.querySelector(`style[data-remote-cursor='${user.name}']`)) {
          const style = document.createElement('style')
          style.setAttribute('data-remote-cursor', user.name)
          style.innerHTML = `${className} { border-left: 2px solid ${user.color} !important; }`
          document.head.appendChild(style)
        }
      })
    }
  }

  // Broadcast typing event
  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '')
    if (userName) socket.emit('user-typing', userName)
  }

  // Copy room link
  const handleCopy = () => {
    if (navigator.clipboard && window.location) {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  // Lock toggle (dummy for now, real logic should be in App)
  const handleLockToggle = () => {
    setLocked((v) => !v)
  }

  return (
    <div className="h-[calc(100vh-200px)] border border-gray-700 rounded">
      {/* Top bar with all controls */}
      <div className="flex gap-2 p-2 bg-gray-900 rounded-t items-center">
        {/* Avatars and names */}
        {users && users.map((user) => (
          <span key={user.name} className="flex items-center gap-1">
            <span style={{ background: user.color, color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 13 }}>
              {user.name[0]?.toUpperCase()}
            </span>
            <span style={{ color: user.color, fontWeight: userName === user.name ? 'bold' : 'normal' }}>
              {user.name}
            </span>
          </span>
        ))}
        {/* Language and theme selectors */}
        <select className="ml-4 px-2 py-1 rounded bg-gray-800 text-white" value={language} onChange={e => setLanguage(e.target.value)}>
          {LANGUAGES.map(lang => <option key={lang.value} value={lang.value}>{lang.label}</option>)}
        </select>
        <select className="ml-2 px-2 py-1 rounded bg-gray-800 text-white" value={theme} onChange={e => setTheme(e.target.value)}>
          {THEMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        {/* Lock, Copy, Help buttons */}
        <button className={`ml-2 px-2 py-1 rounded ${locked ? 'bg-red-600' : 'bg-gray-800'} text-white`} onClick={handleLockToggle} title={locked ? 'Unlock room' : 'Lock room'}>
          {locked ? '🔒' : '🔓'}
        </button>
        <button className="ml-2 px-2 py-1 bg-gray-800 text-white rounded" onClick={handleCopy} title="Copy room link">📋</button>
        <button className="ml-2 px-2 py-1 bg-gray-800 text-white rounded" onClick={() => setShowHelp(true)} title="Show help">?</button>
      </div>
      {/* Typing indicator */}
      {typingUser && <div className="text-xs text-gray-300 px-2">{typingUser} is typing...</div>}
      {/* Help modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-gray-900 text-white p-8 rounded shadow-lg max-w-lg">
            <h2 className="text-xl font-bold mb-2">Help & Shortcuts</h2>
            <pre className="text-sm whitespace-pre-wrap">Shortcuts & Features:\n- Ctrl + [ / ]: Adjust transparency (min 5%)\n- Language & theme: Top bar dropdowns\n- Copy room link: 📋 button\n- Lock room: 🔒 button (first user only)\n- Who's typing: See indicator below user bar\n- Local auto-save: Document restores on reload\n</pre>
            <button className="mt-4 px-4 py-2 bg-blue-600 rounded" onClick={() => setShowHelp(false)}>Close</button>
          </div>
        </div>
      )}
      <MonacoEditor
        height="100%"
        language={language}
        theme={theme}
        value={value}
        onChange={handleEditorChange}
        onMount={handleMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: readOnly || false,
          automaticLayout: true,
        }}
      />
    </div>
  )
}

export default Editor 