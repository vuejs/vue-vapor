import { describe, expect, it } from 'vitest'
import { createListAppWithShallowRef } from './vapor-shallow-ref'

describe('vapor-shallow-ref', () => {
  it('should work', async () => {
    const { html, ctx, options, wait } = createListAppWithShallowRef()
    options.setup()

    const { list, createItems, selected } = ctx

    list.value = createItems(3)
    expect(list.value.length).toBe(3)

    selected.value = list.value[0].id

    await wait()

    await expect(html()).toMatchFileSnapshot('./__snapshots__/create-list.html')
    expect(document.body.innerHTML.trim()).toBe(
      `<div id="host" data-v-app="">${html()}</div>`,
    )

    options.teardown()

    expect(document.body.innerHTML.trim()).toBe('')
  })
})
