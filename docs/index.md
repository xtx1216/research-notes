# XTX Research Notes

> 一个长期维护的科研与工程知识库：VLA、强化学习、机器人 Benchmark、论文阅读与工程踩坑记录。

## 最近更新

| 日期 | 内容 |
|---|---|
| 2026-09-21 | 建立 MkDocs 科研笔记站 |
| 2026-09-21 | 初始化 VLA / RL / Benchmark / Paper Notes / Engineering 目录 |

## 快速入口

<div class="grid cards" markdown>

-   :material-robot:{ .lg .middle } **VLA**

    ---

    RT-1 / RT-2 / OpenVLA / π0 / π0.5 / π0.7 与 RL 后训练。

    [:octicons-arrow-right-24: 进入 VLA](VLA/index.md)

-   :material-chart-bell-curve:{ .lg .middle } **Reinforcement Learning**

    ---

    PPO、GAE、PBRS、Reward Model、PRM 与后训练方法。

    [:octicons-arrow-right-24: 进入 RL](RL/index.md)

-   :material-test-tube:{ .lg .middle } **Benchmarks**

    ---

    LIBERO、CALVIN、ManiSkill、SimplerEnv、RoboCasa、Meta-World。

    [:octicons-arrow-right-24: 进入 Benchmarks](Benchmarks/index.md)

-   :material-file-document-outline:{ .lg .middle } **Paper Notes**

    ---

    按论文长期积累：问题、方法、实验、局限与个人理解。

    [:octicons-arrow-right-24: 进入 Paper Notes](Paper-Notes/index.md)

</div>

## 推荐的记录原则

!!! tip "一篇笔记解决一个问题"
    不要追求“一次写完”。先记清楚核心结论、公式、图和坑，后续随实验继续补。

!!! note "公式示例"
    GAE 的 TD 残差：

    $$
    \delta_t = r_t + \gamma V(s_{t+1}) - V(s_t)
    $$

## 常用命令

```bash
# 安装依赖
pip install -r requirements.txt

# 本地启动
mkdocs serve

# 构建静态站点
mkdocs build
```
