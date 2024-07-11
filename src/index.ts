import 'dotenv/config';
import express from 'express';
import globalRouter from './global-router';
import { logger } from './logger';
import http from 'http';
import cors from 'cors'

const app = express();
const PORT = process.env.PORT || 3838;

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST','PUT', 'DELETE'],
  allowedHeaders: '*', 
  exposedHeaders: '*',
  credentials: true
}));


app.use(logger);
app.use(express.json());
app.use('/api/v1/', globalRouter);

app.listen(PORT, () => {
  console.log(`Server runs at http://localhost:${PORT}`);
}
);




// const server = http.createServer(app);

// // Handle WebSocket connections with origin validation
// server.on('upgrade', (request, socket, head) => {
//   const origin = request.headers.origin;
//   console.log(`Origin: ${origin}`);
//   // Validate the origin before proceeding
//   if (origin === 'https://websockets-example.vercel.app') {
//     wss.handleUpgrade(request, socket, head, (ws) => {
//       wss.emit('connection', ws, request);
//     });
//   } else {
//     socket.destroy();
//   }
// });

// server.listen(PORT, () => {
//   console.log(`Server runs at http://localhost:${PORT}`);
// });
