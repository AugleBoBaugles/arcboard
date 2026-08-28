// Fractional ordering: reordering only ever writes the single moved row,
// instead of renumbering every row after the drop point.
export const POSITION_GAP = 1000

export function positionAfter(prevPosition) {
  return (prevPosition ?? 0) + POSITION_GAP
}

// Note: repeatedly inserting into the same tiny gap many times will eventually
// approach float precision limits. If that becomes an issue, add a periodic
// resequencing pass that rewrites a timeline's positions to even multiples of
// POSITION_GAP in one transaction.
export function positionBetween(prevPosition, nextPosition) {
  if (prevPosition == null && nextPosition == null) return POSITION_GAP
  if (prevPosition == null) return nextPosition - POSITION_GAP
  if (nextPosition == null) return prevPosition + POSITION_GAP
  return (prevPosition + nextPosition) / 2
}
