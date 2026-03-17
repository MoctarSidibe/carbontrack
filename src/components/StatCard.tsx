import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
}

export default function StatCard({ label, value, sub, accent, icon, iconColor, iconBg }: Props) {
  const defaultIconColor = accent ? 'rgba(255,255,255,0.9)' : (iconColor ?? '#22c55e');
  const defaultIconBg    = accent ? 'rgba(255,255,255,0.18)' : (iconBg ?? '#f0fdf4');

  return (
    <View className={`flex-1 rounded-2xl p-4 ${accent ? 'bg-brand-500' : 'bg-white border border-gray-100'}`}>
      <View className="flex-row items-start justify-between mb-2">
        <Text className={`text-xs font-semibold flex-1 ${accent ? 'text-brand-100' : 'text-gray-500'}`}>
          {label}
        </Text>
        {icon && (
          <View style={{ backgroundColor: defaultIconBg, borderRadius: 8, padding: 5 }}>
            <Ionicons name={icon} size={14} color={defaultIconColor} />
          </View>
        )}
      </View>
      <Text className={`text-xl font-extrabold ${accent ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </Text>
      {sub ? (
        <Text className={`text-xs mt-0.5 ${accent ? 'text-brand-200' : 'text-gray-400'}`}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}
