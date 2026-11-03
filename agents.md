# MostNote 项目规范（Agents）

本文件是本仓库唯一的 AI 代理操作规范。所有开发、测试、发布、数据操作与文档更新都必须遵守本文件。

## 项目概览

MostNote（基于 Plainpad）是一个自托管笔记应用：Laravel 12 JSON API（`server/`）加 Create React App 单页应用
（`client/`），由 `build.sh` 打包成单个发布 zip。

- 生产站点：<https://mostnote.com/>，代码仓库：<https://github.com/soulizer/mostnote>。
- 当前版本：`1.2.0`；生产运行 PHP 8.2 + MySQL 8 + nginx。
- GPLv3。每个源文件都带许可证头，新建文件时保留。
- 版本号同时存在于 `client/.env`（`REACT_APP_VERSION`）和 `server/config/app.php`，发布前必须一致。
- 生产发布只使用 GitHub 上用户指定的版本，禁止把开发目录直接同步到生产。

## 核心铁律（最高优先级）

1. **用户体验是最终验收标准**：测试通过不等于功能可用；用户看不到、点不到、看不懂，都是缺陷。
2. **数据安全高于功能便利**：真实数据永远不是调试目标；禁止以清库、删数据作为修复手段。
3. **最小改动，不顺手重构**：能不改就不改，能小改不扩大；除非明确要求，不换架构、存储、数据库、认证方案。
4. **先复现，再修复；断言先红后绿**：没失败过的测试说明不了它守住了什么。
5. **代码是行为事实，文档要同步**：行为以代码/注释为准；规则冲突以权威文档为准；两者不一致时改文档，不靠记忆。
6. **先备份，再动数据**：涉及数据库、data/、对象存储删除，必须先备份并确认远端副本可读。
7. **生产只走唯一发布路径**：测试验收 → 用户指定版本 → 生产从 GitHub 拉取；不允许把测试环境代码直接同步上线。
8. **没有回滚方案，不发版**：发布前先给当前运行镜像打回滚标签，再构建新镜像。
9. **清理只碰可再生资源**：只清构建产物、缓存、日志和“能证明未被引用”的对象；拿不准就不删。
10. **权限边界只在服务端**：前端隐藏菜单不构成安全边界；服务端必须回查数据库角色与资源归属。
11. **秘密不进仓库，配置不随代码覆盖**：密钥只存 .env（600）或秘密管理器；测试/生产配置不得互拷。
12. **发布留记录，事故留教训**：每次发布记录版本、结构变更、数据影响、备份、回滚；事故写进归档。

## 提交与分支

- 提交信息不得添加 `Co-Authored-By: Claude ...` 等 AI 共同作者尾注。
- 不得将 Claude 或任何 AI 助手列为提交作者或共同作者。
- 除非维护者明确要求，不新建分支；提交到当前已检出的分支。
- `CHANGELOG.md` 每行最多 120 个字符，超长内容换行续写。
- 提交前检查 `git status`、`git diff`，只暂存预期文件；禁止提交 `.env`、密钥、备份和运行数据。
- 提交信息应简洁说明变更目的，遵循仓库现有风格。

## 项目结构与架构

```
client/          React 16 + MobX SPA（Create React App，CoreUI 2 + Bootstrap 4，SCSS）
  src/stores/    MobX stores（account、application、notes、profile、settings、users），应用状态都在这里
  src/http/      各资源的请求封装；HttpClient 添加 Bearer Token，并抛出 OfflineError
  src/views/     页面（Notes、Settings、About、Help、Pages/Login、RecoverPassword、ResetPassword、404、500）
  src/containers/NoteLayout/  应用外壳（header、aside、footer）
  src/lang/      多语言文案：en-US、de-DE、fr-FR、sv-SE、zh-CN
  src/storage.js localforage 封装，每个版本 + 用户一个 IndexedDB，用于离线笔记
server/          Laravel 12 / PHP 8.2+
  app/Http/Controllers/V1/  ApplicationController、NotesController、SessionsController、SettingsController、
                            UsersController
  app/Http/Middleware/      auth（自定义 Token Authenticate）、admin
  app/Models/               Note、Session、Setting、User
  app/Services/AutoUpdateService.php  从 APP_REPOSITORY 下载并应用发布包
  routes/api.php            所有 `/v1` 接口，通过 `public/api.php` 提供
  tests/                    PHPUnit（Feature + Unit）
docker/          nginx、php-fpm、mysql 开发环境配置
docs/            用户与运维文档
build/           生成产物，禁止手改，由 build.sh 重新生成
```

### 架构说明

- SPA 通过 `api.php/v1/...` 调用 API（`REACT_APP_BASE_URL`）。nginx 把 `/api.php/` 映射到服务端，其余路径反代到
  CRA 开发服务器 3000 端口。
- 认证是自定义 Bearer Token，存储在 `sessions` 表，不使用 Sanctum/Passport。`SessionsController::create`
  使用 `throttle:login` 限流；找回密码使用 `throttle:5,15`。
- 管理员接口（设置、用户管理、应用更新/刷新）位于 `admin` 中间件组之后。
- 笔记采用离线优先同步：notes store 写入 localforage，再与 API 对账，UUID 在客户端生成。
- 新增 API 路由必须注册在 `server/routes/api.php` 对应的中间件组内，并在 `client/src/http/` 增加匹配的客户端方法。
- 新增用户可见文案必须补充到 `client/src/lang/` 下的所有语言。

## 开发命令

```bash
docker compose up -d                      # 启动开发环境（nginx、php-fpm、mysql、phpmyadmin、mailpit）
./build.sh                                # 生成发布包 build/ 与 build.zip

cd client && npm start                    # CRA 开发服务器，端口 3000
cd client && npm run build                # 生产前端构建
cd client && npm test                     # Jest / react-scripts 测试

cd server && php artisan migrate:fresh --seed   # 仅限本地开发，禁止对生产数据执行
cd server && ./vendor/bin/phpunit         # 服务端测试
cd server && ./vendor/bin/pint            # PHP 格式化（Laravel Pint）
```

端口来自根目录 `.env`（`NGINX_PORT`、`MYSQL_PORT`、`PHPMYADMIN_PORT`、`MAILPIT_HTTP_PORT`、
`MAILPIT_SMTP_PORT`）。服务端需要自己的 `server/.env`，从 `server/.env.example` 复制。

## 编码约定

- PHP：Laravel Pint（PSR-12）。控制器保持精简，校验统一使用 `$request->validate()`。
- JS：2 空格缩进、单引号、MobX `decorate(...)` class 写法，不使用 TypeScript。
- 变更范围限定在 `client/` 或 `server/`；`build/` 只是输出，不手工修改。
- 代码注释使用中文，保持简明专业；不添加无意义注释。

## 代码质量与开发原则

### 质量要求

- 只改动必要的部分，优先复用现有成熟代码，避免重复造轮子。
- 架构设计时让边界情况自然融入常规逻辑，而不是单独打补丁。
- 单个代码文件不超过 1000 行，否则应当进行功能拆分。
- 保持代码简单直观，不过度设计复杂架构方案。
- 代码应表达实际逻辑，结构清晰，不保留不再使用的代码，不留无用的混淆项，避免未来维护困惑。
- 在代码文件中使用与用户沟通一致的语言撰写简明专业的代码注释。

### 测试与验证

- 所有变更必须通过对应语言的 lint/format/test，只有通过必要的本地检查后，才可以回传或提交代码，禁止依赖后续修复来兜底。
- 如目前无对应语言的测试与验证要求，应当在项目根目录的 `agents.md` 中结合项目实际情况补齐要求。
- 新增或变更功能时必须补充单元测试和集成测试。
- 如用户未要求，不引入测试框架。

## 文档与记忆

使用文档与记忆来沉淀背景信息、对齐执行约束。

所有文档与记忆都采用 Markdown 格式，存放于 `.agentdocs/` 及其子目录下，仅面向 AI 代理使用，不包含任何人类向说明。

使用 `.agentdocs/index.md` 作为索引文档，记录所有文档的主要内容、读取场景及全局关键记忆，例如：

```
  ## 产品文档
  `prd/idea.md` - 用户关于整个项目的想法
  `prd/board.md` - 白板模块的整体产品文档

  ## 前端文档
  `frontend/architecture.md` - 前端架构与技术约束，修改任何前端代码时必读
  `frontend/ui-design.md` - 设计风格与样式文档，修改界面时必读

  ## 后端文档
  `backend/architecture.md` - 后端架构与技术约束，修改任何后端代码时必读
  `backend/api.md` - 后端 API 主文档，进行任何前后端对接工作时必读

  ## 当前任务文档
  `workflow/251006-fix-audio-player.md` - 修复音频播放器BUG
  `workflow/201007-floweditor-edge-feature.md` - 为工作流编辑器增加连线功能

  ## 全局重要记忆
```

文档创建与更新原则：

- 不要创建工作汇报或任务总结性质的文档，无使用场景。
- 新增的文档都必须在索引文档中分类并记录。
- 如果已有相关文档或记忆，优先更新现有内容而非新建。
- 更新文档或记忆时，应按照原格式重新组织整理文件，而非单纯追加在末尾。
- 如缺少索引文档 `.agentdocs/index.md`，先初始化索引文档，并补齐基础技术治理信息。

### 文档

文档沉淀项目架构、领域边界与跨文件共性信息，帮助在处理复杂任务时快速了解全局上下文，避免重复遍历大量代码。

根据项目情况合理划分子目录与文档类型，例如：

- 产品文档：用户的想法，某个模块的具体功能设计等
- 前端文档：前端技术架构，组件复用规则等
- 后端文档：后端技术架构、API 文档等

特殊文档类型：

- 任务文档：记录复杂任务的现状分析、方案设计、背后思考、任务阶段及 TODO 拆解等所有内容。存放于
  `.agentdocs/workflow/` 目录下，文件名格式为 `YYMMDD-任务简述.md`，其中任务简述使用短横线连接的英文单词，
  如 `251007-fix-audio-player.md`。

### 记忆

记忆沉淀项目中长期适用的重要共识、约束、原则或事实，确保处理不同任务时都遵循一致的执行准则。

典型的记忆示例：

- 新实现了可复用的自定义滚动条 React 组件 CustomScrollArea，在前端相关文档中记忆：“开发时滚动容器都应优先使用 CustomScrollArea”。
- 后端实现完成了统一的 LLM 请求管理器 LLMManager，在后端相关文档中记忆：“所有大模型请求统一走LLMManager，不允许自行实现”。

## 任务处理指南

- 当需求不明确时，在继续之前向用户提出问题来澄清需求。
- 对于用户提出的设想和意见，结合项目情况进行全面客观的分析，而不是一味遵循。
- 对于复杂任务，在分析和规划阶段先从宏观抽象层面厘清问题，再回到具体执行步骤。
- 对于复杂任务（例如涉及多个模块或跨领域变更），必须先制定分阶段实施计划并创建任务文档，然后按阶段推进执行。每完成一个阶段，必须更新文档中的 TODO 状态。
- 当问题超过三次修改仍未解决时，应回到三次修改之前重新审视，分析并探索与失败尝试不同的方案。
- 若当前任务可能需要了解跨模块约束、设计约定、使用规范或历史决策（例如样式基准、接口契约、复用组件规则）等技术治理信息时，应先查阅 `.agentdocs/index.md`，再按索引定位并阅读相关文档。
- 在所需文档缺失时，参照“文档创建与更新原则”补齐。

### 任务回顾

在任务完成呈现最终消息前，必须进行以下任务回顾：

- 根据任务执行情况判断是否需要形成或更新文档/记忆：若产出新的可复用模式、跨文件约束或关键决策，则写入对应文档；若仅影响局部实现且无长期价值，则无需写回。
- 如当前任务有对应文档，检查并更新对应文档内的 TODO 完成情况。
- 检查索引文档中所有的“当前任务文档”，如该文档对应开发已全部完成，则将该文档移动至 `.agentdocs/workflow/done/`，并从“当前任务文档”部分移除。

## 发布与运维

- 发布流程、备份、回滚与验证步骤见 [docs/deployment.md](docs/deployment.md)。
- 发布前必须备份数据库、站点目录、`.env`、nginx 配置与证书，并确认回滚目录可用。
- 生产只从 GitHub 指定版本发布；禁止把测试环境代码直接同步上线。
- 发布记录必须包含版本、commit、迁移、数据影响、备份位置、回滚方式和验证结果。
- 事故处理完成后必须归档原因、影响范围、修复方式和改进项。

## 沟通原则

- 与用户的所有回复与沟通、文档与代码注释均使用中文，必要时可保留英文专业名词，并在首次出现时附简要中文注释。
