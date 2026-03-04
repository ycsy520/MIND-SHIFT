# MIND/SHIFT - 认知反射引擎

[English](./README.md) | **中文**

一款基于浏览器、通过头部运动控制的反应类游戏，采用科幻风格的“认知反射引擎”主题。

![MIND/SHIFT Banner](https://img.shields.io/badge/Status-Active-cyan)

## 🎮 游戏玩法

1.  **允许摄像头访问**：游戏需要摄像头来追踪您的头部位置。
2.  **移动头部**：
    *   **MIND 领域 (蓝)**：头向 **左** 歪 -> 向左移动，头向 **右** 歪 -> 向右移动。
    *   **SHIFT 领域 (红)**：控制反转！头向 **左** 歪 -> 向 **右** 移动。
3.  **躲避墙壁**：引导您的飞船穿过迎面而来的数字墙壁缝隙。
4.  **无敌护盾**：每次现实切换后会出现 3 秒钟的白色护盾，保护您度过转换期。
5.  **生命值**：您有 3 条生命。撞墙会消耗一条生命。
6.  **适应**：随着分数增加，现实模式将在 MIND (正常) 和 SHIFT (反转) 之间切换。

## 🛠️ 技术栈

*   **React 18**: UI 框架
*   **TypeScript**: 类型安全
*   **MediaPipe Tasks Vision**: 实时面部特征点检测
*   **Tailwind CSS**: 样式
*   **Vite**: 构建工具

## 🚀 快速开始

### 先决条件

*   Node.js (v16 或更高版本)
*   npm 或 yarn

### 安装

1.  克隆仓库：
    ```bash
    git clone https://github.com/ycsy520/MIND-SHIFT.git
    cd MIND-SHIFT
    ```

2.  安装依赖：
    ```bash
    npm install
    ```

3.  启动开发服务器：
    ```bash
    npm run dev
    ```

## ☁️ 部署

### Vercel (推荐)

本项目已配置为支持 Vercel 一键部署。

1.  将此代码推送到您的 GitHub 仓库。
2.  登录 [Vercel](https://vercel.com)。
3.  点击 "Add New..." -> "Project"。
4.  导入您的 GitHub 仓库。
5.  Framework Preset 应自动检测为 **Vite**。
6.  点击 **Deploy**。

`package.json` 包含了 Vercel 所需的构建脚本 (`tsc && vite build`)。

## 📱 移动端兼容性

游戏已针对移动设备进行优化：
*   防止双指缩放。
*   处理安全区域（支持刘海屏）。
*   更大的触摸目标和玩家可见度。
*   优雅的摄像头错误处理。

## 📄 许可证

MIT
