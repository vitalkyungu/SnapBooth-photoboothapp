import type { DelaySeconds } from '../config/event'

interface DelayPickerProps {
  value: DelaySeconds
  onChange: (value: DelaySeconds) => void
  disabled?: boolean
}

export function DelayPicker({ value, onChange, disabled }: DelayPickerProps) {
  const options: DelaySeconds[] = [3, 5, 10]

  return (
    <div className="delay-picker" role="group" aria-label="Countdown delay">
      {options.map((seconds) => (
        <button
          key={seconds}
          type="button"
          className={`delay-option chip ${value === seconds ? 'chip-active' : 'chip-inactive'}`}
          onClick={() => onChange(seconds)}
          disabled={disabled}
        >
          {seconds}s
        </button>
      ))}
    </div>
  )
}
