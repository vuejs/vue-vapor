import { describe, expect, it } from 'vitest'
import { createListAppOnVanilla } from './vanilla'

describe('vanilla', () => {
  it('should work', async () => {
    const { html, ctx, options } = createListAppOnVanilla()
    options.setup()

    const { create, rows } = ctx

    create(3)
    ;(rows().item(0)!.firstChild as HTMLElement)!.click()

    await expect(html()).toMatchFileSnapshot('./__snapshots__/create-list.html')
    expect(document.body.innerHTML.trim()).toBe(
      `<div id="host">${html()}</div>`,
    )

    options.teardown()

    expect(document.body.innerHTML.trim()).toBe('')
  })
  it('shoud work with 1000 items', async () => {
    const { html, ctx, options } = createListAppOnVanilla()
    options.setup()

    const { create, rows } = ctx

    create(1000)
    const items = rows()
    ;(items.item(0)!.firstChild as HTMLElement)!.click()

    expect(items.length).toBe(1000)
    expect(document.body.innerHTML.trim()).toBe(
      `<div id="host">${html()}</div>`,
    )

    options.teardown()

    expect(document.body.innerHTML.trim()).toBe('')
  })
})
