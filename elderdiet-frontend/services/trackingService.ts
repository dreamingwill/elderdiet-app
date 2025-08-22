import { Platform } from 'react-native';
import { authStorage } from '@/utils/authStorage';

// 简化的设备信息获取（避免依赖react-native-device-info）
const getDeviceInfo = () => {
  try {
    return {
      deviceType: Platform.OS,
      platform: Platform.OS,
      deviceModel: Platform.OS === 'ios' ? 'iPhone' : 'Android',
      osVersion: String(Platform.Version),
      appVersion: '1.0.0',
      userAgent: `ElderDiet-App/${Platform.OS}`,
    };
  } catch (error) {
    console.warn('获取设备信息失败:', error);
    return {
      deviceType: 'unknown',
      platform: 'unknown',
      deviceModel: 'unknown',
      osVersion: 'unknown',
      appVersion: '1.0.0',
      userAgent: 'ElderDiet-App/unknown',
    };
  }
};

interface TrackingConfig {
  apiBaseUrl: string;
  enabled: boolean;
  batchSize: number;
  flushInterval: number; // 毫秒
  sessionTimeoutMinutes: number; // 新增：Session超时时间（分钟）
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
  private lastActivityTime: Date | null = null;
  
  // 新增：防重复调用的状态管理
  private pendingPageVisits: Map<string, Promise<boolean>> = new Map();
  private lastPageVisitCall: Map<string, number> = new Map();
  private readonly DUPLICATE_CALL_THRESHOLD = 500; // 500ms内的重复调用被视为重复
  // 以下变量在禁用 page_view 事件后已不再需要，但保留以避免破坏现有代码
  // private lastPageVisitTime: Map<string, number> = new Map();
  // private pageVisitCallStack: string[] = [];
  // private pendingPageVisits: Set<string> = new Set();

  constructor() {
    console.log('🔧 TrackingService构造函数开始');
    
    this.config = {
      apiBaseUrl: 'https://api06.dxdu.cn', // 使用实际的API地址
      enabled: true,
      batchSize: 10, // 
      flushInterval: 15000, // 进一步缩短到秒
      sessionTimeoutMinutes: 30, // 默认30分钟超时
    };

    console.log('⚙️ 配置初始化完成:', this.config);

    try {
      this.initializeDeviceInfo();
      console.log('📱 设备信息初始化完成:', this.deviceInfo);

      this.startFlushTimer();
      console.log('⏰ 定时器启动完成');
      
      console.log('✅ TrackingService构造函数完成');
    } catch (error) {
      console.error('❌ TrackingService构造函数失败:', error);
    }
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
      this.cleanupOldRecords(); // 清理旧记录
      this.checkSessionTimeout(); // 新增：检查Session超时
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

  /**
   * 清理旧的防重复记录
   */
  private cleanupOldRecords() {
    const now = Date.now();
    const cleanupThreshold = 5 * 60 * 1000; // 5分钟前的记录可以清理
    
    let cleanedCount = 0;
    
    // 清理过期的页面访问调用记录
    for (const [key, timestamp] of this.lastPageVisitCall.entries()) {
      if (now - timestamp > cleanupThreshold) {
        this.lastPageVisitCall.delete(key);
        cleanedCount++;
      }
    }
    
    // 清理可能泄漏的pending请求（理论上不应该存在，但作为安全措施）
    for (const [key, promise] of this.pendingPageVisits.entries()) {
      // 检查Promise是否已经settled（这是一个简单的检查）
      promise.then(() => {
        // Promise已resolved，如果还在Map中则清理
        if (this.pendingPageVisits.get(key) === promise) {
          this.pendingPageVisits.delete(key);
        }
      }).catch(() => {
        // Promise已rejected，如果还在Map中则清理
        if (this.pendingPageVisits.get(key) === promise) {
          this.pendingPageVisits.delete(key);
        }
      });
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 清理了 ${cleanedCount} 个过期的防重复记录`);
    }
  }

  /**
   * 检查Session超时
   */
  private checkSessionTimeout() {
    if (!this.currentSession || !this.lastActivityTime) return;

    const now = new Date();
    const timeSinceLastActivity = now.getTime() - this.lastActivityTime.getTime();
    const timeoutMs = this.config.sessionTimeoutMinutes * 60 * 1000;

    if (timeSinceLastActivity > timeoutMs) {
      console.log('⏰ Session超时，自动结束会话');
      this.endSession('timeout');
    }
  }

  /**
   * 更新最后活动时间
   */
  private updateLastActivity() {
    this.lastActivityTime = new Date();
  }

  // ========== 会话管理 ==========

  /**
   * 开始App生命周期会话（App打开时调用）
   * 每次App打开都创建全新的Session
   */
  public async startAppSession(): Promise<boolean> {
    if (!this.config.enabled) return false;

    try {
      console.log('🚀 startAppSession被调用');
      console.log('📊 当前状态检查:');
      console.log('  - currentSession:', this.currentSession ? `存在(${this.currentSession.sessionId})` : '不存在');
      console.log('  - lastActivityTime:', this.lastActivityTime ? this.lastActivityTime.toISOString() : '不存在');
      
      // 如果有现有会话，先结束它
      if (this.currentSession) {
        console.log('🔄 检测到现有会话，先结束再开始新会话');
        const endSuccess = await this.endSession('app_reopen');
        console.log('🔄 结束现有会话结果:', endSuccess);
      }

      console.log('🔄 准备开始全新会话');
      // 尝试获取token，如果有则开始认证会话
      const token = await authStorage.getItem('userToken');
      if (token) {
        console.log('🔐 检测到用户token，开始认证会话');
        return await this.startSession();
      } else {
        console.log('👤 未检测到token，开始匿名会话追踪');
        // 对于匿名用户，我们仍然可以追踪一些基本信息
        this.currentSession = {
          sessionId: `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: 'anonymous',
          startTime: new Date(),
          deviceType: this.deviceInfo.deviceType,
          isActive: true,
        };
        this.updateLastActivity();
        console.log('✅ 匿名会话开始:', this.currentSession.sessionId);
        return true;
      }
    } catch (error) {
      console.error('开始App会话异常:', error);
      return false;
    }
  }

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
        device_type: this.deviceInfo.deviceType,
        device_model: this.deviceInfo.deviceModel,
        os_version: this.deviceInfo.osVersion,
        app_version: this.deviceInfo.appVersion,
        user_agent: this.deviceInfo.userAgent,
      };

      const apiUrl = `${this.config.apiBaseUrl}/api/tracking/session/start`;
      console.log('🚀 发起会话请求:', apiUrl);
      console.log('📱 请求数据:', requestBody);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 响应状态:', response.status);
      const responseText = await response.text();
      console.log('📄 响应内容:', responseText);

      if (response.ok) {
        const data = JSON.parse(responseText);
        this.currentSession = {
          sessionId: data.session_id || data.sessionId, // 兼容两种格式
          userId: data.user_id || data.userId,
          startTime: new Date(),
          deviceType: this.deviceInfo.deviceType,
          isActive: true,
        };

        this.updateLastActivity(); // 新增：更新活动时间
        console.log('✅ 会话追踪开始成功:', this.currentSession.sessionId);
        return true;
      } else {
        console.error('❌ 开始会话追踪失败:', response.status, responseText);
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
    if (!this.config.enabled || !this.currentSession) {
      console.log('⏸️ 跳过endSession: enabled=' + this.config.enabled + ', currentSession=' + (this.currentSession ? '存在' : '不存在'));
      return false;
    }

    try {
      // 保存当前会话信息，防止并发调用时被清空
      const sessionToEnd = this.currentSession;
      console.log('🔄 准备结束会话:', sessionToEnd.sessionId, 'reason:', reason);

      // 立即清空当前会话，防止重复调用
      this.currentSession = null;
      this.currentPageName = null;
      this.lastActivityTime = null;

      // 先刷新所有待发送的事件
      await this.flushEvents();

      const token = await authStorage.getItem('userToken');
      if (!token) {
        console.log('⚠️ 无token，跳过后端Session结束调用');
        return true; // 本地状态已清理，返回true
      }

      const requestBody = {
        session_id: sessionToEnd.sessionId, // 使用保存的会话信息
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
    if (!this.config.enabled) {
      console.log('⏸️ 追踪已禁用，跳过事件:', eventName);
      return;
    }

    // 更新最后活动时间
    this.updateLastActivity();

    const event: EventData = {
      eventType,
      eventName,
      eventData,
      result,
      deviceType: this.deviceInfo.deviceType,
      sessionId: this.currentSession?.sessionId,
    };

    console.log('📝 添加事件到队列:', event);

    // 添加到队列
    this.eventQueue.push(event);

    console.log(`📊 当前队列长度: ${this.eventQueue.length}/${this.config.batchSize}`);

    // 如果队列达到批量大小，立即刷新
    if (this.eventQueue.length >= this.config.batchSize) {
      console.log('🚀 队列已满，触发批量发送');
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
   * 简化版本：只记录成功和失败，不记录开始状态
   */
  public trackFeatureEvent(featureName: string, featureData?: Record<string, any>, result: 'success' | 'failure' = 'success') {
    // 添加通用的功能事件元数据
    const enrichedData = {
      ...featureData,
      timestamp: new Date().toISOString(),
      feature_name: featureName,
    };
    
    this.trackEvent('FEATURE_USE', featureName, enrichedData, result);
  }

  /**
   * 追踪功能成功事件的便捷方法
   */
  public trackFeatureSuccess(featureName: string, featureData?: Record<string, any>) {
    this.trackFeatureEvent(featureName, featureData, 'success');
  }

  /**
   * 追踪功能失败事件的便捷方法
   */
  public trackFeatureFailure(featureName: string, error: string | Error, featureData?: Record<string, any>) {
    const errorMessage = error instanceof Error ? error.message : error;
    this.trackFeatureEvent(featureName, {
      ...featureData,
      error: errorMessage,
    }, 'failure');
  }

  /**
   * 追踪交互事件
   */
  public trackInteractionEvent(eventName: string, eventData?: Record<string, any>) {
    // 🚫 禁止调用 page_view 事件
    if (eventName === 'page_view') {
      console.log(`🚫 page_view 事件已被禁用，跳过调用`);
      return;
    }
    
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
   * 开始页面访问（仅API调用，不添加事件到队列）
   * 注意：page_view 事件已被禁用
   */
  public async startPageVisit(pageName: string, pageTitle?: string, route?: string, referrer?: string): Promise<boolean> {
    if (!this.config.enabled) {
      console.log('⏸️ 页面访问追踪已禁用');
      return false;
    }

    // 防重复调用检查
    const now = Date.now();
    const lastCallTime = this.lastPageVisitCall.get(pageName) || 0;
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall < this.DUPLICATE_CALL_THRESHOLD) {
      console.log(`🚫 防重复：页面 ${pageName} 在 ${timeSinceLastCall}ms 前刚被调用，跳过重复请求`);
      // 如果有正在进行的请求，返回该请求的Promise
      const pendingRequest = this.pendingPageVisits.get(pageName);
      if (pendingRequest) {
        console.log(`🔄 返回正在进行的页面访问请求: ${pageName}`);
        return pendingRequest;
      }
      return true; // 如果没有正在进行的请求，直接返回成功
    }

    // 记录调用时间
    this.lastPageVisitCall.set(pageName, now);

    // 如果已经有相同页面的请求在进行，返回该请求
    const existingRequest = this.pendingPageVisits.get(pageName);
    if (existingRequest) {
      console.log(`🔄 页面 ${pageName} 已有请求在进行中，返回现有请求`);
      return existingRequest;
    }

    if (!this.currentSession) {
      console.warn('⚠️ 没有活跃会话，但仍尝试记录页面访问 (sessionId将为unknown)');
    }

    console.log('🔥 startPageVisit被调用 (仅API模式):', pageName);
    
    // 创建页面访问请求Promise
    const pageVisitPromise = this.performPageVisit(pageName, pageTitle, route, referrer);
    
    // 存储正在进行的请求
    this.pendingPageVisits.set(pageName, pageVisitPromise);
    
    // 请求完成后清理
    pageVisitPromise.finally(() => {
      this.pendingPageVisits.delete(pageName);
    });

    return pageVisitPromise;
  }

  /**
   * 执行实际的页面访问请求
   */
  private async performPageVisit(pageName: string, pageTitle?: string, route?: string, referrer?: string): Promise<boolean> {
    // 保存之前的页面名称作为referrer
    const previousPageName = this.currentPageName;
    
    console.log('🚫 page_view 事件已被禁用，仅执行API调用');
    console.log('✅ 页面访问追踪（仅API调用）, 当前页面:', pageName);

    // 以下是可选的API调用（如果失败不影响事件追踪）
    try {
      // 如果有之前的页面，先结束它
      if (previousPageName && previousPageName !== pageName) {
        console.log('🔄 结束之前的页面访问:', previousPageName);
        await this.endPageVisit('navigation');
      }

      const token = await authStorage.getItem('userToken');
      if (!token) {
        console.warn('⚠️ 无token，跳过页面访问API调用');
        return true; // 返回true因为事件已经被追踪
      }

      // 更新当前页面名称
      this.currentPageName = pageName;
      
      const requestBody = {
        page_name: pageName,
        page_title: pageTitle,
        route,
        referrer: referrer || previousPageName || undefined,
        device_type: this.deviceInfo.deviceType,
        session_id: this.currentSession?.sessionId || 'unknown',
      };
      
      // console.log('📤 页面访问API请求体:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${this.config.apiBaseUrl}/api/tracking/page/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        console.log('✅ 页面访问API调用成功:', pageName);
        return true;
      } else {
        console.error('❌ 页面访问API失败:', response.status);
        return false; // 修改：API失败时返回false
      }
    } catch (error) {
      console.error('❌ 页面访问API调用异常:', error);
      return false; // 修改：异常时返回false
    }
  }

  /**
   * 结束页面访问
   */
  public async endPageVisit(exitReason: string = 'navigation'): Promise<boolean> {
    if (!this.config.enabled || !this.currentPageName) return false;

    const pageToEnd = this.currentPageName;
    
    // 防重复调用检查 - 使用特殊的key来标识结束请求
    const endKey = `end_${pageToEnd}`;
    const now = Date.now();
    const lastCallTime = this.lastPageVisitCall.get(endKey) || 0;
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall < this.DUPLICATE_CALL_THRESHOLD) {
      console.log(`🚫 防重复：页面结束 ${pageToEnd} 在 ${timeSinceLastCall}ms 前刚被调用，跳过重复请求`);
      return true;
    }

    // 记录调用时间
    this.lastPageVisitCall.set(endKey, now);

    try {
      const token = await authStorage.getItem('userToken');
      if (!token) return false;

      const requestBody = {
        page_name: pageToEnd,
        exit_reason: exitReason,
      };

      console.log('📤 结束页面访问请求:', pageToEnd, 'reason:', exitReason);

      const response = await fetch(`${this.config.apiBaseUrl}/api/tracking/page/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        console.log('✅ 页面访问结束成功:', pageToEnd);
        // 只有在成功时才清空当前页面名称
        if (this.currentPageName === pageToEnd) {
          this.currentPageName = null;
        }
        return true;
      } else {
        console.error('❌ 结束页面访问失败:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ 结束页面访问异常:', error);
      return false;
    }
  }

  // ========== 批量处理 ==========

  /**
   * 刷新事件队列
   */
  private async flushEvents(): Promise<boolean> {
    if (!this.config.enabled || this.eventQueue.length === 0) {
      console.log('🔄 跳过事件刷新: enabled=' + this.config.enabled + ', 队列长度=' + this.eventQueue.length);
      return false;
    }

    try {
      const token = await authStorage.getItem('userToken');
      if (!token) {
        console.warn('⚠️ 无token，跳过事件发送');
        return false;
      }

      const eventsToSend = [...this.eventQueue];
      this.eventQueue = []; // 清空队列

      console.log('📦 准备发送事件数量:', eventsToSend.length);
      console.log('📝 事件详情:', eventsToSend);

      // 转换事件格式为snake_case
      const formattedEvents = eventsToSend.map(event => ({
        event_type: event.eventType,
        event_name: event.eventName,
        event_data: event.eventData,
        result: event.result,
        device_type: event.deviceType,
        session_id: event.sessionId,
      }));

      const requestBody = {
        events: formattedEvents,
        session_id: this.currentSession?.sessionId || 'unknown',
        device_type: this.deviceInfo.deviceType,
      };

      // console.log('📤 发送请求体:', JSON.stringify(requestBody, null, 2));

      const apiUrl = `${this.config.apiBaseUrl}/api/tracking/events/batch`;
      console.log('🎯 批量API地址:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 批量响应状态:', response.status);
      const responseText = await response.text();
      console.log('📄 批量响应内容:', responseText);

      if (response.ok) {
        const data = JSON.parse(responseText);
        console.log(`✅ 批量事件发送成功: ${data.success_count || data.successCount}/${data.total_count || data.totalCount}`);
        return true;
      } else {
        // 发送失败，将事件放回队列
        this.eventQueue.unshift(...eventsToSend);
        console.error('❌ 批量事件发送失败:', response.status, responseText);
        return false;
      }
    } catch (error) {
      console.error('💥 批量事件发送异常:', error);
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
   * 获取当前事件队列长度（调试用）
   */
  public getQueueLength(): number {
    return this.eventQueue.length;
  }

  /**
   * 获取当前配置（调试用）
   */
  public getConfig(): TrackingConfig {
    return { ...this.config };
  }

  /**
   * 获取设备信息（调试用）
   */
  public getDeviceInfo(): any {
    return { ...this.deviceInfo };
  }

  /**
   * 手动触发事件刷新（调试用）
   */
  public async manualFlush(): Promise<boolean> {
    console.log('🔧 手动触发事件刷新');
    return await this.flushEvents();
  }

  /**
   * 获取最近的页面访问调用记录（调试用）
   */
  public getRecentPageVisitCalls(): Array<{key: string, timestamp: number, timeAgo: number}> {
    const now = Date.now();
    return Array.from(this.lastPageVisitCall.entries()).map(([key, timestamp]) => ({
      key,
      timestamp,
      timeAgo: now - timestamp
    }));
  }

  /**
   * 获取当前正在进行的页面访问请求（调试用）
   */
  public getPendingPageVisits(): string[] {
    return Array.from(this.pendingPageVisits.keys());
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

    // 清理防重复状态
    this.pendingPageVisits.clear();
    this.lastPageVisitCall.clear();
    console.log('🧹 清理了所有防重复状态');
  }
}

// 创建单例实例
export const trackingService = new TrackingService();

// 导出类型定义
export type { SessionInfo, EventData, PageVisitData, TrackingConfig }; 