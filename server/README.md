# MostNote Server

MostNote 服务端是 Laravel 12 / PHP 8.2+ 的 JSON API，为 `client/` 中的 React 单页应用提供数据与鉴权。

## 要求

- PHP >= 8.2
- Composer 2
- MySQL 8 / MariaDB
- PHP 扩展：`curl`、`json`、`zip`、`mbstring`、`openssl`、`pdo`、`pdo_mysql`、`tokenizer`、`xml`、`fileinfo`

## 本地初始化

```bash
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate:fresh --seed   # 仅限本地开发
php artisan serve
```

默认管理员：`admin@example.org` / `12345678`。

## 目录说明

- `app/Http/Controllers/V1/`：API 控制器
- `app/Http/Middleware/`：认证与管理员中间件
- `app/Models/`：Note、Session、Setting、User
- `app/Services/AutoUpdateService.php`：发布包下载与更新
- `routes/api.php`：所有 `/v1` 路由
- `tests/`：PHPUnit Feature/Unit 测试

## 测试与格式化

```bash
./vendor/bin/phpunit
./vendor/bin/pint
```

## 生产部署

- Web 根目录指向 `public/`。
- `storage/` 与 `bootstrap/cache/` 仅 PHP 进程用户可写，禁止 `chmod 777`。
- 生产 `.env` 使用 `APP_ENV=production`、`APP_DEBUG=false`，权限 `600`。
- 发布前执行迁移与缓存：

  ```bash
  php artisan migrate --force
  php artisan config:cache
  php artisan route:cache
  php artisan view:clear
  php artisan cache:clear
  ```

完整的发布、备份与回滚流程见 [../docs/deployment.md](../docs/deployment.md)。

## 相关文档

- [API 文档](../docs/api.md)
- [安装部署](../docs/installation.md)
- [升级指南](../docs/upgrade.md)
- [项目规范](../agents.md)
