/**
 * Test script to verify OpenAI API key has Realtime API access
 *
 * Usage:
 *   node test-api-key.js
 *
 * Make sure OPENAI_API_KEY is set in your .env file
 */

import dotenv from 'dotenv';
import WebSocket from 'ws';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in environment');
  console.error('💡 Create a .env file with: OPENAI_API_KEY=sk-proj-...');
  process.exit(1);
}

console.log('🔑 Testing API key:', OPENAI_API_KEY.substring(0, 20) + '...');
console.log('🔗 Connecting to OpenAI Realtime API...\n');

// Try to connect to Realtime API
const wsUrl = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';
const ws = new WebSocket(wsUrl, {
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'OpenAI-Beta': 'realtime=v1',
  },
});

let receivedSessionCreated = false;
let receivedError = false;

ws.on('open', () => {
  console.log('✅ WebSocket connection established');
  console.log('⏳ Waiting for session.created event...\n');
});

ws.on('message', (data) => {
  try {
    const parsed = JSON.parse(data.toString());

    console.log(`📨 Received: ${parsed.type}`);

    if (parsed.type === 'session.created') {
      receivedSessionCreated = true;
      console.log('✅ SUCCESS: API key has Realtime API access!');
      console.log('📋 Session details:');
      console.log(JSON.stringify(parsed.session, null, 2));

      // Close gracefully
      setTimeout(() => {
        ws.close();
        process.exit(0);
      }, 1000);
    } else if (parsed.type === 'error') {
      receivedError = true;
      console.error('\n❌ ERROR received from OpenAI:');
      console.error(JSON.stringify(parsed.error, null, 2));

      if (parsed.error.type === 'invalid_request_error') {
        console.error('\n💡 This likely means:');
        console.error('   - Your API key does not have Realtime API access');
        console.error('   - Request access at: https://platform.openai.com/');
      } else if (parsed.error.type === 'server_error') {
        console.error('\n💡 Server error - possible causes:');
        console.error('   - OpenAI service issue');
        console.error('   - Account billing issue');
        console.error('   - Model name incorrect');
      }

      ws.close();
      process.exit(1);
    }
  } catch (e) {
    console.error('⚠️  Non-JSON message received:', data.toString());
  }
});

ws.on('error', (error) => {
  console.error('\n❌ WebSocket error:', error.message);
  console.error('\n💡 Possible causes:');
  console.error('   - Invalid API key');
  console.error('   - Network connectivity issue');
  console.error('   - OpenAI API endpoint down');
  process.exit(1);
});

ws.on('close', (code, reason) => {
  if (!receivedSessionCreated && !receivedError) {
    console.error(`\n❌ Connection closed before receiving response`);
    console.error(`   Code: ${code}, Reason: ${reason}`);
    process.exit(1);
  }
});

// Timeout after 10 seconds
setTimeout(() => {
  if (!receivedSessionCreated && !receivedError) {
    console.error('\n❌ Timeout: No response from OpenAI after 10 seconds');
    ws.close();
    process.exit(1);
  }
}, 10000);
