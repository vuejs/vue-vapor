<script lang="ts">
import type { InjectionKey, Ref } from 'vue/vapor'
export const ContInjectionKey: InjectionKey<Ref<number>> =
  Symbol('ContInjectionKey')
</script>

<script setup lang="ts">
import {
  onBeforeMount,
  onMounted,
  onBeforeUnmount,
  onUnmounted,
  onUpdated,
  ref,
  provide,
} from 'vue/vapor'
import CompSub from './components-sub.vue'

const bar = ref('update')
const id = ref('id')
const p = ref<any>({ bar, id: 'not id', test: 100 })
const countModel = ref(0)
const countProvided = ref(0)
provide(ContInjectionKey, countProvided)

function update() {
  bar.value = 'updated'
  p.value.foo = 'updated foo'
  p.value.newAttr = 'new attr'
  id.value = 'updated id'
}

function update2() {
  delete p.value.test
}

function handleEvent(message: string) {
  console.log(message)
}

onBeforeMount(() => console.log('root: before mount'))
onMounted(() => console.log('root: mounted'))
onBeforeUnmount(() => console.log('root: before unmount'))
onUnmounted(() => console.log('root: unmounted'))
onUpdated(() => console.log('root: updated'))
</script>

<template>
  <div class="component-root">
    <h1>root comp</h1>
    <button type="button" @click="update">update</button>
    <button type="button" @click="update2">update2</button>
    <button type="button" @click="countProvided++">
      countProvided = {{ countProvided }} + 1 (root)
    </button>
    <button type="button" @click="countModel++">
      countModel = {{ countModel }} + 1 (countModel)
    </button>

    <!-- TODO: slots -->
    <CompSub
      v-model="countModel"
      v-bind="p"
      :baz="'baz'"
      :id
      foo="foo"
      @event="handleEvent"
    />
  </div>
</template>
