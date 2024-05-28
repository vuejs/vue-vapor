<script setup lang="ts">
import type { Data } from '@vue/runtime-shared'
import type { ComponentPublicInstance } from '@vue/runtime-core'
import { ref, onMounted } from 'vue/vapor'

const inputRef = ref()
const buttonRef = ref()

function handleSetRef(el: Element | ComponentPublicInstance | null, refs: Data) {
  buttonRef.value = el
  console.log(el, refs)
}

onMounted(() => {
  console.log(inputRef.value, buttonRef.value)
})
</script>

<template>
  <div>
    <input type="text" ref="inputRef" />
    <button :ref="handleSetRef">Button</button>
  </div>
</template>
