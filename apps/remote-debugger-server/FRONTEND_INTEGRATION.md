# Frontend Integration Guide

## Overview

This guide shows how to integrate rrweb session recording with the backend server that accepts packed events.

## Installation

```bash
npm install rrweb rrweb-snapshot
```

## Frontend Implementation

### TypeScript Example

```typescript
import { record, pack, eventWithTime } from 'rrweb';

// Configuration
const SESSION_ID = generateSessionId(); // Your session ID generation logic
const UPLOAD_INTERVAL = 120000; // 2 minutes
const API_ENDPOINT = 'http://localhost:3000/rrweb/events';

let events: eventWithTime[] = [];

// Start recording
record({
  emit(event) {
    events.push(event);
  },
  sampling: {
    mousemove: 50,   // Sample mousemove every 50ms
    scroll: 150,     // Sample scroll every 150ms
    input: 'last',   // Only record last input value
  },
  slimDOMOptions: {
    script: true,    // Remove script tags
    comment: true,   // Remove comments
    headFavicon: true, // Remove favicon
  },
});

// Upload events every 2 minutes
setInterval(async () => {
  if (events.length === 0) return;

  try {
    // 1. Pack events (rrweb optimization)
    const packed = pack(events);

    // 2. Send to server
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': SESSION_ID,
      },
      body: JSON.stringify({ packed }),
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ Uploaded ${result.saved} events for session ${result.sessionId}`);

    // Clear uploaded events
    events = [];
  } catch (error) {
    console.error('❌ Failed to upload session replay:', error);
    // Optional: Implement retry logic here
  }
}, UPLOAD_INTERVAL);

// Helper: Generate unique session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

### JavaScript Example

```javascript
import { record, pack } from 'rrweb';

const SESSION_ID = `session_${Date.now()}`;
let events = [];

record({
  emit(event) {
    events.push(event);
  },
});

setInterval(async () => {
  if (events.length === 0) return;

  const packed = pack(events);

  await fetch('http://localhost:3000/rrweb/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Id': SESSION_ID,
    },
    body: JSON.stringify({ packed }),
  });

  events = [];
}, 120000);
```

## React Hook Example

```typescript
import { useEffect, useRef } from 'react';
import { record, pack, eventWithTime } from 'rrweb';

export function useSessionRecording(sessionId: string, uploadInterval = 120000) {
  const eventsRef = useRef<eventWithTime[]>([]);
  const stopRecordingRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Start recording
    stopRecordingRef.current = record({
      emit(event) {
        eventsRef.current.push(event);
      },
      sampling: {
        mousemove: 50,
        scroll: 150,
        input: 'last',
      },
      slimDOMOptions: {
        script: true,
        comment: true,
        headFavicon: true,
      },
    });

    // Upload interval
    const intervalId = setInterval(async () => {
      const events = eventsRef.current;
      if (events.length === 0) return;

      try {
        const packed = pack(events);

        const response = await fetch('/rrweb/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Id': sessionId,
          },
          body: JSON.stringify({ packed }),
        });

        if (response.ok) {
          eventsRef.current = []; // Clear after successful upload
        }
      } catch (error) {
        console.error('Failed to upload session replay:', error);
      }
    }, uploadInterval);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      if (stopRecordingRef.current) {
        stopRecordingRef.current();
      }
    };
  }, [sessionId, uploadInterval]);
}

// Usage:
function App() {
  const sessionId = useMemo(() => `session_${Date.now()}`, []);
  useSessionRecording(sessionId);

  return <div>Your app content</div>;
}
```

## Advanced: Upload on Page Unload

```typescript
// Upload remaining events when user leaves the page
window.addEventListener('beforeunload', () => {
  if (events.length === 0) return;

  const packed = pack(events);

  // Use sendBeacon for reliable delivery
  const blob = new Blob([JSON.stringify({ packed })], { type: 'application/json' });

  // Note: sendBeacon doesn't support custom headers, so we append sessionId to URL
  navigator.sendBeacon(
    `http://localhost:3000/rrweb/events?sessionId=${SESSION_ID}`,
    blob
  );
});
```

## Error Handling & Retry Logic

```typescript
async function uploadEvents(
  events: eventWithTime[],
  sessionId: string,
  maxRetries = 3,
): Promise<void> {
  const packed = pack(events);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('http://localhost:3000/rrweb/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': sessionId,
        },
        body: JSON.stringify({ packed }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Uploaded ${result.saved} events`);
      return; // Success!
    } catch (error) {
      console.error(`❌ Upload attempt ${attempt}/${maxRetries} failed:`, error);

      if (attempt === maxRetries) {
        // All retries failed - store locally or log to monitoring
        console.error('All upload attempts failed');
        // Optional: Store in localStorage for later retry
        storeFailedUpload(packed, sessionId);
      } else {
        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1000));
      }
    }
  }
}

function storeFailedUpload(packed: string, sessionId: string): void {
  try {
    const key = `rrweb_failed_${sessionId}_${Date.now()}`;
    localStorage.setItem(key, packed);
  } catch (error) {
    console.error('Failed to store in localStorage:', error);
  }
}
```

## Monitoring & Analytics

```typescript
// Track upload statistics
let uploadStats = {
  totalEvents: 0,
  totalUploads: 0,
  failedUploads: 0,
  originalBytes: 0,
  packedBytes: 0,
};

async function uploadWithStats(events: eventWithTime[], sessionId: string) {
  const packed = pack(events);
  const originalSize = new Blob([JSON.stringify(events)]).size;
  const packedSize = new Blob([JSON.stringify({ packed })]).size;

  // Update stats
  uploadStats.totalEvents += events.length;
  uploadStats.originalBytes += originalSize;
  uploadStats.packedBytes += packedSize;

  try {
    const response = await fetch('http://localhost:3000/rrweb/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': sessionId,
      },
      body: JSON.stringify({ packed }),
    });

    if (response.ok) {
      uploadStats.totalUploads++;
      const compressionRatio = (
        (1 - uploadStats.packedBytes / uploadStats.originalBytes) *
        100
      ).toFixed(2);
      console.log(`📊 Pack efficiency: ${compressionRatio}% size reduction`);
    } else {
      uploadStats.failedUploads++;
    }
  } catch (error) {
    uploadStats.failedUploads++;
  }
}
```

## Configuration Best Practices

### Sampling Rates

```typescript
// High-traffic sites (optimize for bandwidth)
{
  mousemove: 100,  // Sample every 100ms
  scroll: 200,     // Sample every 200ms
  input: 'last',   // Only last value
}

// Critical UX tracking (more detailed)
{
  mousemove: 20,   // Sample every 20ms (smoother playback)
  scroll: 50,      // Sample every 50ms
  input: 'all',    // Capture all input changes
}
```

### Upload Intervals

```typescript
// Frequent uploads (lower data loss risk)
const UPLOAD_INTERVAL = 30000; // 30 seconds

// Balanced
const UPLOAD_INTERVAL = 120000; // 2 minutes

// Less frequent (reduce server load)
const UPLOAD_INTERVAL = 300000; // 5 minutes
```

## Testing the Integration

### 1. Start the backend server

```bash
npm run start:dev
```

### 2. Create a test HTML file

```html
<!DOCTYPE html>
<html>
<head>
  <title>rrweb Test</title>
  <script type="module">
    import { record, pack } from 'https://cdn.jsdelivr.net/npm/rrweb@latest';
    import pako from 'https://cdn.jsdelivr.net/npm/pako@latest';

    const SESSION_ID = 'test-session-' + Date.now();
    let events = [];

    record({
      emit(event) {
        events.push(event);
        document.getElementById('count').textContent = events.length;
      }
    });

    window.uploadNow = async () => {
      if (events.length === 0) {
        alert('No events to upload');
        return;
      }

      const packed = pack(events);
      const compressed = pako.gzip(JSON.stringify(packed));

      const response = await fetch('http://localhost:3000/rrweb/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Encoding': 'gzip',
          'X-Session-Id': SESSION_ID,
        },
        body: compressed,
      });

      const result = await response.json();
      alert(`✅ Uploaded ${result.saved} events!`);
      events = [];
      document.getElementById('count').textContent = 0;
    };
  </script>
</head>
<body>
  <h1>rrweb Recording Test</h1>
  <p>Events recorded: <span id="count">0</span></p>
  <button onclick="uploadNow()">Upload Now</button>
</body>
</html>
```

## Troubleshooting

### CORS Issues

If you see CORS errors, add CORS configuration to main.ts:

```typescript
// main.ts
app.enableCors({
  origin: 'http://localhost:3001', // Your frontend URL
  credentials: true,
});
```

### Large Payload Issues

If uploads fail with large payloads, increase the limit:

```typescript
// main.ts
app.use('/rrweb/events', raw({
  type: 'application/octet-stream',
  limit: '100mb'  // Increase as needed
}));
```

### Check Server Logs

```bash
npm run start:dev
```

Look for error messages when uploading.

## API Response

Successful response:

```json
{
  "saved": 247,
  "sessionId": "session_1640000000000_abc123"
}
```

Error response (400):

```json
{
  "statusCode": 400,
  "message": "X-Session-Id header is required",
  "error": "Bad Request"
}
```
