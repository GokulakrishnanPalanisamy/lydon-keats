import type { ReactNode } from 'react'
import { CloseIcon } from '../icons/Icons'

export default function Modal({
  open,
  title,
  onClose,
  children,
  wide = false,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  /** Use for forms with more fields than a simple name/description pair. */
  wide?: boolean
}) {
  if (!open) {
    return null
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className={`dialog modal${wide ? ' modal-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id="modal-title">{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}
