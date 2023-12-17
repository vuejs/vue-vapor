<script setup lang="ts">
import { ref, watchEffect, watchPostEffect, watchSyncEffect } from 'vue/vapor'

const i = ref(0)
const add = () => i.value++

watchEffect(() => {
  console.log('pre i:', i.value)
})

watchPostEffect(() => {
  console.log('post i:', i.value)
})

watchSyncEffect(() => {
  console.log('sync i:', i.value)
})

const log = (arg: any) => (console.log('render i:', i.value), arg)
</script>

<template>
  <div>
    {{ log(i) }}
    <button @click="add">
      Add
    </button>
  </div>
</template>

<style>
.red {
  color: red;
}

html {
  color-scheme: dark;
  background-color: #000;
  padding: 10px;
}
</style>
