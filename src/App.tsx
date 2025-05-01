import { useEffect, useState } from 'react';
import Editor from './components/Editor';
import RoomDialog from './components/RoomDialog';
import React from 'react';
import { socket, joinRoom, emitTextChange, onTextChange, cleanup } from './socket';

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

  useEffect(() => {
    if (room) {
      joinRoom(room);
      onTextChange((data) => {
        setContent(data.content);
      });
    }
    return () => {
      cleanup();
    };
  }, [room]);

  const handleContentChange = (newValue: string) => {
    if (room && newValue !== content) {
      setContent(newValue);
      emitTextChange({ roomId: room, content: newValue });
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