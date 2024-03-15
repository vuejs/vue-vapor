import { isObject } from '@vue/shared'
import {
  type Component,
  type ComponentInternalInstance,
  createComponentInstance,
} from './component'
import { warn } from './warning'
import { version } from '.'
import { render, setupComponent, unmountComponent } from './apiRender'
import type { RawProps } from './componentProps'

export function createVaporApp(
  rootComponent: Component,
  rootProps: RawProps | null = null,
): App {
  if (rootProps != null && !isObject(rootProps)) {
    __DEV__ && warn(`root props passed to app.mount() must be an object.`)
    rootProps = null
  }

  let instance: ComponentInternalInstance

  const app: App = {
    version,
    mount(rootContainer): any {
      if (!instance) {
        instance = createComponentInstance(rootComponent, rootProps)
        setupComponent(instance)
        render(instance, rootContainer)
        return instance
      } else if (__DEV__) {
        warn(
          `App has already been mounted.\n` +
            `If you want to remount the same app, move your app creation logic ` +
            `into a factory function and create fresh app instances for each ` +
            `mount - e.g. \`const createMyApp = () => createApp(App)\``,
        )
      }
    },
    unmount() {
      if (instance) {
        unmountComponent(instance)
      } else if (__DEV__) {
        warn(`Cannot unmount an app that is not mounted.`)
      }
    },
  }

  return app
}

export interface App {
  version: string
  mount(
    rootContainer: Element | string,
    isHydrate?: boolean,
  ): ComponentInternalInstance
  unmount(): void
}
