import Svg, { Rect, Circle, Path, Line } from 'react-native-svg';

/**
 * Bot icon — replicates Lucide React's `<Bot />` so mobile and web share the same visual.
 */
export default function BotIcon({
  size = 22,
  color = '#ffffff',
  strokeWidth = 2,
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 8V4H8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x={4} y={8} width={16} height={12} rx={2} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 14h2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 14h2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={9} cy={13} r={1} fill={color} />
      <Circle cx={15} cy={13} r={1} fill={color} />
      <Path d="M9 17h6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
