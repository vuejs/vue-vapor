import { makeCompile } from './_utils'
import { transformElement, transformVIf } from '../../src'

const compileWithVIf = makeCompile({
  nodeTransforms: [transformElement, transformVIf],
})

describe('compiler: v-if', () => {
  test('basic v-if', () => {
    const { code } = compileWithVIf(`<div v-if="ok"/>`)
    expect(code).matchSnapshot()
  })
})
