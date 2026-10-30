import { Input, Select } from './FormFields'

export const OTHER_VALUE = 'Other'

/** Returns the free-text value when "Other" is chosen, otherwise the chosen option. */
export function resolveOther(value, other) {
  return value === OTHER_VALUE ? (other || '').trim() : value
}

/**
 * Dropdown with an "Other" entry that reveals a free-text input.
 * Stateless: parent keeps `value` (selected option) and `otherValue` (typed text).
 */
export function OtherSelect({ label, name, options, value, otherValue, onChange, onOtherChange, error, otherLabel, otherPlaceholder = 'Please specify', className }) {
  const list = options.includes(OTHER_VALUE) ? options : [...options, OTHER_VALUE]
  const isOther = value === OTHER_VALUE
  return (
    <div className={className}>
      <Select label={label} name={name} value={value} onChange={(e) => onChange(e.target.value)} error={!isOther ? error : undefined}>
        {list.map((item) => <option key={item} value={item}>{item}</option>)}
      </Select>
      {isOther ? (
        <div className="mt-2">
          <Input
            name={name ? `${name}_other` : undefined}
            aria-label={otherLabel || `${label} (specify)`}
            placeholder={otherPlaceholder}
            value={otherValue || ''}
            onChange={(e) => onOtherChange(e.target.value)}
            error={error}
          />
        </div>
      ) : null}
    </div>
  )
}
