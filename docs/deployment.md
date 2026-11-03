## 生产运维与发布回滚

本文档描述 MostNote 生产环境的发布、备份、验证和回滚流程。所有操作必须遵守仓库根目录
[agents.md](../agents.md) 中的核心铁律。

## 当前生产环境

| 项目 | 当前值 |
| --- | --- |
| 公开地址 | <https://mostnote.com/> |
| 代码来源 | <https://github.com/soulizer/mostnote> |
| 当前版本 | `1.2.0` |
| 操作系统 | CentOS 7 |
| Web 服务器 | nginx（宝塔面板管理） |
| PHP | PHP-FPM 8.2 |
| 数据库 | MySQL 8 |
| 站点目录 | `/www/wwwroot/mostnote.com` |
| Web 根目录 | `/www/wwwroot/mostnote.com/public` |
| vhost | `/www/server/panel/vhost/nginx/mostnote.com.conf` |
| 自动更新 | 已通过本地空清单禁用（`public/updates/stable/update.json`） |

> 具体备份路径、数据库账号和密钥只记录在服务器与运维记录中，不写入仓库。

## 发布流程

生产只允许唯一发布路径：

```
开发 → 测试验收 → 用户指定版本 → GitHub Release → 生产备份 → 部署 → 迁移 → 验证 → 记录
```

禁止：

- 把开发目录或测试环境文件直接同步到生产；
- 在生产服务器上直接修改代码；
- 在有数据的数据库执行 `migrate:fresh`；
- 在没有备份和回滚目录的情况下发布。

## 发布前检查

1. 确认目标版本号，并检查 `client/.env` 与 `server/config/app.php` 的版本一致。
2. 检查 `CHANGELOG.md`、迁移文件、依赖变化和配置变化。
3. 在测试环境完成首页、登录、笔记、搜索、设置、API 验收。
4. 由用户确认生产版本。
5. 准备回滚目录或镜像标签。

## 备份

每次发布前至少备份以下内容：

```bash
# 数据库（使用实际账号，避免把密码写入命令历史）
mysqldump --single-transaction --routines --triggers <db_name> > /backup/mostnote-db-$(date +%F-%H%M).sql

# 站点目录（包含 .env、storage、public/.well-known）
tar -czf /backup/mostnote-site-$(date +%F-%H%M).tar.gz -C /www/wwwroot mostnote.com

# nginx、证书与 PHP 配置
cp /www/server/panel/vhost/nginx/mostnote.com.conf /backup/
cp -a /www/server/panel/vhost/cert/mostnote.com /backup/cert-$(date +%F-%H%M)
```

确认备份文件可读、大小正常，并记录备份位置。

## 部署步骤

```bash
# 1. 下载用户指定版本
curl -LO https://github.com/soulizer/mostnote/releases/download/1.2.0/plainpad-1.2.0.zip
unzip plainpad-1.2.0.zip -d /www/wwwroot/mostnote.com.new

# 2. 保留生产配置与运行数据
cp /www/wwwroot/mostnote.com/.env /www/wwwroot/mostnote.com.new/.env
rsync -a /www/wwwroot/mostnote.com/storage/ /www/wwwroot/mostnote.com.new/storage/
rsync -a /www/wwwroot/mostnote.com/public/.well-known/ /www/wwwroot/mostnote.com.new/public/.well-known/
rsync -a /www/wwwroot/mostnote.com/public/updates/ /www/wwwroot/mostnote.com.new/public/updates/

# 3. 权限
chown -R www:www /www/wwwroot/mostnote.com.new
chmod -R ug+rwX /www/wwwroot/mostnote.com.new/storage /www/wwwroot/mostnote.com.new/bootstrap/cache

# 4. 迁移与缓存
cd /www/wwwroot/mostnote.com.new
php artisan migrate --force
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear
php artisan route:cache

# 5. 切换目录
mv /www/wwwroot/mostnote.com /www/wwwroot/mostnote.com.old-$(date +%F-%H%M)
mv /www/wwwroot/mostnote.com.new /www/wwwroot/mostnote.com
```

如果使用软链接发布，可把 `current` 指向版本目录，切换时只替换软链接，回滚更快。

> 当前 1.2.0 的 `AutoUpdateServiceProvider` 直接读取 `env('APP_REPOSITORY')`，执行 `config:cache` 后该值为空，
> 管理员界面会出现更新解析错误。生产暂不启用 `config:cache`，每次发布使用 `config:clear`；待上游修复后再启用。

## 自动更新

本生产把 `APP_REPOSITORY` 指向 `https://mostnote.com/updates/stable`，该目录的 `update.json` 为 `{}`，
因此自动更新始终没有可用版本，避免管理员误装上游版本覆盖本仓库定制。若要启用自动更新，必须改为本项目
自有的签名更新清单，并同步维护 `APP_UPDATE_PUBLIC_KEYS`。每次发布都要像 `.well-known/` 一样保留
`public/updates/`。

## 发布后验证

- 首页 `GET /` 返回 200，静态资源正常加载。
- API `GET /api.php/v1` 返回 JSON。
- 登录、登出、笔记列表与保存正常。
- 管理员设置页可访问。
- 检查 `storage/logs/laravel.log`、nginx error log、PHP-FPM 日志无新错误。
- 确认数据库迁移记录与预期一致。

## 回滚

1. 切回上一版本目录或镜像：

   ```bash
   mv /www/wwwroot/mostnote.com /www/wwwroot/mostnote.com.failed-$(date +%F-%H%M)
   mv /www/wwwroot/mostnote.com.old-<timestamp> /www/wwwroot/mostnote.com
   ```

2. 如果新版本执行了不可逆迁移，恢复发布前的数据库备份。
3. 清理缓存：

   ```bash
   cd /www/wwwroot/mostnote.com
   php artisan config:clear
   php artisan route:clear
   php artisan view:clear
   php artisan cache:clear
   ```

4. 重新执行发布后验证。
5. 记录回滚原因、影响范围、数据是否恢复以及后续改进。

## 自动更新

1.2.0 支持自动更新，但只接受：

- 与版本号匹配的发布包；
- 通过 Ed25519 签名校验的发布包；
- `APP_REPOSITORY` 指向的更新源提供的发布包。

生产使用本仓库时：

- 不要把 `APP_REPOSITORY` 指向上游 Plainpad，否则会覆盖本项目代码；
- 如果服务器上存在手工修改，应关闭自动更新，统一走本文档的发布流程；
- 自动更新的前提是安装目录对 PHP 进程用户可写，这与“最小权限”存在冲突，需按实际运维策略取舍。

## 发布记录模板

每次发布在运维记录中填写：

```
版本：
commit：
发布日期：
执行人：
结构变更/迁移：
数据影响：
备份位置：
回滚方式：
验证结果：
备注：
```

## 事故记录模板

```
发生时间：
影响范围：
现象：
原因：
处理过程：
恢复时间：
数据影响：
改进项：
```

[返回文档索引](readme.md)
