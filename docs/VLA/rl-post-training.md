# VLA 的 RL 后训练

## 典型流程

```text
SFT Policy
   ↓
Rollout
   ↓
Reward / Critic / PRM
   ↓
PPO / GRPO / Other RL
   ↓
Updated Policy
```

## 当前关注

1. 稀疏环境奖励下的探索问题。
2. PRM / dense shaping 是否引入 reward hacking。
3. Action chunk 作为一个 PPO timestep 时，discount 应如何定义。
4. 抓取失败后策略仍继续执行后续轨迹的问题。
