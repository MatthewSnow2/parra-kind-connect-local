/**
 * OpenAI Realtime API WebSocket Proxy Server
 *
 * Proxies WebSocket connections from browser clients to OpenAI Realtime API.
 * Solves browser limitation: browsers cannot send custom headers in WebSocket connections.
 *
 * Architecture:
 * Client (Browser) <--WebSocket--> Proxy Server <--WebSocket with Auth Header--> OpenAI
 */

import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import dotenv from 'dotenv';
import { URL } from 'url';

dotenv.config();

const PORT = process.env.PORT || 8080;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

// Create HTTP server
const server = http.createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Handle WebSocket connections
wss.on('connection', (clientWs, request) => {
  const clientIp = request.socket.remoteAddress;
  const connectionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  console.log(`🔌 New client connection [${connectionId}] from ${clientIp}`);

  // Extract auth token from query parameters
  const url = new URL(request.url, `http://${request.headers.host}`);
  const authToken = url.searchParams.get('token');

  // Basic auth validation (Supabase JWT should be present)
  if (!authToken || authToken.length < 20) {
    console.warn(`❌ [${connectionId}] Rejected: Invalid or missing auth token`);
    clientWs.close(1008, 'Invalid authentication');
    return;
  }

  // Optional: Verify Supabase JWT here if needed
  // For MVP, we trust that the token came from authenticated client
  console.log(`✅ [${connectionId}] Auth token validated`);

  // Send immediate acknowledgment to client so they know we're working
  clientWs.send(JSON.stringify({
    type: 'proxy.connected',
    message: 'Proxy server connected, establishing OpenAI connection...',
  }));

  let openaiWs = null;

  try {
    // Connect to OpenAI Realtime API with proper Authorization header
    const openaiUrl = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview';

    console.log(`🔗 [${connectionId}] Connecting to OpenAI Realtime API...`);

    openaiWs = new WebSocket(openaiUrl, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1',
      },
    });

    // OpenAI connection opened
    openaiWs.on('open', () => {
      console.log(`✅ [${connectionId}] Connected to OpenAI Realtime API`);
      console.log(`⏳ [${connectionId}] Waiting for OpenAI session.created event before configuring...`);
    });

    // Proxy messages: OpenAI -> Client
    openaiWs.on('message', (data) => {
      // Log ALL messages for debugging
      try {
        const parsed = JSON.parse(data.toString());
        console.log(`📨 [${connectionId}] OpenAI message type: ${parsed.type}`);

        if (parsed.type === 'error') {
          console.error(`❌ [${connectionId}] OpenAI error response:`, JSON.stringify(parsed, null, 2));
        } else if (parsed.type === 'session.created') {
          console.log(`🎉 [${connectionId}] Session created, sending configuration...`);

          // Now configure the session with our settings
          // MINIMAL VERSION - testing with bare minimum config
          const sessionConfig = {
            type: "session.update",
            session: {
              modalities: ["text", "audio"],
              instructions: "You are Parra, a friendly and supportive companion for seniors. Speak warmly and naturally in short sentences. Help with daily wellness through gentle conversation about meals, medications, exercise, and social activities.",
              voice: "alloy",
              // Removed input_audio_transcription - may be causing the error
              turn_detection: {
                type: "server_vad",
              },
            },
          };

          openaiWs.send(JSON.stringify(sessionConfig));
          console.log(`📤 [${connectionId}] Sent session configuration to OpenAI`);
        }
      } catch (e) {
        // Not JSON, ignore
        console.log(`📨 [${connectionId}] Non-JSON message received`);
      }

      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(data);
      }
    });

    // Handle OpenAI errors
    openaiWs.on('error', (error) => {
      console.error(`❌ [${connectionId}] OpenAI WebSocket error:`, error.message);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: 'error',
          error: {
            message: 'OpenAI connection error',
          },
        }));
        clientWs.close(1011, 'OpenAI connection error');
      }
    });

    // Handle OpenAI close
    openaiWs.on('close', (code, reason) => {
      console.log(`🔌 [${connectionId}] OpenAI connection closed: ${code} ${reason}`);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close(code, reason.toString());
      }
    });

    // Proxy messages: Client -> OpenAI
    clientWs.on('message', (data) => {
      if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.send(data);
      }
    });

    // Handle client close
    clientWs.on('close', (code, reason) => {
      console.log(`🔌 [${connectionId}] Client disconnected: ${code} ${reason}`);
      if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.close();
      }
    });

    // Handle client errors
    clientWs.on('error', (error) => {
      console.error(`❌ [${connectionId}] Client WebSocket error:`, error.message);
      if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.close();
      }
    });

  } catch (error) {
    console.error(`❌ [${connectionId}] Failed to establish OpenAI connection:`, error);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close(1011, 'Failed to connect to OpenAI');
    }
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 OpenAI Realtime Proxy Server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 OpenAI API Key: ${OPENAI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received, closing server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT received, closing server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
