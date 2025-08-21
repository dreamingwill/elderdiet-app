import { Platform } from 'react-native';
import { authStorage } from '@/utils/authStorage';

// 简化的设备信息获取（避免依赖react-native-device-info）
const getDeviceInfo = () => {
  return {
    deviceType: Platform.OS,
    platform: Platform.OS,
    deviceModel: Platform.OS === 'ios' ? 'iPhone' : 'Android',
    osVersion: Platform.Version.toString(),
    appVersion: '1.0.0',
    userAgent: `ElderDiet-App/${Platform.OS}`,
  };
};

interface TrackingConfig {
  apiBaseUrl: string;
  enabled: boolean;
  batchSize: number;
  flushInterval: number; // 毫秒
}

interface SessionInfo {
  sessionId: string;
  userId: string;
  startTime: Date;
  deviceType: string;
  isActive: boolean;
}

interface EventData {
  eventType: string;
  eventName: string;
  eventData?: Record<string, any>;
  result?: string;
  deviceType?: string;
  sessionId?: string;
}

interface PageVisitData {
  pageName: string;
  pageTitle?: string;
  route?: string;
  referrer?: string;
  deviceType?: string;
  sessionId?: string;
}

/**
 * 用户追踪服务
 * 提供统一的前端埋点功能，支持宏观的用户活跃度追踪
 */
class TrackingService {
  private config: TrackingConfig;
  private currentSession: SessionInfo | null = null;
  private eventQueue: EventData[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private currentPageName: string | null = null;
  private deviceInfo: any = {};

  constructor() {
    this.config = {
      apiBaseUrl: 'https://api06.dxdu.cn', // 使用实际的API地址
      enabled: true,
      batchSize: 10,
      flushInterval: 30000, // 30秒
    };

    this.initializeDeviceInfo();
    this.startFlushTimer();
  }

  /**
   * 初始化设备信息
   */
  private initializeDeviceInfo() {
    this.deviceInfo = getDeviceInfo();
  }

  /**
   * 启动批量刷新定时器
   */
  private startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.config.flushInterval);
  }

  /**
   * 配置追踪服务
   */
  public configure(config: Partial<TrackingConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * 启用/禁用追踪
   */
  public setEnabled(enabled: boolean) {
    this.config.enabled = enabled;
  }

  // ========== 会话管理 ==========

  /**
   * 开始用户会话（通常在登录后调用）
   */
  public async startSession(): Promise<boolean> {
    if (!this.config.enabled) return false;

    try {
      const token = await authStorage.getItem('userToken');
      if (!token) {
        console.warn('未找到用户token，无法开始会话追踪');
        return false;
      }

      const requestBody = {
        deviceType: this.deviceInfo.deviceType,
        deviceModel: this.deviceInfo.deviceModel,
        osVersion: this.deviceInfo.osVersion,
        appVersion: this.deviceInfo.appVersion,
        userAgent: this.deviceInfo.userAgent,
      };

      const response = await fetch(`${this.config.apiBaseUrl}/api/tracking/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        this.currentSession = {
          sessionId: data.sessionId,
          userId: data.userId,
          startTime: new Date(),
          deviceType: this.deviceInfo.deviceType,
          isActive: true,
        };

        console.log('会话追踪开始成功:', this.currentSession.sessionId);
        return true;
      } else {
        console.error('开始会话追踪失败:', response.status);
        return false;
      }
    } catch (error) {
      console.error('开始会话追踪异常:', error);
      return false;
    }
  }

  /**
   * 结束用户会话（通常在登出时调用）
   */
  public async endSession(reason: string = 'logout'): Promise<boolean> {
    if (!this.config.enabled || !this.currentSession) return false;

    try {
      // 先刷新所有待发送的事件
      await this.flushEvents();

      // 结束当前页面访问
      if (this.currentPageName) {
        await this.endPageVisit('session_end');
      }

      const token = await authStorage.getItem('userToken');
      if (!token) return false;

      const requestBody = {
        sessionId: this.currentSession.sessionId,
        reason,
      };

      const response = await fetch(`${this.config.apiBaseUrl}/api/tracking/session/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        console.log('会话追踪结束成功');
        this.currentSession = null;
        this.currentPageName = null;
        return true;
      } else {
        console.error('结束会话追踪失败:', response.status);
        return false;
      }
    } catch (error) {
      console.error('结束会话追踪异常:', error);
      return false;
    }
  }

  /**
   * 获取当前会话信息
   */
  public getCurrentSession(): SessionInfo | null {
    return this.currentSession;
  }

  // ========== 事件追踪 ==========

  /**
   * 追踪事件
   */
  public trackEvent(eventType: string, eventName: string, eventData?: Record<string, any>, result: string = 'success') {
    if (!this.config.enabled) return;

    const event: EventData = {
      eventType,
      eventName,
      eventData,
      result,
      deviceType: this.deviceInfo.deviceType,
      sessionId: this.currentSession?.sessionId,
    };

    // 添加到队列
    this.eventQueue.push(event);

    // 如果队列达到批量大小，立即刷新
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flushEvents();
    }
  }

  /**
   * 追踪认证事件
   */
  public trackAuthEvent(eventName: string, result: string = 'success') {
    this.trackEvent('AUTH', eventName, undefined, result);
  }

  /**
   * 追踪功能使用事件
   */
  public trackFeatureEvent(featureName: string, featureData?: Record<string, any>, result: string = 'success') {
    this.trackEvent('FEATURE_USE', featureName, featureData, result);
  }

  /**
   * 追踪交互事件
   */
  public trackInteractionEvent(eventName: string, eventData?: Record<string, any>) {
    this.trackEvent('INTERACTION', eventName, eventData, 'success');
  }

  /**
   * Tab切换事件
   */
  public trackTabSwitch(targetTab: string, previousTab?: string) {
    this.trackInteractionEvent('tab_switch', {
      targetTab,
      previousTab: previousTab || 'unknown',
    });
  }

  // ========== 页面访问追踪 ==========

  /**
   * 开始页面访问
   */
  public async startPageVisit(pageName: string, pageTitle?: string, route?: string, referrer?: string): Promise<boolean> {
    if (!this.config.enabled || !this.currentSession) return false;

    try {
      // 如果有当前页面，先结束它
      if (this.currentPageName && this.currentPageName !== pageName) {
        await this.endPageVisit('navigation');
      }

      const token = await authStorage.getItem('userToken');
      if (!token) return false;

      const requestBody: PageVisitData = {
        pageName,
        pageTitle,
        route,
        referrer: referrer || this.currentPageName || undefined,
        deviceType: this.deviceInfo.deviceType,
        sessionId: this.currentSession.sessionId,
      };

      const response = await fetch(`${this.config.apiBaseUrl}/api/tracking/page/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        this.currentPageName = pageName;
        console.log('页面访问开始:', pageName);
        return true;
      } else {
        console.error('开始页面访问失败:', response.status);
        return false;
      }
    } catch (error) {
      console.error('开始页面访问异常:', error);
      return false;
    }
  }

  /**
   * 结束页面访问
   */
  public async endPageVisit(exitReason: string = 'navigation'): Promise<boolean> {
    if (!this.config.enabled || !this.currentPageName) return false;

    try {
      const token = await authStorage.getItem('userToken');
      if (!token) return false;

      const requestBody = {
        pageName: this.currentPageName,
        exitReason,
      };

      const response = await fetch(`${this.config.apiBaseUrl}/api/tracking/page/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        console.log('页面访问结束:', this.currentPageName);
        this.currentPageName = null;
        return true;
      } else {
        console.error('结束页面访问失败:', response.status);
        return false;
      }
    } catch (error) {
      console.error('结束页面访问异常:', error);
      return false;
    }
  }

  // ========== 批量处理 ==========

  /**
   * 刷新事件队列
   */
  private async flushEvents(): Promise<boolean> {
    if (!this.config.enabled || this.eventQueue.length === 0) return false;

    try {
      const token = await authStorage.getItem('userToken');
      if (!token) return false;

      const eventsToSend = [...this.eventQueue];
      this.eventQueue = []; // 清空队列

      const requestBody = {
        events: eventsToSend,
        sessionId: this.currentSession?.sessionId,
        deviceType: this.deviceInfo.deviceType,
      };

      const response = await fetch(`${this.config.apiBaseUrl}/api/tracking/events/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`批量事件发送成功: ${data.successCount}/${data.totalCount}`);
        return true;
      } else {
        // 发送失败，将事件放回队列
        this.eventQueue.unshift(...eventsToSend);
        console.error('批量事件发送失败:', response.status);
        return false;
      }
    } catch (error) {
      console.error('批量事件发送异常:', error);
      return false;
    }
  }

  // ========== 便捷方法 ==========

  /**
   * 获取当前页面名称
   */
  public getCurrentPageName(): string | null {
    return this.currentPageName;
  }

  /**
   * 检查是否有活跃会话
   */
  public hasActiveSession(): boolean {
    return this.currentSession !== null && this.currentSession.isActive;
  }

  /**
   * 清理资源
   */
  public cleanup() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // 尝试发送剩余事件
    this.flushEvents();

    // 结束当前会话
    if (this.currentSession) {
      this.endSession('cleanup');
    }
  }
}

// 创建单例实例
export const trackingService = new TrackingService();

// 导出类型定义
export type { SessionInfo, EventData, PageVisitData, TrackingConfig }; 