## 升级指南

生产环境的升级必须走固定流程：**备份 → 获取指定版本 → 部署新目录 → 迁移 → 验证 → 记录**。禁止直接覆盖
生产目录，禁止在有数据的数据库上执行 `migrate:fresh`。

### 升级前检查

1. 确认目标版本号，并与 `client/.env` 的 `REACT_APP_VERSION`、`server/config/app.php` 的版本一致。
2. 检查目标版本的 `CHANGELOG.md`、迁移文件和配置变更。
3. 备份数据库、站点目录、`.env`、nginx 配置和证书。
4. 确认上一版本目录或镜像可用于回滚。
5. 在测试环境完成验收，再由用户确认生产版本。

### 标准升级步骤（发布包）

以下示例把 `1.2.0` 替换为目标版本，把路径替换为实际生产路径。

```bash
# 1. 备份
mysqldump --single-transaction <db_name> > /backup/mostnote-$(date +%F-%H%M).sql
tar -czf /backup/mostnote-site-$(date +%F-%H%M).tar.gz -C /var/www mostnote
cp /var/www/mostnote/.env /backup/mostnote-.env-$(date +%F-%H%M)

# 2. 获取指定版本
curl -LO https://github.com/soulizer/mostnote/releases/download/1.2.0/plainpad-1.2.0.zip
unzip plainpad-1.2.0.zip -d /var/www/mostnote-new

# 3. 保留生产配置与运行数据
cp /var/www/mostnote/.env /var/www/mostnote-new/.env
rsync -a /var/www/mostnote/storage/ /var/www/mostnote-new/storage/
rsync -a /var/www/mostnote/public/.well-known/ /var/www/mostnote-new/public/.well-known/
rsync -a /var/www/mostnote/public/updates/ /var/www/mostnote-new/public/updates/
chown -R www-data:www-data /var/www/mostnote-new
chmod -R ug+rwX /var/www/mostnote-new/storage /var/www/mostnote-new/bootstrap/cache

# 4. 执行迁移与缓存
cd /var/www/mostnote-new
php artisan migrate --force
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear
php artisan route:cache

# 5. 切换目录（推荐使用软链接，便于回滚）
mv /var/www/mostnote /var/www/mostnote-old-$(date +%F-%H%M)
mv /var/www/mostnote-new /var/www/mostnote
```

> 当前 1.2.0 暂不启用 `config:cache`：更新服务直接读取 `env('APP_REPOSITORY')`，缓存配置后会得到空值，
> 导致更新检查失败。发布时保留 `config:clear` 即可。

切换后立即验证：

- 首页返回 200
- `GET /api.php/v1` 返回 JSON
- 登录、登出、笔记列表正常
- `storage/logs/laravel.log` 与 nginx error log 无新错误

### 回滚

1. 切回上一版本目录或镜像。
2. 如果新版本执行了不可逆迁移，恢复升级前的数据库备份。
3. 清理配置与缓存：

   ```bash
   php artisan config:clear
   php artisan route:clear
   php artisan view:clear
   php artisan cache:clear
   ```

4. 验证首页、API、登录与数据完整性。
5. 记录回滚原因、影响范围与后续处理。

### 自动更新

1.2.0 内置自动更新，但只接受与版本匹配且签名有效的发布包。生产使用本仓库时：

- `APP_REPOSITORY` 必须指向本项目的更新源，不能使用上游 Plainpad 的默认地址；
- 本仓库生产默认指向本地空清单（`https://mostnote.com/updates/stable/update.json`，内容为 `{}`），
  自动更新实际处于禁用状态，避免被上游版本覆盖；
- 自动更新会覆盖应用文件，不适合在服务器上直接改过代码的部署；
- 推荐仍以 GitHub Release + 本文档的手工流程发布。

### 历史升级记录

#### 1.0.0-beta.4 → 1.2.0（2026-11-03）

实际生产升级中处理了以下事项：

- 原站点 API 因 nginx 使用 PHP 7.4、依赖要求 PHP 8.2 而返回 500，已切换 PHP-FPM 到 8.2。
- 新增迁移：`password_resets` 表、`users.email`、`sessions.token`、`sessions.user_id` 索引。
- `.env` 调整为 `APP_ENV=production`、`APP_DEBUG=false`。
- 执行 `migrate --force`、配置清理、路由缓存，并验证登录/笔记/登出接口。
- 保留 `.env`、`storage/`、`public/.well-known/` 与中文文档。

[返回文档索引](readme.md)
