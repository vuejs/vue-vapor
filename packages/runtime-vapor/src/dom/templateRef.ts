import {
  type Ref,
  type SchedulerJob,
  isRef,
  onScopeDispose,
  shallowReactive,
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

  if (isUnmounted) {
    return
  }

  const refs =
    currentInstance.refs === EMPTY_OBJ
      ? (currentInstance.refs = {})
      : currentInstance.refs

  if (isFunction(ref)) {
    callWithErrorHandling(ref, currentInstance, VaporErrorCodes.FUNCTION_REF, [
      el,
      refs,
    ])
  } else {
    const _isString = isString(ref)
    const _isRef = isRef(ref)
    let existing: unknown

    if (_isString || _isRef) {
      const doSet: SchedulerJob = () => {
        if (ref_for) {
          existing = _isString
            ? hasOwn(setupState, ref)
              ? setupState[ref]
              : refs[ref]
            : ref.value

          if (!isArray(existing)) {
            existing = shallowReactive([el])
            if (_isString) {
              refs[ref] = existing
              if (hasOwn(setupState, ref)) {
                setupState[ref] = refs[ref]
              }
            } else {
              ref.value = existing
            }
          } else if (!existing.includes(el)) {
            existing.push(el)
          }
        } else if (_isString) {
          refs[ref] = el
          if (hasOwn(setupState, ref)) {
            setupState[ref] = el
          }
        } else if (_isRef) {
          ref.value = el
        } else if (__DEV__) {
          warn('Invalid template ref type:', ref, `(${typeof ref})`)
        }
      }
      doSet.id = -1
      queuePostRenderEffect(doSet)

      onScopeDispose(() => {
        queuePostRenderEffect(() => {
          if (isArray(existing)) {
            remove(existing, el)
          } else if (_isString) {
            refs[ref] = null
            if (hasOwn(setupState, ref)) {
              setupState[ref] = null
            }
          } else if (_isRef) {
            ref.value = null
          }
        })
      })
    } else if (__DEV__) {
      warn('Invalid template ref type:', ref, `(${typeof ref})`)
    }
  }
}
