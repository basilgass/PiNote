import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {fileURLToPath} from 'url'


export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: {
			'@core': fileURLToPath(new URL('./src/core', import.meta.url)),
			'@pi-vue': fileURLToPath(new URL('./src/vue', import.meta.url))
		}
	},
	build: {
		lib: {
			entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
			name: 'PiNote',
			fileName: 'pi-note'
		},
		rollupOptions: {
			external: ['vue', 'pdfjs-dist'],
			output: {
				globals: {
					vue: 'Vue',
					'pdfjs-dist': 'pdfjsLib'
				}
			}
		}
	}
})