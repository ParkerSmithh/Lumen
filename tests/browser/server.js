import { createServer } from 'vite';

// Own the server in the runner process so teardown awaits Vite's real cleanup.
// Windows process-tree termination can be denied inside managed sandboxes.
export default async function setup() {
  const server = await createServer({ server: { host: '127.0.0.1', port: 5175, strictPort: true } });
  await server.listen();
  return async () => { await server.close(); };
}
