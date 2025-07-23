declare module 'jpush-react-native' {
  interface JPushInitOptions {
    appKey: string;
    channel: string;
    production: boolean;
  }

  interface JPushRegistrationResult {
    registerID: string;
  }

  interface JPushNotificationResult {
    messageID: string;
    title: string;
    content: string;
    badge: number;
    ring: string;
    extras: Record<string, any>;
  }

  interface JPushConnectResult {
    connectEnable: boolean;
  }

  interface JPushAliasOptions {
    alias: string;
    sequence: number;
  }

  interface JPushTagsOptions {
    tags: string[];
    sequence: number;
  }

  interface JPushStatic {
    init(options: JPushInitOptions): void;
    setLoggerEnable(enable: boolean): void;
    getRegistrationID(callback: (result: JPushRegistrationResult) => void): void;
    addConnectEventListener(callback: (result: JPushConnectResult) => void): void;
    addNotificationListener(callback: (result: JPushNotificationResult) => void): void;
    addCustomMessageListener(callback: (result: any) => void): void;
    addLocalNotificationListener(callback: (result: any) => void): void;
    setAlias(options: JPushAliasOptions): void;
    setTags(options: JPushTagsOptions): void;
    clearAllNotifications(): void;
  }

  const JPush: JPushStatic;
  export default JPush;
}
