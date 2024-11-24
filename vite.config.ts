import { defineConfig } from 'vite'
import UnoCSS from '@unocss/vite'

export default defineConfig({
  plugins: [
    UnoCSS(),
  ],
  build: {
    target: ['esnext'],
  },
  esbuild: {
    target: 'esnext',
  },
})
