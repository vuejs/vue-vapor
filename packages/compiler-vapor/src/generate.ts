import {
  type CodegenOptions as BaseCodegenOptions,
  type BaseCodegenResult,
  NewlineType,
  type Position,
  type SourceLocation,
  advancePositionWithMutation,
  locStub,
} from '@vue/compiler-dom'
import type { IREffect, IRNodeTypes, RootIRNode, VaporHelper } from './ir'
import { SourceMapGenerator } from 'source-map-js'
import { extend, isString } from '@vue/shared'
import type { ParserPlugin } from '@babel/parser'
import { genTemplate } from './generators/template'
import { genBlockFunctionContent } from './generators/block'

interface CodegenOptions extends BaseCodegenOptions {
  expressionPlugins?: ParserPlugin[]
}

export type CodeFragment =
  | string
  | [code: string, newlineIndex?: number, loc?: SourceLocation, name?: string]
  | undefined

export class CodegenContext {
  options: Required<CodegenOptions>

  source: string
  code: CodeFragment[]
  indentLevel: number = 0
  map?: SourceMapGenerator

  push: (...args: CodeFragment[]) => void
  newline = (): CodeFragment => {
    return [`\n${`  `.repeat(this.indentLevel)}`, NewlineType.Start]
  }
  multi = (
    [left, right, seg]: [left: string, right: string, segment: string],
    ...fns: Array<false | string | CodeFragment[]>
  ): CodeFragment[] => {
    const frag: CodeFragment[] = []
    fns = fns.filter(Boolean)
    frag.push(left)
    for (let [i, fn] of fns.entries()) {
      if (fn) {
        if (isString(fn)) fn = [fn]
        frag.push(...fn)
        if (i < fns.length - 1) frag.push(seg)
      }
    }
    frag.push(right)
    return frag
  }
  call = (
    name: string,
    ...args: Array<false | string | CodeFragment[]>
  ): CodeFragment[] => {
    return [name, ...this.multi(['(', ')', ', '], ...args)]
  }
  withIndent = <T>(fn: () => T): T => {
    ++this.indentLevel
    const ret = fn()
    --this.indentLevel
    return ret
  }

  helpers = new Set<string>([])
  vaporHelpers = new Set<string>([])
  helper = (name: string) => {
    this.helpers.add(name)
    return `_${name}`
  }
  vaporHelper = (name: VaporHelper) => {
    this.vaporHelpers.add(name)
    return `_${name}`
  }

  identifiers: Record<string, number> = Object.create(null)
  withId = <T>(fn: () => T, ids: string[]): T => {
    const { identifiers } = this
    for (const id of ids) {
      if (identifiers[id] === undefined) identifiers[id] = 0
      identifiers[id]!++
    }

    const ret = fn()
    ids.forEach(id => identifiers[id]!--)

    return ret
  }
  effectOverride?: (effects: IREffect[]) => CodeFragment[]

  constructor(ir: RootIRNode, options: CodegenOptions) {
    const defaultOptions = {
      mode: 'function',
      prefixIdentifiers: options.mode === 'module',
      sourceMap: false,
      filename: `template.vue.html`,
      scopeId: null,
      optimizeImports: false,
      runtimeGlobalName: `Vue`,
      runtimeModuleName: `vue`,
      ssrRuntimeModuleName: 'vue/server-renderer',
      ssr: false,
      isTS: false,
      inSSR: false,
      inline: false,
      bindingMetadata: {},
      expressionPlugins: [],
    }
    this.options = extend(defaultOptions, options)
    this.source = ir.source

    const [code, push] = buildCodeFragment()
    this.code = code
    this.push = push

    const {
      options: { filename, sourceMap },
    } = this
    if (!__BROWSER__ && sourceMap) {
      // lazy require source-map implementation, only in non-browser builds
      this.map = new SourceMapGenerator()
      this.map.setSourceContent(filename, this.source)
      this.map._sources.add(filename)
    }
  }
}

export interface VaporCodegenResult extends BaseCodegenResult {
  ast: RootIRNode
  helpers: Set<string>
  vaporHelpers: Set<string>
}

// IR -> JS codegen
export function generate(
  ir: RootIRNode,
  options: CodegenOptions = {},
): VaporCodegenResult {
  const ctx = new CodegenContext(ir, options)
  const { push, withIndent, newline, helpers, vaporHelpers } = ctx

  const functionName = 'render'
  const isSetupInlined = !!options.inline
  if (isSetupInlined) {
    push(`(() => {`)
  } else {
    push(
      // placeholder for preamble
      newline(),
      newline(),
      `export function ${functionName}(_ctx) {`,
    )
  }

  withIndent(() => {
    ir.template.forEach((template, i) => push(...genTemplate(template, i, ctx)))
    push(...genBlockFunctionContent(ir, ctx))
  })

  push(newline())
  if (isSetupInlined) {
    push('})()')
  } else {
    push('}')
  }

  let preamble = ''
  if (vaporHelpers.size)
    // TODO: extract import codegen
    preamble = `import { ${[...vaporHelpers]
      .map(h => `${h} as _${h}`)
      .join(', ')} } from 'vue/vapor';`
  if (helpers.size)
    preamble = `import { ${[...helpers]
      .map(h => `${h} as _${h}`)
      .join(', ')} } from 'vue';`

  let codegen = genCodeFragment(ctx)
  if (!isSetupInlined) {
    codegen = preamble + codegen
  }

  return {
    code: codegen,
    ast: ir,
    preamble,
    map: ctx.map ? ctx.map.toJSON() : undefined,
    helpers,
    vaporHelpers,
  }
}

function genCodeFragment(context: CodegenContext) {
  let codegen = ''
  let line = 1
  let column = 1
  let offset = 0

  for (let frag of context.code) {
    if (!frag) continue
    if (isString(frag)) frag = [frag]

    let [code, newlineIndex = NewlineType.None, loc, name] = frag
    codegen += code

    if (!__BROWSER__ && context.map) {
      if (loc) addMapping(loc.start, name)
      if (newlineIndex === NewlineType.Unknown) {
        // multiple newlines, full iteration
        advancePositionWithMutation({ line, column, offset }, code)
      } else {
        // fast paths
        offset += code.length
        if (newlineIndex === NewlineType.None) {
          // no newlines; fast path to avoid newline detection
          if (__TEST__ && code.includes('\n')) {
            throw new Error(
              `CodegenContext.push() called newlineIndex: none, but contains` +
                `newlines: ${code.replace(/\n/g, '\\n')}`,
            )
          }
          column += code.length
        } else {
          // single newline at known index
          if (newlineIndex === NewlineType.End) {
            newlineIndex = code.length - 1
          }
          if (
            __TEST__ &&
            (code.charAt(newlineIndex) !== '\n' ||
              code.slice(0, newlineIndex).includes('\n') ||
              code.slice(newlineIndex + 1).includes('\n'))
          ) {
            throw new Error(
              `CodegenContext.push() called with newlineIndex: ${newlineIndex} ` +
                `but does not conform: ${code.replace(/\n/g, '\\n')}`,
            )
          }
          line++
          column = code.length - newlineIndex
        }
      }
      if (loc && loc !== locStub) {
        addMapping(loc.end)
      }
    }
  }

  return codegen

  function addMapping(loc: Position, name: string | null = null) {
    // we use the private property to directly add the mapping
    // because the addMapping() implementation in source-map-js has a bunch of
    // unnecessary arg and validation checks that are pure overhead in our case.
    const { _names, _mappings } = context.map!
    if (name !== null && !_names.has(name)) _names.add(name)
    _mappings.add({
      originalLine: loc.line,
      originalColumn: loc.column - 1, // source-map column is 0 based
      generatedLine: line,
      generatedColumn: column - 1,
      source: context.options.filename,
      // @ts-expect-error it is possible to be null
      name,
    })
  }
}

export function buildCodeFragment() {
  const frag: CodeFragment[] = []
  const push = frag.push.bind(frag)
  return [frag, push] as const
}
