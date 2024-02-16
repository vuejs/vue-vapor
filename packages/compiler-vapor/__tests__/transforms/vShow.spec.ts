import { makeCompile } from './_utils'
import { transformElement, transformVShow } from '../../src'
import { VaporErrorCodes } from '../../src/errors'

const compileWithVShow = makeCompile({
  nodeTransforms: [transformElement],
  directiveTransforms: {
    show: transformVShow,
  },
})

describe('compiler: v-show transform', () => {
  test('simple expression', () => {
    const { code } = compileWithVShow(`<div v-show="foo"/>`)
    expect(code).toMatchSnapshot()
  })

  test('should raise error if has no expression', () => {
    const onError = vi.fn()
    compileWithVShow(`<div v-show/>`, { onError })

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        code: VaporErrorCodes.X_V_SHOW_NO_EXPRESSION,
      }),
    )
  })
})
