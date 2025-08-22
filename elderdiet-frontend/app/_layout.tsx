import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, ColorSchemeName, useColorScheme } from 'react-native';
import { UserProvider, useUser } from '@/contexts/UserContext';
import { pushService } from '@/services/pushService';
import { trackingService } from '@/services/trackingService';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <UserProvider>
      <AuthenticatedApp colorScheme={colorScheme} />
    </UserProvider>
  );
}

function AuthenticatedApp({ colorScheme }: { colorScheme: ColorSchemeName }) {
  const { isAuthenticated, isLoading } = useUser();
  const router = useRouter();
  const segments = useSegments();
  const appState = useRef(AppState.currentState);

  // App生命周期追踪
  useEffect(() => {
    console.log('🔧 设置App生命周期监听器');
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // 仅在App首次启动时开始Session
    console.log('🚀 App首次启动，开始初始Session');
    trackingService.startAppSession().then(success => {
      console.log('📱 App首次启动Session结果:', success);
    }).catch(error => {
      console.error('❌ App首次启动Session失败:', error);
    });

    return () => {
      console.log('🧹 清理App生命周期监听器');
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    console.log('📱 App状态变化:', appState.current, '->', nextAppState);

    // 防止相同状态的重复触发
    if (appState.current === nextAppState) {
      console.log('⚠️ 相同状态重复触发，跳过处理');
      return;
    }

    const previousState = appState.current;
    appState.current = nextAppState;

    // App从后台回到前台
    if (
      previousState.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      console.log('📱 App回到前台，开始新Session');
      const success = await trackingService.startAppSession();
      console.log('📱 前台Session开始结果:', success);
    }

    // App进入后台
    if (
      previousState === 'active' &&
      nextAppState.match(/inactive|background/)
    ) {
      console.log('📱 App进入后台，结束Session');
      const success = await trackingService.endSession('background');
      console.log('📱 后台Session结束结果:', success);
    }
  };

  useEffect(() => {
    if (isLoading) return; // 等待认证状态加载完成

    const inAuthGroup = segments[0] === '(auth)';

    if (isAuthenticated && inAuthGroup) {
      // 用户已登录但在认证页面，跳转到主页面
      router.replace('/(tabs)/meal-plan');
    } else if (!isAuthenticated && !inAuthGroup) {
      // 用户未登录但不在认证页面，跳转到登录页面
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  // 初始化推送服务
  useEffect(() => {
    const initializePushService = async () => {
      try {
        if (isAuthenticated) {
          console.log('👤 用户已登录，初始化推送服务...');
          
          // 初始化推送服务（不在这里重试设备注册，避免竞态条件）
          await pushService.initialize();
        } else {
          console.log('👤 用户未登录，跳过推送初始化');
        }
      } catch (error) {
        console.error('❌ 推送服务初始化失败:', error);
      }
    };

    initializePushService();

    // 清理函数
    return () => {
      if (isAuthenticated) {
        pushService.cleanup();
      }
    };
  }, [isAuthenticated]);

  // 等待认证状态加载完成
  if (isLoading) {
    return null; // 或者返回一个加载界面
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack 
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="recipe/[id]" 
          options={{ 
            headerShown: true,
            title: '食谱详情',
            headerTitleStyle: {
              fontSize: 20,
            },
          }} 
        />
        <Stack.Screen 
          name="meal-record" 
          options={{ 
            headerShown: true,
            title: '记录饮食',
            headerTitleStyle: {
              fontSize: 20,
            },
          }} 
        />
        <Stack.Screen 
          name="role-selection/[role]" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="elder-details" 
          options={{ 
            headerShown: true,
            title: '老人健康详情',
            headerTitleStyle: {
              fontSize: 20,
            },
          }} 
        />
        <Stack.Screen
          name="api-test"
          options={{
            headerShown: true,
            title: 'API 测试',
            headerTitleStyle: {
              fontSize: 20,
            },
          }}
        />
        <Stack.Screen
          name="create-post"
          options={{
            headerShown: false, // 在组件内部自定义header
          }}
        />
        <Stack.Screen
          name="push-test"
          options={{
            headerShown: true,
            title: '推送测试',
            headerTitleStyle: {
              fontSize: 20,
            },
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            title: '设置',
            headerTitleStyle: {
              fontSize: 20,
            },
          }}
        />
        <Stack.Screen
          name="debug-tracking"
          options={{
            headerShown: true,
            title: '追踪调试',
            headerTitleStyle: {
              fontSize: 20,
            },
          }}
        />
        <Stack.Screen
          name="tracking-test"
          options={{
            headerShown: true,
            title: '追踪测试',
            headerTitleStyle: {
              fontSize: 20,
            },
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
