import { isArray, isFunction } from '@vue/shared'
import {
  type ComponentInternalInstance,
  currentInstance,
  isComponentInstance,
} from './component'
import { pauseTracking, resetTracking, traverse } from '@vue/reactivity'
import { VaporErrorCodes, callWithAsyncErrorHandling } from './errorHandling'
import { renderEffect } from './renderEffect'
import { type Block, fragmentKey } from './apiRender'
import { warn } from './warning'

export type DirectiveModifiers<M extends string = string> = Record<M, boolean>

export interface DirectiveBinding<V = any, M extends string = string> {
  instance: ComponentInternalInstance
  source?: () => V
  value: V
  oldValue: V | null
  arg?: string
  modifiers?: DirectiveModifiers<M>
  dir: ObjectDirective<any, V>
}

export type DirectiveHook<
  T = any | null,
  V = any,
  M extends string = string,
> = (node: T, binding: DirectiveBinding<V, M>) => void

// create node -> `created` -> node operation -> `beforeMount` -> node mounted -> `mounted`
// effect update -> `beforeUpdate` -> node updated -> `updated`
// `beforeUnmount`-> node unmount -> `unmounted`
export type DirectiveHookName =
  | 'created'
  | 'beforeMount'
  | 'mounted'
  | 'beforeUpdate'
  | 'updated'
  | 'beforeUnmount'
  | 'unmounted'
export type ObjectDirective<T = any, V = any, M extends string = string> = {
  [K in DirectiveHookName]?: DirectiveHook<T, V, M> | undefined
} & {
  /** Watch value deeply */
  deep?: boolean
}

export type FunctionDirective<
  T = any,
  V = any,
  M extends string = string,
> = DirectiveHook<T, V, M>

export type Directive<T = any, V = any, M extends string = string> =
  | ObjectDirective<T, V, M>
  | FunctionDirective<T, V, M>

export type DirectiveArguments = Array<
  | [Directive | undefined]
  | [Directive | undefined, () => any]
  | [Directive | undefined, () => any, argument: string]
  | [
      Directive | undefined,
      value: () => any,
      argument: string,
      modifiers: DirectiveModifiers,
    ]
>

export function withDirectives<T extends ComponentInternalInstance | Node>(
  node: T,
  directives: DirectiveArguments,
): T {
  if (!currentInstance) {
    __DEV__ && warn(`withDirectives can only be used inside render functions.`)
    return node
  }

  let realNode: Node

  const instance = currentInstance

  if (isComponentInstance(node)) {
    let root = normalizeNode(node.block)
    if (!root) return node
    realNode = root
  } else {
    realNode = node
  }

  if (!instance.dirs.has(realNode)) instance.dirs.set(realNode, [])
  const bindings = instance.dirs.get(realNode)!

  for (const directive of directives) {
    let [dir, source, arg, modifiers] = directive
    if (!dir) continue
    if (isFunction(dir)) {
      dir = {
        mounted: dir,
        updated: dir,
      } satisfies ObjectDirective
    }

    const binding: DirectiveBinding = {
      dir,
      instance,
      source,
      value: null, // set later
      oldValue: undefined,
      arg,
      modifiers,
    }
    bindings.push(binding)

    callDirectiveHook(realNode, binding, instance, 'created')

    // register source
    if (source) {
      if (dir.deep) {
        const deep = dir.deep === true ? undefined : dir.deep
        const baseSource = source
        source = () => traverse(baseSource(), deep)
      }
      renderEffect(source)
    }
  }

  return node

  function normalizeNode(block: Block | null) {
    if (!block) return

    if (isArray(block)) {
      __DEV__ &&
        warn(
          `Runtime directive used on component with non-element root node. ` +
            `The directives will not function as intended.`,
        )
      return
    }

    if (block instanceof Node || fragmentKey in block) {
      return block as Node
    } else {
      return normalizeNode(block.block)
    }
  }
}

export function invokeDirectiveHook(
  instance: ComponentInternalInstance | null,
  name: DirectiveHookName,
  nodes?: IterableIterator<Node>,
) {
  if (!instance) return
  nodes = nodes || instance.dirs.keys()
  for (const node of nodes) {
    const directives = instance.dirs.get(node) || []
    for (const binding of directives) {
      callDirectiveHook(node, binding, instance, name)
    }
  }
}

function callDirectiveHook(
  node: Node,
  binding: DirectiveBinding,
  instance: ComponentInternalInstance | null,
  name: DirectiveHookName,
) {
  if (name === 'beforeUpdate') binding.oldValue = binding.value
  const { dir } = binding
  const hook = dir[name]
  if (!hook) return

  const newValue = binding.source ? binding.source() : undefined
  binding.value = newValue
  // disable tracking inside all lifecycle hooks
  // since they can potentially be called inside effects.
  pauseTracking()
  callWithAsyncErrorHandling(hook, instance, VaporErrorCodes.DIRECTIVE_HOOK, [
    node,
    binding,
  ])
  resetTracking()
}
