import { type Ref, EffectScope, ref } from '@vue/reactivity'
import type { Block } from './render'
import type { DirectiveBinding } from './directive'
import type { Data } from '@vue/shared'
import { LifecycleHooks } from './apiLifecycle'

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
  get isUnMounted(): boolean
  isMountedRef: Ref<boolean>
  isUnMountedRef: Ref<boolean>

  /** directives */
  dirs: Map<Node, DirectiveBinding[]>
  // TODO: registory of provides, appContext, lifecycles, ...
  /**
   * @internal
   */
  [LifecycleHooks.BEFORE_CREATE]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.CREATED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.BEFORE_MOUNT]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.MOUNTED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.BEFORE_UPDATE]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.UPDATED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.BEFORE_UNMOUNT]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.UNMOUNTED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.RENDER_TRACKED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.RENDER_TRIGGERED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.ACTIVATED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.DEACTIVATED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.ERROR_CAPTURED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.SERVER_PREFETCH]: LifecycleHook<() => Promise<unknown>>
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
  const isUnMountedRef = ref(false)
  const instance: ComponentInternalInstance = {
    uid: uid++,
    block: null,
    container: null!,
    scope: new EffectScope(true /* detached */)!,

    component,
    get isMounted() {
      return isMountedRef.value
    },
    get isUnMounted() {
      return isUnMountedRef.value
    },
    isMountedRef,
    isUnMountedRef,

    dirs: new Map(),
    // TODO: registory of provides, appContext, lifecycles, ...
    /**
     * @internal
     */
    [LifecycleHooks.BEFORE_CREATE]: null,
    /**
     * @internal
     */
    [LifecycleHooks.CREATED]: null,
    /**
     * @internal
     */
    [LifecycleHooks.BEFORE_MOUNT]: null,
    /**
     * @internal
     */
    [LifecycleHooks.MOUNTED]: null,
    /**
     * @internal
     */
    [LifecycleHooks.BEFORE_UPDATE]: null,
    /**
     * @internal
     */
    [LifecycleHooks.UPDATED]: null,
    /**
     * @internal
     */
    [LifecycleHooks.BEFORE_UNMOUNT]: null,
    /**
     * @internal
     */
    [LifecycleHooks.UNMOUNTED]: null,
    /**
     * @internal
     */
    [LifecycleHooks.RENDER_TRACKED]: null,
    /**
     * @internal
     */
    [LifecycleHooks.RENDER_TRIGGERED]: null,
    /**
     * @internal
     */
    [LifecycleHooks.ACTIVATED]: null,
    /**
     * @internal
     */
    [LifecycleHooks.DEACTIVATED]: null,
    /**
     * @internal
     */
    [LifecycleHooks.ERROR_CAPTURED]: null,
    /**
     * @internal
     */
    [LifecycleHooks.SERVER_PREFETCH]: null,
  }
  return instance
}
