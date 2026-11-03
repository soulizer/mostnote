## 安装部署

MostNote 可以以发布包或源码方式安装。生产环境推荐使用 GitHub Release 中的指定版本发布包，避免在服务器上
直接构建和修改代码。

### 环境要求

- Linux 服务器（生产当前使用 CentOS 7）或 Docker 开发环境
- nginx 或 Apache
- PHP >= 8.2，需启用以下扩展：
  - `curl`、`json`、`zip`（自动更新与依赖必需）
  - `mbstring`、`openssl`、`pdo`、`pdo_mysql`、`tokenizer`、`xml`、`fileinfo`
- Composer 2
- MySQL 8 / MariaDB
- Node.js 18+ 与 npm（仅前端构建时需要）

### 方式一：发布包安装（生产推荐）

1. 从 GitHub Release 下载用户指定的版本：

   ```bash
   curl -LO https://github.com/soulizer/mostnote/releases/download/1.2.0/plainpad-1.2.0.zip
   mkdir -p /var/www/mostnote
   unzip plainpad-1.2.0.zip -d /var/www/mostnote
   ```

2. 创建并编辑 `.env`：

   ```bash
   cd /var/www/mostnote
   cp .env.example .env
   chmod 600 .env
   php artisan key:generate
   ```

   必填项：

   - `APP_NAME`：站点名称，例如 `MostNote`
   - `APP_ENV=production`
   - `APP_DEBUG=false`
   - `APP_URL`：站点完整地址，例如 `https://mostnote.com`
   - `DB_HOST`、`DB_PORT`、`DB_DATABASE`、`DB_USERNAME`、`DB_PASSWORD`
   - `APP_REPOSITORY`：自动更新源；使用本项目自己的更新源，不要指向上游 Plainpad

3. 初始化数据库：

   ```bash
   php artisan migrate --seed --force
   ```

   > 只对空数据库使用 `migrate --seed`。不要在有数据的生产库执行 `migrate:fresh`。

4. 设置权限：

   ```bash
   chown -R www-data:www-data storage bootstrap/cache
   chmod -R ug+rwX storage bootstrap/cache
   ```

   不要使用 `chmod 777`。

5. 将 Web 服务器根目录指向 `public/`。

6. 访问站点，使用默认管理员 `admin@example.org` / `12345678` 登录，并立即修改邮箱和密码。

### 方式二：源码安装（开发或自建构建）

```bash
git clone git@github.com:soulizer/mostnote.git
cd mostnote

cd server
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate:fresh --seed

cd ../client
npm ci
npm run build
```

前端构建产物需要合并到 `server/public/`。生产发布请使用 `./build.sh` 生成完整 zip，不要手工拼装。

### 网页安装向导

也可以访问 `/setup.php` 填写数据库信息，安装向导会生成 `.env` 并执行迁移。安装完成后：

- 应用会阻止 `setup.php` 继续执行；
- 仍建议在 nginx/Apache 中限制或删除该文件；
- 不要通过公网暴露安装向导。

### nginx 配置示例

```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name mostnote.com www.mostnote.com;
    root /var/www/mostnote/public;
    index index.php index.html;

    ssl_certificate     /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    add_header X-Frame-Options "DENY" always;
    add_header Content-Security-Policy "frame-ancestors 'none'" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "same-origin" always;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ [^/]\.php(/|$) {
        try_files $uri =404;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        include fastcgi.conf;
    }

    location ~ ^/(\.env|\.git|composer\.(json|lock)|storage/) {
        deny all;
    }
}
```

如果应用部署在反向代理之后，在 `.env` 中设置 `TRUSTED_PROXIES` 为代理地址（多个用逗号分隔），
否则登录限流会把所有客户端识别成代理地址。

### 安全清单

- `APP_ENV=production`、`APP_DEBUG=false`
- `.env` 权限 `600`，不进入版本库
- `storage/`、`bootstrap/cache/` 仅 PHP 进程用户可写
- 使用 TLS 1.2/1.3，禁用 TLS 1.1
- 限制或移除 `public/setup.php`
- 定期备份数据库与 `.env`
- 默认管理员密码首次登录必须修改
- 生产发布只使用 GitHub 指定版本，见 [生产运维](deployment.md)

[返回文档索引](readme.md)
