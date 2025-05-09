# 使用官方 Python 镜像作为基础镜像
FROM python:3.10-slim

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# 设置工作目录
WORKDIR /app

# 安装依赖
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt \
    && rm -rf /root/.cache/pip/*

# 复制项目代码到工作目录
COPY . /app/

# 暴露端口
EXPOSE 8000

# 运行 Django 应用
# 注意：在生产环境中，应使用 Gunicorn 或 uWSGI 等 WSGI 服务器
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]