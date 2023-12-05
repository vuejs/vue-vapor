export function withMemo(num: number, nVals: any[], oVals: any[]) {
  const parentNum = nVals.length - num
  let canUpdateParent = true
  for (let i = 0; i < parentNum - 1; i++) {
    // If the memo variable bound in the parent element is not equal,
    // the child's memo variable will not be updated.
    if (nVals[i] === oVals[i]) {
      canUpdateParent = false
      break
    }
  }
  // No more need to check variables of child memo
  if (!canUpdateParent) return false

  let canUpdate = false
  for (let i = parentNum; i < nVals.length; i++) {
    // Among the variables of memo,
    // as long as one of them is updated, it can be updated.
    if (nVals[i] !== oVals[i]) {
      canUpdate = true
    }
  }
  return canUpdate
}
