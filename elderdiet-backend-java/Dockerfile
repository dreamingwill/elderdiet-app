# 使用多阶段构建减少镜像大小
FROM openjdk:17-jdk-slim as builder

WORKDIR /app

# 复制Maven配置文件
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn

# 下载依赖（利用Docker层缓存）
RUN ./mvnw dependency:go-offline -B

# 复制源代码
COPY src src

# 构建应用（跳过测试以节省时间和内存）
RUN ./mvnw clean package -DskipTests -B

# 生产运行阶段
FROM openjdk:17-jre-slim

# 安装curl用于健康检查
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# 创建应用目录
WORKDIR /app

# 创建日志目录
RUN mkdir -p /app/logs

# 复制构建的jar文件
COPY --from=builder /app/target/elderdiet-backend-java-1.0.0.jar app.jar

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 创建非root用户（安全最佳实践）
RUN addgroup --system spring && adduser --system spring --ingroup spring
RUN chown -R spring:spring /app
USER spring

# 暴露端口
EXPOSE 3001

# 设置JVM参数和启动命令
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -Dspring.profiles.active=prod"

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/actuator/health || exit 1

# 启动命令
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"] 