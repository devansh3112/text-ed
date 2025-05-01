# Collaborative Text Editor

A real-time collaborative text editor built with React, Socket.IO, and Monaco Editor. This application allows multiple users to edit the same document simultaneously, with changes being synchronized in real-time across all connected clients.

## Features

- **Real-time Collaboration**: Multiple users can edit the same document simultaneously
- **Room-based System**: Create and join different editing rooms
- **Rich Text Editing**: Powered by Monaco Editor (the same editor that powers VS Code)
- **Screen Share Protection**: Built-in protection against unwanted screen sharing
- **Cross-Platform**: Available as both a web application and desktop app (Electron)
- **Modern UI**: Clean, responsive interface with dark mode support

## Technical Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **Real-time Communication**: Socket.IO
- **Text Editor**: Monaco Editor
- **Desktop App**: Electron
- **State Management**: Zustand
- **Backend**: Node.js with Socket.IO server
- **Deployment**: Render.com (free tier)

## Getting Started

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. For desktop app development:
   ```bash
   npm run electron:dev
   ```

## Usage

1. Open the application in your browser or launch the desktop app
2. Create a new room or join an existing one using the room ID
3. Start editing! Changes will be synchronized with all other users in the same room

## Deployment

The application is designed to be easily deployed to Render.com:
- Socket.IO server runs on the free tier
- Automatic HTTPS support
- Continuous deployment from GitHub
- Easy scaling options

## Security Features

- Room-based access control
- Screen share protection
- Secure WebSocket connections
- Input sanitization

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 