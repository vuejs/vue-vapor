// NOTE: This test is implemented based on the case of `runtime-core/__test__/componentSlots.spec.ts`.

import { makeRender } from './_utils'

const define = makeRender<any>()

describe('component: slots', () => {
  test.todo('initSlots: instance.slots should be set correctly', () => {})

  test.todo(
    'initSlots: should normalize object slots (when value is null, string, array)',
    () => {},
  )

  test.todo(
    'initSlots: should normalize object slots (when value is function)',
    () => {},
  )

  test.todo(
    'initSlots: instance.slots should be set correctly (when vnode.shapeFlag is not SLOTS_CHILDREN)',
    () => {},
  )

  test.todo(
    'updateSlots: instance.slots should be updated correctly (when slotType is number)',
    async () => {},
  )

  test.todo(
    'updateSlots: instance.slots should be updated correctly (when slotType is null)',
    async () => {},
  )

  test.todo(
    'updateSlots: instance.slots should be update correctly (when vnode.shapeFlag is not SLOTS_CHILDREN)',
    async () => {},
  )

  test.todo('should respect $stable flag', async () => {})

  test.todo('should not warn when mounting another app in setup', () => {})
})
