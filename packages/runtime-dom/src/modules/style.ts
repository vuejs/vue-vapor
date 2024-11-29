import { isString } from '@vue/shared'
import { warn } from '@vue/runtime-core'
import { type Style, setStyle } from '@vue/runtime-shared'
import {
  type VShowElement,
  vShowHidden,
  vShowOriginalDisplay,
} from '../directives/vShow'
import { CSS_VAR_TEXT } from '../helpers/useCssVars'

const displayRE = /(^|;)\s*display\s*:/

export function patchStyle(el: Element, prev: Style, next: Style): void {
  const style = (el as HTMLElement).style
  const isCssString = isString(next)
  let hasControlledDisplay = false
  if (next && !isCssString) {
    if (prev) {
      if (!isString(prev)) {
        for (const key in prev) {
          if (next[key] == null) {
            setStyle(style, key, '', warn)
          }
        }
      } else {
        for (const prevStyle of prev.split(';')) {
          const key = prevStyle.slice(0, prevStyle.indexOf(':')).trim()
          if (next[key] == null) {
            setStyle(style, key, '', warn)
          }
        }
      }
    }
    for (const key in next) {
      if (key === 'display') {
        hasControlledDisplay = true
      }
      setStyle(style, key, next[key], warn)
    }
  } else {
    if (isCssString) {
      if (prev !== next) {
        // #9821
        const cssVarText = (style as any)[CSS_VAR_TEXT]
        if (cssVarText) {
          ;(next as string) += ';' + cssVarText
        }
        style.cssText = next as string
        hasControlledDisplay = displayRE.test(next)
      }
    } else if (prev) {
      el.removeAttribute('style')
    }
  }
  // indicates the element also has `v-show`.
  if (vShowOriginalDisplay in el) {
    // make v-show respect the current v-bind style display when shown
    el[vShowOriginalDisplay] = hasControlledDisplay ? style.display : ''
    // if v-show is in hidden state, v-show has higher priority
    if ((el as VShowElement)[vShowHidden]) {
      style.display = 'none'
    }
  }
}
