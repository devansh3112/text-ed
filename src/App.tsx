import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import Editor from './components/Editor';
import RoomDialog from './components/RoomDialog';
import React from 'react';

const WEBSOCKET_ENDPOINT = 'wss://demos.yjs.dev'; // Replace with your deployed y-websocket server for production

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error) {}
  render() {
    if (this.state.hasError && this.state.error) {
      return <div className="text-red-500 p-8 bg-black min-h-screen">Error: {this.state.error.message}</div>;
    }
    return this.props.children;
  }
}

export default function App() {
  const [room, setRoom] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const ydocRef = useRef<Y.Doc | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  useEffect(() => {
    if (room) {
      const ydoc = new Y.Doc();
      ydocRef.current = ydoc;
      const provider = new WebsocketProvider(WEBSOCKET_ENDPOINT, room, ydoc);
      providerRef.current = provider;
      const ytext = ydoc.getText('monaco');
      ytextRef.current = ytext;
      const updateContent = () => setContent(ytext.toString());
      ytext.observe(updateContent);
      setContent(ytext.toString());
      return () => {
        ytext.unobserve(updateContent);
        provider.destroy();
        ydoc.destroy();
      };
    }
  }, [room]);

  const handleContentChange = (newValue: string) => {
    if (ytextRef.current) {
      if (ytextRef.current.toString() !== newValue) {
        ytextRef.current.delete(0, ytextRef.current.length);
        ytextRef.current.insert(0, newValue);
      }
    }
  };

  if (!room) {
    return <div className="flex items-center justify-center min-h-screen bg-black bg-opacity-80 backdrop-blur"><RoomDialog onJoin={setRoom} /></div>;
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col items-center justify-center min-h-screen bg-black bg-opacity-80 backdrop-blur">
        <h1 className="text-2xl font-bold mb-4 text-white">Room: {room}</h1>
        <div className="w-[900px]">
          <Editor value={content} onChange={handleContentChange} roomId={room} />
        </div>
      </div>
    </ErrorBoundary>
  );
} 