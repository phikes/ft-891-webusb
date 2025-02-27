import { defineConfig } from 'vite'
import path from "path"
import react from "@vitejs/plugin-react-swc"
import mkcert from "vite-plugin-mkcert"

// https://vite.dev/config/
export default defineConfig({
  plugins: [mkcert(), react()],
  resolve: {
    alias: {
      '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
    }
  },
})
