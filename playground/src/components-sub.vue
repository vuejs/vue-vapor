<script setup lang="ts">
import {
  getCurrentInstance,
  inject,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  onUnmounted,
  onUpdated,
  watchEffect,
} from 'vue/vapor'

import { ContInjectionKey } from './components.vue'

const props = defineProps<{
  foo: string
  bar: string
  baz: string
}>()

const emit = defineEmits<{
  event: [message: string]
}>()

const attrs = getCurrentInstance()?.attrs
watchEffect(() => {
  console.log({ ...attrs })
})

const countModel = defineModel<number>()

const countInjected = inject(ContInjectionKey)!

const keys = Object.keys

onBeforeMount(() => console.log('sub: before mount'))
onMounted(() => console.log('sub: mounted'))
onBeforeUnmount(() => console.log('sub: before unmount'))
onUnmounted(() => console.log('sub: unmounted'))
onUpdated(() => console.log('sub: updated'))
</script>

<template>
  <div class="component-sub">
    <h2>sub-comp</h2>
    <span>props: {{ props }}</span>
    <span>attrs: {{ attrs }}</span>
    <span>attrs-keys: {{ attrs && keys(attrs) }}</span>
    <button type="button" @click="emit('event', 'hello!')">emit event</button>
    <button type="button" @click="countModel !== undefined && countModel++">
      countModel = {{ countModel }} + 1 (sub)
    </button>
    <button type="button" @click="countInjected++">
      countInjected = {{ countInjected }} + 1 (sub)
    </button>
  </div>
</template>
