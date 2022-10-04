import { defineConfig } from 'vite'

export default defineConfig({
    base: '/three-scroll-glb/',
    build: {
        chunkSizeWarningLimit: 1600,
    },
})