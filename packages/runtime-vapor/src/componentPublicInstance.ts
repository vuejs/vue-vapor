import {
  EMPTY_OBJ,
  type IfAny,
  type Prettify,
  extend,
  hasOwn,
} from '@vue/shared'
import type { ComponentInternalInstance } from './component'
import { warn } from './warning'
import type { Data } from '@vue/runtime-shared'
import { type ShallowUnwrapRef, shallowReadonly } from '@vue/reactivity'
import type { EmitFn, EmitsOptions } from './componentEmits'
import type { ComponentCustomProperties } from './apiCreateVaporApp'
import type { SlotsType, UnwrapSlotsType } from './componentSlots'

export type InjectToObject<T extends ComponentInjectOptions> =
  T extends string[]
    ? {
        [K in T[number]]?: unknown
      }
    : T extends ObjectInjectOptions
      ? {
          [K in keyof T]?: unknown
        }
      : never

export type ComponentInjectOptions = string[] | ObjectInjectOptions

type ObjectInjectOptions = Record<
  string | symbol,
  string | symbol | { from?: string | symbol; default?: unknown }
>

export type ExposedKeys<
  T,
  Exposed extends string & keyof T,
> = '' extends Exposed ? T : Pick<T, Exposed>

// in templates (as `this` in the render option)
export type ComponentPublicInstance<
  P = {}, // props type extracted from props option
  B = {}, // raw bindings returned from setup()
  E extends EmitsOptions = {},
  PublicProps = P,
  Defaults = {},
  MakeDefaultsOptional extends boolean = false,
  I extends ComponentInjectOptions = {},
  S extends SlotsType = {},
  Exposed extends string = '',
> = {
  $: ComponentInternalInstance
  $props: MakeDefaultsOptional extends true
    ? Partial<Defaults> & Omit<Prettify<P> & PublicProps, keyof Defaults>
    : Prettify<P> & PublicProps
  $attrs: Data
  $refs: Data
  $slots: UnwrapSlotsType<S>
  $parent: ComponentPublicInstance | null
  $emit: EmitFn<E>
} & ExposedKeys<
  IfAny<P, P, Omit<P, keyof ShallowUnwrapRef<B>>> &
    ShallowUnwrapRef<B> &
    ComponentCustomProperties &
    InjectToObject<I>,
  Exposed
>

export let shouldCacheAccess = true

export type PublicPropertiesMap = Record<
  string,
  (i: ComponentInternalInstance) => any
>

export const publicPropertiesMap: PublicPropertiesMap = extend(
  Object.create(null),
  {
    $: i => i,
    $props: i => (__DEV__ ? shallowReadonly(i.props) : i.props),
    $attrs: i => (__DEV__ ? shallowReadonly(i.attrs) : i.attrs),
    $slots: i => (__DEV__ ? shallowReadonly(i.slots) : i.slots),
    $refs: i => (__DEV__ ? shallowReadonly(i.refs) : i.refs),
    $emit: i => i.emit,
  } as PublicPropertiesMap,
)

enum AccessTypes {
  OTHER,
  SETUP,
  PROPS,
  CONTEXT,
}

export interface ComponentRenderContext {
  [key: string]: any
  _: ComponentInternalInstance
}

const hasSetupBinding = (state: Data, key: string) =>
  state !== EMPTY_OBJ && hasOwn(state, key)

export const PublicInstanceProxyHandlers: ProxyHandler<any> = {
  get({ _: instance }: ComponentRenderContext, key: string) {
    const { ctx, setupState, props, accessCache, appContext } = instance

    // for internal formatters to know that this is a Vue instance
    if (__DEV__ && key === '__isVue') {
      return true
    }

    let normalizedProps
    if (key[0] !== '$') {
      const n = accessCache![key]
      if (n !== undefined) {
        switch (n) {
          case AccessTypes.SETUP:
            return setupState[key]
          case AccessTypes.CONTEXT:
            return ctx[key]
          case AccessTypes.PROPS:
            return props![key]
        }
      } else if (hasSetupBinding(setupState, key)) {
        accessCache![key] = AccessTypes.SETUP
        return setupState[key]
      } else if (
        // only cache other properties when instance has declared (thus stable)
        // props
        (normalizedProps = instance.propsOptions[0]) &&
        hasOwn(normalizedProps, key)
      ) {
        accessCache![key] = AccessTypes.PROPS
        return props![key]
      } else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
        accessCache![key] = AccessTypes.CONTEXT
        return ctx[key]
      } else if (!__FEATURE_OPTIONS_API__ || shouldCacheAccess) {
        accessCache![key] = AccessTypes.OTHER
      }
    }

    const publicGetter = publicPropertiesMap[key]
    let globalProperties
    // public $xxx properties
    if (publicGetter) {
      return publicGetter(instance)
    } else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
      // user may set custom properties to `this` that start with `$`
      accessCache![key] = AccessTypes.CONTEXT
      return ctx[key]
    } else if (
      // global properties
      ((globalProperties = appContext.config.globalProperties),
      hasOwn(globalProperties, key))
    ) {
      return globalProperties[key]
    }
  },

  set(
    { _: instance }: ComponentRenderContext,
    key: string,
    value: any,
  ): boolean {
    const { setupState, ctx } = instance
    if (hasSetupBinding(setupState, key)) {
      setupState[key] = value
      return true
    } else if (
      __DEV__ &&
      setupState.__isScriptSetup &&
      hasOwn(setupState, key)
    ) {
      warn(`Cannot mutate <script setup> binding "${key}" from Options API.`)
      return false
    } else if (hasOwn(instance.props, key)) {
      __DEV__ && warn(`Attempting to mutate prop "${key}". Props are readonly.`)
      return false
    }
    if (key[0] === '$' && key.slice(1) in instance) {
      __DEV__ &&
        warn(
          `Attempting to mutate public property "${key}". ` +
            `Properties starting with $ are reserved and readonly.`,
        )
      return false
    } else {
      if (__DEV__ && key in instance.appContext.config.globalProperties) {
        Object.defineProperty(ctx, key, {
          enumerable: true,
          configurable: true,
          value,
        })
      } else {
        ctx[key] = value
      }
    }
    return true
  },

  has(
    {
      _: { setupState, accessCache, ctx, appContext, propsOptions },
    }: ComponentRenderContext,
    key: string,
  ) {
    let normalizedProps
    return (
      !!accessCache![key] ||
      hasSetupBinding(setupState, key) ||
      ((normalizedProps = propsOptions[0]) && hasOwn(normalizedProps, key)) ||
      hasOwn(ctx, key) ||
      hasOwn(publicPropertiesMap, key) ||
      hasOwn(appContext.config.globalProperties, key)
    )
  },

  defineProperty(
    target: ComponentRenderContext,
    key: string,
    descriptor: PropertyDescriptor,
  ) {
    if (descriptor.get != null) {
      // invalidate key cache of a getter based property #5417
      target._.accessCache![key] = 0
    } else if (hasOwn(descriptor, 'value')) {
      this.set!(target, key, descriptor.value, null)
    }
    return Reflect.defineProperty(target, key, descriptor)
  },
}
