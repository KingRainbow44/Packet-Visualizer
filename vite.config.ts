import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import viteCompression from 'vite-plugin-compression';
import { viteSingleFile } from 'vite-plugin-singlefile';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(), viteCompression(), viteSingleFile()]
})
