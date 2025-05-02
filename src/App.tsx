import React, { useEffect, useState } from 'react';
import Editor from './components/Editor';
import RoomDialog from './components/RoomDialog';
import { User } from './types';
import { useStore } from './store';
import { HelpCircle, Lock, Copy, Users } from 'lucide-react';
import { socket } from './socket';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error) {
    console.error('Error caught by boundary:', error);
  }
  render() {
    if (this.state.hasError && this.state.error) {
      return <div className="text-red-500 p-8 bg-black min-h-screen">Error: {this.state.error.message}</div>;
    }
    return this.props.children;
  }
}

export default function App() {
  const [roomId, setRoomId] = useState<string>('');
  const [showRoomDialog, setShowRoomDialog] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const { users, addUser, removeUser, setUsers } = useStore();

  useEffect(() => {
    // Listen for user events
    const handleUserJoined = (user: User) => addUser(user);
    const handleUserLeft = (userId: string) => removeUser(userId);
    const handleRoomUsers = (roomUsers: User[]) => setUsers(roomUsers);

    socket.on('userJoined', handleUserJoined);
    socket.on('userLeft', handleUserLeft);
    socket.on('roomUsers', handleRoomUsers);

    return () => {
      socket.off('userJoined', handleUserJoined);
      socket.off('userLeft', handleUserLeft);
      socket.off('roomUsers', handleRoomUsers);
    };
  }, [addUser, removeUser, setUsers]);

  const handleJoinRoom = (room: string, name: string) => {
    socket.emit('join-room', { room, name });
    setRoomId(room);
    setShowRoomDialog(false);
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(link);
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-gray-900/95 backdrop-blur-sm">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800/90 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            {/* Users List */}
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-400" />
              <div className="flex -space-x-2">
                {users.map((user: User) => (
                  <div
                    key={user.id}
                    className="w-8 h-8 rounded-full border-2 border-gray-800"
                    style={{ backgroundColor: user.color }}
                    title={user.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Room Controls */}
            <button
              onClick={() => setIsLocked(!isLocked)}
              className={`p-2 rounded hover:bg-gray-700 ${isLocked ? 'text-red-400' : 'text-gray-400'}`}
              title={isLocked ? 'Unlock Room' : 'Lock Room'}
            >
              <Lock className="w-5 h-5" />
            </button>

            <button
              onClick={copyRoomLink}
              className="p-2 rounded hover:bg-gray-700 text-gray-400"
              title="Copy Room Link"
            >
              <Copy className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 rounded hover:bg-gray-700 text-gray-400"
              title="Help"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 overflow-hidden">
          <Editor socket={socket} roomId={roomId} isLocked={isLocked} />
        </div>

        {/* Room Dialog */}
        {showRoomDialog && <RoomDialog onJoin={handleJoinRoom} />}

        {/* Help Modal */}
        {showHelp && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
              <h2 className="text-2xl font-bold mb-4 text-white">Help & Shortcuts</h2>
              <div className="space-y-4 text-gray-300">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Room Features</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Join a room by entering a room ID</li>
                    <li>Copy room link to invite others</li>
                    <li>Lock room to prevent new users from joining</li>
                    <li>See who's in the room with avatars</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Editor Features</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Real-time collaborative editing</li>
                    <li>Language selection</li>
                    <li>Theme switching</li>
                    <li>Window transparency control</li>
                    <li>Auto-save</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Window Controls</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Drag window from any empty space</li>
                    <li>Resize from edges and corners</li>
                    <li>Adjust transparency from 5% to 100%</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
} 