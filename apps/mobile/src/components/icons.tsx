import type { ComponentType, ReactNode } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/** Rounded 1.8–2px stroke line icons. Never emoji. */
export type IconProps = { color: string; size?: number; filled?: boolean };
export type Icon = ComponentType<IconProps>;

const stroke = {
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  fill: 'none',
} as const;

function make(paths: (color: string, filled: boolean) => ReactNode): Icon {
  function IconComponent({ color, size = 22, filled = false }: IconProps) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {paths(color, filled)}
      </Svg>
    );
  }
  return IconComponent;
}

export const HomeIcon = make((c, f) => (
  <Path
    d="M4 10.2 12 4l8 6.2V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9v5.5H5.5A1.5 1.5 0 0 1 4 19z"
    stroke={c}
    {...stroke}
    fill={f ? c : 'none'}
  />
));

export const WalletIcon = make((c) => (
  <>
    <Rect x={3} y={5.5} width={18} height={13} rx={3} stroke={c} {...stroke} />
    <Path d="M3 10h18" stroke={c} {...stroke} />
  </>
));

export const SpendingIcon = make((c) => (
  <Path d="M4 20h16M7 17v-6M12 17V6M17 17v-8" stroke={c} {...stroke} />
));

export const SparkleIcon = make((c, f) => (
  <Path
    d="M12 3.5c.5 4.2 2.6 6.4 7 7-4.4.6-6.5 2.8-7 7-.5-4.2-2.6-6.4-7-7 4.4-.6 6.5-2.8 7-7z"
    stroke={c}
    {...stroke}
    fill={f ? c : 'none'}
  />
));

export const BellIcon = make((c) => (
  <>
    <Path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z" stroke={c} {...stroke} />
    <Path d="M10 20.5a2.2 2.2 0 0 0 4 0" stroke={c} {...stroke} />
  </>
));

export const BackIcon = make((c) => <Path d="M15 5l-7 7 7 7" stroke={c} {...stroke} />);
export const ChevronIcon = make((c) => <Path d="M9 5l7 7-7 7" stroke={c} {...stroke} />);
export const PlusIcon = make((c) => <Path d="M12 5v14M5 12h14" stroke={c} {...stroke} />);
export const CloseIcon = make((c) => <Path d="M6 6l12 12M18 6 6 18" stroke={c} {...stroke} />);
export const CheckIcon = make((c) => (
  <Path d="M5 12.5l4.5 4.5L19 7.5" stroke={c} {...stroke} strokeWidth={2.4} />
));
export const ArrowUpIcon = make((c) => (
  <Path d="M12 19V5M6 11l6-6 6 6" stroke={c} {...stroke} strokeWidth={2.2} />
));
export const MinusIcon = make((c) => (
  <Path d="M5 12h14" stroke={c} {...stroke} strokeWidth={2.4} />
));

export const MoreIcon = make((c) => (
  <>
    <Circle cx={6} cy={12} r={1.6} fill={c} />
    <Circle cx={12} cy={12} r={1.6} fill={c} />
    <Circle cx={18} cy={12} r={1.6} fill={c} />
  </>
));

export const MailIcon = make((c) => (
  <>
    <Rect x={3.5} y={5.5} width={17} height={13} rx={2.5} stroke={c} {...stroke} />
    <Path d="M4 7l8 6 8-6" stroke={c} {...stroke} />
  </>
));

export const LockIcon = make((c) => (
  <>
    <Rect x={5} y={10.5} width={14} height={10} rx={2.5} stroke={c} {...stroke} />
    <Path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" stroke={c} {...stroke} />
  </>
));

export const EyeIcon = make((c) => (
  <>
    <Path
      d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"
      stroke={c}
      {...stroke}
    />
    <Circle cx={12} cy={12} r={2.8} stroke={c} {...stroke} />
  </>
));

export const PlaneIcon = make((c) => (
  <Path
    d="M10.5 13.5 4 11l1.5-1.5 7 .8 4-4c1-1 2.6-1.3 3.2-.7.6.6.3 2.2-.7 3.2l-4 4 .8 7L14.3 21l-2.5-6.5-3.3 3.3.3 2.2-1.3 1.3-1.4-3-3-1.4 1.3-1.3 2.2.3z"
    stroke={c}
    {...stroke}
  />
));

export const GiftIcon = make((c) => (
  <Path
    d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-1.5-3-5.5-3.2-5.5-.8C6.5 7 8 7 12 7zM12 7c1.5-3 5.5-3.2 5.5-.8C17.5 7 16 7 12 7z"
    stroke={c}
    {...stroke}
  />
));

export const PieIcon = make((c) => (
  <>
    <Path d="M11 4a8 8 0 1 0 9 9h-9z" stroke={c} {...stroke} />
    <Path d="M14 3.5V10h6.5A7 7 0 0 0 14 3.5z" stroke={c} {...stroke} />
  </>
));

export const TrendDownIcon = make((c) => (
  <Path d="M3 7l6 6 4-4 8 8M21 11v6h-6" stroke={c} {...stroke} />
));

export const GaugeIcon = make((c) => (
  <>
    <Path d="M4 17a8 8 0 1 1 16 0" stroke={c} {...stroke} />
    <Path d="M12 15l3.5-4.5" stroke={c} {...stroke} />
  </>
));

export const ClockIcon = make((c) => (
  <>
    <Circle cx={12} cy={12} r={8.5} stroke={c} {...stroke} />
    <Path d="M12 7.5V12l3 2" stroke={c} {...stroke} />
  </>
));

export const AlertIcon = make((c) => (
  <>
    <Circle cx={12} cy={12} r={8.5} stroke={c} {...stroke} />
    <Path d="M12 8v4.5" stroke={c} {...stroke} />
    <Circle cx={12} cy={16} r={1.1} fill={c} />
  </>
));

export const UnlinkIcon = make((c) => (
  <>
    <Path d="M10 14a4 4 0 0 1 0-5.6l2.4-2.4a4 4 0 0 1 5.6 5.6L16.5 13" stroke={c} {...stroke} />
    <Path d="M14 10a4 4 0 0 1 0 5.6l-2.4 2.4a4 4 0 0 1-5.6-5.6L7.5 11" stroke={c} {...stroke} />
    <Path d="M5 5l14 14" stroke={c} {...stroke} />
  </>
));

export const TrashIcon = make((c) => (
  <Path d="M4.5 6.5h15M9 6.5V4.5h6v2M6.5 6.5l1 13h9l1-13" stroke={c} {...stroke} />
));

export const FaceIdIcon = make((c) => (
  <>
    <Path
      d="M4 8.5V6.5A2.5 2.5 0 0 1 6.5 4h2M15.5 4h2A2.5 2.5 0 0 1 20 6.5v2M20 15.5v2a2.5 2.5 0 0 1-2.5 2.5h-2M8.5 20h-2A2.5 2.5 0 0 1 4 17.5v-2"
      stroke={c}
      {...stroke}
    />
    <Path d="M9 9.5v1M15 9.5v1M12 9.5v3.5h-1M9.5 15.5c1.4 1.2 3.6 1.2 5 0" stroke={c} {...stroke} />
  </>
));

export const AppleIcon = make((c) => (
  <Path
    d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.2.8 1.1 1.7 2.3 2.8 2.3 1.1 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.4-.9-2.4-3.7zM14.2 5.8c.6-.8 1-1.8.9-2.8-.9 0-2 .6-2.6 1.4-.6.7-1.1 1.7-.9 2.7 1 .1 2-.5 2.6-1.3z"
    fill={c}
  />
));

export const GoogleIcon = make((c) => (
  <Path
    d="M20.6 12.2c0-.6-.1-1.2-.2-1.8H12v3.4h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5zM12 21c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.7H3.9v2.3A9 9 0 0 0 12 21zM6.9 13.8a5.4 5.4 0 0 1 0-3.6V7.9H3.9a9 9 0 0 0 0 8.2zM12 6.6c1.3 0 2.5.5 3.5 1.4l2.6-2.6A9 9 0 0 0 3.9 7.9l3 2.3C7.6 8.1 9.6 6.6 12 6.6z"
    fill={c}
  />
));

/** Same glyph as the Wallet tab, used for "which card" prompts. */
export const CardIcon = WalletIcon;
