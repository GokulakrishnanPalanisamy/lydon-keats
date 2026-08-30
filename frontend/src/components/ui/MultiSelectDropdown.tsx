import { useState } from 'react'
import { CheckCircleIcon, ChevronDownIcon, SearchIcon } from '../icons/Icons'

interface MultiSelectOption {
  id: number
  label: string
}

export default function MultiSelectDropdown({
  options,
  selectedIds,
  onChange,
  placeholder = 'Select...',
  emptyMessage = 'No options available.',
  searchThreshold = 6,
}: {
  options: MultiSelectOption[]
  selectedIds: number[]
  onChange: (ids: number[]) => void
  placeholder?: string
  emptyMessage?: string
  searchThreshold?: number
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = options.filter((option) => selectedIds.includes(option.id))

  const filtered =
    options.length > searchThreshold && query.trim() !== ''
      ? options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()))
      : options

  function toggle(id: number) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((selectedId) => selectedId !== id) : [...selectedIds, id])
  }

  let label = placeholder
  if (selected.length === 1) {
    label = selected[0].label
  } else if (selected.length === 2) {
    label = selected.map((option) => option.label).join(', ')
  } else if (selected.length > 2) {
    label = `${selected[0].label}, ${selected[1].label} +${selected.length - 2} more`
  }

  return (
    <div className="multi-select" onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="multi-select-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`multi-select-label${selected.length === 0 ? ' placeholder' : ''}`}>{label}</span>
        <ChevronDownIcon />
      </button>

      {open && (
        <div className="multi-select-dropdown">
          {options.length > searchThreshold && (
            <div className="multi-select-search">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoFocus
              />
            </div>
          )}

          <div className="multi-select-options" role="listbox" aria-multiselectable="true">
            {options.length === 0 ? (
              <div className="multi-select-empty">{emptyMessage}</div>
            ) : filtered.length === 0 ? (
              <div className="multi-select-empty">No matches.</div>
            ) : (
              filtered.map((option) => {
                const checked = selectedIds.includes(option.id)

                return (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={checked}
                    className={`multi-select-option${checked ? ' selected' : ''}`}
                    onClick={() => toggle(option.id)}
                  >
                    <span>{option.label}</span>
                    {checked && <CheckCircleIcon />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
