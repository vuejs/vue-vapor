import { NodeTypes } from '@vue/compiler-dom'
import { IRNodeTypes } from '../../src'
import { getBaseTransformPreset } from '../../src/compile'
import { makeCompile } from './_utils'

const [nodeTransforms, directiveTransforms] = getBaseTransformPreset(true)
const compileWithMemo = makeCompile({
  nodeTransforms,
  directiveTransforms,
})

describe('compiler: v-memo', () => {
  test('on normal element', () => {
    const { ir, code, vaporHelpers } = compileWithMemo(
      `<div v-memo="[x]">
        {{ y }}
      </div>`,
    )
    expect(code).toMatchSnapshot()
    expect(vaporHelpers).contains('createMemo')
    expect(ir.block.effect).lengthOf(0)
    expect(ir.block.operation).toMatchObject([
      {
        type: IRNodeTypes.MEMO,
        id: 0,
        memo: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: '[x]',
        },
        render: {
          type: IRNodeTypes.BLOCK,
          dynamic: {
            children: [{ template: 0 }],
          },
        },
        level: 0,
      },
    ])
  })

  test('nested v-memo on normal element', () => {
    const { ir, code, vaporHelpers } = compileWithMemo(
      `<div v-memo="[x]">
        {{ y }}
        <div v-memo="[z]">
          {{ k }}
        </div>
      </div>`,
    )
    expect(code).toMatchSnapshot()
    expect(vaporHelpers).contains('createMemo')
    expect(ir.block.effect).lengthOf(0)
    expect(ir.block.operation).toMatchObject([
      {
        type: IRNodeTypes.MEMO,
        id: 0,
        memo: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: '[x]',
        },
        render: {
          type: IRNodeTypes.BLOCK,
          dynamic: {
            children: [{ template: 0 }],
          },
        },
        level: 0,
      },
    ])
    expect((ir.block.operation[0] as any).render.operation[1]).toMatchObject({
      type: IRNodeTypes.MEMO,
      id: 3,
      memo: {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: '[z]',
      },
      render: {
        type: IRNodeTypes.BLOCK,
        dynamic: {
          children: [{ template: 0 }],
        },
      },
      level: 1,
    })
  })

  test.todo('on component')
  test.todo('on slot outlet')
  test.todo('with v-if/else')
  test.todo('with v-for')
})
