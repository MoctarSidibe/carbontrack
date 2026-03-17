import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  title: string;
  action?: { label: string; onPress: () => void };
}

export default function SectionHeader({ title, action }: Props) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <Text className="text-base font-bold text-gray-900">{title}</Text>
      {action ? (
        <TouchableOpacity onPress={action.onPress}>
          <Text className="text-sm font-medium text-brand-600">{action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
