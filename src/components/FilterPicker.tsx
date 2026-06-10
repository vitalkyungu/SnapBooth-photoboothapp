import { PHOTO_FILTERS, type PhotoFilter } from '../config/event'

interface FilterPickerProps {
  value: PhotoFilter
  onChange: (value: PhotoFilter) => void
  disabled?: boolean
}

export function FilterPicker({ value, onChange, disabled }: FilterPickerProps) {
  return (
    <div className="filter-picker" role="group" aria-label="Photo filter">
      {PHOTO_FILTERS.map((filter) => (
        <button
          key={filter.id}
          type="button"
          className={`filter-option chip ${value === filter.id ? 'chip-active' : 'chip-inactive'}`}
          onClick={() => onChange(filter.id)}
          disabled={disabled}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
