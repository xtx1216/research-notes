# 模型名称

<span class="page-subtitle">Vision-Language-Action · Architecture · Action Generation</span>

<div class="tags">
  <span>VLA</span>
  <span>Robot Foundation Model</span>
  <span>Action Policy</span>
</div>

一句话说明模型解决的问题和最重要的特点。

---

## 模型概览

| 项目 | 内容 |
|---|---|
| 模型 | 待补充 |
| 发布机构 | 待补充 |
| 年份 | 待补充 |
| 参数量 | 待补充 |
| Vision Encoder | 待补充 |
| Language Backbone | 待补充 |
| Action Head | 待补充 |
| Action Chunk | 待补充 |
| 训练数据 | 待补充 |
| 开源情况 | 待补充 |

## 核心思想

说明模型要解决的问题、相对已有方法的变化、核心创新及设计原因。

!!! abstract "核心结论"
    用一句话概括模型最重要的思想。

## 模型架构

<!--
<figure markdown="span">
  ![模型架构](../assets/images/vla/model/architecture.png){ width="85%" }
  <figcaption>图 1. 模型整体架构</figcaption>
</figure>
-->

### 输入

| 输入 | 形式 |
|---|---|
| 图像 | RGB / 多视角 |
| 语言 | Instruction |
| Robot State | Proprioception |

### Backbone

待补充。

### Action Head

待补充动作生成方式，例如离散 token、diffusion、flow matching 或 autoregressive。

## Action Representation

| 维度 | 含义 |
|---|---|
| 0–2 | Position |
| 3–5 | Rotation |
| 6 | Gripper |

## Action Chunking

| 项目 | 设置 |
|---|---|
| Chunk Length | 待补充 |
| Execution Length | 待补充 |
| Replan Frequency | 待补充 |

## 训练方法

### Pre-training

待补充。

### Fine-tuning

待补充。

### RL / Post-training

待补充。

## 数据

| 数据集 | Embodiment | 数据规模 | 用途 |
|---|---|---:|---|
| 待补充 | | | |

## Benchmark 与结果

| Model | Backbone | Data | Benchmark | Result |
|---|---|---|---|---:|
| 待补充 | | | | |

## 与相关模型比较

| Dimension | 当前模型 | 对比模型 |
|---|---|---|
| Backbone | | |
| Action Head | | |
| Action Chunk | | |
| Training | | |

## 我的理解

- 为什么这样设计；
- 有哪些优点与限制；
- 对当前研究有什么启发。

## 实践记录

!!! note "实现记录"
    - Checkpoint：
    - Batch Size：
    - Learning Rate：
    - GPU：
    - 已知问题：

## 常见问题

### Q1. 待补充

回答。

## 参考资料

1. **论文标题**<br>
   Authors, Venue, Year.<br>
   [Paper](链接) · [Project](链接) · [Code](链接)
