import { SegmentedControl } from './SegmentedControl';
import { setAppearance, useAppearance, type AppearancePreference } from '@/theme/appearance';

const OPTIONS: { value: AppearancePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** System / Light / Dark. Applies instantly and is remembered across launches. */
export function AppearancePicker() {
  return (
    <SegmentedControl
      label="Appearance"
      options={OPTIONS}
      value={useAppearance()}
      onChange={setAppearance}
      stretch
    />
  );
}
