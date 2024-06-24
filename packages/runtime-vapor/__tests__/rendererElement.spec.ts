import { makeRender } from './_utils'
import { template } from '../src/dom/template'

const define = makeRender()

describe('renderer: element', () => {
  it('should create an element', () => {
    const { html } = define({
      render() {
        return template(`<div>`)()
      },
    }).render()

    expect(html()).toBe('<div></div>')
  })

  it('should create an element with props', () => {
    const { html } = define({
      render() {
        return template(`<div id="foo" class="bar">`)()
      },
    }).render()

    expect(html()).toBe('<div id="foo" class="bar"></div>')
  })

  it('should create an element with direct text children', () => {
    const { html } = define({
      render() {
        return template(`<div>foo bar`)()
      },
    }).render()

    expect(html()).toBe('<div>foo bar</div>')
  })

  // it('should create an element with direct text children and props', () => {
  //   const { html } = define({
  //     setup() {
  //       const el = document.createElement('div')
  //       el.id = 'foo'
  //       el.textContent = 'bar'
  //       return el
  //     },
  //   }).render()

  //   expect(html()).toBe('<div id="foo">bar</div>')
  // })

  // it('should update an element tag which is already mounted', () => {
  //   render(h('div', ['foo']), root)
  //   expect(inner(root)).toBe('<div>foo</div>')

  //   render(h('span', ['foo']), root)
  //   expect(inner(root)).toBe('<span>foo</span>')
  // })

  // it('should update element props which is already mounted', () => {
  //   render(h('div', { id: 'bar' }, ['foo']), root)
  //   expect(inner(root)).toBe('<div id="bar">foo</div>')

  //   render(h('div', { id: 'baz', class: 'bar' }, ['foo']), root)
  //   expect(inner(root)).toBe('<div id="baz" class="bar">foo</div>')
  // })
})
