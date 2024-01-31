import { NOOP } from '@vue/shared'
import { recordPropMetadata, setAttr, setClass, setStyle } from '../../src'
import {
  createComponentInstance,
  currentInstance,
  getCurrentInstance,
  setCurrentInstance,
} from '../../src/component'

let removeComponentInstance = NOOP
beforeEach(() => {
  const reset = setCurrentInstance(createComponentInstance((() => {}) as any))
  removeComponentInstance = () => {
    reset()
    removeComponentInstance = NOOP
  }
})
afterEach(() => {
  removeComponentInstance()
})

describe('patchProp', () => {
  describe('recordPropMetadata', () => {
    test('should record prop metadata', () => {
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
      removeComponentInstance()
      expect(currentInstance).toBeNull()

      const node = {} as Node
      let prev = recordPropMetadata(node, 'class', 'foo')
      expect(prev).toBeNaN()
      prev = recordPropMetadata(node, 'class', 'bar')
      expect(prev).toBeNaN()
    })
  })

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
    })
    test.fails('shoud set style with object and array property', () => {
      const el = document.createElement('div')
      setStyle(el, { color: 'red' })
      expect(el.style.cssText).toBe('color: red;')
      setStyle(el, [{ color: 'blue' }, { fontSize: '12px' }])
      expect(el.style.cssText).toBe('color: blue; font-size: 12px;')
    })
  })

  describe('setAttr', () => {
    test('should set attribute', () => {
      const el = document.createElement('div')
      setAttr(el, 'id', 'foo')
      expect(el.getAttribute('id')).toBe('foo')
      setAttr(el, 'name', 'bar')
      expect(el.getAttribute('name')).toBe('bar')
    })

    test('should remove attribute', () => {
      const el = document.createElement('div')
      setAttr(el, 'id', 'foo')
      setAttr(el, 'data', 'bar')
      expect(el.getAttribute('id')).toBe('foo')
      expect(el.getAttribute('data')).toBe('bar')
      setAttr(el, 'id', null)
      expect(el.getAttribute('id')).toBeNull()
      setAttr(el, 'data', undefined)
      expect(el.getAttribute('data')).toBeNull()
    })

    test('should remove attribute outside of component', () => {
      removeComponentInstance()
      expect(currentInstance).toBeNull()

      const el = document.createElement('div')
      setAttr(el, 'id', 'foo')
      setAttr(el, 'data', 'bar')
      expect(el.getAttribute('id')).toBe('foo')
      expect(el.getAttribute('data')).toBe('bar')
      setAttr(el, 'id', null)
      expect(el.getAttribute('id')).toBeNull()
      setAttr(el, 'data', undefined)
      expect(el.getAttribute('data')).toBeNull()
    })

    test('should set boolean attribute to string', () => {
      const el = document.createElement('div')
      setAttr(el, 'disabled', true)
      expect(el.getAttribute('disabled')).toBe('true')
      setAttr(el, 'disabled', false)
      expect(el.getAttribute('disabled')).toBe('false')
    })
  })
})
