// Local browser tests only. Never permit a request to a hosted database/provider.
const originalFetch = globalThis.fetch;
globalThis.fetch = function(input, init) {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error('Local campaign test blocked a non-loopback request');
  }
  return originalFetch(input, init);
};
