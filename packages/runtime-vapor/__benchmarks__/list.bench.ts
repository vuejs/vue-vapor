import { bench, describe } from 'vitest'
import { createListAppWithRef } from './_runtimes/vapor-ref'
import { createListAppWithShallowRef } from './_runtimes/vapor-shallow-ref'
import { createListAppOnVanilla } from './_runtimes/vanilla'

describe('vapor list create', () => {
  {
    const { options, wait, ctx } = createListAppWithRef()
    const { list, createItems } = ctx
    bench(
      'create vapor + ref',
      async () => {
        list.value = createItems(1000)
        await wait()
      },
      options,
    )
  }

  {
    const { options, wait, ctx } = createListAppWithShallowRef()
    const { list, createItems } = ctx
    bench(
      'create vapor + shallowRef',
      async () => {
        list.value = createItems(1000)
        await wait()
      },
      options,
    )
  }

  {
    const { options, ctx } = createListAppOnVanilla()
    const { create } = ctx
    bench(
      'create vanilla',
      () => {
        create(1000)
      },
      options,
    )
  }
})

describe.todo('vapor list add', () => {
  bench('create vanilla', () => {})

  bench('create vapor + ref', () => {})

  bench('create vapor + shallowRef', () => {})
})

describe.todo('vapor list update every 10th row', () => {
  bench('create vanilla', () => {})

  bench('create vapor + ref', () => {})

  bench('create vapor + shallowRef', () => {})
})
