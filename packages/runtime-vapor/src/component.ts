import { EffectScope } from '@vue/reactivity'
import { EMPTY_OBJ } from '@vue/shared'
import { Block, BlockFn } from './render'
import { DirectiveBinding } from './directives'
import {
  ComponentPropsOptions,
  NormalizedPropsOptions,
  normalizePropsOptions,
} from './componentProps'

// Conventional ConcreteComponent
export interface Component<P = {}> {
  props?: ComponentPropsOptions<P>
  blockFn: BlockFn
}

export interface ComponentInternalInstance {
  uid: number
  container: ParentNode
  block: Block | null
  scope: EffectScope

  blockFn: BlockFn
  propsOptions: NormalizedPropsOptions

  // state
  props: Data

  /** directives */
  dirs: Map<Node, DirectiveBinding[]>

  // lifecycle
  isMounted: boolean
  // TODO: registory of provides, appContext, lifecycles, ...
}

// TODO
export let currentInstance: ComponentInternalInstance | null = null

export const getCurrentInstance: () => ComponentInternalInstance | null = () =>
  currentInstance

export const setCurrentInstance = (instance: ComponentInternalInstance) => {
  currentInstance = instance
  instance.scope.on()
}

export const unsetCurrentInstance = () => {
  currentInstance && currentInstance.scope.off()
  currentInstance = null
}

export interface ComponentPublicInstance {}

let uid = 0
export const createComponentInstance = (
  component: Component,
): ComponentInternalInstance => {
  const instance: ComponentInternalInstance = {
    uid: uid++,
    block: null,
    container: null!, // set on mount
    scope: new EffectScope(true /* detached */)!,
    blockFn: component.blockFn,

    // resolved props and emits options
    propsOptions: normalizePropsOptions(component),
    // emitsOptions: normalizeEmitsOptions(type, appContext), // TODO:

    // state
    props: EMPTY_OBJ,

    dirs: new Map(),

    // lifecycle hooks
    isMounted: false,
    // TODO: registory of provides, appContext, lifecycles, ...
  }
  return instance
}

// FIXME: duplicated with runtime-core
export type Data = Record<string, unknown>
