import { SegmentedControl } from './SegmentedControl';
import { Text } from './Text';
import { setAppearance, useAppearance, type AppearancePreference } from '@/theme/appearance';
import { space } from '@/theme/tokens';

const OPTIONS: { value: AppearancePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** System / Light / Dark. Applies instantly and is remembered across launches. */
export function AppearancePicker() {
  const preference = useAppearance();
  return (
    <>
      <SegmentedControl
        label="Appearance"
        options={OPTIONS}
        value={preference}
        onChange={setAppearance}
        stretch
      />
      <Text variant="body" muted style={{ marginTop: space.md }}>
        {preference === 'system'
          ? "Otto follows your iPhone's light or dark setting."
          : `Otto stays ${preference} whatever your iPhone is set to.`}
      </Text>
    </>
  );
}
