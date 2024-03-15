<script setup lang="ts">
import SubComp from './sub-comp.vue'
import { ref } from 'vue'

const bar = ref('update')
const id = ref('id')
const p = ref<any>({
  bar,
  id: 'not id',
  test: 100,
})

function update() {
  bar.value = 'updated'
  p.value.foo = 'updated foo'
  p.value.newAttr = 'new attr'
  id.value = 'updated id'
}

function update2() {
  delete p.value.test
}
</script>

<template>
  <div>
    root comp
    <button @click="update">update</button>
    <button @click="update2">update2</button>
    <SubComp foo="foo" v-bind="p" :baz="'baz'" :id />
  </div>
</template>
