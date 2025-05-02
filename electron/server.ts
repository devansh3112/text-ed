import { Server } from 'socket.io'
import { createServer } from 'http'
import express from 'express'
import { EventEmitter } from 'events'

export class IntegratedServer extends EventEmitter {
  private io: Server | null = null
  private port: number = 3000
  private app = express()
  private httpServer = createServer(this.app)
  // In-memory room tracking: { [room: string]: Set<string> }
  private rooms: Record<string, Set<string>> = {}
  // Map socket.id to { room, name }
  private userInfo: Record<string, { room: string, name: string }> = {}

  constructor(port: number = 3000) {
    super()
    this.port = port
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.io = new Server(this.httpServer, {
          cors: {
            origin: '*',
            methods: ['GET', 'POST']
          }
        })

        this.io.on('connection', (socket) => {
          console.log('Client connected:', socket.id)

          // Join room with name
          socket.on('join-room', ({ room, name }) => {
            if (!room || !name) return
            socket.join(room)
            if (!this.rooms[room]) this.rooms[room] = new Set()
            this.rooms[room].add(name)
            this.userInfo[socket.id] = { room, name }
            // Broadcast updated user list
            this.io!.to(room).emit('user-list', Array.from(this.rooms[room]))
            console.log(`${name} joined room ${room}`)
          })

          // Leave room
          socket.on('leave-room', () => {
            const info = this.userInfo[socket.id]
            if (info) {
              const { room, name } = info
              socket.leave(room)
              if (this.rooms[room]) {
                this.rooms[room].delete(name)
                if (this.rooms[room].size === 0) delete this.rooms[room]
                else this.io!.to(room).emit('user-list', Array.from(this.rooms[room]))
              }
              delete this.userInfo[socket.id]
              console.log(`${name} left room ${room}`)
            }
          })

          // Document changes (per room)
          socket.on('document-change', (data) => {
            const info = this.userInfo[socket.id]
            if (info) {
              this.io!.to(info.room).emit('document-change', data)
            }
          })

          // Cursor move (per room)
          socket.on('cursor-move', (data) => {
            const info = this.userInfo[socket.id]
            if (info) {
              this.io!.to(info.room).emit('cursor-move', data)
            }
          })

          // Handle disconnect
          socket.on('disconnect', () => {
            const info = this.userInfo[socket.id]
            if (info) {
              const { room, name } = info
              if (this.rooms[room]) {
                this.rooms[room].delete(name)
                if (this.rooms[room].size === 0) delete this.rooms[room]
                else this.io!.to(room).emit('user-list', Array.from(this.rooms[room]))
              }
              delete this.userInfo[socket.id]
              console.log(`${name} disconnected from room ${room}`)
            } else {
              console.log('Client disconnected:', socket.id)
            }
          })
        })

        this.httpServer.listen(this.port, () => {
          console.log(`Server running on port ${this.port}`)
          resolve()
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  stop(): void {
    if (this.io) {
      this.io.close()
      this.httpServer.close()
    }
  }

  getPort(): number {
    return this.port
  }
} 