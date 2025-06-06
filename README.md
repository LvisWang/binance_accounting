# Binance 多账户交易分析器 (React 版本)

一个基于 Next.js 的 Binance 多账户交易分析工具，可以查询和分析多个账户的交易记录，计算盈亏和手续费统计。

## 功能特点

- 🔐 **多账户管理**：支持添加多个 Binance 账户，安全存储在本地
- 📊 **交易查询**：并行查询多个账户的交易记录
- 📈 **数据分析**：详细的买入/卖出统计和盈亏分析
- 💾 **数据导出**：导出 CSV 格式的详细分析报告
- 🎨 **现代界面**：使用 Tailwind CSS 构建的美观响应式界面
- ☁️ **易于部署**：专门为 Vercel 部署优化

## 技术栈

- **前端**：React 18 + Next.js 14 + TypeScript
- **样式**：Tailwind CSS
- **图标**：Lucide React
- **API**：Next.js API Routes (Serverless Functions)
- **部署**：Vercel

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 本地开发

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 3. 构建生产版本

```bash
npm run build
npm start
```

## 部署到 Vercel

### 方法一：Git 部署（推荐）

1. 将代码推送到 GitHub 仓库
2. 在 [Vercel](https://vercel.com) 中连接你的 GitHub 仓库
3. Vercel 会自动检测这是一个 Next.js 项目并部署

### 方法二：CLI 部署

1. 安装 Vercel CLI：
```bash
npm i -g vercel
```

2. 在项目根目录运行：
```bash
vercel
```

3. 按照提示完成部署

## 使用说明

### 1. 添加账户

- 点击"添加账户"按钮
- 输入账户名称、API Key 和 Secret Key
- 可选择是否使用测试网
- 系统会自动验证 API 密钥的有效性

### 2. 查询交易

- 选择要查询的交易对（如 PNUTUSDT）
- 设置查询的时间范围
- 可使用快速选择按钮（最近3天、7天等）
- 点击"查询交易记录"

### 3. 分析交易

- 在交易记录表格中选择要分析的交易
- 点击"分析选中"按钮
- 查看详细的分析报告，包括：
  - 买入/卖出统计
  - 平均价格计算
  - 盈亏分析
  - 手续费统计

### 4. 导出报告

- 完成交易分析后，点击"导出报告"
- 下载包含完整分析数据的 CSV 文件

## 安全说明

- ⚠️ **API 密钥安全**：所有 API 密钥仅在本地浏览器存储，不会上传到服务器
- 🔑 **权限建议**：建议创建仅具有查询权限的只读 API 密钥
- 🚫 **公共环境**：请勿在公共计算机上输入真实的 API 密钥

## API 配置

### 创建 Binance API 密钥

1. 登录 [Binance](https://www.binance.com)
2. 前往 API 管理页面
3. 创建新的 API 密钥
4. **重要**：仅启用"读取"权限，禁用交易和提现权限
5. 记录 API Key 和 Secret Key

### 测试网使用

如果要使用 Binance 测试网：
1. 访问 [Binance Testnet](https://testnet.binance.vision)
2. 创建测试网账户和 API 密钥
3. 在添加账户时勾选"使用测试网"选项

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── add-account/   # 添加账户
│   │   ├── analyze-trades/# 分析交易
│   │   ├── export-csv/    # 导出 CSV
│   │   └── query-trades/  # 查询交易
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx          # 主页
├── components/            # React 组件
│   ├── AccountForm.tsx    # 账户表单
│   ├── AnalysisModal.tsx  # 分析结果模态框
│   ├── QueryForm.tsx      # 查询表单
│   └── TradesTable.tsx    # 交易表格
├── lib/                   # 工具库
│   └── binance.ts        # Binance API 客户端
└── types/                 # TypeScript 类型定义
    └── index.ts
```

## 常见问题

### Q: 为什么要用 React 重写？
A: React/Next.js 版本更适合部署到 Vercel，避免了 Python 部署的复杂性，同时提供更好的用户体验。

### Q: 数据是否安全？
A: 是的，所有 API 密钥仅在本地浏览器存储，服务器端只处理 API 调用逻辑。

### Q: 支持哪些交易对？
A: 支持所有 Binance 现货交易对，如 BTCUSDT、ETHUSDT、PNUTUSDT 等。

### Q: 查询时间范围有限制吗？
A: 建议不要超过30天，以避免查询时间过长和 API 限制。

## 开发

### 本地开发环境设置

```bash
# 克隆项目
git clone <repository-url>
cd binance-multi-account-analyzer

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 代码检查

```bash
# 运行 ESLint
npm run lint

# 类型检查
npx tsc --noEmit
```

## 许可证

MIT License

## 支持

### 第一步：添加账户
1. 在主页填写账户信息
2. 输入账户名称、API Key 和 Secret Key
3. 选择是否使用测试网
4. 点击"添加账户"

### 第二步：查询交易
1. 设置查询参数（交易对、时间范围）
2. 点击"查询交易记录"
3. 查看查询结果统计

### 第三步：分析交易
1. 在交易记录页面选择要分析的交易
2. 可以使用全选、清除选择等快捷操作
3. 点击"分析选中交易"查看分析结果

### 第四步：导出报告
1. 分析完成后点击"导出 CSV 报告"
2. 下载包含详细分析数据的 CSV 文件

## API 权限要求

您的 Binance API 密钥需要以下权限：
- ✅ 现货交易读取权限
- ❌ 不需要交易权限
- ❌ 不需要提现权限

## 安全提示

- 🔒 API 密钥仅在内存中临时存储，不会保存到文件
- 🌐 建议在本地环境使用，避免在公共网络中暴露API密钥
- 🛡️ 可以在 Binance 设置中限制 API 的 IP 访问范围
- ⚠️ 定期检查和更换 API 密钥

## 文件说明

- `app.py` - Flask 主应用文件
- `binance_exporter.py` - Binance API 交互模块
- `config.py` - 配置文件
- `run.py` - 启动脚本
- `requirements.txt` - 依赖包列表
- `templates/` - HTML 模板文件
  - `base.html` - 基础模板
  - `index.html` - 主页模板
  - `trades.html` - 交易记录页面模板

## 技术栈

- **后端**: Flask (Python)
- **前端**: Bootstrap 5 + JavaScript
- **API**: Binance REST API
- **样式**: Bootstrap Icons

## 常见问题

**Q: API 连接失败怎么办？**
A: 请检查：
1. API 密钥是否正确
2. 是否启用了现货交易权限
3. IP 是否在白名单中
4. 网络连接是否正常

**Q: 查询不到交易记录？**
A: 请确认：
1. 时间范围是否正确
2. 交易对名称是否正确（如 BTCUSDT）
3. 该时间段内是否确实有交易

**Q: 分析结果不准确？**
A: 分析基于选中的交易记录，请确保：
1. 选择了正确的交易记录
2. 买入和卖出交易都包含在分析范围内

## 开发者

如需自定义或扩展功能，请参考代码注释和Flask文档。

---

⚡ **快速开始**: 运行 `python run.py` 并访问 http://localhost:5000 