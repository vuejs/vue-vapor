import { describe, expect, it } from 'vitest'
import { createListAppWithRef } from './vapor-ref'

describe('vapor-ref', () => {
  it('should work', async () => {
    const { html, ctx, options, wait } = createListAppWithRef()
    options.setup()

    const { list, createItems, selected } = ctx

    list.value = createItems(3)
    expect(list.value.length).toBe(3)

    selected.value = list.value[0].id

    await wait()

    expect(html()).toMatchFileSnapshot('./__snapshots__/create-list.html')
    expect(document.body.innerHTML).toBe(
      `<div id="host" data-v-app="">${html()}</div>`,
    )

    options.teardown()

    expect(document.body.innerHTML).toBe('')
  })
  it('shoud work with 1000 items', async () => {
    const { html, ctx, options, wait } = createListAppWithRef()
    options.setup()

    const { list, createItems, selected } = ctx

    list.value = createItems(1000)
    expect(list.value.length).toBe(1000)

    selected.value = list.value[0].id

    await wait()

    let count = 0
    html().replaceAll('</a></td></tr>', v => (++count, v))
    expect(count).toBe(1000)
    expect(document.body.innerHTML).toBe(
      `<div id="host" data-v-app="">${html()}</div>`,
    )

    options.teardown()

    expect(document.body.innerHTML).toBe('')
  })
})
