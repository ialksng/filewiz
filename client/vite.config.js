import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

const onnxWebgpuExternalWasm = fileURLToPath(
  new URL('./node_modules/onnxruntime-web/dist/ort.webgpu.min.mjs', import.meta.url),
)

export default defineConfig({
  base: '/work/projects/filewiz/app/',
  resolve: {
    // Keep the 25+ MiB ONNX WASM binary out of deployment assets without changing
    // package export resolution for every other dependency in the app.
    alias: [{ find: 'onnxruntime-web/webgpu', replacement: onnxWebgpuExternalWasm }],
  },
  plugins: [
    react(),
    tailwindcss(),
  ]
})
