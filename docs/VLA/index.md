# VLA

Vision-Language-Action 模型相关笔记。

## 建议整理维度

| 维度 | 关注内容 |
|---|---|
| 输入 | 图像、语言、机器人状态 |
| Backbone | VLM / LLM / Vision Encoder |
| Action Head | 离散 token、diffusion、flow matching |
| Action Chunk | chunk 长度、执行策略、replan 频率 |
| 数据 | 机器人数据规模、跨 embodiment 数据 |
| 后训练 | SFT、RL、reward model、self-improvement |
| Benchmark | LIBERO、CALVIN、RoboCasa 等 |
