JPush-React-Native
ChangeLog
从 RN-JPush2.7.5 开始，重新支持 TypeScript
由于 RN-JCore1.6.0 存在编译问题，从 RN-JCore1.7.0 开始，还是需要在 AndroidManifest.xml 中添加配置代码，具体参考 配置-2.1 Android

1. 安装
   npm install jpush-react-native --save
   注意：如果项目里没有 jcore-react-native，需要安装

npm install jcore-react-native --save
安装完成后连接原生库 进入到根目录执行
react-native link
或
react-native link jpush-react-native
react-native link jcore-react-native

2. 配置
   2.1 Android
   build.gradle

android {
defaultConfig {
applicationId "yourApplicationId" //在此替换你的应用包名
...
manifestPlaceholders = [
JPUSH_APPKEY: "yourAppKey", //在此替换你的 APPKey
JPUSH_CHANNEL: "yourChannel" //在此替换你的 channel
]
}
}
dependencies {
...
implementation project(':jpush-react-native') // 添加 jpush 依赖
implementation project(':jcore-react-native') // 添加 jcore 依赖
}
setting.gradle

include ':jpush-react-native'
project(':jpush-react-native').projectDir = new File(rootProject.projectDir, '../node_modules/jpush-react-native/android')
include ':jcore-react-native'
project(':jcore-react-native').projectDir = new File(rootProject.projectDir, '../node_modules/jcore-react-native/android')
AndroidManifest.xml

<meta-data
	android:name="JPUSH_CHANNEL"
	android:value="${JPUSH_CHANNEL}" />
<meta-data
	android:name="JPUSH_APPKEY"
	android:value="${JPUSH_APPKEY}" />  
2.2 iOS
注意：您需要打开 ios 目录下的.xcworkspace 文件修改您的包名

2.2.1 pod
pod install
注意：如果项目里使用 pod 安装过，请先执行命令

pod deintegrate
2.2.2 手动方式
Libraries

Add Files to "your project name"
node_modules/jcore-react-native/ios/RCTJCoreModule.xcodeproj
node_modules/jpush-react-native/ios/RCTJPushModule.xcodeproj
Capabilities

Push Notification --- ON
Build Settings

All --- Search Paths --- Header Search Paths --- +
$(SRCROOT)/../node_modules/jcore-react-native/ios/RCTJCoreModule/
$(SRCROOT)/../node_modules/jpush-react-native/ios/RCTJPushModule/
Build Phases

libz.tbd
libresolv.tbd
UserNotifications.framework
libRCTJCoreModule.a
libRCTJPushModule.a 3. 引用
3.1 Android
参考：MainApplication.java

3.2 iOS
参考：AppDelegate.m

3.3 js
参考：App.js

4. API
   详见：index.js

5. 其他
   集成前务必将 example 工程跑通
   如有紧急需求请前往极光社区
   上报问题还麻烦先调用 JPush.setLoggerEnable(true}，拿到 debug 日志

---

Android 快速接入
最近更新：2025-01-13
本文旨要引导用户快速集成推送服务，详细集成步骤参考 SDK 集成指南 和 厂商通道 SDK 集成指南。

SDK 下载详见 资源下载。

添加工程配置
Project 根目录的主 gradle 配置
确认 Android Studio 的 Project 根目录的主 gradle 中配置了 mavenCentral 支持（新建 Project 默认配置就支持），配置华为和 FCM Maven 代码库，可根据华为和 FCM 发布的版本更新选择最新版本：

buildscript {
repositories {
google()
mavenCentral()
// hms， 若不集成华为厂商通道，可直接跳过
maven { url 'https://developer.huawei.com/repo/'}
// fcm， 若不集成 FCM 通道，可直接跳过
maven { url "https://maven.google.com" }
}

                 dependencies {
                    // fcm，若不集成 FCM 通道，可直接跳过
                    classpath 'com.google.gms:google-services:4.3.8'
                    // hms，若不集成华为厂商通道，可直接跳过
                    classpath 'com.huawei.agconnect:agcp:1.6.0.300'
                 }
             }

            allprojects {
                  repositories {
                    google()
                    mavenCentral()
                    //hms，若不集成华为厂商通道，可直接跳过
                    maven {url 'https://developer.huawei.com/repo/'}
                    //fcm，若不集成 FCM 通道，可直接跳过
                    maven { url "https://maven.google.com" }
                  }
              }

Module 的 gradle 配置
在 Module 的 gradle 中添加依赖和 AndroidManifest 的替换变量，集成极光推送 SDK 和厂商通道 SDK，其中厂商组合选择所需的通道即可。

android {
......
defaultConfig {
applicationId "com.xxx.xxx" //JPush 上注册的包名.
......

                    ndk {
                        //选择要添加的对应 cpu 类型的 .so 库。
                        abiFilters 'armeabi', 'armeabi-v7a', 'arm64-v8a'
                        // 还可以添加 'x86', 'x86_64', 'mips', 'mips64'
                    }

                    manifestPlaceholders = [
                        JPUSH_PKGNAME : applicationId,
                        //JPush 上注册的包名对应的 Appkey.
                        JPUSH_APPKEY : "你的 Appkey ",
                        //暂时填写默认值即可.
                        JPUSH_CHANNEL : "developer-default",

                        //若不集成厂商通道，可直接跳过以下配置
                        MEIZU_APPKEY : "MZ-魅族的APPKEY",
                        MEIZU_APPID : "MZ-魅族的APPID",
                        XIAOMI_APPID : "MI-小米的APPID",
                        XIAOMI_APPKEY : "MI-小米的APPKEY",
                        OPPO_APPKEY : "OP-oppo的APPKEY",
                        OPPO_APPID : "OP-oppo的APPID",
                        OPPO_APPSECRET : "OP-oppo的APPSECRET",
                        VIVO_APPKEY : "vivo的APPKEY",
                        VIVO_APPID : "vivo的APPID",
                        HONOR_APPID : "Honor的APP ID",
                        NIO_APPID : "蔚来的APP ID",
                    ]
                    ......
                }
                repositories {
                    flatDir {
                        dirs 'libs'
                    }
                }
                ......
            }


            dependencies {
                ......
                // 此处以JPush 5.6.0 版本为例，注意：从 5.0.0 版本开始可以自动拉取 JCore 包，无需另外配置
                implementation 'cn.jiguang.sdk:jpush:5.6.0'

                //若不集成厂商通道，可直接跳过以下依赖
                // 极光厂商插件版本与接入 JPush 版本保持一致，下同
                // 接入华为厂商
                implementation 'com.huawei.hms:push:6.13.0.300'
                implementation 'cn.jiguang.sdk.plugin:huawei:5.6.0'

                // 接入 FCM 厂商
                implementation 'com.google.firebase:firebase-messaging:24.1.0'
                implementation 'cn.jiguang.sdk.plugin:fcm:5.6.0'

                // 接入魅族厂商
                implementation 'cn.jiguang.sdk.plugin:meizu:5.6.0'
                 // JPush Android SDK v5.2.3 开始，需要单独引入 魅族 厂商 aar ，请下载官网 SDK 包并把 jpush-android-xxx-release/third-push/meizu/libs 下的 aar 文件单独拷贝一份到应用 module/libs 下
                implementation(name: 'push-internal-5.0.3', ext: 'aar')

                // 接入 VIVO 厂商
                implementation 'cn.jiguang.sdk.plugin:vivo:5.6.0'


                // 接入小米厂商
                implementation 'cn.jiguang.sdk.plugin:xiaomi:5.6.0'

                // 接入 OPPO 厂商
                implementation 'cn.jiguang.sdk.plugin:oppo:5.6.0'
                // JPush Android SDK v4.6.0 开始，需要单独引入 oppo 厂商 aar ，请下载官网 SDK 包并把 jpush-android-xxx-release/third-push/oppo/libs 下的 aar 文件单独拷贝一份到应用 module/libs 下
                implementation(name: 'com.heytap.msp_3.5.3', ext: 'aar')
                //以下为 OPPO 3.1.0 aar需要依赖
                implementation 'com.google.code.gson:gson:2.10.1'
                implementation 'commons-codec:commons-codec:1.6'
                implementation 'androidx.annotation:annotation:1.1.0'

                // 接入荣耀厂商
                implementation 'cn.jiguang.sdk.plugin:honor:5.6.0'
                //需要单独引入荣耀厂商 aar ，请下载官网 SDK 包并把 jpush-android-xxx-release/third-push/honor/libs 下的 aar 文件单独拷贝一份到应用 module/libs 下
                implementation(name: 'HiPushSDK-8.0.12.307', ext: 'aar')

                // 接入蔚来厂商
                implementation 'cn.jiguang.sdk.plugin:nio:5.6.0'
                //JPush Android SDK v5.6.0 开始需要单独引入蔚来厂商 aar ，请下载官网 SDK 包并把 jpush-android-xxx-release/third-push/nio/libs 下的 aar 文件单独拷贝一份到应用 module/libs 下
                implementation(name: 'niopush-sdk-v1.0', ext: 'aar')
                ......
            }

            apply plugin: 'com.google.gms.google-services'
            apply plugin: 'com.huawei.agconnect'

应用 Module 配置
如果选择的厂商通道包含了 Huawei 厂商通道和 FCM 厂商通道，则需要额外执行以下操作，若未选择可忽略本步骤。
FCM：在 Firebase 上创建和 JPush 上同包名的待发布应用，创建完成后下载该应用的 google-services.json 配置文件并添加到应用的 module 目录下。
Huawei：在 Huawei 上创建和 JPush 上同包名的待发布应用，创建完成后下载该应用的 agconnect-services.json 配置文件并添加到应用的 module 目录下。

配置推送必须组件
在 AndroidManifest 中配置一个 Service 和 Receiver，以在更多手机平台上获得更稳定的支持，示例如下：

<!-- Since JCore2.0.0 Required SDK核心功能-->
<!-- 可配置android:process参数将Service放在其他进程中；android:enabled属性不能是false -->
<!-- 这个是自定义Service，要继承极光JCommonService，可以在更多手机平台上使得推送通道保持的更稳定 -->

<service android:name="xx.xx.XService"
        android:enabled="true"
        android:exported="false"
        android:process=":pushcore">
<intent-filter>
<action android:name="cn.jiguang.user.service.action" />
</intent-filter>
</service>

<!-- 新的 tag/alias 接口结果返回需要开发者配置一个自定义的Receiver -->
<!-- 该广播需要继承 JPush 提供的 JPushMessageReceiver 类, 并如下新增一个 Intent-Filter -->

<receiver
    android:name="自定义 Receiver"
    android:enabled="true"
    android:exported="false" >
<intent-filter>
<action android:name="cn.jpush.android.intent.RECEIVER_MESSAGE" />
<category android:name="您应用的包名" />
</intent-filter>
</receiver>

mavenCentral 集成其他注意事项，查看解决方案。
若需手动集成，查看集成教程。
初始化推送服务
JPush SDK 提供的 API 接口，都主要集中在 cn.jpush.android.api.JPushInterface 类里。

public class ExampleApplication extends Application {
@Override
public void onCreate() {
super.onCreate();
JPushInterface.setDebugMode(true);

        // 调整点一：初始化代码前增加setAuth调用
        boolean isPrivacyReady; // app根据是否已弹窗获取隐私授权来赋值
        if(!isPrivacyReady){
            JCollectionAuth.setAuth(context, false); // 后续初始化过程将被拦截
        }
        JPushInterface.init()


        // 调整点二：隐私政策授权获取成功后调用
        JCollectionAuth.setAuth(context, true); //如初始化被拦截过，将重试初始化过程
    }

}

验证推送结果
集成完成后，如果输出以下日志则代表您已经集成成功。

D/JIGUANG-JPush: [ActionHelper] doAction:init
......
I/JIGUANG-JCore: [ConnectingHelper] Register succeed - juid:58446897155, registrationId:1104a89792620fb0b02, deviceId:null

获取日志中的 registrationId，并在极光控制台 创建推送 体验推送服务。
推送完成后，你可以在 推送历史 中查看推送状态、推送通道、送达率等详细数据。

---

iOS 快速接入
最近更新：2022-05-12
本文旨要引导用户快速集成推送服务，详细集成步骤参考 SDK 集成指南。

添加工程配置
导入方式 1.推荐使用 Cocoapods 导入方式选择最新版本方式集成

pod 'JCore' // 可选项，也可由 pod 'JPush'自动获取
pod 'JPush' // 必选项

注：如果无法导入最新版本，请执行 pod repo update master 这个命令来升级本机的 pod 库，然后重新 pod 'JPush'

2.如果需要安装指定版本则使用以下方式（以 JPush 4.8.0 版本为例）：

pod 'JCore', '3.2.3' // 可选项，也可由 pod 'JPush'自动获取
pod 'JPush', '4.8.0' // 必选项

注意事项
App 在苹果应用市场审核注意事项，查看解决方案。
App 选择使用无 IDFA 版本，查看解决方案。
若需手动集成，查看集成教程。
初始化推送服务
全局配置

<key>NSAppTransportSecurity</key>
<dict>
<key>NSAllowsArbitraryLoads</key>
<true/>
</dict>

添加头文件
请将以下代码添加到 AppDelegate.m 引用头文件的位置。

// 引入 JPush 功能所需头文件
#import "JPUSHService.h"
#import <UserNotifications/UserNotifications.h>

添加 Delegate
为 AppDelegate 添加 Delegate，参考代码：

@interface AppDelegate ()<JPUSHRegisterDelegate>

@end

添加初始化代码
添加初始化 APNs 代码

请将以下代码添加到
-(BOOL)application:(UIApplication _)application
didFinishLaunchingWithOptions:(NSDictionary _)launchOptions{

//【注册通知】通知回调代理（可选）
JPUSHRegisterEntity \* entity = [[JPUSHRegisterEntity alloc] init];
entity.types = JPAuthorizationOptionAlert|JPAuthorizationOptionBadge|JPAuthorizationOptionSound|JPAuthorizationOptionProvidesAppNotificationSettings;
[JPUSHService registerForRemoteNotificationConfig:entity delegate:self];
}

请将以下代码添加到

- (void)application:(UIApplication)application
  didRegisterForRemoteNotificationsWithDeviceToken:(NSData)deviceToken {

      //sdk注册DeviceToken
      [JPUSHService registerDeviceToken:deviceToken];

}

添加初始化 JPush 代码

请将以下代码添加到

-(BOOL)application:(UIApplication \*)application

didFinishLaunchingWithOptions:(NSDictionary \*)launchOptions{

//【初始化 sdk】
// notice: 2.1.5 版本的 SDK 新增的注册方法，改成可上报 IDFA，如果没有使用 IDFA 直接传 nil
[JPUSHService setupWithOption:launchOptions appKey:appKey
channel:channel
apsForProduction:isProduction
advertisingIdentifier:advertisingId];

}

部分参数说明：
appKey
选择极光控制台的应用 ，点击“设置”获取其 appkey 值。请确保应用内配置的 appkey 与极光控制台上创建应用后生成的 appkey 一致。
channel
指明应用程序包的下载渠道，为方便分渠道统计，具体值由你自行定义，如：App Store。
apsForProduction
1.3.1 版本新增，用于标识当前应用所使用的 APNs 证书环境。
0（默认值）表示采用的是开发证书，1 表示采用生产证书发布应用。
注：此字段的值要与 Build Settings 的 Code Signing 配置的证书环境一致。
advertisingIdentifier
详见 关于 IDFA。
验证推送结果
集成完成后，真机调试该项目，如果控制台输出以下日志则代表您已经集成成功。

2022-01-10 12:05:38.914868+0800 PushTest[329:9045] | JIGUANG | I - [JIGUANGTcpEventController]
----- register result -----
uid: 58446934317
registrationID:1517bfd3f70cc645a1c

获取日志中的 registrationID，并在极光控制台 创建推送 体验通知推送服务。
推送完成后，你可以在 推送历史 中查看推送状态、推送通道、送达率等详细数据。

---

三分钟完成 Demo 体验
最近更新：2022-03-14
本文目的在于，指导新接触极光推送的开发者，在短短几分钟时间内把极光推送跑起来：

安装 Demo 到客户端。
在 Portal 上创建推送。
客户端收到推送并显示在状态栏 。
创建极光开发者帐号
创建极光开发者帐号，请访问 极光推送官方网站。

创建应用
完成极光开发者账号的注册后，进入极光控制台，点击“创建应用”按钮，填写应用名称即可创建应用。

配置推送服务
选择服务“消息推送”，点击下一步。

Android 配置
在 Android 版块填上你的应用包名，并选择需要集成的厂商通道，点击下一步即可完成推送服务配置。

iOS 配置
上传 iOS 推送证书 后，点击下一步即可完成推送服务配置。

下载推送 Demo
Android 平台
点击“下载推送 Demo，免集成体验移动端接收消息” ，扫码下载推送 Demo，此 Demo 是已经配置好当前应用包名与 AppKey 的示例应用，可直接安装到手机，用于客户端接收推送。

iOS 平台
点击“下载 SDK”，并使用 Xcode 运行应用到手机。

快速测试推送
安装并打开实例应用，在应用首页获取设备的 Registration ID，如下图所示。

保持示例应用前台活跃并联网，在扫码下载推送 Demo 页面的底部输入 Registration ID，即可发送测试消息（仅支持 Android 平台）。若您需体验更多的消息样式、推送类型等，可参考下文：Portal 创建推送。

Portal 创建推送
进入【极光控制台】-【消息推送】-【创建推送】-【通知消息】，可测试更多的消息样式、推送类型，具体详情请查看 创建推送。

客户端接收推送
在上述步骤安装推送 Demo 的手机上，你就可以收到推送的通知了。

---

创建极光开发者帐号
创建极光开发者帐号，请访问 极光推送官方网站。

创建应用
完成极光开发者账号的注册后，进入【极光控制台】-【应用管理】页面，点击“创建应用”按钮。

填写应用名称并选择应用类型，即可完成应用创建。

配置推送服务
选择服务“消息推送”，点击下一步。

Android 配置
在 Android 版块填上你的应用包名，并选择需要集成的厂商通道，点击下一步即可完成推送服务配置。

请慎重填写包名，包名保存成功后不支持自助修改，若需修改需联系技术支持，提供相关资料后方可修改。

HarmonyOS 配置
在 HarmonyOS 版块填上你的应用包名，并填写默认标题、上传厂商密钥文件，保存即可完成推送服务配置。

请慎重填写包名，包名保存成功后不支持自助修改，若需修改需联系技术支持，提供相关资料后方可修改。

iOS 配置
上传 iOS 推送证书 后，点击下一步即可完成推送服务配置。

---

创建推送任务
最近更新：2024-03-28
本文旨在指导客户如何在极光控制台上快速创建推送任务，更多推送参数配置参考 创建推送 文档。

推送配置说明
完成 SDK 接入后，可以进入【消息推送】-【推送管理】-【创建推送】-【通知消息】页面创建推送任务，必要配置如下：

选择目标平台：根据集成 SDK 的平台，选择需要推送的平台。
通知标题：推送消息的标题，请尽量避免“test、测试、纯数字” 等无意义内容，否则可能会被厂商拦截而无法接收到通知消息。
通知内容：推送消息的内容，请尽量避免“test、测试、纯数字” 等无意义内容，否则可能会被厂商拦截而无法接收到通知消息。
选择目标：需要推送的目标人群，测试时建议使用注册日志中获取的 registrationID 进行推送。

发送预览
配置推送参数后，点击发送预览，可以查看配置的推送参数和预估推送人数。

确认预估人数>0，点击确认即可成功创建推送任务。

## 若预估人数为 0，推送无法发送，并会返回以下错误：

查看推送历史
最近更新：2025-01-13
本文旨在指导客户如何在极光控制台上快速查看推送记录。

推送记录
推送成功后，点击“去看看”，进入推送记录页面。

推送记录页面会显示 Message ID、推送状态等内容，点击“详情”可以查看通知详情。

推送状态为“推送失败”时，该条推送显示为红色，点击“推送失败”右侧符号可以查看详细错误信息。

通知详情
基本消息
点击消息体，可以查看这条推送的 json 消息体。

通知消息
选择对应的平台，可以查看该平台不同通道的详细推送数据。

折损原因分析
点击环形区域可以查看细分的折损原因。

---

快速排查问题
最近更新：2022-03-14
本文主要引导用户在推送收不到时，可以通过推送记录、排查工具等工具快速地进行问题排查。

推送记录
推送收不到时，查看推送记录的消息是否有正常下发，如果推送状态为“推送失败”，点击消息查看对应的错误信息，根据报错信息修改后再重新下发。

排查工具
消息查询
推送收不到时，可以进入【极光控制台】-【消息推送】-【配置管理】-【排查工具】-【消息查询】页面进行生命周期排查，输入 Message ID 和 Registration ID，点击查询即可查看消息的生命周期，查询结果如下图：

消息生命周期：如果发送失败，会在相应的失败环节展示错误码+错误提示信息。
特殊消息生命周期：如果消息类型为通知消息+自定义消息，则消息生命周期会产生两条分叉路径。
消息基本信息：展示消息类型、发送策略和消息体，点击消息体可以查看消息体 json。
设备基本信息：展示通知权限开关状态、厂商注册情况、最近在线时间等设备基本信息。
Message ID 获取方法
进入【极光控制台】-【消息推送】-【推送管理】-【推送记录】页面，即可获取 Message ID。

API 调用后在应答参数中获取 ​：

{
"sendno": "0",
"msg_id": "54043471036732219"
}

Registration ID 获取方法
客户端初始化 JPush 成功后，JPush 服务端会分配一个 Registration ID，作为此设备的标识（同一个手机不同 App 的 Registration ID 是不同的），因此排查时需要获取 Registration ID 定位问题，获取方法：Android、iOS。

---

SDK 概述
最近更新：2021-12-15
Android 常见问题
Android 客户端 SDK 下载
JPush Android
jpush_android

开发者集成 JPush Android SDK 到其应用里，JPush Android SDK 创建到 JPush Cloud 的长连接，为 App 提供长期在线的能力。 当开发者想要及时地推送消息到达 App 时，只需要调用 JPush API 推送，或者使用其他方便的智能推送工具，即可轻松与用户交流。

图中红色部分，是 JPush 与 App 开发者的接触点。手机客户端侧，App 需要集成 JPush SDK；服务器端部分，开发者调用 JPush REST API 来进行推送。

Android SDK 服务
JPush Android SDK 是作为 Android Service 长期运行在后台的，从而创建并保持长连接，为 App 提供长期在线的能力，当然也会受到厂商设备系统级进程管理机制控制，详情参见 常见问题。

多平台支持
JPush Android SDK 除了 jar 包，还有一个 .so 文件，.so 文件需要与 CPU 平台适配，需要支持哪个平台的 CPU，就需要包含这个平台相应的 .so 编译文件。

除支持默认的 ARM CPU 平台之外，JPush SDK 还提供 x86 与 MIPs 平台的 CPU 版本 SDK。请单独到 资源下载 页下载。

电量与流量
JPush Android SDK 由于使用自定义协议，协议体做得极致地小，流量消耗非常地小。

电量方面，JPush Android SDK 经过持续地优化，尽可能减少不必要的代码执行；并且，长期的版本升级迭代，不断地调优，在保证一定的网络连接稳定性的要求小，减少电量消耗。

压缩包说明
供下载的 JPush Android SDK 压缩包，一般包含以下几个部分：

.jar 文件
.so 文件
AndroidManifest.xml 配置示例
其中 .jar, .so 文件有版本号后缀，需要互相匹配。请升级时一定记得检查版本号，并删除旧版本。

AndroidManifest.xml 配置示例可能在版本升级时，会有变更。请留意 版本发布说明。

Android SDK 集成
请参考以下文档与教程，来集成 Android SDK。

三分钟完成 Demo 体验（Android）
Android 集成指南
集成到其他平台
客户端集成插件

---

使用提示
本文是 JPush Android SDK 标准的集成指南文档。用以指导 SDK 的使用方法，默认读者已经熟悉 IDE（Eclipse 或者 Android Studio）的基本使用方法，以及具有一定的 Android 编程知识基础。

本篇指南匹配的 JPush Android SDK 版本为：3.0.0 及以后版本。

三分钟完成 Demo 体验（Android）：如果您想要快速地测试、感受下极光推送的效果，请参考本文在几分钟内跑通 Demo。
极光推送 文档网站 上，有极光推送相关的所有指南、API、教程等全部的文档。包括本文档的更新版本，都会及时地发布到该网站上。
如果您看到本文档，但还未下载 Android SDK，请访问 组装 SDK 服务 并下载。
产品功能说明
极光推送（JPush）是一个端到端的推送服务，使得服务器端消息能够及时地推送到终端用户手机上，让开发者积极地保持与用户的连接，从而提高用户活跃度、提高应用的留存率。极光推送客户端支持 Android，iOS 两个平台。

本 Android SDK 方便开发者基于 JPush 来快捷地为 Android App 增加推送功能。

主要功能
保持与服务器的长连接，以便消息能够即时推送到达客户端
接收通知与自定义消息，并向开发者 App 传递相关信息
主要特点
客户端维持连接占用资源少、耗电低
SDK 丰富的接口，可定制通知栏提示样式
服务器大容量、稳定
SDK 所支持的 Android 系统版本
目前 SDK 只支持 Android 2.3 或以上版本的手机系统;
富媒体信息流功能则需 Android 3.0 或以上版本的系统。
mavenCentral 自动集成方式（推荐）
使用 mavenCentral 自动集成的开发者，不需要在项目中添加 jar 和 so，mavenCentral 会自动完成依赖；在 AndroidManifest.xml 中不需要添加任何 JPush SDK 相关的配置，mavenCentral 会自动导入。

如果需要处理收到的消息、使用 3.0.7 版本支持的别名与标签的新接口，AndroidManifest 中的自定义广播接收器仍需开发者手动配置，参考 SDK 压缩包里的 AndroidManifest.xml 样例文件。

修改组件属性
如果开发者需要修改组件属性，可以在本地的 AndroidManifest 中定义同名的组件并配置想要的属性，然后用 xmlns:tools 来控制本地组件覆盖 mavenCentral 上的组件。示例：

<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.android.tests.flavorlib.app"
    xmlns:tools="http://schemas.android.com/tools">

    <application
        android:icon="@drawable/icon"
        android:name="com.example.jpushdemo.ExampleApplication"
        android:label="@string/app_name" >

  </application>

</manifest>

配置 mavenCentral 支持
确认 android studio 的 Project 根目录的主 gradle 中配置了 mavenCentral 支持。（新建 project 默认配置就支持）

buildscript {
repositories {
mavenCentral()
}
......
}

allprojects {
repositories {
mavenCentral()
}
}

配置依赖和替换变量
在 module 的 gradle 中添加依赖和 AndroidManifest 的替换变量。

android {
......
defaultConfig {
applicationId "com.xxx.xxx" //JPush 上注册的包名.
......

    ndk {
        //选择要添加的对应 cpu 类型的 .so 库。
        abiFilters 'armeabi', 'armeabi-v7a', 'arm64-v8a'
        // 还可以添加 'x86', 'x86_64', 'mips', 'mips64'
    }

    manifestPlaceholders = [
        JPUSH_PKGNAME : applicationId,
        JPUSH_APPKEY : "你的 Appkey ", //JPush 上注册的包名对应的 Appkey.
        JPUSH_CHANNEL : "developer-default", //暂时填写默认值即可.
    ]
    ......

}
......
}

dependencies {
......

implementation 'cn.jiguang.sdk:jpush:5.8.0' // 必选，此处以 JPush 5.8.0 版本为例，注意：5.0.0 版本开始可以自动拉取 JCore 包，无需另外配置
implementation 'cn.jiguang.sdk:joperate:2.0.2' // 可选，集成极光分析 SDK 后，即可支持行为触发推送消息、推送转化率统计，用户行为分析和用户标签等功能

}

极光分析 SDK 更多功能和 API 详见极光分析 SDK 集成指南

如果需要使用指定版本的 JCore，可以使用如下命令，不再自动拉取最新版 jcore

implementation ('cn.jiguang.sdk:jpush:5.8.0'){
exclude group: 'cn.jiguang.sdk', module: 'jcore' //不再使用自动拉取的最新版 JCore
}
implementation 'cn.jiguang.sdk:jcore:5.x.x' //使用指定的 JCore 版本

当使用的 JPush ≥ 5.0.0 且 JCore < 4.2.0 时，需要在清单文件中添加以下配置：

<provider tools:node="remove"
            android:exported="false"
            android:authorities="${applicationId}.jiguang.InitProvider"
            android:name="cn.jpush.android.service.InitProvider"></provider>

如果使用的 JPush ＜ 5.0.0 版本时，需要配置 JCore 依赖：

implementation 'cn.jiguang.sdk:jpush:4.x.x'
implementation 'cn.jiguang.sdk:jcore:4.x.x'

Google Play 版本
如果你希望使用 Google Play 版本，则自动集成时需要选择 Google Play 版本对应 SDK

5.0.0 版本开始可以自动拉取 JCore 包，无需另外配置，配置如下：

dependencies {
......

implementation 'cn.jiguang.sdk:jpush-google:5.8.0' // 此处以 JPush 5.8.0 Google Play 版本为例，

}

如果想剔除 JPush 自动依赖的 JCore，可以使用以下方式：

implementation ('cn.jiguang.sdk:jpush-google:5.8.0'){
exclude group: 'cn.jiguang.sdk', module: 'jcore-google'//会自动把 JCore 剔除
}

注意 ：当使用 JPush 5.0.0 及以上版本时，用户移除了 JPush 自动依赖的 JCore 版本，而使用自己依赖的 JCore 其他版本当 JCore 版本< 4.2.0 时，需要在清单文件中添加以下配置：

<provider tools:node="remove"
            android:exported="false"
            android:authorities="${applicationId}.jiguang.InitProvider"
            android:name="cn.jpush.android.service.InitProvider"></provider>

如果使用 JPush 5.0.0 及以下版本时，需要配置 JCore 依赖：

implementation 'cn.jiguang.sdk:jpush-google:4.x.x'
implementation 'cn.jiguang.sdk:jcore-google:4.x.x'

配置 Service
如果你使用的 JCore 是 2.0.0 及以上的版本，需要额外在 Androidmanifest 中配置一个 Service，以在更多手机平台上获得更稳定的支持，示例如下。（JCore1.x 版本不需要）

 <!-- Since JCore2.0.0 Required SDK核心功能-->
 <!-- 可配置android:process参数将Service放在其他进程中；android:enabled属性不能是false -->
 <!-- 这个是自定义Service，要继承极光JCommonService，可以在更多手机平台上使得推送通道保持的更稳定 -->

<service android:name="xx.xx.XService"
         android:enabled="true"
         android:exported="false"
         android:process=":pushcore">
<intent-filter>
<action android:name="cn.jiguang.user.service.action" />
</intent-filter>
</service>

配置 Receiver
从 JPush3.0.7 开始，需要配置继承 JPushMessageReceiver 的广播，原来如果配了 MyReceiver 现在可以弃用。示例如下。

 <!-- Required since 3.0.7 -->
 <!-- 新的 tag/alias 接口结果返回需要开发者配置一个自定的广播 -->
 <!-- 3.3.0开始所有事件将通过该类回调 -->
 <!-- 该广播需要继承 JPush 提供的 JPushMessageReceiver 类, 并如下新增一个 Intent-Filter -->

<receiver
       android:name="自定义 Receiver"
       android:enabled="true"
       android:exported="false" >
<intent-filter>

<!-- 从 JPush v5.4.0 版本开始，请特别注意 RECEIVER_MESSAGE 写法, 如配置错误则无法找到回调类 -->
<action android:name="cn.jpush.android.intent.RECEIVER_MESSAGE" />
<category android:name="您应用的包名" />
</intent-filter>
</receiver>

注 :SDK 回调方式说明

SDK 版本：3.0.7<= x < 5.2.0 和 5.4.0 及以上 使用 receiver 方式
SDK 版本：5.2.0<= x <=5.3.1 使用 service 方式
注 : 如果在添加以上 abiFilter 配置之后 android Studio 出现以下提示：

NDK integration is deprecated in the current plugin. Consider trying the new experimental plugin

则在 Project 根目录的 gradle.properties 文件中添加：

android.useDeprecatedNdk=true

注 : 使用 NDK r17 时，可能 Android Studio 会出现以下提示：

A problem occurred starting process ‘command
‘/Users/xxx/Library/Android/sdk/ndk-bundle/toolchains/mips64el-linux-android-4.9/prebuilt
/darwin-x86_64/bin/mips64el-linux-android-strip”

系统找不到指定的文件

这是因为 NDK r17 之后不再支持 mips 平台，在 build.gradle 里增加如下配置可解决

android {

    defaultConfig {
        .....
    }

    packagingOptions {
        doNotStrip '*/mips/*.so'
        doNotStrip '*/mips64/*.so'
    }

}

若没有 res/drawable-xxxx/jpush_notification_icon 这个资源默认使用应用图标作为通知 icon，在 5.0 以上系统将应用图标作为 statusbar icon 可能显示不正常，用户可定义没有阴影和渐变色的 icon 替换这个文件，文件名不要变。

配置和代码说明
必须权限说明
权限 用途
You Package.permission.JPUSH_MESSAGE 官方定义的权限，允许应用接收 JPush 内部代码发送的广播消息。
INTERNET 允许应用可以访问网络。
ACCESS_NETWORK_STATE 允许应用获取网络信息状态，如当前的网络连接是否有效。
集成 JPush Android SDK 的混淆
请下载 4.x 及以上版本的 proguard.jar， 并替换你 Android SDK "tools\proguard\lib\proguard.jar"

请在工程的混淆文件中添加以下配置：

    -dontoptimize
    -dontpreverify

    -dontwarn cn.jpush.**
    -keep class cn.jpush.** { *; }
    -keep class * extends cn.jpush.android.service.JPushMessageReceiver { *; }

    -dontwarn cn.jiguang.**
    -keep class cn.jiguang.** { *; }

2.0.5 ~ 2.1.7 版本有引入 gson 和 protobuf，增加排除混淆的配置。（2.1.8 版本不需配置）

        #==================gson && protobuf==========================
        -dontwarn com.google.**
        -keep class com.google.gson.** {*;}
        -keep class com.google.protobuf.** {*;}

关于资源混淆
极光 SDK 资源不能混淆，如果有资源混淆需要添加以下白名单：

andResGuard {
...
whiteList = [
"R.xml.jpush*",
"R.drawable.jpush*",
"R.layout.jpush*",
"R.layout.push*",
"R.string.jg*",
"R.style.MyDialogStyle",
"R.style.JPushTheme"
]
...
}

添加代码
JPush SDK 提供的 API 接口，都主要集中在 cn.jpush.android.api.JPushInterface 类里。

基础 API
init 初始化 SDK 与开启推送服务 API
特别提醒：

1. 考虑 APP 上线合规，开发者必须在 APP 用户同意了隐私政策，并且开发者确定为 App 用户开始提供推送服务后，再调用此接口启用推送业务功能来使用极光服务。
2. 关于 APP 隐私政策建议和说明，具体可以参考 极光推送 SDK 合规指引。

public static void init(Context context, JPushConfig config);

setDebugMode 设置调试模式
注：该接口需在 init 接口之前调用，避免出现部分日志没打印的情况。多进程情况下建议在自定义的 Application 中 onCreate 中调用。

// You can enable debug mode in developing state. You should close debug mode when release.
public static void setDebugMode(boolean debugEnalbed)

添加统计代码
参考文档： 统计分析 API
调用示例代码（参考 example 项目）
init 只需要在应用程序启动时调用一次该 API 即可。

以下代码定制一个本应用程序 Application 类。需要在 AndoridManifest.xml 里配置。请参考上面 AndroidManifest.xml 片断，或者 example 项目。

public class ExampleApplication extends Application {
@Override
public void onCreate() {
super.onCreate();
JPushInterface.setDebugMode(true);

        // 调整点一：初始化代码前增加setAuth调用
        boolean isPrivacyReady; // app根据是否已弹窗获取隐私授权来赋值
        if(!isPrivacyReady){
            JCollectionAuth.setAuth(context, false); // 后续的初始化与启用推送服务过程将被拦截，即不会开启推送业务
        }
        JPushInterface.init()


        // 调整点二：App用户同意了隐私政策授权，并且开发者确定要开启推送服务后调用
        JCollectionAuth.setAuth(context, true); //如初始化被拦截过，将重试初始化过程
    }

}

测试确认
确认所需的权限都已经添加。如果必须的权限未添加，日志会提示错误。
确认 AppKey（在 Portal 上生成的）已经正确的写入 Androidmanifest.xml 。
确认在程序启动时候调用了 init（context）接口
确认测试手机（或者模拟器）已成功连入网络 ＋ 客户端调用 init 后不久，如果一切正常，应有登录成功的日志信息
启动应用程序，在 Portal 上向应用程序发送自定义消息或者通知栏提示。详情请参考 创建推送。
在几秒内，客户端应可收到下发的通知或者正定义消息，如果 SDK 工作正常，则日志信息会如下：

[JPushInterface] action:init
.......
[ConnectingHelper] Login succeed

如图所示，客户端启动分为 4 步：

检查 metadata 的 appKey 和 channel，如果不存在，则启动失败
初始化 JPush SDK，检查 JNI 等库文件的有效性，如果库文件无效，则启动失败
检查 Androidmanifest.xml，如果有 Required 的权限不存在，则启动失败
连接服务器登录，如果存在网络问题，则登陆失败，或者前面三步有问题，不会启动 JPush SDK
进阶功能
获取 Registration ID 交互建议
由于极光推送所有形式的推送最后都会转化为对 Registration ID 推送，因此排查客户问题的时候需要提供 Registration ID。为了方便线上客户准确提供信息，减少沟通成本，我们建议您完成 SDK 集成后，在 App 的【关于】、【意见反馈】、【我的】等比较不常用的 UI 中展示客户的 Registration ID 。

示例代码：

JPushInterface.getRegistrationID(getContext());

效果如图：

其他功能
请参考：

API：Android

其他集成方式
组装服务集成方式
组包服务是对手动集成 SDK 的封装服务，通过将 SDK 组合到单独的 jiguang module ，将手动集成的共同配置业务隐藏，开发者只需关注自己本身的个性化配置，减少集成步骤，提高开发者接入效率。

如您需要使用 Jpush 组包服务，请在组包服务界面勾选 JPush 服务，并 组装 SDK。 jpush_android_3m

jiguang_sdk.zip 集成压缩包内容说明
jiguang

JIGUANG SDK 组合包
JPush jar 包，资源文件等已在该包中进行依赖，无需在手动拷贝依赖
jiguang-demo

JIGUANG SDK 组合包集成 demo。
是一个完整的 Android 项目，通过这个演示了组包服务的基本用法，可以用来做参考。
根据您勾选的服务自动组合构建，组包前预设的相关配置会同时预埋到 demo 中
导入 JIGUANG SDK
通过 AS 将 SDK 作为 module 导入项目

导入步骤：AndroidStudio -> File -> New -> Import Module -> 选择 jiguang 导入

配置 JIGUANG SDK
settings.gradle 配置添加：

include ':jiguang'

在应用 gradle 中 添加 SDK 依赖

android {
......
defaultConfig {
applicationId "com.xxx.xxx" //JPush 上注册的包名.
......

        manifestPlaceholders = [
            JPUSH_PKGNAME : applicationId,
            JPUSH_APPKEY : "你的 Appkey ", //JPush 上注册的包名对应的 Appkey.
            JPUSH_CHANNEL : "developer-default", //暂时填写默认值即可.
        ]
        ......
    }
    ......

}

dependencies {
......

    implementation project(':jiguang')
    ......

}

在应用 Androidmanifest 中配置

<!-- Since JCore2.0.0 Required SDK核心功能-->
<!-- 可配置android:process参数将Service放在其他进程中；android:enabled属性不能是false -->
<!-- 这个是自定义Service，要继承极光JCommonService，可以在更多手机平台上使得推送通道保持的更稳定 -->

<service android:name="xx.xx.XService"
        android:enabled="true"
        android:exported="false"
        android:process=":pushcore">
<intent-filter>
<action android:name="cn.jiguang.user.service.action" />
</intent-filter>
</service>

 <!-- Required since 3.0.7 -->
 <!-- 新的 tag/alias 接口结果返回需要开发者配置一个自定的广播 -->
 <!-- 3.3.0开始所有事件将通过该类回调 -->
 <!-- 该广播需要继承 JPush 提供的 JPushMessageReceiver 类, 并如下新增一个 Intent-Filter -->

<receiver
       android:name="自定义 Receiver"
       android:enabled="true"
       android:exported="false" >
<intent-filter>
<action android:name="cn.jpush.android.intent.RECEIVER_MESSAGE" />
<category android:name="您应用的包名" />
</intent-filter>
</receiver>

手动集成方式
手动集成压缩包下载链接：前往下载

jpush-android-3.x.x-release.zip 集成压缩包内容
AndroidManifest.xml
客户端嵌入 SDK 参考的配置文件
libs/jcore-android.x.x.x.jar
极光开发者服务的核心包。
libs/jpush-android-3.x.y.jar
JPush SDK 开发包。
libs/(cpu-type)/libjcore1xx.so
各种 CPU 类型的 native 开发包。
res
集成 SDK 必须添加的资源文件
example
是一个完整的 Android 项目，通过这个演示了 JPush SDK 的基本用法，可以用来做参考。
SDK 文件移植
解压缩 jpush-android--3.x.x-release.zip 集成压缩包。
复制 libs/jcore-android-x.x.x.jar 到工程 libs/ 目录下。
复制 libs/jpush-android-3.x.x.jar 到工程 libs/ 目录下。
复制 libs/(cpu-type)/libjcore1xy.so 到你的工程中存放对应 cpu 类型的目录下。
复制 res/ 中 drawable-hdpi, layout, values 文件夹中的资源文件到你的工程中 res/ 对应同名的目录下。
说明 1：若没有 res/drawable-xxxx/jpush_notification_icon 这个资源默认使用应用图标作为通知 icon，在 5.0 以上系统将应用图标作为 statusbar icon 可能显示不正常，用户可定义没有阴影和渐变色的 icon 替换这个文件，文件名不要变。

说明 2：使用 android studio 的开发者，如果使用 jniLibs 文件夹导入 so 文件，则仅需将所有 cpu 类型的文件夹拷进去；如果将 so 文件添加在 module 的 libs 文件夹下，注意在 module 的 gradle 配置中添加一下配置：

android {
......
sourceSets {
main {
jniLibs.srcDirs = ['libs']
......
}
......
}
......
}

配置 AndroidManifest.xml
根据 SDK 压缩包里的 AndroidManifest.xml 样例文件，来配置应用程序项目的 AndroidManifest.xml 。

主要步骤为：

复制备注为 "Required" 的部分
将标注为“您应用的包名”的部分，替换为当前应用程序的包名
将标注为“您应用的 Appkey” 的部分，替换为在 Portal 上创建该应用后应用信息中的 Appkey，例如：9fed5bcb7b9b87413678c407
说明：

如果使用 android studio，可在 AndroidManifest 中引用 applicationId 的值，在 build.gradle 配置中 defaultConfig 节点下配置，如：

defaultConfig {
applicationId "cn.jpush.example" //您应用的包名
......
}

在 AndroidManifest 中使用 ${applicationId} 引用 gradle 中定义的包名

AndroidManifest 示例

<?xml version="1.0" encoding="utf-8"?>

<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="您应用的包名"
    android:versionCode="316"
    android:versionName="3.1.6"
    >
<uses-sdk android:minSdkVersion="9" android:targetSdkVersion="23" />

    <!-- Required -->
    <permission
        android:name="您应用的包名.permission.JPUSH_MESSAGE"
        android:protectionLevel="signature" />
    <uses-permission android:name="您应用的包名.permission.JPUSH_MESSAGE" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <!-- 适配Android13，弹出通知必须权限-->
     <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>

    <!-- Optional. Required for location feature -->
    <!-- 为了提高sdk识别唯一用户的能力，保证消息推送的精准送达，建议集成以下权限（可选）-->
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />
    <uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" />
    <uses-permission android:name="android.permission.GET_TASKS" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />

   <!-- 如您需要接入地理围栏业务，建议集成以下权限（可选）-->

    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

    <!-- 如您需要对应设备通知相关的能力，建议集成以下权限（可选）-->
    <uses-permission android:name="com.huawei.android.launcher.permission.CHANGE_BADGE" /><!-- 华为角标 -->
    <uses-permission android:name="com.vivo.notification.permission.BADGE_ICON" /><!-- VIVO角标权限 -->
    <uses-permission android:name="com.hihonor.android.launcher.permission.CHANGE_BADGE" /><!--honor 角标-->
    <uses-permission android:name="android.permission.VIBRATE" /><!--振动器权限，JPUSH支持通知开启振动功能，小米推送必须-->

    <!-- 扩展备用权限（可选）-->
    <permission android:name="${applicationId}.permission.JOPERATE_MESSAGE" android:protectionLevel="signature"/>
    <uses-permission android:name="${applicationId}.permission.JOPERATE_MESSAGE" />


    <application
        android:icon="@drawable/ic_launcher"
        android:label="@string/app_name"
        android:name="Your Application Name">

        <!-- Required SDK 核心功能-->
        <!-- 可配置 android:process 参数将 PushService 放在其他进程中 -->
        <service
            android:name="cn.jpush.android.service.PushService"
            android:enabled="true"
            android:exported="false" >
            <intent-filter>
                <action android:name="cn.jpush.android.intent.REGISTER" />
                <action android:name="cn.jpush.android.intent.REPORT" />
                <action android:name="cn.jpush.android.intent.PushService" />
                <action android:name="cn.jpush.android.intent.PUSH_TIME" />
            </intent-filter>
        </service>

 <!-- since 3.0.9 Required SDK 核心功能-->

        <provider
            android:authorities="您应用的包名.DataProvider"
            android:name="cn.jpush.android.service.DataProvider"
            android:exported="true"
            android:process=":pushcore"
        />

        <!-- Required SDK 核心功能-->
        <receiver
            android:name="cn.jpush.android.service.PushReceiver"
            android:exported="false"
            android:enabled="true" >
          <intent-filter>
                <action android:name="cn.jpush.android.intent.NOTIFICATION_RECEIVED_PROXY" />
                <category android:name="您应用的包名"/>
            </intent-filter>
        </receiver>

        <!-- Required SDK 核心功能-->
        <activity
            android:name="cn.jpush.android.ui.PushActivity"
            android:configChanges="orientation|keyboardHidden"
            android:theme="@android:style/Theme.NoTitleBar"
            android:exported="true" >
            <intent-filter>
                <action android:name="cn.jpush.android.ui.PushActivity" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="您应用的包名" />
            </intent-filter>
        </activity>
        <!-- SDK 核心功能-->
        <activity
            android:name="cn.jpush.android.ui.PopWinActivity"
            android:configChanges="orientation|keyboardHidden"
            android:exported="true"
            android:theme="@style/JPushDialogStyle">
            <intent-filter>
                <category android:name="android.intent.category.DEFAULT" />
                <action android:name="cn.jpush.android.ui.PopWinActivity" />
                <category android:name="您应用的包名" />
            </intent-filter>
        </activity>



        <!-- Since JCore2.0.0 Required SDK核心功能-->
     <!-- 可配置android:process参数将Service放在其他进程中；android:enabled属性不能是false -->
        <!-- 这个是自定义Service，要继承极光JCommonService，可以在更多手机平台上使得推送通道保持的更稳定 -->
         <service android:name="xx.xx.XService"
                 android:enabled="true"
                 android:exported="false"
                 android:process=":pushcore">
                 <intent-filter>
                     <action android:name="cn.jiguang.user.service.action" />
                 </intent-filter>
         </service>

        <!-- Required SDK 核心功能-->
        <receiver android:name="cn.jpush.android.service.AlarmReceiver" />

        <!-- 新的 tag/alias 接口结果返回需要开发者配置一个自定义的Service -->
        <!-- 该广播需要继承 JPush 提供的 JPushMessageReceiver 类, 并如下新增一个 Intent-Filter -->
        <receiver
            android:name="自定义 Receiver"
            android:enabled="true"
            android:exported="false" >
            <intent-filter>
                <action android:name="cn.jpush.android.intent.RECEIVER_MESSAGE" />
                <category android:name="您应用的包名" />
            </intent-filter>
        </receiver>




        <!--Required SDK核心功能 since 3.3.0，主要用来统一各大推送厂商跳转逻辑，透明窗体也是为了通知跳转时候，保持UI效果一致。-->
        <activity
            android:name="cn.jpush.android.service.JNotifyActivity"
            android:exported="true"
            android:taskAffinity=""
            android:theme="@style/JPushTheme">
            <intent-filter>
                <action android:name="cn.jpush.android.intent.JNotifyActivity" />
                <category android:name="android.intent.category.DEFAULT" /><!--Required SDK核心功能 since 4.2.2-->
                <category android:name="您应用的包名" />
            </intent-filter>
        </activity>
        <!-- since 4.6.0 Required SDK核心功能，各大推送厂商跳转 备份Activity。防止JNotifyActivity 被封后，通知不能跳转。 -->
        <activity
            android:name="cn.android.service.JTransitActivity"
            android:exported="true"
            android:taskAffinity=""
            android:theme="@style/JPushTheme" >
            <intent-filter>
                <action android:name="cn.android.service.JTransitActivity" />
                <category android:name="android.intent.category.DEFAULT"/>
                <category android:name="${applicationId}" />
            </intent-filter>
        </activity>
        <!-- since 5.0.0 Required SDK核心功能 -->
        <provider
            android:name="cn.jpush.android.service.InitProvider"
            android:authorities="${applicationId}.jiguang.InitProvider"
            android:exported="false"
            android:readPermission="${applicationId}.permission.JPUSH_MESSAGE"
            android:writePermission="${applicationId}.permission.JPUSH_MESSAGE" />
        <!-- Required. For publish channel feature -->
        <!-- JPUSH_CHANNEL 是为了方便开发者统计 APK 分发渠道。-->
        <!-- 例如: -->
        <!-- 发到 Google Play 的 APK 可以设置为 google-play; -->
        <!-- 发到其他市场的 APK 可以设置为 xxx-market。 -->
        <meta-data android:name="JPUSH_CHANNEL" android:value="developer-default"/>
        <!-- Required. AppKey copied from Portal -->
        <meta-data android:name="JPUSH_APPKEY" android:value="您应用的 Appkey"/>
    </application>

</manifest>

---

新增 cursor 快速更新模版文档

使用方法：修改需求里的内容，将需求和步骤内容作为指令让 cursor 进行执行。

需求：

更新 iOS JPush SDK 到 x.x.x 版本。JPush SDK 包的路径是：xxx

更新 Android JPush SDK 到 x.x.x 版本, JPush SDK 包的路径是：xxx

将原生 iOS、Android SDK 新增的方法，封装在插件中。 原生 SDK 新增方法一： iOS ：

Android:

统一封装为 方法名为 "" 的对外方法。

请按照以下步骤完成：

找到需要升级的 iOS JPush SDK，替换 ios/RCTJPushModule/jpush-ios-x.x.x.xcframework 为需要更新的版本。

找到需要升级的 Android JPush SDK，替换 android/libs/jpush-android-x.x.x.jar 为需要更新的版本。

在插件中封装需求中需要封装的 SDK 方法，并在插件示例 demo 中提供示例调用代码，注意 rn 插件新增方法还需要再 index.js 和 index.d.ts 文件中声明哦。（如果没有需求中没有需要新增的方法，则跳过该步骤）

在 package.json 中更新插件版本号，在现有版本号上 + 0.0.1

在 example/package.json 中 修改示例 插件的集成版本号。 改为最新的插件版本号。涉及到更改的代码

"dependencies": {
...
"jpush-react-native": "^x.x.x",
...

---

This is a new React Native project, bootstrapped using @react-native-community/cli.

Getting Started
Note: Make sure you have completed the React Native - Environment Setup instructions till "Creating a new application" step, before proceeding.

Step 1: Start the Metro Server
First, you will need to start Metro, the JavaScript bundler that ships with React Native.

To start Metro, run the following command from the root of your React Native project:

# using npm

npm start

# OR using Yarn

yarn start
Step 2: Start your Application
Let Metro Bundler run in its own terminal. Open a new terminal from the root of your React Native project. Run the following command to start your Android or iOS app:

For Android

# using npm

npm run android

# OR using Yarn

yarn android
For iOS

# using npm

npm run ios

# OR using Yarn

yarn ios
If everything is set up correctly, you should see your new app running in your Android Emulator or iOS Simulator shortly provided you have set up your emulator/simulator correctly.

This is one way to run your app — you can also run it directly from within Android Studio and Xcode respectively.

Step 3: Modifying your App
Now that you have successfully run the app, let's modify it.

Open App.tsx in your text editor of choice and edit some lines.

For Android: Press the R key twice or select "Reload" from the Developer Menu (Ctrl + M (on Window and Linux) or Cmd ⌘ + M (on macOS)) to see your changes!

For iOS: Hit Cmd ⌘ + R in your iOS Simulator to reload the app and see your changes!

Congratulations! 🎉
You've successfully run and modified your React Native App. 🥳

Now what?
If you want to add this new React Native code to an existing application, check out the Integration guide.
If you're curious to learn more about React Native, check out the Introduction to React Native.
Troubleshooting
If you can't get this to work, see the Troubleshooting page.

Learn More
To learn more about React Native, take a look at the following resources:

React Native Website - learn more about React Native.
Getting Started - an overview of React Native and how setup your environment.
Learn the Basics - a guided tour of the React Native basics.
Blog - read the latest official React Native Blog posts.
@facebook/react-native - the Open Source; GitHub repository for React Native.
