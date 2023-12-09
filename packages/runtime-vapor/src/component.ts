import { type Ref, EffectScope, ref } from '@vue/reactivity'
import type { Block } from './render'
import type { DirectiveBinding } from './directive'
import type { Data } from '@vue/shared'
import { VaporLifecycleHooks } from './apiLifecycle'

export type SetupFn = (props: any, ctx: any) => Block | Data
export type FunctionalComponent = SetupFn & {
  render(ctx: any): Block
}
export interface ObjectComponent {
  setup: SetupFn
  render(ctx: any): Block
}
type LifecycleHook<TFn = Function> = TFn[] | null
export interface ComponentInternalInstance {
  uid: number
  container: ParentNode
  block: Block | null
  scope: EffectScope

  component: FunctionalComponent | ObjectComponent
  get isMounted(): boolean
  get isUnmounted(): boolean
  isMountedRef: Ref<boolean>
  isUnmountedRef: Ref<boolean>

  /** directives */
  dirs: Map<Node, DirectiveBinding[]>
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
  [VaporLifecycleHooks.SERVER_PREFETCH]: LifecycleHook<() => Promise<unknown>>
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
): ComponentInternalInstance => {
  const isMountedRef = ref(false)
  const isUnmountedRef = ref(false)
  const instance: ComponentInternalInstance = {
    uid: uid++,
    block: null,
    container: null!,
    scope: new EffectScope(true /* detached */)!,

    component,
    get isMounted() {
      return isMountedRef.value
    },
    get isUnmounted() {
      return isUnmountedRef.value
    },
    isMountedRef,
    isUnmountedRef,

    dirs: new Map(),
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
    [VaporLifecycleHooks.SERVER_PREFETCH]: null,
  }
  return instance
}
