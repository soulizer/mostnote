## 参与贡献

MostNote 基于开源项目 [Plainpad](https://github.com/alextselegidis/plainpad)，代码同样以 GPLv3 发布。欢迎通过
Issue 和 Pull Request 参与改进。

### 开始之前

1. 阅读仓库根目录的 [agents.md](../agents.md)，所有开发、测试、发布和数据操作都必须遵守其中的规则。
2. 先搜索是否已有相同 Issue 或 PR。
3. 需求不明确时先创建 Issue 讨论，避免直接提交大范围改动。
4. 遵循“最小改动，不顺手重构”的原则。

### 开发流程

```bash
git clone git@github.com:soulizer/mostnote.git
cd mostnote

# 服务端
cd server
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate:fresh --seed   # 仅限本地开发

# 前端
cd ../client
npm ci
npm start
```

开发环境也可以使用 Docker，见 [Docker 开发环境](docker.md)。

### 提交要求

- 目标分支为 `main`（除非维护者另有指定）。
- 提交信息简洁说明变更目的，不添加 AI 共同作者尾注。
- 新增或变更功能必须补充单元测试和集成测试。
- 新增 API 路由需在 `server/routes/api.php` 注册，并补充 `client/src/http/` 对应方法。
- 新增用户可见文案需同步更新 `client/src/lang/` 下的所有语言。
- 行为变化必须更新相关文档和 `CHANGELOG.md`；`CHANGELOG.md` 每行不超过 120 字符。
- 不提交 `.env`、密钥、备份、运行日志和 `build/` 生成物。

### 测试与检查

```bash
cd server && ./vendor/bin/phpunit
cd server && ./vendor/bin/pint

cd client && npm test
cd client && npm run build
```

只有上述检查通过后才可以提交或请求合并。

### 发布相关

- 生产发布由维护者按 [生产运维与发布回滚](deployment.md) 执行。
- 禁止把开发或测试环境代码直接同步到生产。
- 发布包必须通过 `./build.sh` 生成，并按需签名。

### 翻译

用户界面文案位于 `client/src/lang/`，目前包含 en-US、de-DE、fr-FR、sv-SE、zh-CN。新增文案必须覆盖所有
语言；无法确定的翻译可以保留英文并在 PR 中说明。

### 安全问题

发现安全漏洞时不要公开提交 Issue，请通过 GitHub 仓库的 Security 页面私下报告，或联系维护者。

感谢 [Alex Tselegidis](https://alextselegidis.com) 与 Plainpad 的所有贡献者。

[返回文档索引](readme.md)
