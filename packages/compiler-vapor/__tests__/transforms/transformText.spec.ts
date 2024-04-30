// TODO: add tests for this transform
import {
  IRNodeTypes,
  transformChildren,
  transformElement,
  transformText,
  transformVBind,
  transformVOn,
} from '../../src'

import { makeCompile } from './_utils'

const compileWithTextTransform = makeCompile({
  nodeTransforms: [transformElement, transformChildren, transformText],
  directiveTransforms: {
    bind: transformVBind,
    on: transformVOn,
  },
})

describe('compiler: text transform', () => {
  it('should transform text node', () => {
    const { code, ir, vaporHelpers } = compileWithTextTransform(
      '{{ "hello world" }}',
    )
    expect(code).toMatchSnapshot()
    expect(vaporHelpers).contains.all.keys('createTextNode')
    expect(ir.block.operation).toMatchObject([
      {
        type: IRNodeTypes.CREATE_TEXT_NODE,
        id: 0,
        values: [
          {
            type: IRNodeTypes.SET_TEXT,
            content: '"hello world"',
            isStatic: false,
          },
        ],
        effect: false,
      },
    ])
  })

  it('should transform text node with only dynamic value', () => {
    const { code, ir, vaporHelpers } = compileWithTextTransform('{{ msg }}')
    expect(code).toMatchSnapshot()
    expect(vaporHelpers).contains.all.keys('createTextNode')
    expect(ir.block.operation).toMatchObject([
      {
        type: IRNodeTypes.CREATE_TEXT_NODE,
        id: 0,
        values: [
          {
            type: IRNodeTypes.SET_TEXT,
            content: 'msg',
            isStatic: false,
          },
        ],
        effect: true,
      },
    ])
  })

  // test('no consecutive text', () => {
  //   const root = transformWithTextOpt(`{{ foo }}`)
  //   expect(root.children[0]).toMatchObject({
  //     type: NodeTypes.INTERPOLATION,
  //     content: {
  //       content: `foo`,
  //     },
  //   })
  //   expect(generate(root).code).toMatchSnapshot()
  // })

  // test('consecutive text', () => {
  //   const root = transformWithTextOpt(`{{ foo }} bar {{ baz }}`)
  //   expect(root.children.length).toBe(1)
  //   expect(root.children[0]).toMatchObject({
  //     type: NodeTypes.COMPOUND_EXPRESSION,
  //     children: [
  //       { type: NodeTypes.INTERPOLATION, content: { content: `foo` } },
  //       ` + `,
  //       { type: NodeTypes.TEXT, content: ` bar ` },
  //       ` + `,
  //       { type: NodeTypes.INTERPOLATION, content: { content: `baz` } },
  //     ],
  //   })
  //   expect(generate(root).code).toMatchSnapshot()
  // })

  // test('consecutive text between elements', () => {
  //   const root = transformWithTextOpt(`<div/>{{ foo }} bar {{ baz }}<div/>`)
  //   expect(root.children.length).toBe(3)
  //   expect(root.children[0].type).toBe(NodeTypes.ELEMENT)
  //   expect(root.children[1]).toMatchObject({
  //     // when mixed with elements, should convert it into a text node call
  //     type: NodeTypes.TEXT_CALL,
  //     codegenNode: {
  //       type: NodeTypes.JS_CALL_EXPRESSION,
  //       callee: CREATE_TEXT,
  //       arguments: [
  //         {
  //           type: NodeTypes.COMPOUND_EXPRESSION,
  //           children: [
  //             { type: NodeTypes.INTERPOLATION, content: { content: `foo` } },
  //             ` + `,
  //             { type: NodeTypes.TEXT, content: ` bar ` },
  //             ` + `,
  //             { type: NodeTypes.INTERPOLATION, content: { content: `baz` } },
  //           ],
  //         },
  //         genFlagText(PatchFlags.TEXT),
  //       ],
  //     },
  //   })
  //   expect(root.children[2].type).toBe(NodeTypes.ELEMENT)
  //   expect(generate(root).code).toMatchSnapshot()
  // })

  // test('text between elements (static)', () => {
  //   const root = transformWithTextOpt(`<div/>hello<div/>`)
  //   expect(root.children.length).toBe(3)
  //   expect(root.children[0].type).toBe(NodeTypes.ELEMENT)
  //   expect(root.children[1]).toMatchObject({
  //     // when mixed with elements, should convert it into a text node call
  //     type: NodeTypes.TEXT_CALL,
  //     codegenNode: {
  //       type: NodeTypes.JS_CALL_EXPRESSION,
  //       callee: CREATE_TEXT,
  //       arguments: [
  //         {
  //           type: NodeTypes.TEXT,
  //           content: `hello`,
  //         },
  //         // should have no flag
  //       ],
  //     },
  //   })
  //   expect(root.children[2].type).toBe(NodeTypes.ELEMENT)
  //   expect(generate(root).code).toMatchSnapshot()
  // })

  // test('consecutive text mixed with elements', () => {
  //   const root = transformWithTextOpt(
  //     `<div/>{{ foo }} bar {{ baz }}<div/>hello<div/>`,
  //   )
  //   expect(root.children.length).toBe(5)
  //   expect(root.children[0].type).toBe(NodeTypes.ELEMENT)
  //   expect(root.children[1]).toMatchObject({
  //     type: NodeTypes.TEXT_CALL,
  //     codegenNode: {
  //       type: NodeTypes.JS_CALL_EXPRESSION,
  //       callee: CREATE_TEXT,
  //       arguments: [
  //         {
  //           type: NodeTypes.COMPOUND_EXPRESSION,
  //           children: [
  //             { type: NodeTypes.INTERPOLATION, content: { content: `foo` } },
  //             ` + `,
  //             { type: NodeTypes.TEXT, content: ` bar ` },
  //             ` + `,
  //             { type: NodeTypes.INTERPOLATION, content: { content: `baz` } },
  //           ],
  //         },
  //         genFlagText(PatchFlags.TEXT),
  //       ],
  //     },
  //   })
  //   expect(root.children[2].type).toBe(NodeTypes.ELEMENT)
  //   expect(root.children[3]).toMatchObject({
  //     type: NodeTypes.TEXT_CALL,
  //     codegenNode: {
  //       type: NodeTypes.JS_CALL_EXPRESSION,
  //       callee: CREATE_TEXT,
  //       arguments: [
  //         {
  //           type: NodeTypes.TEXT,
  //           content: `hello`,
  //         },
  //       ],
  //     },
  //   })
  //   expect(root.children[4].type).toBe(NodeTypes.ELEMENT)
  //   expect(generate(root).code).toMatchSnapshot()
  // })

  // test('<template v-for>', () => {
  //   const root = transformWithTextOpt(
  //     `<template v-for="i in list">foo</template>`,
  //   )
  //   expect(root.children[0].type).toBe(NodeTypes.FOR)
  //   const forNode = root.children[0] as ForNode
  //   // should convert template v-for text children because they are inside
  //   // fragments
  //   expect(forNode.children[0]).toMatchObject({
  //     type: NodeTypes.TEXT_CALL,
  //   })
  //   expect(generate(root).code).toMatchSnapshot()
  // })

  // test('with prefixIdentifiers: true', () => {
  //   const root = transformWithTextOpt(`{{ foo }} bar {{ baz + qux }}`, {
  //     prefixIdentifiers: true,
  //   })
  //   expect(root.children.length).toBe(1)
  //   expect(root.children[0]).toMatchObject({
  //     type: NodeTypes.COMPOUND_EXPRESSION,
  //     children: [
  //       { type: NodeTypes.INTERPOLATION, content: { content: `_ctx.foo` } },
  //       ` + `,
  //       { type: NodeTypes.TEXT, content: ` bar ` },
  //       ` + `,
  //       {
  //         type: NodeTypes.INTERPOLATION,
  //         content: {
  //           type: NodeTypes.COMPOUND_EXPRESSION,
  //           children: [
  //             { content: `_ctx.baz` },
  //             ` + `,
  //             { content: `_ctx.qux` },
  //           ],
  //         },
  //       },
  //     ],
  //   })
  //   expect(
  //     generate(root, {
  //       prefixIdentifiers: true,
  //     }).code,
  //   ).toMatchSnapshot()
  // })

  // // #3756
  // test('element with custom directives and only one text child node', () => {
  //   const root = transformWithTextOpt(`<p v-foo>{{ foo }}</p>`)
  //   expect(root.children.length).toBe(1)
  //   expect(root.children[0].type).toBe(NodeTypes.ELEMENT)
  //   expect((root.children[0] as ElementNode).children[0]).toMatchObject({
  //     type: NodeTypes.TEXT_CALL,
  //     codegenNode: {
  //       type: NodeTypes.JS_CALL_EXPRESSION,
  //       callee: CREATE_TEXT,
  //       arguments: [
  //         {
  //           type: NodeTypes.INTERPOLATION,
  //           content: {
  //             type: NodeTypes.SIMPLE_EXPRESSION,
  //             content: 'foo',
  //           },
  //         },
  //         genFlagText(PatchFlags.TEXT),
  //       ],
  //     },
  //   })
  //   expect(generate(root).code).toMatchSnapshot()
  // })
})
