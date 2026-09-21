# VLA

<span class="page-subtitle">Vision-Language-Action Models · Robotics · Embodied AI</span>

Vision-Language-Action 模型相关笔记。

<div class="grid cards" markdown>

-   :material-robot-outline:{ .lg .middle } **模型笔记**

    ---

    整理 VLA 基础模型的架构、训练数据、动作表示与评测结果。

    [OpenVLA](openvla.md) · [π0](../Paper-Notes/vla_base/pi0.md) · [π0.5](../Paper-Notes/vla_base/pi05.md)

-   :material-chart-timeline-variant:{ .lg .middle } **RL 后训练**

    ---

    关注稀疏奖励、过程奖励、action chunk 与策略优化。

    [进入 RL 后训练笔记](rl-post-training.md)

-   :material-flask-outline:{ .lg .middle } **机器人 Benchmark**

    ---

    对比 LIBERO、CALVIN、ManiSkill 等环境的任务与评测协议。

    [查看 Benchmark 概览](../Benchmarks/index.md)

</div>

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
