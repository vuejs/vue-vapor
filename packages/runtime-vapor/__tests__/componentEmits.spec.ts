// NOTE: this test cases are based on paclages/runtime-core/__tests__/componentEmits.spec.ts

// Note: emits and listener fallthrough is tested in
// ./rendererAttrsFallthrough.spec.ts.

describe('component: emit', () => {
  test.todo('trigger handlers', () => {})

  test.todo('trigger camelCase handler', () => {})

  test.todo('trigger kebab-case handler', () => {})

  // #3527
  test.todo('trigger mixed case handlers', () => {})

  // for v-model:foo-bar usage in DOM templates
  test.todo('trigger hyphenated events for update:xxx events', () => {})

  test.todo('should trigger array of listeners', async () => {})

  test.todo('warning for undeclared event (array)', () => {})

  test.todo('warning for undeclared event (object)', () => {})

  test.todo('should not warn if has equivalent onXXX prop', () => {})

  test.todo('validator warning', () => {})

  test.todo('merging from mixins', () => {})

  // #2651
  test.todo(
    'should not attach normalized object when mixins do not contain emits',
    () => {},
  )

  test.todo('.once', () => {})

  test.todo('.once with normal listener of the same name', () => {})

  test.todo('.number modifier should work with v-model on component', () => {})

  test.todo('.trim modifier should work with v-model on component', () => {})

  test.todo(
    '.trim and .number modifiers should work with v-model on component',
    () => {},
  )

  test.todo(
    'only trim string parameter when work with v-model on component',
    () => {},
  )

  test.todo('isEmitListener', () => {})

  test.todo('does not emit after unmount', async () => {})

  test.todo('merge string array emits', async () => {})

  test.todo('merge object emits', async () => {})
})
