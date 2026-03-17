import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
}

export default function EmptyState({ icon = 'file-tray-outline', title, description }: Props) {
  return (
    <View className="flex-1 items-center justify-center py-16 px-8">
      <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
        <Ionicons name={icon} size={28} color="#9ca3af" />
      </View>
      <Text className="text-base font-semibold text-gray-700 text-center mb-1">{title}</Text>
      {description ? (
        <Text className="text-sm text-gray-400 text-center">{description}</Text>
      ) : null}
    </View>
  );
}
