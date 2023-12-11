import { extend, hasOwn } from '@vue/shared'
import { TrackOpTypes, track } from '@vue/reactivity'
import { type ComponentInternalInstance } from './component'

export type PublicPropertiesMap = Record<
  string,
  (i: ComponentInternalInstance) => any
>

export const publicPropertiesMap: PublicPropertiesMap = extend(
  Object.create(null),
  {
    $: (i) => i.proxy,
    $props: (i) => i.props,
    $attrs: (i) => i.attrs,
    $emit: (i) => i.emit,
    $slots: (i) => i.slots,
    // TODO: others
  } as PublicPropertiesMap,
)

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

    const publicGetter = publicPropertiesMap[key]
    if (publicGetter) {
      if (key === '$attrs') {
        track(instance, TrackOpTypes.GET, key)
      }
      return publicGetter(instance)
    } else {
      // TODO: css modules, global properties, ...
    }
  },
}
