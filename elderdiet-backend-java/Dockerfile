# 多阶段构建Dockerfile for ElderDiet Backend
# 使用国内镜像源优化网络连接

# 构建阶段 - 使用Maven编译Java应用
FROM maven:3.8.6-openjdk-17-slim AS builder

# 设置工作目录
WORKDIR /app

# 配置Maven使用阿里云镜像源
RUN mkdir -p /root/.m2 && \
    echo '<?xml version="1.0" encoding="UTF-8"?>' > /root/.m2/settings.xml && \
    echo '<settings>' >> /root/.m2/settings.xml && \
    echo '  <mirrors>' >> /root/.m2/settings.xml && \
    echo '    <mirror>' >> /root/.m2/settings.xml && \
    echo '      <id>aliyun-maven</id>' >> /root/.m2/settings.xml && \
    echo '      <name>Aliyun Maven Mirror</name>' >> /root/.m2/settings.xml && \
    echo '      <url>https://maven.aliyun.com/repository/public</url>' >> /root/.m2/settings.xml && \
    echo '      <mirrorOf>central</mirrorOf>' >> /root/.m2/settings.xml && \
    echo '    </mirror>' >> /root/.m2/settings.xml && \
    echo '  </mirrors>' >> /root/.m2/settings.xml && \
    echo '</settings>' >> /root/.m2/settings.xml

# 先复制依赖文件，利用Docker缓存
COPY pom.xml .

# 下载依赖（这一层会被缓存）
RUN mvn dependency:go-offline -B

# 复制源码
COPY src ./src

# 编译应用，跳过测试以加快构建速度
RUN mvn clean package -DskipTests -B

# 运行阶段 - 使用更小的JRE镜像
FROM openjdk:17-jre-slim

# 创建非root用户以提高安全性
RUN groupadd -r spring && useradd -r -g spring spring

# 安装必要的工具和字体（支持中文）
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        fontconfig \
        fonts-dejavu-core \
        tzdata && \
    rm -rf /var/lib/apt/lists/*

# 设置时区为中国标准时间
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 创建应用目录
WORKDIR /app

# 从构建阶段复制jar文件
COPY --from=builder /app/target/*.jar app.jar

# 更改文件所有者
RUN chown -R spring:spring /app

# 切换到非root用户
USER spring

# JVM优化参数（适合1.8GB内存服务器）
ENV JAVA_OPTS="-Xms256m -Xmx768m \
    -XX:+UseG1GC \
    -XX:G1HeapRegionSize=16m \
    -XX:+UseStringDeduplication \
    -XX:+OptimizeStringConcat \
    -Djava.awt.headless=true \
    -Djava.security.egd=file:/dev/./urandom \
    -Dspring.backgroundpreinitializer.ignore=true"

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/actuator/health || exit 1

# 暴露端口
EXPOSE 3001

# 启动应用
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"] 