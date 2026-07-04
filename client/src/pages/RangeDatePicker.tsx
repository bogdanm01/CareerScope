import { DatePicker, DateField, Calendar } from "@heroui/react";
import { parseDate } from "@internationalized/date";

export const RangeDatePicker = ({
  label,
  value,
  onChange,
  maxValue,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxValue?: string;
}) => (
  <div className="grid gap-1.5">
    <span className="text-xs font-medium text-default-500">{label}</span>
    <DatePicker
      className="w-full"
      aria-label={label}
      value={value ? parseDate(value) : null}
      onChange={(dateValue) => onChange(dateValue?.toString() ?? "")}
      maxValue={maxValue ? parseDate(maxValue) : undefined}
    >
      <DateField.Group fullWidth className="min-h-[40px] rounded-lg">
        <DateField.Input>
          {(segment) => <DateField.Segment segment={segment} />}
        </DateField.Input>
        <DateField.Suffix>
          <DatePicker.Trigger>
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      <DatePicker.Popover className="!w-[320px] !min-w-[320px] max-w-[calc(100vw-2rem)]">
        <Calendar className="!w-[320px] max-w-full">
          <Calendar.Header>
            <Calendar.NavButton slot="previous" />
            <Calendar.YearPickerTrigger>
              <Calendar.YearPickerTriggerHeading />
              <Calendar.YearPickerTriggerIndicator />
            </Calendar.YearPickerTrigger>
            <Calendar.NavButton slot="next" />
          </Calendar.Header>
          <Calendar.Grid>
            <Calendar.GridHeader>
              {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
            </Calendar.GridHeader>
            <Calendar.GridBody>
              {(date) => (
                <Calendar.Cell date={date}>
                  {({ formattedDate }) => (
                    <>
                      {formattedDate}
                      <Calendar.CellIndicator />
                    </>
                  )}
                </Calendar.Cell>
              )}
            </Calendar.GridBody>
          </Calendar.Grid>
          <Calendar.YearPickerGrid>
            <Calendar.YearPickerGridBody>
              {({ year }) => <Calendar.YearPickerCell year={year} />}
            </Calendar.YearPickerGridBody>
          </Calendar.YearPickerGrid>
        </Calendar>
      </DatePicker.Popover>
    </DatePicker>
  </div>
);
