import { NOOP } from '@vue/shared'
import {
  setDynamicProp as _setDynamicProp,
  recordPropMetadata,
  setAttr,
  setClass,
  setDOMProp,
  setHtml,
  setStyle,
  setText,
} from '../../src'
import {
  createComponentInstance,
  currentInstance,
  getCurrentInstance,
  setCurrentInstance,
} from '../../src/component'

let removeComponentInstance = NOOP
beforeEach(() => {
  const reset = setCurrentInstance(
    createComponentInstance((() => {}) as any, {}),
  )
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

      // FIXME
      expect(() => recordPropMetadata({} as Node, 'class', 'foo')).toThrowError(
        'cannot be used out of component',
      )
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

    test('should set boolean attribute to string', () => {
      const el = document.createElement('div')
      setAttr(el, 'disabled', true)
      expect(el.getAttribute('disabled')).toBe('true')
      setAttr(el, 'disabled', false)
      expect(el.getAttribute('disabled')).toBe('false')
    })
  })

  describe('setDOMProp', () => {
    test('should set DOM property', () => {
      const el = document.createElement('div')
      setDOMProp(el, 'textContent', 'foo')
      expect(el.textContent).toBe('foo')
      setDOMProp(el, 'innerHTML', '<p>bar</p>')
      expect(el.innerHTML).toBe('<p>bar</p>')
    })
  })

  describe('setDynamicProp', () => {
    const element = document.createElement('div')
    function setDynamicProp(
      key: string,
      value: any,
      el = element.cloneNode(true) as HTMLElement,
    ) {
      _setDynamicProp(el, key, value)
      return el
    }

    test('should be able to set id', () => {
      let res = setDynamicProp('id', 'bar')
      expect(res.id).toBe('bar')
    })

    test('should be able to set class', () => {
      let res = setDynamicProp('class', 'foo')
      expect(res.className).toBe('foo')
    })

    test('should be able to set style', () => {
      let res = setDynamicProp('style', 'color: red')
      expect(res.style.cssText).toBe('color: red;')
    })

    test('should be able to set .prop', () => {
      let res = setDynamicProp('.foo', 'bar')
      expect((res as any)['foo']).toBe('bar')
      expect(res.getAttribute('foo')).toBeNull()
    })

    test('should be able to set ^attr', () => {
      let res = setDynamicProp('^foo', 'bar')
      expect(res.getAttribute('foo')).toBe('bar')
      expect((res as any)['foo']).toBeUndefined()
    })

    test('should be able to set boolean prop', () => {
      let res = setDynamicProp(
        'disabled',
        true,
        document.createElement('button'),
      )
      expect(res.getAttribute('disabled')).toBe('')
      setDynamicProp('disabled', false, res)
      expect(res.getAttribute('disabled')).toBeNull()
    })

    // The function shouldSetAsProp has complete tests elsewhere,
    // so here we only do a simple test.
    test('should be able to set innerHTML and textContent', () => {
      let res = setDynamicProp('innerHTML', '<p>bar</p>')
      expect(res.innerHTML).toBe('<p>bar</p>')
      res = setDynamicProp('textContent', 'foo')
      expect(res.textContent).toBe('foo')
    })

    test.todo('should be able to set something on SVG')
  })

  describe('setText', () => {
    test('should set textContent', () => {
      const el = document.createElement('div')
      setText(el, 'foo')
      expect(el.textContent).toBe('foo')
      setText(el, 'bar')
      expect(el.textContent).toBe('bar')
    })
  })

  describe('setHtml', () => {
    test('should set innerHTML', () => {
      const el = document.createElement('div')
      setHtml(el, '<p>foo</p>')
      expect(el.innerHTML).toBe('<p>foo</p>')
      setHtml(el, '<p>bar</p>')
      expect(el.innerHTML).toBe('<p>bar</p>')
    })
  })
})
