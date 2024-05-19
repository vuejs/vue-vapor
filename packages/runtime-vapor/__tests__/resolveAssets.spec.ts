import {
  type Component,
  createComponent,
  createTextNode,
  ref,
  resolveComponent,
  setText,
  template,
  watchEffect,
} from '../src'
import { describe, expect } from 'vitest'
import { makeRender } from './_utils'

const define = makeRender()

describe('resolveAssets', () => {
  test('should work', async () => {
    const child = {
      name: 'FooBaz',
      setup() {
        return (() => {
          const n2 = createTextNode()
          return n2
        })()
      },
    }
    const { render } = define({
      name: 'parent',
      setup() {
        return (() => {
          createComponent(child)
          expect(resolveComponent('foo-baz')).toBeDefined()
          expect(resolveComponent('foo-baz')).toBeDefined()
          expect(resolveComponent('FooBaz')).toBeDefined()
        })()
      },
    })
    render()
  })
  test('maybe self ref', async () => {
    let comp: Component | null = null
    const rootCompObj = {
      name: 'Root',
      setup() {
        comp = resolveComponent('Root', true, true)
      },
    }
    const root = define(rootCompObj)
    root.render()
    expect(comp).toMatchObject(rootCompObj)
  })
  describe('warning', () => {
    test('outside render() or setup()', () => {
      resolveComponent('foo')
      expect(
        'resolveComponent can only be used in render() or setup().',
      ).toHaveBeenWarned()
    })
    test('not exists', () => {
      const root = {
        setup() {
          resolveComponent('not-exists-component')
          return (() => {
            const n = createTextNode()
          })()
        },
      }
      const { render } = define(root)
      render()
      expect(
        'Failed to resolve component: not-exists-component',
      ).toHaveBeenWarned()
    })
  })
})
