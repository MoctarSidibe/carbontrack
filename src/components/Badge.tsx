import { View, Text } from 'react-native';

type Variant = 'green' | 'yellow' | 'red' | 'blue' | 'gray';

const styles: Record<Variant, { bg: string; text: string }> = {
  green:  { bg: 'bg-green-100',  text: 'text-green-700' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  red:    { bg: 'bg-red-100',    text: 'text-red-700' },
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-700' },
  gray:   { bg: 'bg-gray-100',   text: 'text-gray-600' },
};

interface Props {
  label: string;
  variant?: Variant;
}

export default function Badge({ label, variant = 'gray' }: Props) {
  const { bg, text } = styles[variant];
  return (
    <View className={`rounded-full px-2 py-0.5 self-start ${bg}`}>
      <Text className={`text-xs font-medium ${text}`}>{label}</Text>
    </View>
  );
}
