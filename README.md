---
title: Metro Signage Generator
emoji: 🚇
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
app_port: 7860
---

# 🚇 Metro Signage Generator | 轨道交通导视生成器

一个现代化的轨道交通导视牌设计工具，采用**标准化一行式布局**，符合真实地铁导视牌的设计规范。

## ✨ 核心特点

### 标准化设计
- **一行式水平布局**：符合真实地铁导视牌的设计规范
- **固定元素尺寸**：所有元素尺寸高度标准化，不可随意缩放
- **标准间距系统**：紧凑/标准/宽松三档间距可选
- **拖动改变顺序**：元素只能通过拖动改变在导视牌中的排列顺序

### 丰富的元素库
- **出口标识**：A/B/C/D... 标准黄色圆形出口标志
- **线路标识**：16条线路颜色，标准尺寸徽章
- **站名文字**：中英文双语站名
- **方向指示**：←/→/↑ 带中英文方向说明
- **换乘信息**：线路徽章+换乘文字组合
- **设施图标**：电梯、扶梯、卫生间、无障碍、ATM
- **分隔线**：元素分组分隔

## 🚀 快速开始

### 环境要求
- Python 3.11+
- Node.js 18+
- [uv](https://github.com/astral-sh/uv)

### 安装

```bash
# 安装 Python 依赖
uv sync

# 安装前端依赖
cd frontend
npm install
```

### 运行

**终端 1 - 后端**:
```bash
uv run uvicorn app.main:app --reload --port 8000
```

**终端 2 - 前端**:
```bash
cd frontend
npm run dev
```

打开浏览器访问: **http://localhost:5173**

## 🎨 使用方法

1. **添加元素**：点击左侧元素库中的元素，自动添加到导视牌末尾
2. **调整顺序**：拖动元素可以改变其在导视牌中的位置
3. **编辑属性**：
   - 点击选中元素
   - 在右侧面板编辑：文字内容、线路号、出口字母、箭头方向等
   - 调整间距：紧凑/标准/宽松
4. **切换主题**：顶部下拉菜单选择不同城市地铁风格
5. **调整宽度**：选择小型/中型/大型/特大导视牌宽度
6. **导出**：点击 SVG 或 PNG 按钮导出高清图片

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Delete` | 删除选中元素 |
| `⌘D` | 复制选中元素 |
| `⌘Z` | 撤销 |
| `⌘⇧Z` | 重做 |
| `Esc` | 取消选择 |

## 🛠️ 技术栈

- **后端**: FastAPI + Pydantic + CairoSVG
- **前端**: React 18 + TypeScript + Zustand
- **构建**: Vite + uv

## 📁 项目结构

```
metro-signage-generator/
├── app/                    # FastAPI 后端
│   ├── main.py            
│   ├── models.py          
│   └── export.py          
├── frontend/              # React 前端
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── SignageCanvas.tsx
│   │   │   └── PropertiesPanel.tsx
│   │   ├── store.ts       # Zustand 状态管理
│   │   ├── types.ts       # TypeScript 类型
│   │   └── styles.css
│   └── package.json
└── pyproject.toml
```

---

<p align="center">
  Made with ❤️ for metro transit design
</p>
