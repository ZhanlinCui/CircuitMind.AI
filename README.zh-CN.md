<p align="center">
  <img src="https://img.shields.io/badge/Gemini_3-Powered-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini 3" />
  <img src="https://img.shields.io/badge/React_19-TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite_7-Fast-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-Styling-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT" />
</p>

<h1 align="center">CircuitMind.AI</h1>

<p align="center">
  <strong>首个自主 AI 电路设计智能体 — 画草图、说需求、出方案</strong>
</p>

<p align="center">
  <a href="#快速开始">快速开始</a> •
  <a href="#gemini-3-集成">Gemini 3 集成</a> •
  <a href="#核心功能">核心功能</a> •
  <a href="#系统架构">系统架构</a> •
  <a href="./README.md">English</a>
</p>

---

## CircuitMind 是什么？

**CircuitMind** 是一个 AI 原生的电路设计平台，通过手绘草图和自然语言描述，将创意转化为可落地的硬件方案。它利用 Google **Gemini 3** 的多模态推理能力，通过 **4 步自主智能体管道**（非单次 prompt 调用）完成从需求到方案的全流程。

> **为 [Google DeepMind Gemini 3 Hackathon 2026](https://gemini3.devpost.com/) 而构建**

### 痛点

电路设计需要在元器件选型、电源管理、总线协议、PCB 布局等方面有深厚的专业知识。学生和创客面临陡峭的学习曲线，即便是资深工程师也要花数天迭代系统架构。

### 我们的方案

CircuitMind 提供 3 种输入方式：

1. **画草图** — 拍照上传手绘电路图，Gemini 3 视觉识别所有元器件
2. **说需求** — 输入一句话描述，AI 生成完整项目规格
3. **出方案** — 4 步智能体管道产出 3 套经过验证的硬件方案

---

## Gemini 3 集成

CircuitMind 每个项目编排 **4+ 次 Gemini 3 API 调用**，通过自主智能体管道完成：

| 步骤 | 模型 | 功能 |
|------|------|------|
| **1. 感知 (Perceive)** | `gemini-3-flash-preview` | 分析需求，提取电气参数，识别模糊点 |
| **2. 生成 (Generate)** | `gemini-3-flash-preview` + JSON Schema | 生成 3 套差异化电路方案，强制类型安全的结构化输出 |
| **3. 验证 (Validate)** | `gemini-3-pro-preview` | AI 自审查：电压匹配、总线冲突、缺失器件、功耗预算；打分 0-100 |
| **4. 迭代 (Iterate)** | `gemini-3-flash-preview` | 自动修复验证发现的关键问题 — 无需人工干预 |

**其他能力：**
- **多模态草图分析** — Gemini 3 Vision 将手绘电路照片转为结构化 JSON
- **一键智能生成** — 一句话需求 → 完整项目规格（模块 + 连接）
- **JSON Schema 强制约束** — `responseMimeType` + `responseSchema` 保证输出格式100%正确

---

## 核心功能

| 功能 | 说明 |
|------|------|
| **4 步智能体管道** | 感知 → 生成 → 验证 → 迭代，实时步骤进度 UI |
| **AI 自我验证** | Gemini 审查自己的输出，自动修正工程错误 |
| **多模态草图识别** | 上传手绘电路图照片，AI 识别所有元器件和连接 |
| **一键智能生成** | 一句话项目描述 → 完整电路规格 |
| **3 套备选方案** | 对比成本、复杂度、性能的差异化方案 |
| **L1 架构图** | 交互式系统拓扑图，含端口、边、信号路径 |
| **研发工作流** | 泳道图：硬件/软件/测试泳道、里程碑、门禁评审 |
| **实时校验** | 电压不匹配、总线兼容性、上拉电阻缺失检测 |
| **模块库** | 电源、MCU、传感器、接口、保护等模块目录 |
| **电路案例库** | 8 个参考设计（Arduino、STM32、ESP32、汽车、医疗） |
| **元器件数据库** | 可搜索的元器件目录（含规格和数据手册） |
| **双语界面** | 完整的中英文国际化支持 |

---

## 系统架构

```
┌───────────────────────────────────────────────────────────┐
│                   CircuitMind 前端                         │
│               React 19 + TypeScript + Vite 7               │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │   草图分析   │  │   智能生成   │  │  智能体管道     │ │
│  │  (多模态)    │  │  (一句话)    │  │  (4 步 Agent)   │ │
│  └──────┬───────┘  └──────┬───────┘  └───────┬─────────┘ │
│         └─────────────────┼───────────────────┘           │
│              ┌────────────▼────────────┐                  │
│              │   Gemini 3 API 客户端   │                  │
│              │   (src/lib/gemini.ts)   │                  │
│              └────────────┬────────────┘                  │
└───────────────────────────┼───────────────────────────────┘
                            │
               ┌────────────▼────────────┐
               │   Google Gemini 3 API   │
               │  步骤 1: 感知 (Perceive)│  ← 需求分析
               │  步骤 2: 生成 (Generate)│  ← 结构化输出
               │  步骤 3: 验证 (Validate)│  ← AI 自审查
               │  步骤 4: 迭代 (Iterate) │  ← 自动修复
               │  + 多模态视觉           │  ← 草图识别
               └─────────────────────────┘
```

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript (strict) |
| 构建 | Vite 7 |
| 样式 | Tailwind CSS 3 + CSS Modules |
| 图形可视化 | @xyflow/react (ReactFlow) + dagre |
| AI 引擎 | Google Gemini 3 API (`gemini-3-flash-preview`, `gemini-3-pro-preview`) |
| 图标 | Lucide React + FontAwesome 6 |
| 国际化 | react-i18next |
| 路由 | React Router v7 |
| 持久化 | 浏览器 LocalStorage |

---

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/ZhanlinCui/CircuitMind.AI.git
cd CircuitMind.AI

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

打开浏览器访问 `http://localhost:5173`。

### 配置 Gemini API Key

1. 访问 [Google AI Studio](https://aistudio.google.com/) 获取 API Key
2. 在 CircuitMind 中，进入 **设置 → AI 算力配置**
3. 选择 **Google Gemini** 作为 Provider
4. 粘贴 API Key，点击 **测试连接**
5. 开始创建项目！

---

## 演示

> **[观看 3 分钟演示视频](#)** *(链接待补充)*

### 快速演示步骤

1. 打开 CircuitMind → 点击 **"Try Live Demo"**
2. 看到预填的提示词：*"A portable air quality monitor..."*
3. 点击 **Generate** — 观看 4 步管道实时运行
4. 查看 3 套生成方案，包含 L1 架构图和研发工作流
5. 尝试 **草图识别**：上传任何手绘电路图

---

## 评分标准对照

| 标准 | 权重 | CircuitMind 的对应 |
|------|------|-------------------|
| **技术执行** | 40% | 4 步智能体管道（4+ API 调用）、JSON Schema 结构化输出、TypeScript strict、CI |
| **创新/惊艳度** | 30% | 自我验证的 AI 智能体（非 prompt 包装）、多模态草图转设计、自主纠错 |
| **潜在影响** | 20% | 降低硬件设计门槛、将迭代周期从数天缩短到分钟 |
| **展示/演示** | 10% | 专业 Landing Page、架构图、双语文档、清晰 3 分钟 Demo |

---

## 贡献

欢迎贡献！请提 Issue 或 Pull Request。

## 许可证

[MIT](./LICENSE)

---

<p align="center">
  <strong>基于 Google Gemini 3 构建，为 <a href="https://gemini3.devpost.com/">Google DeepMind Hackathon 2026</a> 参赛作品</strong>
</p>
