import {EffectScope, isRef, Ref, ref} from '@vue/reactivity'

import {EMPTY_OBJ, isArray} from '@vue/shared'
import { Block } from './render'
import { type DirectiveBinding } from './directive'
import {
  type ComponentPropsOptions,
  type NormalizedPropsOptions,
  normalizePropsOptions,
} from './componentProps'

import type { Data } from '@vue/shared'
import { VaporLifecycleHooks } from './apiLifecycle'
import { warn } from "@vue/runtime-core";

export type Component = FunctionalComponent | ObjectComponent

export type SetupFn = (props: any, ctx: any) => Block | Data
export type FunctionalComponent = SetupFn & {
  props: ComponentPropsOptions
  render(ctx: any): Block
}
export interface ObjectComponent {
  props: ComponentPropsOptions
  setup?: SetupFn
  render(ctx: any): Block
}

type LifecycleHook<TFn = Function> = TFn[] | null

export interface ComponentInternalInstance {
  uid: number
  container: ParentNode
  block: Block | null
  scope: EffectScope
  component: FunctionalComponent | ObjectComponent
  propsOptions: NormalizedPropsOptions

  // TODO: type
  proxy: Data | null

  // state
  props: Data
  setupState: Data

  // exposed properties via expose()
  exposed: Record<string, any> | null
  exposeProxy: Record<string, any> | null

  /** directives */
  dirs: Map<Node, DirectiveBinding[]>

  // lifecycle
  get isMounted(): boolean
  get isUnmounted(): boolean
  isUnmountedRef: Ref<boolean>
  isMountedRef: Ref<boolean>
  // TODO: registory of provides, appContext, lifecycles, ...
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

// TODO: Maybe it can be reused
// TODO: https://github.com/vuejs/core/blob/04d2c05054c26b02fbc1d84839b0ed5cd36455b6/packages/runtime-core/src/component.ts#L186C1-L186C1
export type SetupContext = {
  expose: (exposed?: Record<string, any>) => void
}

// TODO: Maybe it can be reused
// TODO: https://github.com/vuejs/core/blob/04d2c05054c26b02fbc1d84839b0ed5cd36455b6/packages/runtime-core/src/component.ts#L983
export function createSetupContext(
  instance: ComponentInternalInstance
): SetupContext {
  const expose: SetupContext['expose'] = exposed => {
    if (__DEV__) {
      if (instance.exposed) {
        warn(`expose() should be called only once per setup().`)
      }
      if (exposed != null) {
        let exposedType: string = typeof exposed
        if (exposedType === 'object') {
          if (isArray(exposed)) {
            exposedType = 'array'
          } else if (isRef(exposed)) {
            exposedType = 'ref'
          }
        }
        if (exposedType !== 'object') {
          warn(
            `expose() should be passed a plain object, received ${exposedType}.`
          )
        }
      }
    }
    instance.exposed = exposed || {}
  }

  if (__DEV__) {
    // We use getters in dev in case libs like test-utils overwrite instance
    // properties (overwrites should not be done in prod)
    return Object.freeze({
      expose
    })
  } else {
    return {
      expose
    }
  }
}

let uid = 0
export const createComponentInstance = (
  component: ObjectComponent | FunctionalComponent,
): ComponentInternalInstance => {
  const isMountedRef = ref(false)
  const isUnmountedRef = ref(false)
  const instance: ComponentInternalInstance = {
    uid: uid++,
    block: null,
    container: null!, // set on mountComponent
    scope: new EffectScope(true /* detached */)!,
    component,

    // resolved props and emits options
    propsOptions: normalizePropsOptions(component),
    // emitsOptions: normalizeEmitsOptions(type, appContext), // TODO:
    proxy: null,

    // state
    props: EMPTY_OBJ,
    setupState: EMPTY_OBJ,

    // exposed properties via expose()
    exposed: null,
    exposeProxy: null,

    dirs: new Map(),

    // lifecycle
    get isMounted() {
      return isMountedRef.value
    },
    get isUnmounted() {
      return isUnmountedRef.value
    },
    isMountedRef,
    isUnmountedRef,
    // TODO: registory of provides, appContext, lifecycles, ...
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
  return instance
}
