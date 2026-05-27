import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: './lib/json-editor.js',
      name: 'JsonEditor',
      formats: ['es', 'umd'],
      fileName: (format) => `json-editor.${format}.js`
    }
  }
})
