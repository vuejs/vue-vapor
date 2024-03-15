import {
  type Data,
  EMPTY_ARR,
  EMPTY_OBJ,
  camelize,
  extend,
  hasOwn,
  hyphenate,
  isArray,
  isFunction,
} from '@vue/shared'
import { warn } from './warning'
import {
  type Component,
  type ComponentInternalInstance,
  setCurrentInstance,
} from './component'
import { isEmitListener } from './componentEmits'

export type ComponentPropsOptions<P = Data> =
  | ComponentObjectPropsOptions<P>
  | string[]

export type ComponentObjectPropsOptions<P = Data> = {
  [K in keyof P]: Prop<P[K]> | null
}

export type Prop<T, D = T> = PropOptions<T, D> | PropType<T>

type DefaultFactory<T> = (props: Data) => T | null | undefined

export interface PropOptions<T = any, D = T> {
  type?: PropType<T> | true | null
  required?: boolean
  default?: D | DefaultFactory<D> | null | undefined | object
  validator?(value: unknown, props: Data): boolean
  /**
   * @internal
   */
  skipFactory?: boolean
}

export type PropType<T> = PropConstructor<T> | PropConstructor<T>[]

type PropConstructor<T = any> =
  | { new (...args: any[]): T & {} }
  | { (): T }
  | PropMethod<T>

type PropMethod<T, TConstructor = any> = [T] extends [
  ((...args: any) => any) | undefined,
] // if is function with args, allowing non-required functions
  ? { new (): TConstructor; (): T; readonly prototype: TConstructor } // Create Function like constructor
  : never

enum BooleanFlags {
  shouldCast,
  shouldCastTrue,
}

type NormalizedProp =
  | null
  | (PropOptions & {
      [BooleanFlags.shouldCast]?: boolean
      [BooleanFlags.shouldCastTrue]?: boolean
    })

export type NormalizedProps = Record<string, NormalizedProp>
export type NormalizedPropsOptions =
  | [props: NormalizedProps, needCastKeys: string[]]
  | []

type StaticProps = Record<string, () => unknown>
type RestProps = () => Data
export type RawProps =
  | [staticProps?: StaticProps, restProps?: RestProps]
  | StaticProps
  | null

export function initProps(
  instance: ComponentInternalInstance,
  rawProps: RawProps,
  isStateful: boolean,
) {
  const props: Data = {}
  const attrs: Data = {}

  let staticProps: StaticProps | undefined
  let restProps: (() => Data) | undefined

  if (rawProps) {
    if (isArray(rawProps)) {
      ;[staticProps, restProps] = rawProps
    } else {
      staticProps = rawProps
    }
  }

  const [options, needCastKeys] = instance.propsOptions

  if (staticProps) {
    for (const key in staticProps) {
      registerProp(key, staticProps[key])
    }
  }

  // ensure all declared prop keys are present
  if (options) {
    for (const key in options) {
      if (!(key in props)) {
        if (restProps) {
          const getter = () => {
            const rest = restProps!()
            return key in rest ? rest[key] : rest[hyphenate(key)]
          }
          registerProp(key, getter)
        } else {
          props[key] = undefined
        }
      }
    }

    // validation
    if (__DEV__) {
      validateProps(staticProps, restProps, props, options)
    }
  }

  if (isStateful) {
    instance.props = props
  } else {
    // functional w/ optional props, props === attrs
    instance.props = instance.propsOptions === EMPTY_ARR ? attrs : props
  }
  instance.attrs = attrs

  function registerProp(rawKey: string, getter: () => any) {
    const key = camelize(rawKey)
    if (options && hasOwn(options, key)) {
      const getterWithCast =
        needCastKeys && needCastKeys.includes(key)
          ? () =>
              resolvePropValue(
                options!,
                props,
                rawKey,
                getter(),
                instance,
                (!rawProps || !hasOwn(rawProps, rawKey)) &&
                  (!restProps || !hasOwn(restProps(), rawKey)),
              )
          : getter

      Object.defineProperty(props, key, {
        get: getterWithCast,
        enumerable: true,
      })
    } else if (!isEmitListener(instance.emitsOptions, rawKey)) {
      Object.defineProperty(attrs, rawKey, {
        get: getter,
        enumerable: true,
      })
    }
  }
}

function resolvePropValue(
  options: NormalizedProps,
  props: Data,
  key: string,
  value: unknown,
  instance: ComponentInternalInstance,
  isAbsent: boolean,
) {
  const opt = options[key]
  if (opt != null) {
    const hasDefault = hasOwn(opt, 'default')
    // default values
    if (hasDefault && value === undefined) {
      const defaultValue = opt.default
      if (
        opt.type !== Function &&
        !opt.skipFactory &&
        isFunction(defaultValue)
      ) {
        // TODO: caching?
        // const { propsDefaults } = instance
        // if (key in propsDefaults) {
        //   value = propsDefaults[key]
        // } else {
        const reset = setCurrentInstance(instance)
        value = defaultValue.call(null, props)
        reset()
        // }
      } else {
        value = defaultValue
      }
    }
    // boolean casting
    if (opt[BooleanFlags.shouldCast]) {
      if (isAbsent && !hasDefault) {
        value = false
      } else if (
        opt[BooleanFlags.shouldCastTrue] &&
        (value === '' || value === hyphenate(key))
      ) {
        value = true
      }
    }
  }
  return value
}

export function normalizePropsOptions(comp: Component): NormalizedPropsOptions {
  // TODO: cahching?

  const raw = comp.props
  const normalized: NormalizedProps | undefined = {}
  const needCastKeys: NormalizedPropsOptions[1] = []

  if (!raw) {
    return EMPTY_ARR as []
  }

  if (isArray(raw)) {
    for (let i = 0; i < raw.length; i++) {
      const normalizedKey = camelize(raw[i])
      if (validatePropName(normalizedKey)) {
        normalized[normalizedKey] = EMPTY_OBJ
      }
    }
  } else {
    for (const key in raw) {
      const normalizedKey = camelize(key)
      if (validatePropName(normalizedKey)) {
        const opt = raw[key]
        const prop: NormalizedProp = (normalized[normalizedKey] =
          isArray(opt) || isFunction(opt) ? { type: opt } : extend({}, opt))
        if (prop) {
          const booleanIndex = getTypeIndex(Boolean, prop.type)
          const stringIndex = getTypeIndex(String, prop.type)
          prop[BooleanFlags.shouldCast] = booleanIndex > -1
          prop[BooleanFlags.shouldCastTrue] =
            stringIndex < 0 || booleanIndex < stringIndex
          // if the prop needs boolean casting or default value
          if (booleanIndex > -1 || hasOwn(prop, 'default')) {
            needCastKeys.push(normalizedKey)
          }
        }
      }
    }
  }

  const res: NormalizedPropsOptions = [normalized, needCastKeys]
  return res
}

function validatePropName(key: string) {
  if (key[0] !== '$') {
    return true
  }
  return false
}

function getType(ctor: Prop<any>): string {
  const match = ctor && ctor.toString().match(/^\s*(function|class) (\w+)/)
  return match ? match[2] : ctor === null ? 'null' : ''
}

function isSameType(a: Prop<any>, b: Prop<any>): boolean {
  return getType(a) === getType(b)
}

function getTypeIndex(
  type: Prop<any>,
  expectedTypes: PropType<any> | void | null | true,
): number {
  if (isArray(expectedTypes)) {
    return expectedTypes.findIndex(t => isSameType(t, type))
  } else if (isFunction(expectedTypes)) {
    return isSameType(expectedTypes, type) ? 0 : -1
  }
  return -1
}

/**
 * dev only
 */
function validateProps(
  staticProps: StaticProps | undefined,
  restProps: RestProps | undefined,
  props: Data,
  options: NormalizedProps,
) {
  for (const key in options) {
    const opt = options[key]
    const found =
      (staticProps && findKey(staticProps, key)) ||
      (restProps && findKey(restProps(), key))

    if (opt != null) validateProp(key, props[key], opt, props, !found)
  }
}

function findKey(obj: Data, key: string) {
  return Object.keys(obj).find(k => k !== '__rest' && camelize(k) === key)
}

/**
 * dev only
 */
function validateProp(
  name: string,
  value: unknown,
  option: PropOptions,
  props: Data,
  isAbsent: boolean,
) {
  const { required, validator } = option
  // required!
  if (required && isAbsent) {
    warn('Missing required prop: "' + name + '"')
    return
  }
  // missing but optional
  if (value == null && !required) {
    return
  }
  // NOTE: type check is not supported in vapor
  // // type check
  // if (type != null && type !== true) {
  //   let isValid = false
  //   const types = isArray(type) ? type : [type]
  //   const expectedTypes = []
  //   // value is valid as long as one of the specified types match
  //   for (let i = 0; i < types.length && !isValid; i++) {
  //     const { valid, expectedType } = assertType(value, types[i])
  //     expectedTypes.push(expectedType || '')
  //     isValid = valid
  //   }
  //   if (!isValid) {
  //     warn(getInvalidTypeMessage(name, value, expectedTypes))
  //     return
  //   }
  // }

  // custom validator
  if (validator && !validator(value, props)) {
    warn('Invalid prop: custom validator check failed for prop "' + name + '".')
  }
}
