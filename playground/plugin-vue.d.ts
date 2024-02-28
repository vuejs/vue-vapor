import '@vitejs/plugin-vue'

// TODO: add type to @vitejs/plugin-vue
declare module '@vitejs/plugin-vue' {
  export interface Options {
    vapor?: boolean
  }
}
