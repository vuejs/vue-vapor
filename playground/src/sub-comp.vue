<script setup lang="ts">
import { getCurrentInstance, watchEffect } from 'vue/vapor'

const props = defineProps<{
  foo: string
  bar: string
  baz: string
}>()

const attrs = getCurrentInstance()?.attrs

watchEffect(() => {
  console.log({ ...attrs })
})

const keys = Object.keys
</script>

<template>
  <div>sub-comp</div>
  {{ props }}
  {{ attrs }}
  {{ keys(attrs) }}
</template>
