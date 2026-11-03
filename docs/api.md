# API 文档

MostNote 通过 JSON REST API 暴露全部功能。生产基础地址：

```
https://mostnote.com/api.php/v1
```

自建部署时把域名替换为实际地址；如果 Web 根目录直接指向 `public/`，也可以使用 `/api.php/v1`。所有请求和
响应均使用 JSON，错误响应也始终是 JSON。

## 认证

API 使用 Bearer Token。先通过登录接口创建 session，再把返回的 token 放到请求头：

```http
Authorization: Bearer {SESSION-TOKEN}
Accept: application/json
```

### 登录

```http
POST /v1/sessions
Content-Type: application/json
```

```json
{
  "email": "admin@example.org",
  "password": "12345678"
}
```

成功返回 `201 Created`：

```json
{
  "user_id": "0cf76d64-7aea-4060-94f0-553a5d41baea",
  "expires_at": "2026-11-04 03:08:15",
  "token": "pZoQKVXYET9KzgnCTzTRafwSrTN9E0RR9DZDK2sWXbudfSz38nyMV5uviSMt"
}
```

失败返回：

- `401`：邮箱或密码错误
- `422`：参数校验失败
- `429`：触发登录限流

登录限流按账号和来源地址组合计算：15 分钟内同一账号 + 地址最多 5 次，同一账号最多 50 次，同一地址最多
50 次。

### 登出

```http
DELETE /v1/sessions/{token}
Authorization: Bearer {SESSION-TOKEN}
```

- `200`：删除成功
- `404`：token 不存在
- `401`：token 不属于当前用户

## 通用约定

### 限流

除登录和密码相关接口外，API 默认限制为每个用户（未认证时按 IP）每分钟 200 次请求，响应头包含：

```http
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 199
```

### 列表参数

笔记和用户列表支持以下查询参数：

| 参数 | 说明 |
| --- | --- |
| `filter` | 关键词过滤 |
| `sort` | 排序字段 |
| `direction` | `asc` 或 `desc` |
| `page` | 页码，从 1 开始 |
| `length` | 每页数量 |
| `fields` | 逗号分隔的返回字段 |

`filter`、`sort`、`fields` 只接受允许的字段，非法值会被忽略或回退到默认值。

### 错误格式

```json
{
  "message": "Unauthenticated."
}
```

常见状态码：

| 状态码 | 含义 |
| --- | --- |
| `200` | 成功 |
| `201` | 创建成功 |
| `401` | 未认证或无权限 |
| `404` | 资源不存在，或不属于当前用户 |
| `422` | 参数校验失败 |
| `429` | 触发限流 |

> 访问其他用户的笔记返回 `404` 而不是 `401`，避免客户端误判为登录过期。

## 应用

### 获取应用信息

```http
GET /v1
```

无需登录。管理员携带 Bearer Token 时，响应可能包含可用更新：

```json
{
  "updates": []
}
```

### 安装

```http
POST /v1
```

仅在数据库还没有任何表时可用，会执行 `migrate:fresh --seed`。数据库已有表时返回 `401`。该接口只用于首次
安装，禁止在已有数据的库上调用。

### 更新

```http
PUT /v1
Authorization: Bearer {ADMIN-TOKEN}
```

管理员接口。检查并安装可用更新；没有可用更新时返回 `404`。生产环境建议按
[生产运维](deployment.md) 的流程手工发布。

### 刷新

```http
POST /v1/refresh
Authorization: Bearer {ADMIN-TOKEN}
```

管理员接口。清理配置缓存、执行迁移并清理无用文件。

## 笔记

所有笔记接口都需要登录，普通用户只能访问自己的笔记。

### 列表

```http
GET /v1/notes?filter=keyword&sort=updated_at&direction=desc&page=1&length=20&fields=id,title,pinned
Authorization: Bearer {TOKEN}
```

`filter` 会同时匹配标题和内容。开启加密后内容在服务端是密文，过滤会在 PHP 层完成。

响应 `200`：

```json
[
  {
    "id": "644d6d5f-6c42-4c28-b9c1-d25a14cd7903",
    "user_id": "e150a31c-5987-41d7-bd16-b42d87dd3bce",
    "content": "Content",
    "title": "Title",
    "pinned": false,
    "created_at": "2020-03-20 09:34:02",
    "updated_at": "2020-03-20 09:34:08"
  }
]
```

### 获取单条

```http
GET /v1/notes/{id}
Authorization: Bearer {TOKEN}
```

### 创建

```http
POST /v1/notes
Authorization: Bearer {TOKEN}
Content-Type: application/json
```

```json
{
  "title": "New Note",
  "content": "This is the new note content.",
  "pinned": false
}
```

`content` 可以是空字符串或 `null`。成功返回 `201` 和笔记对象。

### 更新

```http
PUT /v1/notes/{id}
Authorization: Bearer {TOKEN}
Content-Type: application/json
```

```json
{
  "title": "Updated Note",
  "content": "This is the updated note content.",
  "pinned": true
}
```

成功返回 `200` 和更新后的笔记。

### 删除

```http
DELETE /v1/notes/{id}
Authorization: Bearer {TOKEN}
```

成功返回 `200`。

### 固定/取消固定

```http
PATCH /v1/notes/{id}/pinned
Authorization: Bearer {TOKEN}
Content-Type: application/json
```

```json
{
  "pinned": true
}
```

成功返回 `200`。

## 用户

### 当前用户/指定用户

```http
GET /v1/users/{id}
Authorization: Bearer {TOKEN}
```

普通用户只能读取自己；管理员可以读取任意用户。无权限返回 `401`。

### 更新用户

```http
PUT /v1/users/{id}
Authorization: Bearer {TOKEN}
Content-Type: application/json
```

```json
{
  "name": "John Doe",
  "email": "user@example.org",
  "password": "new-password",
  "current_password": "old-password",
  "locale": "zh-CN",
  "view": "compact",
  "line": "full",
  "sort": "modified",
  "theme": "light",
  "encrypt": false,
  "admin": false
}
```

规则：

- `name`、`email` 必填；`password` 至少 8 位，可为空。
- 用户修改自己的邮箱或密码时必须提供 `current_password`，否则返回 `422`。
- 修改密码会撤销该用户除当前 session 外的其他 session。
- 只有管理员可以修改 `admin` 字段。
- 不能把最后一个管理员降级，否则返回 `422`。
- 开关 `encrypt` 会在事务中重新加密/解密该用户全部笔记。

### 用户列表（管理员）

```http
GET /v1/users?filter=john&sort=name&direction=asc&page=1&length=50
Authorization: Bearer {ADMIN-TOKEN}
```

### 创建用户（管理员）

```http
POST /v1/users
Authorization: Bearer {ADMIN-TOKEN}
Content-Type: application/json
```

```json
{
  "name": "John Doe",
  "email": "user@example.org",
  "password": "12345678",
  "locale": "en-US",
  "view": "compact",
  "line": "full",
  "sort": "modified",
  "theme": "light",
  "encrypt": false,
  "admin": false
}
```

`password` 至少 8 位，`admin` 必填。成功返回 `201` 和用户对象（不包含密码）。

### 删除用户（管理员）

```http
DELETE /v1/users/{id}
Authorization: Bearer {ADMIN-TOKEN}
```

不能删除自己；不能删除最后一个管理员。成功返回 `200`。

### 找回密码

```http
POST /v1/users/recovery
Content-Type: application/json
```

```json
{
  "email": "user@example.org"
}
```

无论邮箱是否存在都返回 `200`，避免账号枚举。邮件在响应后异步发送，重置链接有效期为 60 分钟。该接口限制为
每 15 分钟 5 次。

### 重置密码

```http
POST /v1/users/reset-password
Content-Type: application/json
```

```json
{
  "email": "user@example.org",
  "token": "邮件中的重置 token",
  "password": "new-password"
}
```

- `password` 至少 8 位。
- token 无效或过期返回 `422`。
- 成功返回 `200`，并撤销该用户所有 session。

## 设置

### 获取设置

```http
GET /v1/settings
Authorization: Bearer {ADMIN-TOKEN}
```

返回键值对象，例如：

```json
{
  "default_locale": "en-US",
  "mail_driver": "smtp",
  "mail_host": "smtp.example.org",
  "mail_port": "587",
  "mail_username": "",
  "mail_password": "",
  "mail_encryption": "tls",
  "mail_from_address": "hello@example.org",
  "mail_from_name": "MostNote"
}
```

### 更新设置

```http
PUT /v1/settings
Authorization: Bearer {ADMIN-TOKEN}
Content-Type: application/json
```

请求体为要更新的键值对象，未提供的键保持不变。成功返回 `200`。

## 相关文档

- [安装部署](installation.md)
- [生产运维与发布回滚](deployment.md)
- [项目简介](introduction.md)

[返回文档索引](readme.md)
