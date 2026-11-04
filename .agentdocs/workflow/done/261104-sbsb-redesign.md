# sb.sb 风格整体界面重构

## 背景

用户要求把 MostNote 的整体界面（颜色、布局、组件观感）改为 <https://sb.sb/> 的风格。
此前的登录页渐变改造被用户否决并已回退，本次必须统一、克制、扁平。

## 参考采样

- 页面背景 `#f7f8fa`，主文字 `#1c1c1e`，次文字 `#555a6a`，弱文字 `#6b6f7e`。
- 描边 `#e0e2e8`，细线 `#eef0f3`，表面 `#ffffff` / `#fafbfc`。
- 强调色 `#ffd02f`，强调浅底 `#fff4c4`，危险色 `#cd071e`。
- 系统字体栈，基准字号 `15px`。
- 扁平、紧凑、少圆角、阴影仅用于浮层。

## 范围

- `client/src/scss/_variables.scss`：颜色、字体、圆角、边框、CoreUI 变量。
- `client/src/scss/_custom.scss`：全局组件、布局、编辑器、认证页、表格、浮层。
- `client/src/scss/_dark.scss`：深色主题同步。
- `client/src/views/Notes/NoteContextMenu.js`：内联样式改为可主题化类名。
- 认证页与欢迎页：增加品牌标识与统一容器类名。
- `client/public/index.html`、`manifest.json`：主题色与字体引用。
- 品牌 SVG 与应用图标：改为深色底 + 黄色折线。

## TODO

- [x] 变量与全局样式改造
- [x] 深色主题同步
- [x] 组件标记微调（认证页、欢迎页、右键菜单、品牌）
- [x] 图标与主题色更新
- [x] 构建并桌面/移动端截图验收
- [x] 登录回归测试
- [x] 备份、生产部署与回滚验证
- [x] 提交并推送
