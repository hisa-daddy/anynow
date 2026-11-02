// Fetch wrapper and a server-sent-events reader that can send headers.

export class ApiError extends Error {
  constructor(code, status, data = {}) {
    super(code);
    this.code = code;
    this.status = status;
    this.data = data; // extra fields the server sent with the error
  }
}

// `file` sends a File as the raw request body (used for video uploads).
export async function api(path, { method = 'GET', body, file, headers = {} } = {}) {
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(file ? { 'Content-Type': file.type || 'application/octet-stream' } : {}),
        ...headers,
      },
      body: file || (body ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError('NETWORK', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || 'UNKNOWN', res.status, data);
  return data;
}

// EventSource can't send headers, so read the stream with fetch. Reconnects on its own;
// onOpen runs on every (re)connect so callers can refetch anything they missed.
export function openStream(path, { headers = {}, onOpen, onEvent, onStatus, onFatal } = {}) {
  let stopped = false;
  let controller;

  async function run() {
    while (!stopped) {
      try {
        controller = new AbortController();
        const res = await fetch(path, { headers, signal: controller.signal, cache: 'no-store' });
        if (res.status === 401 || res.status === 404) {
          onFatal?.(res.status);
          return;
        }
        if (!res.ok || !res.body) throw new Error(`stream ${res.status}`);
        onStatus?.(true);
        onOpen?.();
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = '';
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += value;
          let end;
          while ((end = buffer.indexOf('\n\n')) >= 0) {
            const chunk = buffer.slice(0, end);
            buffer = buffer.slice(end + 2);
            let event = 'message';
            let data = '';
            for (const line of chunk.split('\n')) {
              if (line.startsWith('event: ')) event = line.slice(7);
              else if (line.startsWith('data: ')) data += line.slice(6);
            }
            if (data) {
              try { onEvent?.(event, JSON.parse(data)); } catch (err) { console.error(err); }
            }
          }
        }
      } catch (err) {
        if (stopped) return;
      }
      onStatus?.(false);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  run();
  return () => {
    stopped = true;
    controller?.abort();
  };
}

// Same rule as the server (src/phone.js): Japanese numbers become +81..., others need a leading +.
export function toE164(input) {
  const raw = String(input ?? '').trim();
  const digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+')) return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  if (digits.startsWith('0') && (digits.length === 10 || digits.length === 11)) return `+81${digits.slice(1)}`;
  return null;
}

export const mapsPlaceUrl = (name, address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}`;

export const mapsDirectionsUrl = (r) =>
  `https://www.google.com/maps/dir/?api=1&destination=${r.location.lat},${r.location.lng}&travelmode=walking`;
