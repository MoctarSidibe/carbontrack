import { View, Text } from 'react-native';

export default function MarketScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50 p-8">
      <Text className="text-4xl mb-4">🌱</Text>
      <Text className="text-xl font-bold text-slate-800 mb-2 text-center">
        Marché Carbone
      </Text>
      <Text className="text-slate-500 text-center">
        Cette fonctionnalité sera disponible prochainement.
      </Text>
    </View>
  );
}
