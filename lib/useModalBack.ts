'use client'

import { useEffect, useRef } from 'react'

/**
 * Intercepts the mobile back gesture / browser back button to close a modal
 * instead of navigating away from the page.
 *
 * When the modal opens, pushes a history entry. When the user presses back,
 * the popstate event fires and we call onClose instead of navigating.
 * When the modal closes normally (e.g. X button), we pop the extra entry.
 */
export function useModalBack(
  isOpen: boolean,
  onClose: () => void,
  navigatingRef?: React.RefObject<boolean>,
) {
  const pushed = useRef(false)

  useEffect(() => {
    if (!isOpen) {
      if (pushed.current) {
        pushed.current = false
        // Skip history.back() when navigating to a new page — the router
        // already pushed a new history entry and back() would revert it.
        if (!navigatingRef?.current) {
          window.history.back()
        }
      }
      return
    }

    // Modal just opened — push a history entry
    window.history.pushState({ modal: true }, '')
    pushed.current = true

    const handlePopState = () => {
      // Back was pressed — close the modal instead of navigating
      pushed.current = false
      onClose()
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isOpen, onClose, navigatingRef])
}
