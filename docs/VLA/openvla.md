# OpenVLA

<span class="page-subtitle">Vision-Language-Action · Open-Source Model · Action Tokenization</span>

<div class="tags">
  <span>VLA</span>
  <span>Robot Foundation Model</span>
  <span>Open Source</span>
</div>

OpenVLA 是面向通用机器人操作的开源 Vision-Language-Action 模型；本页重点记录其模型结构、动作离散方式、训练数据、微调方法与评测结果。

---

## 模型概览

| 项目 | 内容 |
|---|---|
| 模型 | OpenVLA |
| 发布机构 | 待补充 |
| 年份 | 待补充 |
| 参数量 | 待补充 |
| Vision Encoder | 待补充 |
| Language Backbone | 待补充 |
| Action Head | Action Tokenization，细节待补充 |
| Action Chunk | 待补充 |
| 训练数据 | 待补充 |
| 开源情况 | 开源，仓库与许可证待补充 |

## 核心思想

OpenVLA 将机器人动作纳入视觉语言模型的生成空间，使策略可以根据视觉观察和语言指令预测机器人动作。

!!! abstract "核心结论"
    重点关注动作如何被离散化、加入语言模型词表，并在推理时还原为连续控制量。

## 模型架构

### 输入

| 输入 | 形式 | 说明 |
|---|---|---|
| 图像 | RGB | 视角与分辨率待补充 |
| 语言 | Instruction | 自然语言任务描述 |
| Robot State | 待补充 | 是否使用 proprioception 待核对 |

### Vision Encoder

待补充编码器组成、特征融合方式及冻结策略。

### Language Backbone

待补充模型名称、参数规模与微调范围。

### Action Head

待补充动作 token 的词表映射、离散区间、损失函数和解码方式。

## Action Representation

| 项目 | 设置 |
|---|---|
| 动作维度 | 待补充 |
| 坐标系 | 待补充 |
| Rotation 表示 | 待补充 |
| Gripper 表示 | 待补充 |
| 归一化方式 | 待补充 |
| Tokenization | 待补充 |

## Action Chunking

| 项目 | 设置 |
|---|---|
| Chunk Length | 待补充 |
| Execution Length | 待补充 |
| Replan Frequency | 待补充 |

## 训练方法

### Pre-training

待补充预训练初始化方式、数据混合策略和训练目标。

### Fine-tuning

待补充全量微调、参数高效微调及不同 embodiment 的适配方式。

### RL / Post-training

待补充 OpenVLA 用于 RL 后训练时的策略接口、log-prob 计算与 critic 设计。

## 数据

| Dataset | Embodiment | Scale | Purpose |
|---|---|---:|---|
| 待补充 | | | Pre-training |
| 待补充 | | | Fine-tuning |

## Benchmark 与结果

| Model | Backbone | Data | Benchmark | Result |
|---|---|---|---|---:|
| OpenVLA | 待补充 | 待补充 | LIBERO | 待补充 |
| OpenVLA | 待补充 | 待补充 | CALVIN | 待补充 |

## 我的理解

- 动作离散化会如何影响控制精度和跨 embodiment 泛化；
- 自回归动作生成与 diffusion / flow matching action head 的差异；
- 模型规模、推理延迟与机器人控制频率之间的权衡；
- 将 OpenVLA 用作 RL policy 时需要补齐哪些训练接口。

## 实践记录

!!! note "实现记录"
    - Checkpoint：待补充
    - Fine-tuning 方法：待补充
    - Batch Size：待补充
    - Learning Rate：待补充
    - GPU：待补充
    - 已知问题：待补充

## 常见问题

### 动作 token 如何还原为连续控制量？

待补充离散区间、反归一化和 clipping 逻辑。

### 如何迁移到新的机器人 embodiment？

待补充动作空间映射、数据格式和微调策略。

## 参考资料

1. **OpenVLA 论文**<br>
   作者、Venue 与年份待补充。<br>
   Paper · Project · Code 链接待补充。
