import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { KermaLogo } from '../../components/KermaLogo';
import { Colors, Typography } from '../../constants/theme';

function TabIcon({ focused, emoji, label }: { focused: boolean; emoji: string; label: string }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabActive]}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, { color: focused ? Colors.kerma : Colors.t3 }]}>{label}</Text>
    </View>
  );
}

function ShopTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabActive]}>
      <KermaLogo size={20} />
      <Text style={[styles.tabLabel, { color: focused ? Colors.kerma : Colors.t3 }]}>SHOP</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Shop',
          tabBarIcon: ({ focused }) => <ShopTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="📊" label="DASH" />,
        }}
      />
      <Tabs.Screen
        name="stock"
        options={{
          title: 'Stock',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="📦" label="STOCK" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="👤" label="PROFILE" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    paddingBottom: 8,
    height: 72,
  },
  tabItem: {
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 4,
    paddingVertical: 7,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: Colors.kermaPale,
  },
  tabEmoji: { fontSize: 20 },
  tabLabel: {
    fontFamily: Typography.bold,
    fontSize: 9,
    letterSpacing: 0.3,
  },
});
