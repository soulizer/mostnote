# Contributing

感谢参与 MostNote（基于 Plainpad）的开发。提交改动前请先阅读仓库根目录的
[agents.md](../agents.md)，所有开发、测试、发布和数据操作都必须遵守其中的规则。

## 讨论

- 需求不明确时先创建 Issue，说明使用场景、预期行为和影响范围。
- 安全问题不要公开提交 Issue，请通过 GitHub Security 页面私下报告。
- 大范围重构、架构调整、存储或认证方案变更必须先与维护者确认。

## Pull Request

1. 目标分支为 `main`，除非维护者明确指定其他分支。
2. 改动保持最小范围，不顺手重构无关代码。
3. 新增或变更功能必须补充测试。
4. 服务端与前端检查必须通过：

   ```bash
   cd server && ./vendor/bin/phpunit && ./vendor/bin/pint
   cd client && npm test && npm run build
   ```

5. 行为变化必须同步更新相关文档和 `CHANGELOG.md`；`CHANGELOG.md` 每行不超过 120 字符。
6. 新增 API 路由需同步 `client/src/http/`；新增用户文案需覆盖 `client/src/lang/` 下所有语言。
7. 不提交 `.env`、密钥、备份、运行日志和 `build/` 生成物。

## 发布

生产发布由维护者按 [docs/deployment.md](../docs/deployment.md) 执行，禁止把开发或测试环境代码直接同步到
生产。
