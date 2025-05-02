import { useState } from 'react';

function randomRoomCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function RoomDialog({ onJoin }: { onJoin: (room: string, name: string) => void }) {
  const [room, setRoom] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = () => {
    const code = randomRoomCode();
    setRoom(code);
    setError('');
    if (name.trim()) onJoin(code, name.trim());
    else setError('Please enter your name.');
  };

  const handleJoin = () => {
    if (!room.trim()) {
      setError('Please enter a room code.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    onJoin(room.trim().toUpperCase(), name.trim());
  };

  return (
    <div className="flex flex-col items-center gap-4 p-8 bg-gray-900 rounded shadow-lg border border-gray-700">
      <h2 className="text-xl font-bold text-white">Collaborative Room</h2>
      <div className="flex gap-2">
        <input
          className="border px-2 py-1 rounded bg-gray-800 text-white placeholder-gray-400"
          placeholder="Enter room code"
          value={room}
          onChange={e => setRoom(e.target.value.toUpperCase())}
        />
        <input
          className="border px-2 py-1 rounded bg-gray-800 text-white placeholder-gray-400"
          placeholder="Enter your name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={handleJoin}>
          Join
        </button>
        <button className="bg-green-500 text-white px-3 py-1 rounded" onClick={handleGenerate}>
          Generate & Join
        </button>
      </div>
      {error && <div className="text-red-500">{error}</div>}
    </div>
  );
} 