# Docker 开发环境

仓库提供了一套 Docker Compose 开发环境，包含 nginx、php-fpm、MySQL、phpMyAdmin 和 Mailpit。开发环境与生产
环境分离，禁止把开发容器中的代码或数据库直接同步到生产。

## 启动

1. 在仓库根目录创建 `.env`，用于端口映射（该文件不提交）：

   ```bash
   cat > .env <<'EOF'
   NGINX_PORT=8080
   MYSQL_PORT=3306
   PHPMYADMIN_PORT=8081
   MAILPIT_HTTP_PORT=8025
   MAILPIT_SMTP_PORT=1025
   EOF
   ```

2. 启动容器：

   ```bash
   docker compose up -d
   ```

3. 进入 php-fpm 容器初始化服务端：

   ```bash
   docker compose exec -T php-fpm bash
   cd /var/www/html/server
   cp .env.example .env
   php artisan key:generate
   php artisan migrate:fresh --seed
   ```

   > `migrate:fresh` 会清空数据库，仅限本地开发使用。

4. 访问服务：

   - 应用：`http://localhost:${NGINX_PORT}`，默认 `http://localhost:8080`
   - phpMyAdmin：`http://localhost:${PHPMYADMIN_PORT}`
   - Mailpit：`http://localhost:${MAILPIT_HTTP_PORT}`

## 服务端 `.env`

Docker 环境下数据库主机为服务名 `mysql`：

```dotenv
APP_NAME=MostNote
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=plainpad
DB_USERNAME=user
DB_PASSWORD=password
```

生产环境必须使用 `APP_ENV=production`、`APP_DEBUG=false`，并配置独立的强密码。

## 前端开发

```bash
cd client
npm ci
npm start
```

开发服务器运行在 3000 端口，nginx 会把非 `/api.php/` 请求反代到该端口。生产构建使用：

```bash
npm run build
```

发布包请使用根目录的 `./build.sh` 生成，不要手工拼装。

## 测试与格式化

```bash
cd server && ./vendor/bin/phpunit
cd server && ./vendor/bin/pint
cd client && npm test
```

## 停止与清理

```bash
docker compose down
# 同时删除数据库卷（会丢失本地数据，仅限开发环境）
docker compose down --volumes
```

[返回文档索引](readme.md)
