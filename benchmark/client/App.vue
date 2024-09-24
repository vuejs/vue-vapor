<script setup lang="ts" vapor>
import { signal, createSelector, type Signal } from '@vue/vapor'
import { buildData } from './data'
import { defer, wrap } from './profiling'

const isVapor = !!import.meta.env.IS_VAPOR

const selected = signal<number>()
const rows = signal<
  {
    id: number
    label: Signal<string>
  }[]
>([])

// Bench Add: https://jsbench.me/45lzxprzmu/1
const add = wrap('add', () => {
  rows().push(...buildData(1000))
  rows.set(rows())
})

const remove = wrap('remove', (id: number) => {
  rows().splice(
    rows().findIndex(d => d.id === id),
    1,
  )
  rows.set(rows())
})

const select = wrap('select', (id: number) => {
  selected.set(id)
})

const run = wrap('run', () => {
  rows.set(buildData())
  selected.set(undefined)
})

const update = wrap('update', () => {
  const _rows = rows()
  for (let i = 0, len = _rows.length; i < len; i += 10) {
    _rows[i].label.value += ' !!!'
  }
})

const runLots = wrap('runLots', () => {
  rows.set(buildData(10000))
  selected.set(undefined)
})

const clear = wrap('clear', () => {
  rows.set([])
  selected.set(undefined)
})

const swapRows = wrap('swap', () => {
  const _rows = rows()
  if (_rows.length > 998) {
    const d1 = _rows[1]
    const d998 = _rows[998]
    _rows[1] = d998
    _rows[998] = d1
    rows.set(rows())
  }
})

async function bench() {
  for (let i = 0; i < 30; i++) {
    rows.set([])
    await defer()
    await runLots()
  }
}

const isSelected = createSelector(selected)

const globalThis = window
</script>

<template>
  <h1>Vue.js ({{ isVapor ? 'Vapor' : 'Virtual DOM' }}) Benchmark</h1>

  <div style="display: flex; gap: 4px; margin-bottom: 4px">
    <label>
      <input
        type="checkbox"
        :value="globalThis.doProfile"
        @change="globalThis.doProfile = $event.target.checked"
      />
      Profiling
    </label>
    <label>
      <input
        type="checkbox"
        :value="globalThis.reactivity"
        @change="globalThis.reactivity = $event.target.checked"
      />
      Reactivity Cost
    </label>
  </div>

  <div
    id="control"
    style="display: flex; flex-direction: column; width: fit-content; gap: 6px"
  >
    <button @click="bench">Benchmark mounting</button>
    <button id="run" @click="run">Create 1,000 rows</button>
    <button id="runLots" @click="runLots">Create 10,000 rows</button>
    <button id="add" @click="add">Append 1,000 rows</button>
    <button id="update" @click="update">Update every 10th row</button>
    <button id="clear" @click="clear">Clear</button>
    <button id="swaprows" @click="swapRows">Swap Rows</button>
  </div>
  <div id="time"></div>
  <table>
    <tbody>
      <tr
        v-for="row of rows()"
        :key="row.id"
        :class="{ danger: selected() === row.id }"
      >
        <td>{{ row.id }}</td>
        <td>
          <a @click="select(row.id)">{{ row.label() }}</a>
        </td>
        <td>
          <button @click="remove(row.id)">x</button>
        </td>
        <td class="col-md-6"></td>
      </tr>
    </tbody>
  </table>
</template>

<style>
.danger {
  background-color: red;
}
</style>
