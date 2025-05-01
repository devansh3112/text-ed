import { useState } from 'react';

function randomRoomCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function RoomDialog({ onJoin }: { onJoin: (room: string) => void }) {
  const [room, setRoom] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = () => {
    const code = randomRoomCode();
    setRoom(code);
    setError('');
    onJoin(code); // Immediately join the generated room
  };

  const handleJoin = () => {
    if (!room.trim()) {
      setError('Please enter a room code.');
      return;
    }
    onJoin(room.trim().toUpperCase());
  };

  return (
    <div className="flex flex-col items-center gap-4 p-8 bg-white rounded shadow-lg">
      <h2 className="text-xl font-bold">Collaborative Room</h2>
      <div className="flex gap-2">
        <input
          className="border px-2 py-1 rounded"
          placeholder="Enter room code"
          value={room}
          onChange={e => setRoom(e.target.value.toUpperCase())}
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