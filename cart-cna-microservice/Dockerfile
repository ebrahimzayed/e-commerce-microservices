# المرحلة الأولى: بناء المشروع وتوليد ملف الـ JAR الجديد
FROM gradle:8.5-jdk17 AS build
WORKDIR /app
COPY . .
# تفعيل الـ build بدون تشغيل الـ Tests لتسريع الـ Pipeline
RUN ./gradlew bootJar --no-daemon -x test

# المرحلة الثانية: تشغيل التطبيق بأخف حجم وأعلى أمان
FROM eclipse-temurin:17-jdk-alpine
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring
WORKDIR /app
# نسخ ملف الـ JAR الفريش اللي لسه مبني حالا في المرحلة الأولى
COPY --from=build /app/build/libs/cart-1.0.0.jar app.jar
ENTRYPOINT ["java","-jar","app.jar"]