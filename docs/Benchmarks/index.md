# Robotics Benchmarks

本章节整理机器人操作领域常用 Benchmark 的任务设置、观测与动作空间、评测协议、结果解读方式和适用研究问题。

当前目录下的 6 个 Benchmark 页面都已经完成基础整理：每篇都覆盖“它在测什么”“任务和环境是什么样的”“输入输出与动作空间”“成功率或核心指标怎么读”“最重要的理解”和参考资料。它们更适合作为 benchmark 选型与读论文时的概念索引，而不是具体实验日志。

## 完成情况

| Benchmark | 完成状态 | 已整理重点 | 适合用来研究 |
|---|---:|---|---|
| [LIBERO](libero.md) | 已完成 | Task suite、语言条件桌面操作、demonstration、success rate、lifelong learning 指标 | VLA SFT、RL 后训练、持续学习、多任务泛化 |
| [CALVIN](calvin.md) | 已完成 | 语言条件长程操作、5 个连续任务、SR@1-SR@5、Average Length、A/B/C/D 环境划分 | 长程规划、语言跟随、连续任务组合能力 |
| [ManiSkill](maniskill.md) | 已完成 | 高性能仿真、state/RGB-D/point cloud 观测、多机器人、GPU 并行仿真、demonstration | 高吞吐 RL、仿真数据生成、操作泛化、视觉或点云策略 |
| [SimplerEnv](simplerenv.md) | 已完成 | Real-to-Sim、Google Robot、WidowX + Bridge、visual matching、variant aggregation、real-sim correlation | VLA 仿真评测、sim-to-real 相关性、真实策略复现实验 |
| [RoboCasa](robocasa.md) | 已完成 | 厨房场景、atomic/composite task、场景与资产多样性、human/synthetic demonstration、pretrain/target split | 家庭机器人、长程复杂操作、场景泛化、组合任务 |
| [Meta-World](metaworld.md) | 已完成 | 经典 Sawyer 操作任务、observation/action、reward/success、MT/ML benchmark、meta-RL 设置 | 多任务 RL、元学习、轻量级 manipulation 基线 |

## 阅读路线

如果目标是快速选 benchmark，可以按研究问题进入：

- 做 **VLA 微调、RL 后训练、任务 suite 评测**：先看 [LIBERO](libero.md)。
- 做 **语言条件长程任务**：先看 [CALVIN](calvin.md)，再看 [RoboCasa](robocasa.md)。
- 做 **高吞吐 RL、仿真数据生成、多模态观测**：先看 [ManiSkill](maniskill.md)。
- 做 **真实机器人策略的仿真复现与泛化评估**：先看 [SimplerEnv](simplerenv.md)。
- 做 **家庭与厨房场景的复杂组合操作**：先看 [RoboCasa](robocasa.md)。
- 需要 **经典、轻量、可快速跑 baseline 的 manipulation 环境**：先看 [Meta-World](metaworld.md)。

## Benchmark 对比

| 维度 | LIBERO | CALVIN | ManiSkill | SimplerEnv | RoboCasa | Meta-World |
|---|---|---|---|---|---|---|
| 主要任务形态 | 桌面多任务操作 | 连续语言指令操作 | 多类型仿真操作 | 真实策略仿真评测 | 厨房长程操作 | 经典单臂操作 |
| 语言条件 | 强 | 强 | 视任务而定 | 强 | 强 | 弱 / 通常不是核心 |
| 长程任务 | 中 | 强 | 视任务而定 | 中 | 强 | 弱 |
| 多任务 / 泛化 | 强 | 强 | 强 | 强 | 强 | 强 |
| RL 友好度 | 中 | 中 | 强 | 中 | 中 | 强 |
| VLA 评测相关性 | 强 | 强 | 中 | 强 | 强 | 中 |
| 真实机器人相关性 | 中 | 中 | 中 | 强 | 中 | 弱 |

## 统一记录口径

为了让不同 Benchmark 的实验结果更容易横向比较，各页面尽量按照以下维度记录：

1. 环境版本、代码仓库与数据版本；
2. 任务数量、任务划分和语言指令形式；
3. Observation、Action Space 与控制频率；
4. 训练数据、初始化方式和最大 episode 长度；
5. 成功条件、评测次数与聚合指标；
6. 模型配置、实验结果、随机种子和已知问题。

后续如果补充具体实验记录，建议优先在每个 Benchmark 页面末尾增加“实验设置”和“结果表”，并保持同一套记录口径。
