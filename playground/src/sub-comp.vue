<script setup lang="ts">
const props = defineProps<{
  foo: string
}>()
</script>

<template>
  <div>sub-comp</div>
  {{ props }}
</template>
