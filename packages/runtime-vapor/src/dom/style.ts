import { isString, normalizeStyle } from '@vue/shared'
import { type Style, setStyle as setStyleValue } from '@vue/runtime-shared'
import { warn } from '../warning'
import { recordPropMetadata } from '../componentMetadata'
import { mergeInheritAttr } from './prop'

export function setStyle(el: HTMLElement, value: any, root?: boolean): void {
  const prev = recordPropMetadata(
    el,
    'style',
    (value = normalizeStyle(root ? mergeInheritAttr('style', value) : value)),
  )
  patchStyle(el, prev, value)
}

function patchStyle(el: Element, prev: Style, next: Style) {
  const style = (el as HTMLElement).style
  const isCssString = isString(next)
  if (next && !isCssString) {
    if (prev && !isString(prev)) {
      for (const key in prev) {
        if (next[key] == null) {
          setStyleValue(style, key, '', warn)
        }
      }
    }

    for (const key in next) {
      setStyleValue(style, key, next[key], warn)
    }
  } else {
    if (isCssString) {
      // TODO: combine with v-show
      if (prev !== next) {
        style.cssText = next
      }
    } else if (prev) {
      el.removeAttribute('style')
    }
  }
}
