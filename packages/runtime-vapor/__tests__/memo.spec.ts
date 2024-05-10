import {
  createMemo,
  createTextNode,
  insert,
  nextTick,
  ref,
  setText,
  template,
} from '../src'
import { makeRender } from './_utils'

const define = makeRender()

describe('createMemo', () => {
  test('on with external array', async () => {
    // <div v-memo="arr">{{ arr[0] }} {{ arr[1] }} {{arr[2] ?? '_' }} ({{c}})</div>{{c}}

    const arr = ref([0, 0])
    const c = ref(0)
    const t0 = template('<div></div>')

    const { host } = define(() => {
      const n0 = createMemo(
        () => arr.value,
        () => {
          const n2 = t0()
          setText(
            n2,
            arr.value[0],
            ' ',
            arr.value[1],
            ' ',
            arr.value[2] ?? '_',
            ' (',
            c.value,
            ')',
          )
          return n2
        },
        0,
      )
      const n3 = createTextNode(() => [c])
      return [n0, n3]
    }).render()

    expect(host.innerHTML).toBe(`<div>0 0 _ (0)</div><!--memo-->0`)

    let [x, y, z] = [0, 1, 2]

    // change at index x - should update
    arr.value[x]++
    c.value++
    await nextTick()
    expect(host.innerHTML).toBe(`<div>1 0 _ (1)</div><!--memo-->1`)

    // change at index y - should update
    arr.value[y]++
    c.value++
    await nextTick()
    expect(host.innerHTML).toBe(`<div>1 1 _ (2)</div><!--memo-->2`)

    // noop change - should NOT update
    arr.value[x] = arr.value[0]
    arr.value[y] = arr.value[1]
    c.value++
    await nextTick()
    expect(host.innerHTML).toBe(`<div>1 1 _ (2)</div><!--memo-->3`)

    // add item  3rd item - should update
    arr.value[z] = 0
    c.value++
    await nextTick()
    expect(host.innerHTML).toBe(`<div>1 1 0 (4)</div><!--memo-->4`)

    // remove 3rd item - should update
    arr.value = arr.value.slice(0, arr.value.length - 1)
    c.value++
    await nextTick()
    expect(host.innerHTML).toBe(`<div>1 1 _ (5)</div><!--memo-->5`)
  })

  test('on normal element', async () => {
    // mock this template:
    //  <div v-momo="[x]">
    //    {{x}} {{y}}
    //  </div>

    const x = ref(0)
    const y = ref(0)
    const t0 = template('<div></div>')

    const { host } = define(() => {
      const n0 = createMemo(
        () => [x.value],
        () => {
          const n2 = t0()
          setText(n2, x.value, ' ', y.value)
          return n2
        },
        0,
      )
      return n0
    }).render()

    expect(host.innerHTML).toBe(`<div>0 0</div><!--memo-->`)
    x.value++
    // should update
    await nextTick()
    expect(host.innerHTML).toBe(`<div>1 0</div><!--memo-->`)

    y.value++
    // should not update
    await nextTick()
    expect(host.innerHTML).toBe(`<div>1 0</div><!--memo-->`)

    x.value++
    // should update
    await nextTick()
    expect(host.innerHTML).toBe(`<div>2 1</div><!--memo-->`)
  })

  test('nested v-memo on normal element', async () => {
    // <div v-memo="[x]">
    //   {{ y }}
    //   <div v-memo="[z]">
    //     {{ k }}
    //   </div>
    // </div>

    const t0 = template('<div></div>')
    const x = ref(0)
    const y = ref(0)
    const z = ref(0)
    const k = ref(0)
    const { host } = define(() => {
      const n0 = createMemo(
        () => [x.value],
        _cache => {
          const n6 = t0()
          const n2 = createTextNode([y.value, ' '])
          const n3 = createMemo(
            () => [z.value],
            _cache => {
              const n5 = t0()
              setText(n5, k.value)
              return n5
            },
            1,
            _cache,
          )
          insert([n2, n3], n6 as ParentNode)
          return n6
        },
        0,
      )
      return n0
    }).render()

    expect(host.innerHTML).toBe(
      `<div>0 <div>0</div><!--memo--></div><!--memo-->`,
    )

    y.value++
    k.value++
    await nextTick()
    expect(host.innerHTML).toBe(
      `<div>0 <div>0</div><!--memo--></div><!--memo-->`,
    )

    x.value++
    await nextTick()
    expect(host.innerHTML).toBe(
      `<div>1 <div>0</div><!--memo--></div><!--memo-->`,
    )

    z.value++
    await nextTick()
    expect(host.innerHTML).toBe(
      `<div>1 <div>0</div><!--memo--></div><!--memo-->`,
    )

    x.value++
    await nextTick()
    expect(host.innerHTML).toBe(
      `<div>1 <div>1</div><!--memo--></div><!--memo-->`,
    )
  })

  test.todo('on component')

  test.todo('on v-if')

  test.todo('on v-for')

  test.todo('on v-for /w constant expression ')

  test('v-memo dependency is NaN should be equal', async () => {
    const x = ref(NaN)
    const y = ref(0)
    const t0 = template('<div></div>')
    const { host } = define(() => {
      const n0 = createMemo(
        () => [x.value],
        () => {
          const n2 = t0()
          setText(n2, y.value)
          return n2
        },
        0,
      )
      return n0
    }).render()
    expect(host.innerHTML).toBe(`<div>0</div><!--memo-->`)

    y.value++
    // should not update
    await nextTick()
    expect(host.innerHTML).toBe(`<div>0</div><!--memo-->`)
  })
})
