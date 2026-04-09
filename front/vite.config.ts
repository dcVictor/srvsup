import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  
  // --- ADICIONE ESTA PARTE ---
  preview: {
    allowedHosts: ['srvapl01'] // Libera o host para o modo de preview
  },
  server: {
    allowedHosts: ['srvapl01'] // Libera o host para o modo de desenvolvimento (npm run dev)
  }
  // ---------------------------
  
})