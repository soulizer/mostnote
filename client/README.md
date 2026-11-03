# MostNote Client

`client/` 是 MostNote 的 React 16 + MobX 单页应用，使用 Create React App 构建，UI 基于 CoreUI 2 +
Bootstrap 4。前端通过 `api.php/v1` 调用服务端 API，并使用 IndexedDB 缓存笔记以支持离线使用。

## 开发

```bash
npm ci
npm start        # 开发服务器，端口 3000
npm run build    # 生产构建
npm test         # Jest / react-scripts 测试
```

开发环境通常由仓库根目录的 Docker Compose 启动 nginx 和 PHP-FPM，前端开发服务器负责其余页面。

## 目录

- `src/stores/`：MobX 状态
- `src/http/`：API 请求封装
- `src/views/`：页面
- `src/containers/`：应用外壳
- `src/lang/`：多语言文案

## 注意

- 新增用户可见文案必须同步 `src/lang/` 下的所有语言。
- 新增 API 路由必须同时补充 `src/http/` 的客户端方法。
- `CRA.md`、`REACT.md`、`COREUI.md`、`CHANGELOG.md`、`CONTRIBUTING.md` 是上游脚手架参考文档，
  本项目开发规范以 [../agents.md](../agents.md) 为准。
- 生产构建与发布包由根目录的 `./build.sh` 统一生成，不要手工拼装。
