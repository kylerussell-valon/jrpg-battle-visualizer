import { EventEmitter } from 'events';

// Global event emitter for SSE connections
// This is a singleton that persists across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var battleEventEmitter: EventEmitter | undefined;
}

export function getEventEmitter(): EventEmitter {
  if (!global.battleEventEmitter) {
    global.battleEventEmitter = new EventEmitter();
    // Increase max listeners for multiple SSE connections
    global.battleEventEmitter.setMaxListeners(100);
  }
  return global.battleEventEmitter;
}
