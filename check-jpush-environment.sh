#!/bin/bash

# 检查JPush环境的脚本
echo "🔍 检查JPush推送环境..."
echo ""

# 检查项目依赖
echo "=== 检查项目依赖 ==="
cd elderdiet-frontend

if [ -f "package.json" ]; then
    echo "✅ package.json存在"
    
    # 检查JPush依赖
    if grep -q "jpush-react-native" package.json; then
        JPUSH_VERSION=$(grep "jpush-react-native" package.json | sed 's/.*: *"\(.*\)".*/\1/')
        echo "✅ jpush-react-native依赖存在，版本: $JPUSH_VERSION"
    else
        echo "❌ jpush-react-native依赖不存在"
    fi
    
    # 检查jcore依赖
    if grep -q "jcore-react-native" package.json; then
        JCORE_VERSION=$(grep "jcore-react-native" package.json | sed 's/.*: *"\(.*\)".*/\1/')
        echo "✅ jcore-react-native依赖存在，版本: $JCORE_VERSION"
    else
        echo "❌ jcore-react-native依赖不存在"
    fi
    
    # 检查expo-dev-client
    if grep -q "expo-dev-client" package.json; then
        DEV_CLIENT_VERSION=$(grep "expo-dev-client" package.json | sed 's/.*: *"\(.*\)".*/\1/')
        echo "✅ expo-dev-client依赖存在，版本: $DEV_CLIENT_VERSION"
    else
        echo "❌ expo-dev-client依赖不存在"
    fi
else
    echo "❌ package.json不存在"
fi

echo ""

# 检查JPush配置文件
echo "=== 检查JPush配置 ==="
if [ -f "android/app/src/main/assets/jpush.conf" ]; then
    echo "✅ JPush配置文件存在"
    echo "配置内容:"
    cat android/app/src/main/assets/jpush.conf
    
    # 检查AppKey是否已设置
    if grep -q "fe2833d9f5871fd5f212dc84" android/app/src/main/assets/jpush.conf; then
        echo "✅ AppKey已正确配置"
    else
        echo "⚠️ AppKey可能需要更新"
    fi
else
    echo "❌ JPush配置文件不存在: android/app/src/main/assets/jpush.conf"
fi

echo ""

# 检查TypeScript类型定义
echo "=== 检查类型定义 ==="
if [ -f "types/jpush.d.ts" ]; then
    echo "✅ JPush类型定义存在"
else
    echo "❌ JPush类型定义不存在"
fi

echo ""

# 检查服务文件
echo "=== 检查服务文件 ==="
if [ -f "services/jpushService.ts" ]; then
    echo "✅ JPush服务文件存在"
else
    echo "❌ JPush服务文件不存在"
fi

if [ -f "services/pushService.ts" ]; then
    echo "✅ 推送服务文件存在"
else
    echo "❌ 推送服务文件不存在"
fi

if [ -f "config/jpush.config.ts" ]; then
    echo "✅ JPush配置文件存在"
else
    echo "❌ JPush配置文件不存在"
fi

echo ""

# 检查EAS配置
echo "=== 检查EAS构建配置 ==="
if [ -f "../eas.json" ]; then
    echo "✅ eas.json存在"
    
    # 检查development profile
    if grep -A 5 -B 5 "development" ../eas.json | grep -q "developmentClient"; then
        echo "✅ development构建配置正确"
    else
        echo "⚠️ development构建配置可能需要检查"
    fi
else
    echo "❌ eas.json不存在"
fi

echo ""

# 检查当前运行环境
echo "=== 当前环境状态 ==="
if command -v eas &> /dev/null; then
    echo "✅ EAS CLI已安装，版本: $(eas --version)"
else
    echo "❌ EAS CLI未安装"
    echo "   安装命令: npm install -g @expo/eas-cli"
fi

echo ""
echo "📋 总结："
echo "1. 如果所有依赖都存在 ✅"
echo "2. 并且EAS CLI已安装 ✅"  
echo "3. 那么您可以构建Development Build："
echo "   cd .."
echo "   eas build --profile development --platform android"
echo ""
echo "4. 构建完成后："
echo "   - 下载APK到真实Android设备"
echo "   - 运行: npx expo start --dev-client"
echo "   - JPush应该能正常工作！"
echo ""
echo "🎯 关键点："
echo "- ❌ 不能在Expo Go中测试JPush"
echo "- ✅ 必须使用Development Build"
echo "- ✅ 必须在真实设备上测试" 