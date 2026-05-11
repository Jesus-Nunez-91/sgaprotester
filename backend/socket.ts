import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (requestOrigin: any, callback: any) => {
        callback(null, requestOrigin); // Reflejar el origen para permitir credenciales
      },
      credentials: true
    }
  });

  // TICs Requirement: Socket.IO Authentication Middleware
  io.use((socket, next) => {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) return next(new Error('Internal server error: JWT configuration missing'));
    const cookies = socket.handshake.headers.cookie;
    let token = '';

    if (cookies) {
      const parsedCookies = cookie.parse(cookies);
      token = parsedCookies.token;
    }

    if (!token && socket.handshake.auth) {
      token = socket.handshake.auth.token;
    }

    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      (socket as any).user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
