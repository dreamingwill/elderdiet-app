import { useEffect } from 'react';
import { Redirect } from 'expo-router';

export default function IndexPage() {
  // 重定向到今日膳食页面
  return <Redirect href="/(tabs)/meal-plan" />;
}
