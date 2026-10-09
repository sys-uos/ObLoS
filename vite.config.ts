import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  server: {
    open: true
  },
  plugins: [
    react(),
    svgr(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/leaflet/dist/images/*',
          dest: ''
        }
      ]
    })
  ]
})
