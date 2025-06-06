# 使用官方 Node.js LTS (Long Term Support) 版本作为基础镜像
FROM node:18-alpine as builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json (或 yarn.lock)
COPY package*.json ./

# 复制项目文件和文件夹到工作目录
COPY . .

# 安装所有依赖并更新package-lock.json
RUN npm install

# 安装生产环境依赖
RUN npm ci --omit=dev

# 构建应用
RUN npm run build

# 第二阶段：使用 Nginx 提供静态文件服务
FROM nginx:stable-alpine

# 从构建阶段复制构建好的静态文件到 Nginx 的默认服务目录
COPY --from=builder /app/dist /usr/share/nginx/html

# （可选）复制自定义的 Nginx 配置文件
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 Nginx 服务
CMD ["nginx", "-g", "daemon off;"]