import type { Data } from '@vue/shared'
import { EMPTY_OBJ } from '@vue/shared'
import { EffectScope, Ref, ref } from '@vue/reactivity'

import { Block } from './render'

import type {
  ComponentPropsOptions,
  NormalizedPropsOptions,
} from './componentProps'
import { normalizePropsOptions } from './componentProps'

import type { EmitFn, EmitsOptions, ObjectEmitsOptions } from './componentEmits'
import { emit, normalizeEmitsOptions } from './componentEmits'

import type { DirectiveBinding } from './directive'

export type Component = FunctionalComponent | ObjectComponent

export type SetupFn = (props: any, ctx: any) => Block | Data
export type FunctionalComponent = SetupFn & {
  props: ComponentPropsOptions
  emits: EmitsOptions
  render(ctx: any): Block
}
export interface ObjectComponent {
  props: ComponentPropsOptions
  emits: EmitsOptions
  setup?: SetupFn
  render(ctx: any): Block
}

export interface ComponentInternalInstance {
  uid: number
  container: ParentNode
  block: Block | null
  scope: EffectScope

  // conventional vnode.type
  component: FunctionalComponent | ObjectComponent
  rawProps: Data

  // normalized options
  propsOptions: NormalizedPropsOptions
  emitsOptions: ObjectEmitsOptions | null

  // TODO: type
  proxy: Data | null

  // state
  props: Data
  setupState: Data
  emit: EmitFn
  emitted: Record<string, boolean> | null

  /** directives */
  dirs: Map<Node, DirectiveBinding[]>

  // lifecycle
  get isMounted(): boolean
  isMountedRef: Ref<boolean>
  get isUnmounted(): boolean
  isUnmountedRef: Ref<boolean>
  // TODO: registory of provides, appContext, lifecycles, ...
}

// TODO
export let currentInstance: ComponentInternalInstance | null = null

export const getCurrentInstance: () => ComponentInternalInstance | null = () =>
  currentInstance

export const setCurrentInstance = (instance: ComponentInternalInstance) => {
  currentInstance = instance
}

export const unsetCurrentInstance = () => {
  currentInstance = null
}

let uid = 0
export const createComponentInstance = (
  component: ObjectComponent | FunctionalComponent,
  rawProps: Data,
): ComponentInternalInstance => {
  const isMountedRef = ref(false)
  const isUnmountedRef = ref(false)
  const instance: ComponentInternalInstance = {
    uid: uid++,
    block: null,
    container: null!, // set on mount
    scope: new EffectScope(true /* detached */)!,
    component,
    rawProps,

    // resolved props and emits options
    propsOptions: normalizePropsOptions(component),
    emitsOptions: normalizeEmitsOptions(component),

    // emit
    emit: null!, // to be set immediately
    emitted: null,

    proxy: null,

    // state
    props: EMPTY_OBJ,
    setupState: EMPTY_OBJ,

    dirs: new Map(),

    // lifecycle
    get isMounted() {
      return isMountedRef.value
    },
    isMountedRef,
    get isUnmounted() {
      return isUnmountedRef.value
    },
    isUnmountedRef,
    // TODO: registory of provides, appContext, lifecycles, ...
  }

  instance.emit = emit.bind(null, instance)

  return instance
}
