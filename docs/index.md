# XTX Research Notes

> 围绕 Vision-Language-Action、机器人强化学习后训练、仿真平台与工程实践长期维护的研究笔记。

这个站点不是论文列表的简单堆叠，而是用来沉淀三个层面的东西：

1. **概念框架**：VLA、RL、benchmark、训练范式之间到底是什么关系；
2. **论文理解**：每篇论文解决什么问题，方法为什么这样设计，实验结论该怎么读；
3. **工程经验**：环境、训练、评测、GPU / CUDA / 分布式系统里踩过的坑。

## 快速入口

<div class="grid cards" markdown>

-   :material-robot-outline:{ .lg .middle } **VLA**

    ---

    VLA 基础模型、动作表示、action chunk、flow matching 与 RL 后训练。

    [OpenVLA](VLA/openvla.md) · [RL Post-Training](VLA/rl-post-training.md)

-   :material-chart-bell-curve:{ .lg .middle } **强化学习**

    ---

    Policy optimization、TRPO、PPO，以及面向 VLA 后训练的 RL 基础。

    [TRPO](RL/trpo.md) · [PPO](RL/ppo.md)

-   :material-flask-outline:{ .lg .middle } **仿真平台**

    ---

    LIBERO、CALVIN、ManiSkill、SimplerEnv、RoboCasa、Meta-World 的任务设置与评测协议。

    [查看平台总览](Benchmarks/index.md)

-   :material-file-document-outline:{ .lg .middle } **论文阅读**

    ---

    按方向整理论文笔记，记录问题、方法、实验、局限和个人理解。

    [π₀](Paper-Notes/vla_base/pi0.md) · [π₀.₅](Paper-Notes/vla_base/pi05.md) · [iRe-VLA](Paper-Notes/RL_posttraining/iRe-VLA.md)

-   :material-tools:{ .lg .middle } **Engineering**

    ---

    记录 Git、Linux、CUDA / NCCL、FSDP 等科研工程问题与解决方式。

    [进入工程笔记](Engineering/index.md)

</div>

## 当前内容地图

| 方向 | 已整理内容 | 适合什么时候看 |
|---|---|---|
| [VLA](VLA/index.md) | OpenVLA、VLA RL 后训练、VLA 常用整理维度 | 想快速建立 VLA 研究主线 |
| [强化学习](RL/index.md) | TRPO、PPO、policy optimization 基础 | 想补 VLA 后训练背后的 RL 方法 |
| [仿真平台](Benchmarks/index.md) | 6 个机器人 benchmark 的任务、指标和选型对比 | 准备选环境、读实验表或设计评测 |
| [论文阅读](Paper-Notes/index.md) | π₀、π₀.₅、iRe-VLA | 想系统读 VLA 基础模型和 RL 后训练论文 |
| [Engineering](Engineering/index.md) | Git、Linux、CUDA / NCCL、FSDP | 遇到训练、环境或分布式工程问题 |

## 推荐阅读路线

如果是从 VLA 方向开始，可以按下面的顺序读：

```text
VLA 总览
→ π₀
→ π₀.₅
→ iRe-VLA
→ LIBERO / CALVIN / SimplerEnv
→ PPO / TRPO
```

这条路线先建立模型和训练范式，再回到 benchmark 和 RL 方法。对后面做 SFT、RL post-training、仿真评测会更顺。

## 记录原则

!!! tip "一页解决一个核心问题"
    每篇笔记尽量回答一个清楚的问题：这篇论文或这个工具到底解决了什么，为什么这样设计，结论对当前研究有什么用。

!!! note "优先记录可复用判断"
    比起摘录所有细节，更重要的是留下以后能复用的判断：这个 benchmark 适合测什么，这个算法为什么稳定，这个工程坑下次怎么避开。
