import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Pressable, useColorScheme } from 'react-native';

import Colors from '@/constants/Colors';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

function IonIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return <Ionicons size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      initialRouteName="meal-plan"
      screenOptions={{
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingTop: 5,
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        headerShown: useClientOnlyValue(false, true),
        tabBarHideOnKeyboard: true,
      }}>
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: '今日膳食',
          headerShown: false,
          tabBarIcon: ({ color }: { color: string }) => (
            <IonIcon name="restaurant" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: '交流',
          headerShown: false,
          tabBarIcon: ({ color }: { color: string }) => (
            <IonIcon name="chatbubble-ellipses" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discovery"
        options={{
          title: '发现',
          headerShown: false,
          tabBarIcon: ({ color }: { color: string }) => (
            <IonIcon name="search" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          headerShown: false,
          tabBarIcon: ({ color }: { color: string }) => (
            <IonIcon name="person" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
