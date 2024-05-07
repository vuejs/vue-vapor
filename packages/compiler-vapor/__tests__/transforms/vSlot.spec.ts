import {
  transformChildren,
  transformElement,
  transformSlotOutlet,
  transformText,
  transformVBind,
  transformVFor,
  transformVIf,
  transformVOn,
  transformVSlot,
} from '../../src'
import { makeCompile } from './_utils'

const compileWithSlots = makeCompile({
  nodeTransforms: [
    transformText,
    transformVIf,
    transformVFor,
    transformSlotOutlet,
    transformElement,
    transformVSlot,
    transformChildren,
  ],
  directiveTransforms: {
    bind: transformVBind,
    on: transformVOn,
  },
})

describe('compiler: transform slot', () => {
  test('implicit default slot', () => {
    const { code } = compileWithSlots(`<Comp><div/></Comp>`)
    expect(code).toMatchSnapshot()
  })

  test('named slots w/ implicit default slot', () => {
    const { code } = compileWithSlots(
      `<Comp>
        <template #one>foo</template>bar<span/>
      </Comp>`,
    )
    expect(code).toMatchSnapshot()
  })

  test('nested slots', () => {
    const { code } = compileWithSlots(
      `<Foo>
        <template #one><Bar><div/></Bar></template>
      </Foo>`,
    )
    expect(code).toMatchSnapshot()
  })
})
