import * as CompilerVapor from '../src'
// import * as CompilerDOM from '@vue/compiler-dom'
import { parse, compileScript } from '@vue/compiler-sfc'
import source from './fixtures/counter.vue?raw'
import singleRootSource from './fixtures/singleRoot.vue?raw'
import singleRootSourceText from './fixtures/singleRootText.vue?raw'
import singleRootSourceLast from './fixtures/singleRootLast.vue?raw'
import singleRootSourceFirst from './fixtures/singleRootFirst.vue?raw'
test('basic', async () => {
  const { descriptor } = parse(source, { compiler: CompilerVapor })
  const script = compileScript(descriptor, {
    id: 'counter.vue',
    inlineTemplate: true,
    templateOptions: { compiler: CompilerVapor },
  })
  expect(script.content).matchSnapshot()
})

test('A single node containing dynamic content', async () => {
  const { descriptor } = parse(singleRootSource, { compiler: CompilerVapor })
  const script = compileScript(descriptor, {
    id: 'singleRoot.vue',
    inlineTemplate: true,
    templateOptions: { compiler: CompilerVapor },
  })
  expect(script.content).matchSnapshot()
})

test('A single node containing dynamic content & text', async () => {
  const { descriptor } = parse(singleRootSourceText, {
    compiler: CompilerVapor,
  })
  const script = compileScript(descriptor, {
    id: 'singleRootText.vue',
    inlineTemplate: true,
    templateOptions: { compiler: CompilerVapor },
  })
  expect(script.content).matchSnapshot()
})

test('A single node containing dynamic content & first', async () => {
  const { descriptor } = parse(singleRootSourceFirst, {
    compiler: CompilerVapor,
  })
  const script = compileScript(descriptor, {
    id: 'singleRootFirst.vue',
    inlineTemplate: true,
    templateOptions: { compiler: CompilerVapor },
  })
  expect(script.content).matchSnapshot()
})

test('A single node containing dynamic content & last', async () => {
  const { descriptor } = parse(singleRootSourceLast, {
    compiler: CompilerVapor,
  })
  const script = compileScript(descriptor, {
    id: 'singleRootLast.vue',
    inlineTemplate: true,
    templateOptions: { compiler: CompilerVapor },
  })
  expect(script.content).matchSnapshot()
})
