import { recordPropMetadata, setClass, setStyle } from '../../src'
import {
  createComponentInstance,
  getCurrentInstance,
  setCurrentInstance,
} from '../../src/component'

const mockComponentInstance = () => {
  afterEach(setCurrentInstance(createComponentInstance((() => {}) as any)))
  return getCurrentInstance()
}

describe('patchProp', () => {
  describe('setClass', () => {
    test('should set class', () => {
      const el = document.createElement('div')
      setClass(el, 'foo')
      expect(el.className).toBe('foo')
      setClass(el, ['bar', 'baz'])
      expect(el.className).toBe('bar baz')
      setClass(el, { a: true, b: false })
      expect(el.className).toBe('a')
    })
  })

  describe('setStyle', () => {
    test('should set style', () => {
      const el = document.createElement('div')
      setStyle(el, 'color: red')
      expect(el.style.cssText).toBe('color: red;')
      // TODO
      // setStyle(el, [{ color: 'blue' }, { fontSize: '12px' }])
      // expect(el.style.cssText).toBe('color: blue; font-size: 12px;')
    })
  })

  describe('recordPropMetadata', () => {
    test('should record prop metadata', () => {
      mockComponentInstance()
      const node = {} as Node // the node is just a key
      let prev = recordPropMetadata(node, 'class', 'foo')
      expect(prev).toBeUndefined()
      prev = recordPropMetadata(node, 'class', 'bar')
      expect(prev).toBe('foo')
      prev = recordPropMetadata(node, 'style', 'color: red')
      expect(prev).toBeUndefined()
      prev = recordPropMetadata(node, 'style', 'color: blue')
      expect(prev).toBe('color: red')

      expect(getCurrentInstance()?.metadata.get(node)).toEqual({
        props: { class: 'bar', style: 'color: blue' },
      })
    })

    test('should have different metadata for different nodes', () => {
      mockComponentInstance()
      const node1 = {} as Node
      const node2 = {} as Node
      recordPropMetadata(node1, 'class', 'foo')
      recordPropMetadata(node2, 'class', 'bar')
      expect(getCurrentInstance()?.metadata.get(node1)).toEqual({
        props: { class: 'foo' },
      })
      expect(getCurrentInstance()?.metadata.get(node2)).toEqual({
        props: { class: 'bar' },
      })
    })

    test('should not record prop metadata outside of component', () => {
      const node = {} as Node
      let prev = recordPropMetadata(node, 'class', 'foo')
      expect(prev).toBeUndefined()
      prev = recordPropMetadata(node, 'class', 'bar')
      expect(prev).toBeUndefined()
    })
  })
})
