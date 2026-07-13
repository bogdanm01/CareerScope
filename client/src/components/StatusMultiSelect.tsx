import { ListBox, Select } from '@heroui/react';

export type StatusFilterOption = {
  value: string;
  label: string;
};

type StatusMultiSelectProps = {
  ariaLabel: string;
  options: StatusFilterOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  className?: string;
};

export const StatusMultiSelect = ({
  ariaLabel,
  options,
  selectedValues,
  onChange,
  className = 'h-10 rounded-lg text-sm',
}: StatusMultiSelectProps) => (
  <Select
    aria-label={ariaLabel}
    selectionMode="multiple"
    value={selectedValues}
    onChange={(keys) => onChange(keys.map(String))}
  >
    <Select.Trigger aria-label={ariaLabel} className={className}>
      <Select.Value>
        {({ selectedText }) => {
          if (selectedValues.length === 0 || selectedValues.length === options.length) {
            return 'All statuses';
          }

          return selectedValues.length === 1 ? selectedText : `${selectedValues.length} statuses`;
        }}
      </Select.Value>
      <Select.Indicator />
    </Select.Trigger>
    <Select.Popover>
      <ListBox aria-label={`${ariaLabel} options`}>
        {options.map((option) => (
          <ListBox.Item key={option.value} id={option.value} textValue={option.label}>
            <span className="flex-1">{option.label}</span>
            <ListBox.ItemIndicator />
          </ListBox.Item>
        ))}
      </ListBox>
    </Select.Popover>
  </Select>
);
