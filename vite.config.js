import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    minify: 'terser',
    lib: {
      entry: 'src/json-editor.js',
      name: 'JsonEditor',
      formats: ['es', 'umd'],
      fileName: (format) => `json-editor.${format}.js`
    },
  }
})
