import { camelize, capitalize } from '@vue/shared'
import {
  type ComponentInternalInstance,
  currentInstance,
  getComponentName,
} from '../component'
import { warn } from '../warning'

const resolve = (registry: Record<string, any> | undefined, name: string) => {
  return (
    registry &&
    (registry[name] ||
      registry[camelize(name)] ||
      registry[capitalize(camelize(name))])
  )
}

export function resolveComponent(
  name: string,
  warnMissing = true,
  maybeSelfReference = false,
) {
  const instance = currentInstance
  if (!instance?.component) {
    if (__DEV__) {
      warn(`resolveComponent ` + `can only be used in render() or setup().`)
    }
    return
  }
  const component = instance.component
  const selfName = getComponentName(component)
  if (
    selfName &&
    (selfName === name ||
      selfName === camelize(name) ||
      selfName === capitalize(camelize(name)))
  ) {
    return component
  }
  const registry =
    instance.components ?? (component as ComponentInternalInstance).component
  const res =
    resolve(registry, name) || resolve(instance.appContext.components, name)
  if (!res && maybeSelfReference) {
    return component
  }
  if (__DEV__ && warnMissing && !res) {
    const extra =
      `\nIf this is a native custom element, make sure to exclude it from ` +
      `component resolution via compilerOptions.isCustomElement.`
    warn(`Failed to resolve component: ${name}${extra}`)
  }
  return res
  // // TODO
}

export function resolveDirective() {
  // TODO
}
