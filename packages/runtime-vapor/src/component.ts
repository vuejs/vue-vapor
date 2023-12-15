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

import type { InternalSlots } from './componentSlots'

import type { DirectiveBinding } from './directive'

import { VaporLifecycleHooks } from './apiLifecycle'

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

type LifecycleHook<TFn = Function> = TFn[] | null

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
  attrs: Data
  slots: InternalSlots
  setupState: Data
  emit: EmitFn
  emitted: Record<string, boolean> | null

  /** directives */
  dirs: Map<Node, DirectiveBinding[]>

  // TODO: registory of provides, appContext, ...

  // lifecycle
  get isMounted(): boolean
  isMountedRef: Ref<boolean>
  get isUnmounted(): boolean
  isUnmountedRef: Ref<boolean>
  /**
   * @internal
   */
  [VaporLifecycleHooks.BEFORE_CREATE]: LifecycleHook
  /**
   * @internal
   */
  [VaporLifecycleHooks.CREATED]: LifecycleHook
  /**
   * @internal
   */
  [VaporLifecycleHooks.BEFORE_MOUNT]: LifecycleHook
  /**
   * @internal
   */
  [VaporLifecycleHooks.MOUNTED]: LifecycleHook
  /**
   * @internal
   */
  [VaporLifecycleHooks.BEFORE_UPDATE]: LifecycleHook
  /**
   * @internal
   */
  [VaporLifecycleHooks.UPDATED]: LifecycleHook
  /**
   * @internal
   */
  [VaporLifecycleHooks.BEFORE_UNMOUNT]: LifecycleHook
  /**
   * @internal
   */
  [VaporLifecycleHooks.UNMOUNTED]: LifecycleHook
  /**
   * @internal
   */
  [VaporLifecycleHooks.RENDER_TRACKED]: LifecycleHook
  /**
   * @internal
   */
  [VaporLifecycleHooks.RENDER_TRIGGERED]: LifecycleHook
  /**
   * @internal
   */
  [VaporLifecycleHooks.ACTIVATED]: LifecycleHook
  /**
   * @internal
   */
  [VaporLifecycleHooks.DEACTIVATED]: LifecycleHook
  /**
   * @internal
   */
  [VaporLifecycleHooks.ERROR_CAPTURED]: LifecycleHook
  /**
   * @internal
   */
  // [VaporLifecycleHooks.SERVER_PREFETCH]: LifecycleHook<() => Promise<unknown>>
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
    container: null!, // set on mountComponent
    scope: new EffectScope(true /* detached */)!,
    component,
    rawProps,

    // resolved props and emits options
    propsOptions: normalizePropsOptions(component),
    emitsOptions: normalizeEmitsOptions(component),

    proxy: null,

    // state
    props: EMPTY_OBJ,
    attrs: EMPTY_OBJ,
    slots: EMPTY_OBJ,
    setupState: EMPTY_OBJ,
    emit: null!, // to be set immediately
    emitted: null,

    dirs: new Map(),

    // TODO: registory of provides, appContext, ...

    // lifecycle
    get isMounted() {
      return isMountedRef.value
    },
    get isUnmounted() {
      return isUnmountedRef.value
    },
    isMountedRef,
    isUnmountedRef,
    /**
     * @internal
     */
    [VaporLifecycleHooks.BEFORE_CREATE]: null,
    /**
     * @internal
     */
    [VaporLifecycleHooks.CREATED]: null,
    /**
     * @internal
     */
    [VaporLifecycleHooks.BEFORE_MOUNT]: null,
    /**
     * @internal
     */
    [VaporLifecycleHooks.MOUNTED]: null,
    /**
     * @internal
     */
    [VaporLifecycleHooks.BEFORE_UPDATE]: null,
    /**
     * @internal
     */
    [VaporLifecycleHooks.UPDATED]: null,
    /**
     * @internal
     */
    [VaporLifecycleHooks.BEFORE_UNMOUNT]: null,
    /**
     * @internal
     */
    [VaporLifecycleHooks.UNMOUNTED]: null,
    /**
     * @internal
     */
    [VaporLifecycleHooks.RENDER_TRACKED]: null,
    /**
     * @internal
     */
    [VaporLifecycleHooks.RENDER_TRIGGERED]: null,
    /**
     * @internal
     */
    [VaporLifecycleHooks.ACTIVATED]: null,
    /**
     * @internal
     */
    [VaporLifecycleHooks.DEACTIVATED]: null,
    /**
     * @internal
     */
    [VaporLifecycleHooks.ERROR_CAPTURED]: null,
    /**
     * @internal
     */
    // [VaporLifecycleHooks.SERVER_PREFETCH]: null,
  }

  instance.emit = emit.bind(null, instance)

  return instance
}
