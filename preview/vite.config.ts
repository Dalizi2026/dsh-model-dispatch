/** Interactive ModelPicker preview: real component, fake catalog, isolated origin storage. */
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: {
    alias: { '@deepseek-ai/dsh-client-ui-primitives': fileURLToPath(new URL('./ui-primitives.tsx', import.meta.url)) },
  },
  esbuild: { jsx: 'automatic' },
  server: { host: '127.0.0.1', port: 5179, strictPort: true },
})
