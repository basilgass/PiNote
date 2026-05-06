import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {fileURLToPath} from 'url'
import path from 'path'


export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: [
			{ find: '@core',   replacement: fileURLToPath(new URL('./src/core', import.meta.url)) },
			{ find: '@pi-vue', replacement: fileURLToPath(new URL('./src/vue',  import.meta.url)) },
			// Résolution des subpath imports (#) de @mathjax/src non gérés par Vite depuis node_modules
			{ find: /^#default-font\/(.*)/, replacement: path.resolve('./node_modules/@mathjax/mathjax-newcm-font/mjs/$1') },
			{ find: /^#js\/(.*)/,           replacement: path.resolve('./node_modules/@mathjax/src/mjs/$1') },
			{ find: /^#source\/(.*)/,       replacement: path.resolve('./node_modules/@mathjax/src/components/mjs/$1') },
		]
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