import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server:{
    host: true,
    allowedHosts:[
      "f52c-2401-4900-c0aa-e4fe-934-3509-eb9d-ab7a.ngrok-free.app",
    ]
  }
})
