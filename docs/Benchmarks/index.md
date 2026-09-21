# Robotics Benchmarks

本章节整理机器人操作领域常用 Benchmark 的任务设置、观测与动作空间、评测协议、常用命令和实验结果。

## Benchmark 概览

| Benchmark | 主要特点 | 当前关注 |
|---|---|---|
| [LIBERO](libero.md) | 多任务桌面操作与持续学习 | VLA SFT、RL 后训练 |
| [CALVIN](calvin.md) | 语言条件下的长程连续操作 | 连续任务长度、长程规划 |
| [ManiSkill](maniskill.md) | 高性能仿真与多类型操作任务 | RL、数据生成、操作泛化 |
| [SimplerEnv](simplerenv.md) | 面向真实机器人策略的仿真评测 | VLA 泛化、Sim-to-Real 相关性 |
| [RoboCasa](robocasa.md) | 家庭与厨房场景中的复杂操作 | 长程、多任务、场景泛化 |
| [Meta-World](metaworld.md) | 经典多任务机器人操作环境 | RL 基线、多任务与元学习 |

## 如何选择

- 研究 **VLA 微调或 RL 后训练**：优先关注 [LIBERO](libero.md)。
- 研究 **语言条件长程任务**：优先关注 [CALVIN](calvin.md) 和 [RoboCasa](robocasa.md)。
- 研究 **高吞吐 RL 或仿真数据生成**：优先关注 [ManiSkill](maniskill.md)。
- 研究 **VLA 的仿真评测与泛化**：优先关注 [SimplerEnv](simplerenv.md)。
- 需要 **经典且轻量的 manipulation 基线**：优先关注 [Meta-World](metaworld.md)。

## 统一记录维度

为了让不同 Benchmark 的实验结果更容易比较，各页面尽量按照以下维度记录：

1. 环境版本、代码仓库与数据版本；
2. 任务数量、任务划分和语言指令形式；
3. Observation、Action Space 与控制频率；
4. 训练数据、初始化方式和最大 episode 长度；
5. 成功条件、评测次数与聚合指标；
6. 模型配置、实验结果、随机种子和已知问题。
