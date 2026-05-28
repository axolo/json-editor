# JSON Editor Web Component

A lightweight, customizable JSON Editor Web Component with validation support.

## Features

- 🎨 **Theming**: Supports light, dark, and system themes
- ✨ **Auto Formatting**: Automatically formats JSON on input
- ✅ **Validation**: Real-time JSON validation with error highlighting
- 📝 **Line Numbers**: Shows line numbers with error highlighting
- 🎯 **Events**: Custom events for change and error handling

## Installation

```bash
npm i @axolo/json-editor
```

## Usage

### HTML

```html
<json-editor 
  value='{"name":"Jerry","age":1}'
  placeholder="Enter JSON ..."
  theme="dark"
  verbose
  onchange="console.log(event)"
  onerror="console.error(event)"
/>
```

### Vue

```js
// vite.config.js
import vue from '@vitejs/plugin-vue'

export default {
  plugins: [      
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag.startsWith('json-editor')
        }
      }
    })
  ]
}
```

```html
<script setup>
import { ref } from 'vue'
import '@axolo/json-editor'

const json = ref('{"name":"Tom","age":2}')
</script>

<template>
  <json-editor
    v-model="json"
    @change="console.log"
    @error="console.error"
  />
</template>
```

## Attributes

|   Attribute   |   Type   |      Default       |         Description          |
| ------------- | -------- | ------------------ | ---------------------------- |
| `value`       | string   | `""`               | JSON string value            |
| `theme`       | string   | `"system"`         | `light`, `dark`, or `system` |
| `placeholder` | string   | `"Enter JSON ..."` | Placeholder text             |
| `verbose`     | boolean  | `false`            | Show error messages          |
| `onchange`    | function | -                  | Event handler: change        |
| `onerror`     | function | -                  | Event handler: error         |

## Development

```bash
npm i            # Install dependencies
npm run dev      # Start development server
npm run build    # Build for development
```
