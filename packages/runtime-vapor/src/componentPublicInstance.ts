import { Data, IfAny, Prettify, hasOwn } from '@vue/shared'
import { type ComponentInternalInstance } from './component'
import { ShallowUnwrapRef, UnwrapNestedRefs } from '@vue/reactivity'
import { WatchOptions, WatchStopHandle } from './apiWatch'
import { nextTick } from '.'

export type ComponentPublicInstance<
  P = {}, // props type extracted from props option
  B = {}, // raw bindings returned from setup()
  D = {}, // return from data()
  // TODO: not ready yet

  // C extends ComputedOptions = {},
  // M extends MethodOptions = {},
  // E extends EmitsOptions = {},
  // PublicProps = P,
  // Defaults = {},
  // MakeDefaultsOptional extends boolean = false,
  // Options = ComponentOptionsBase<any, any, any, any, any, any, any, any, any>,
  // I extends ComponentInjectOptions = {},
  // S extends SlotsType = {}
> = {}

export interface ComponentRenderContext {
  [key: string]: any
  _: ComponentInternalInstance
}

export const PublicInstanceProxyHandlers: ProxyHandler<any> = {
  get({ _: instance }: ComponentRenderContext, key: string) {
    let normalizedProps
    const { setupState, props } = instance
    if (hasOwn(setupState, key)) {
      return setupState[key]
    } else if (
      (normalizedProps = instance.propsOptions[0]) &&
      hasOwn(normalizedProps, key)
    ) {
      return props![key]
    }
  },
}
