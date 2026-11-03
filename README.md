<h1 align="center">
    <br>
    <a href="https://mostnote.com/">
        <img src="logo.png" alt="MostNote" width="200">
    </a>
    <br>
    MostNote
    <br>
</h1>

<h4 align="center">
    基于 Plainpad 的自托管笔记应用（Laravel 12 + React）
</h4>

<p align="center">
  <a href="#简介">简介</a> •
  <a href="#功能">功能</a> •
  <a href="#技术栈与目录">技术栈与目录</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#生产部署">生产部署</a> •
  <a href="#发布与更新">发布与更新</a> •
  <a href="#备份与回滚">备份与回滚</a> •
  <a href="#文档">文档</a> •
  <a href="#开发规则">开发规则</a>
</p>

![screenshot](screenshot.png)

## 简介

MostNote 是基于开源项目 [Plainpad](https://github.com/alextselegidis/plainpad) 的自托管笔记应用。数据保存在
自己的服务器上，支持多用户、离线使用、笔记加密和完整的 REST API。

- 生产站点：<https://mostnote.com/>
- 代码仓库：<https://github.com/soulizer/mostnote>
- 当前版本：`1.2.0`
- 生产环境：CentOS 7 + nginx + PHP-FPM 8.2 + MySQL 8，站点根目录指向 `public/`

## 功能

- 多用户笔记，用户之间数据隔离。
- 离线优先的 PWA，本地缓存笔记，恢复网络后自动同步。
- 笔记可加密存储，加密开关在用户设置中控制。
- 搜索、排序、固定、明暗主题、紧凑/舒适视图。
- 管理员用户管理、邮件设置、应用更新。
- Bearer Token 鉴权，登录与找回密码接口带限流。
- 自动更新包使用 Ed25519 签名，可配置 `APP_REPOSITORY`。

## 技术栈与目录

```
client/          React 16 + MobX + CoreUI/Bootstrap 单页应用（Create React App）
  src/stores/    MobX 状态（account、application、notes、profile、settings、users）
  src/http/      各资源的请求封装，HttpClient 负责 Bearer Token
  src/views/     页面（Notes、Settings、About、Help、Login、密码找回/重置、404、500）
  src/lang/      多语言文案：en-US、de-DE、fr-FR、sv-SE、zh-CN
server/          Laravel 12 / PHP 8.2+ JSON API
  app/Http/Controllers/V1/   API 控制器
  app/Http/Middleware/       认证与管理员中间件
  app/Models/                Note、Session、Setting、User
  app/Services/AutoUpdateService.php  自动更新服务
  routes/api.php             所有 `/v1` API 路由
  tests/                     PHPUnit 测试
docker/          nginx、php-fpm、mysql 开发环境配置
docs/            用户与运维文档
build.sh         生成发布 zip（含客户端构建、服务端依赖与签名）
```

## 快速开始

### 环境要求

- PHP >= 8.2，启用 `ext-curl`、`ext-json`、`ext-zip`、`ext-mbstring`、`ext-openssl`、`ext-pdo`、
  `ext-tokenizer`、`ext-xml`、`ext-fileinfo`
- Composer 2
- MySQL 8 / MariaDB
- Node.js 18+（仅构建前端时需要）
- Docker + Docker Compose（推荐用于本地开发）

### Docker 开发环境

```bash
git clone git@github.com:soulizer/mostnote.git
cd mostnote

# 根目录 .env 用于 docker compose 端口映射（不要提交到仓库）
cat > .env <<'EOF'
NGINX_PORT=8080
MYSQL_PORT=3306
PHPMYADMIN_PORT=8081
MAILPIT_HTTP_PORT=8025
MAILPIT_SMTP_PORT=1025
EOF

docker compose up -d
docker compose exec -T php-fpm bash
# 容器内：初始化服务端
cd /var/www/html/server
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
```

浏览器访问 `http://localhost:8080`。前端开发模式在 `client/` 下执行 `npm start`。

> `migrate:fresh` 会清空数据库，仅限本地开发环境使用，禁止对生产数据执行。

更完整的开发说明见 [docs/docker.md](docs/docker.md)。

### 从发布包安装

```bash
# 1. 下载指定版本发布包（示例）
curl -LO https://github.com/soulizer/mostnote/releases/download/1.2.0/plainpad-1.2.0.zip
mkdir -p /var/www/mostnote && unzip plainpad-1.2.0.zip -d /var/www/mostnote

# 2. 配置环境
cd /var/www/mostnote
cp .env.example .env
php artisan key:generate

# 3. 初始化数据库
php artisan migrate --seed --force

# 4. 权限（不要使用 chmod 777）
chown -R www-data:www-data storage bootstrap/cache
```

将 Web 服务器根目录指向 `public/`，并确保 `storage/`、`bootstrap/cache/` 对 PHP 进程用户可写。

默认管理员：`admin@example.org` / `12345678`。首次登录后立即修改邮箱和密码。

安装、nginx 配置与安全清单见 [docs/installation.md](docs/installation.md)。

## 生产部署

生产环境只走唯一发布路径：

```
开发/测试验收 → 用户确认版本 → 生产从 GitHub 拉取指定版本 → 备份 → 迁移 → 验证
```

禁止把测试环境目录直接同步到生产，也不允许在生产服务器上直接修改代码。

当前生产部署要点：

- 站点目录：`/www/wwwroot/mostnote.com`，Web 根目录为 `public/`。
- nginx 通过 PHP-FPM 8.2 处理 PHP；`APP_ENV=production`，`APP_DEBUG=false`。
- `.env` 权限 `600`，只保存在服务器，不进入仓库。
- 发布前必须备份数据库、站点文件、`.env` 与 nginx 配置，并确认回滚目录可用。

完整步骤见 [docs/deployment.md](docs/deployment.md)。

## 发布与更新

### 发布新版本

1. 在仓库 `main` 分支完成开发，补充测试与 `CHANGELOG.md`。
2. 更新 `client/.env` 的 `REACT_APP_VERSION` 与 `server/config/app.php` 的默认版本号。
3. 运行服务端与前端检查：

   ```bash
   cd server && ./vendor/bin/phpunit && ./vendor/bin/pint
   cd client && npm test && npm run build
   ```

4. 在 Docker 环境执行 `./build.sh`，生成 `plainpad-<version>.zip` 与 `.sig` 签名。
5. 在 GitHub 创建对应版本 Release，上传 zip 与签名文件。
6. 按 [docs/deployment.md](docs/deployment.md) 部署并由用户验收。

### 自动更新

应用内置自动更新，但发布包必须由项目私钥签名，且 `APP_REPOSITORY` 必须指向本仓库的更新源。公网生产环境
建议仍以 GitHub Release + 手工发布流程为准，避免上游 Plainpad 的更新覆盖本项目的定制代码。

## 备份与回滚

每次发布前至少完成：

- 数据库备份：`mysqldump --single-transaction <db> > backup.sql`
- 站点备份：打包当前目录（含 `.env`、`storage/`、`public/.well-known/`）
- 配置备份：nginx vhost、证书、PHP-FPM 配置
- 记录当前版本、commit、迁移列表、备份路径和回滚步骤

回滚时切回上一版本目录并恢复数据库，再执行：

```bash
php artisan config:clear
php artisan cache:clear
php artisan migrate --force   # 仅在需要恢复结构时执行
```

## 文档

- [文档索引](docs/readme.md)
- [项目简介](docs/introduction.md)
- [安装部署](docs/installation.md)
- [生产运维与发布回滚](docs/deployment.md)
- [升级指南](docs/upgrade.md)
- [Docker 开发环境](docs/docker.md)
- [API 文档](docs/api.md)
- [参与贡献](docs/contributions.md)

## 开发规则

所有开发、测试、发布与数据操作必须遵守 [agents.md](agents.md) 中的 12 条核心铁律，重点包括：

- 用户体验是最终验收标准，测试通过不等于功能可用。
- 真实数据永远不是调试目标，禁止以清库、删数据作为修复手段。
- 最小改动，不顺手重构；先复现再修复，断言先红后绿。
- 先备份再动数据；没有回滚方案不发版；生产只从 GitHub 指定版本发布。
- 秘密不进仓库；权限边界只在服务端；发布与事故都要留记录。

## 许可证与致谢

代码采用 [GPL v3.0](https://www.gnu.org/licenses/gpl-3.0.en.html)，内容采用
[CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)。

本项目基于 [Alex Tselegidis](https://alextselegidis.com) 的
[Plainpad](https://github.com/alextselegidis/plainpad)，感谢上游作者与贡献者。
