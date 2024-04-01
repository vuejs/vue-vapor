import {
  type Ref,
  type SchedulerJob,
  isRef,
  onScopeDispose,
} from '@vue/reactivity'
import { currentInstance } from '../component'
import { VaporErrorCodes, callWithErrorHandling } from '../errorHandling'
import {
  EMPTY_OBJ,
  hasOwn,
  isArray,
  isFunction,
  isString,
  remove,
} from '@vue/shared'
import { warn } from '../warning'
import { queuePostRenderEffect } from '../scheduler'

export type NodeRef = string | Ref | ((ref: Element) => void)

/**
 * Function for handling a template ref
 */
export function setRef(el: Element, ref: NodeRef, ref_for = false) {
  if (!currentInstance) return
  const { setupState, isUnmounted } = currentInstance

  const value = isUnmounted ? null : el
  const refs =
    currentInstance.refs === EMPTY_OBJ
      ? (currentInstance.refs = {})
      : currentInstance.refs

  if (isFunction(ref)) {
    callWithErrorHandling(ref, currentInstance, VaporErrorCodes.FUNCTION_REF, [
      value,
      refs,
    ])
  } else {
    const _isString = isString(ref)
    const _isRef = isRef(ref)

    if (_isString || _isRef) {
      let isScopeDispose = false

      const doSet = () => {
        if (ref_for) {
          const existing = _isString
            ? hasOwn(setupState, ref)
              ? setupState[ref]
              : refs[ref]
            : ref.value
          if (isUnmounted || isScopeDispose) {
            isArray(existing) && remove(existing, value)
          } else {
            if (!isArray(existing)) {
              if (_isString) {
                refs[ref] = [value]
                if (hasOwn(setupState, ref)) {
                  setupState[ref] = refs[ref]
                }
              } else {
                ref.value = [value]
              }
            } else if (!existing.includes(value)) {
              existing.push(value)
            }
          }
        } else if (_isString) {
          refs[ref] = value
          if (hasOwn(setupState, ref)) {
            setupState[ref] = value
          }
        } else if (_isRef) {
          ref.value = value
        } else if (__DEV__) {
          warn('Invalid template ref type:', ref, `(${typeof ref})`)
        }
      }

      onScopeDispose(() => {
        isScopeDispose = true
        doSet()
        isScopeDispose = false
      })

      // #9908 ref on v-for mutates the same array for both mount and unmount
      // and should be done together
      if (isUnmounted /* || isVFor */) {
        doSet()
      } else {
        // #1789: set new refs in a post job so that they don't get overwritten
        // by unmounting ones.
        ;(doSet as SchedulerJob).id = -1
        queuePostRenderEffect(doSet)
      }
    } else if (__DEV__) {
      warn('Invalid template ref type:', ref, `(${typeof ref})`)
    }
  }
}
