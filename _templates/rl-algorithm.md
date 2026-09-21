# 算法名称

<span class="page-subtitle">Reinforcement Learning · Policy Optimization</span>

<div class="tags">
  <span>RL</span>
  <span>Policy Gradient</span>
  <span>On-Policy</span>
</div>

一句话说明算法解决的问题。

---

## 算法概览

| 项目 | 内容 |
|---|---|
| 类型 | On-policy / Off-policy |
| Policy | Stochastic / Deterministic |
| Value Function | Yes / No |
| Model-free | Yes / No |
| 核心思想 | 待补充 |
| 代表论文 | 待补充 |

## 核心思想

解释算法的直觉。

!!! abstract "核心结论"
    用一句话概括算法为什么有效。

## 算法流程

1. 收集 trajectory；
2. 计算 reward 和 return；
3. 估计 advantage；
4. 更新 actor；
5. 更新 critic。

## 核心公式

策略目标为：

$$
L(\theta)=\ldots
$$

其中：

| 符号 | 含义 |
|---|---|
| $\theta$ | Policy 参数 |
| $A_t$ | Advantage estimate |
| $\gamma$ | Discount factor |

## 算法伪代码

```python
for iteration in range(num_iterations):
    rollout = collect_rollout(policy)
    advantage = compute_advantage(rollout)
    update_policy(policy, rollout, advantage)
```

## 关键超参数

| Parameter | Value | Description |
|---|---:|---|
| learning_rate | | 学习率 |
| gamma | | Discount factor |
| lambda | | GAE λ |
| clip_eps | | Clipping coefficient |

## 优点与限制

### 优点

- 待补充。

### 限制

- 待补充。

## VLA 中的应用

### Action Chunk

待补充。

### Reward

待补充 sparse reward、dense reward、reward model 和 process reward 的使用方式。

### Discount

待补充 action chunk 与 discount 时间尺度的对应关系。

## 实验排查

!!! warning "常见问题"
    - Reward 太稀疏；
    - Value 学不稳；
    - Rollout policy 与 old policy 不一致；
    - Discount 时间尺度错误。

## 实验记录

| Date | Model | Setting | Result | Notes |
|---|---|---|---:|---|
| | | | | |

## 与相关算法比较

| Dimension | 当前算法 | 对比算法 |
|---|---|---|
| On/Off Policy | | |
| Stability | | |
| Sample Efficiency | | |
| VLA Suitability | | |

## 参考资料

1. **论文标题**<br>
   Authors, Venue, Year.<br>
   [Paper](链接) · [Code](链接)
