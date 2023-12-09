import { ErrorCodes, NodeTypes, BindingTypes } from '@vue/compiler-dom'
import {
  type RootIRNode,
  type CompilerOptions,
  parse,
  transform,
  transformVBind,
  transformElement,
  IRNodeTypes,
  compile as _compile,
  generate,
} from '../../src'

function compileWithVBind(
  template: string,
  options: CompilerOptions = {},
): {
  ir: RootIRNode
  code: string
} {
  const ast = parse(template, { prefixIdentifiers: true, ...options })

  const ir = transform(ast, {
    nodeTransforms: [transformElement],
    directiveTransforms: {
      bind: transformVBind,
    },
    prefixIdentifiers: true,
    ...options,
  })

  const { code } = generate(ir, { prefixIdentifiers: true, ...options })

  return { ir, code }
}

describe('compiler: transform v-bind', () => {
  test('basic', () => {
    const { ir: node, code } = compileWithVBind(`<div v-bind:id="id"/>`)

    expect(node.dynamic.children[0]).toMatchObject({
      id: 1,
      referenced: true,
    })
    expect(node.template[0]).toMatchObject({
      type: IRNodeTypes.TEMPLATE_FACTORY,
      template: '<div></div>',
    })
    expect(node.effect).lengthOf(1)
    expect(node.effect[0].expressions).lengthOf(1)
    expect(node.effect[0].operations).lengthOf(1)
    expect(node.effect[0]).toMatchObject({
      expressions: [
        {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'id',
          isStatic: false,
        },
      ],
      operations: [
        {
          type: IRNodeTypes.SET_PROP,
          element: 1,
          key: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: 'id',
            isStatic: true,
            loc: {
              start: { line: 1, column: 13, offset: 12 },
              end: { line: 1, column: 15, offset: 14 },
              source: 'id',
            },
          },
          value: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: 'id',
            isStatic: false,
            loc: {
              source: 'id',
              start: { line: 1, column: 17, offset: 16 },
              end: { line: 1, column: 19, offset: 18 },
            },
          },
        },
      ],
    })

    expect(code).matchSnapshot()
  })

  test('no expression', () => {
    const { ir: node, code } = compileWithVBind(`<div v-bind:id />`)

    expect(node.effect[0].operations[0]).toMatchObject({
      type: IRNodeTypes.SET_PROP,
      key: {
        content: `id`,
        isStatic: true,
        loc: {
          start: { line: 1, column: 13, offset: 12 },
          end: { line: 1, column: 15, offset: 14 },
        },
      },
      value: {
        content: `id`,
        isStatic: false,
        loc: {
          start: { line: 1, column: 13, offset: 12 },
          end: { line: 1, column: 15, offset: 14 },
        },
      },
    })

    expect(code).matchSnapshot()
    expect(code).contains('_setAttr(n1, "id", undefined, _ctx.id)')
  })

  test('no expression (shorthand)', () => {
    const { ir: node, code } = compileWithVBind(`<div :camel-case />`)

    expect(node.effect[0].operations[0]).toMatchObject({
      type: IRNodeTypes.SET_PROP,
      key: {
        content: `camel-case`,
        isStatic: true,
      },
      value: {
        content: `camelCase`,
        isStatic: false,
      },
    })

    expect(code).matchSnapshot()
    expect(code).contains(
      '_setAttr(n1, "camel-case", undefined, _ctx.camelCase)',
    )
  })

  test('dynamic arg', () => {
    const { ir: node, code } = compileWithVBind(`<div v-bind:[id]="id"/>`)
    expect(node.effect[0].operations[0]).toMatchObject({
      type: IRNodeTypes.SET_PROP,
      element: 1,
      key: {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: 'id',
        isStatic: false,
      },
      value: {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: 'id',
        isStatic: false,
      },
    })

    expect(code).matchSnapshot()
    expect(code).contains('_setAttr(n1, _ctx.id, undefined, _ctx.id)')
  })

  test('should error if empty expression', () => {
    const onError = vi.fn()
    const { ir: node, code } = compileWithVBind(`<div v-bind:arg="" />`, {
      onError,
    })

    expect(onError.mock.calls[0][0]).toMatchObject({
      code: ErrorCodes.X_V_BIND_NO_EXPRESSION,
      loc: {
        start: { line: 1, column: 6 },
        end: { line: 1, column: 19 },
      },
    })
    expect(node.template[0]).toMatchObject({
      type: IRNodeTypes.TEMPLATE_FACTORY,
      template: '<div arg=""></div>',
    })

    expect(code).matchSnapshot()
    expect(code).contains(JSON.stringify('<div arg=""></div>'))
  })

  test('.camel modifier', () => {
    const { ir: node, code } = compileWithVBind(
      `<div v-bind:foo-bar.camel="id"/>`,
    )

    expect(node.effect[0].operations[0]).toMatchObject({
      key: {
        content: `fooBar`,
        isStatic: true,
      },
      value: {
        content: `id`,
        isStatic: false,
      },
    })

    expect(code).matchSnapshot()
    expect(code).contains('_setAttr(n1, "fooBar", undefined, _ctx.id)')
  })

  test('.camel modifier w/ no expression', () => {
    const { ir: node, code } = compileWithVBind(`<div v-bind:foo-bar.camel />`)

    expect(node.effect[0].operations[0]).toMatchObject({
      key: {
        content: `fooBar`,
        isStatic: true,
      },
      value: {
        content: `fooBar`,
        isStatic: false,
      },
    })

    expect(code).matchSnapshot()
    expect(code).contains('effect')
    expect(code).contains('_setAttr(n1, "fooBar", undefined, _ctx.fooBar)')
  })

  test('.camel modifier w/ dynamic arg', () => {
    const { ir: node, code } = compileWithVBind(
      `<div v-bind:[foo].camel="id"/>`,
    )

    expect(node.effect[0].operations[0]).toMatchObject({
      runtimeCamelize: true,
      key: {
        content: `foo`,
        isStatic: false,
      },
      value: {
        content: `id`,
        isStatic: false,
      },
    })

    expect(code).matchSnapshot()
    expect(code).contains('effect')
    expect(code).contains(
      `_setAttr(n1, _camelize(_ctx.foo), undefined, _ctx.id)`,
    )
  })

  test.todo('.camel modifier w/ dynamic arg + prefixIdentifiers')

  test.todo('.prop modifier')
  test.todo('.prop modifier w/ no expression')
  test.todo('.prop modifier w/ dynamic arg')
  test.todo('.prop modifier w/ dynamic arg + prefixIdentifiers')
  test.todo('.prop modifier (shorthand)')
  test.todo('.prop modifier (shortband) w/ no expression')
  test.todo('.attr modifier')
  test.todo('.attr modifier w/ no expression')
})
