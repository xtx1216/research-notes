# PPO

<span class="page-subtitle">
Proximal Policy Optimization · Policy Gradient · Actor-Critic
</span>

<div class="tags">
  <span>Reinforcement Learning</span>
  <span>Policy Gradient</span>
  <span>Actor-Critic</span>
  <span>On-Policy</span>
</div>

PPO（**Proximal Policy Optimization**）延续了 TRPO 的基本思想：**策略需要持续改进，但一次更新不能让新策略偏离旧策略太远。**

TRPO 通过显式的 KL 约束构造 Trust Region，但实现中需要 Conjugate Gradient、Line Search 等步骤。PPO 的出发点是：

> **能不能保留“限制策略更新幅度”这个思想，同时把训练过程变成普通的一阶梯度优化？**

PPO 最经典的做法就是 **Clipped Objective**。

---

## 从 TRPO 到 PPO

TRPO 的优化形式是：

$$
\max_{\theta}
\quad
\mathbb{E}_t
\left[
r_t(\theta)\hat A_t
\right]
$$

同时要求：

$$
\mathbb{E}_s
\left[
D_{\mathrm{KL}}
\left(
\pi_{\theta_{\mathrm{old}}}
\|
\pi_\theta
\right)
\right]
\leq \delta
$$

其中：

$$
r_t(\theta)
=
\frac{
\pi_\theta(a_t|s_t)
}{
\pi_{\theta_{\mathrm{old}}}(a_t|s_t)
}
$$

PPO 不再显式求解这个带 KL 约束的优化问题，而是直接对 probability ratio 做限制。

这让整个更新过程可以使用普通的 minibatch、反向传播和 Adam 来完成。

---

## Clipped Objective

PPO 最常见的目标函数为：

$$
L^{\mathrm{CLIP}}(\theta)
=
\mathbb{E}_t
\left[
\min
\left(
r_t(\theta)\hat A_t,\,
\operatorname{clip}
\left(
r_t(\theta),
1-\epsilon,
1+\epsilon
\right)\hat A_t
\right)
\right]
$$

其中：

$$
r_t(\theta)
=
\frac{
\pi_\theta(a_t|s_t)
}{
\pi_{\theta_{\mathrm{old}}}(a_t|s_t)
}
$$

如果：

$$
r_t(\theta)=1
$$

说明新旧策略对当前动作给出的概率相同。

如果：

$$
r_t(\theta)>1
$$

说明新策略更倾向于这个动作。

如果：

$$
r_t(\theta)<1
$$

说明新策略降低了这个动作的概率。

PPO 通过：

$$
\operatorname{clip}
\left(
r_t(\theta),
1-\epsilon,
1+\epsilon
\right)
$$

避免这个比例偏离 1 太多。

例如 $\epsilon=0.2$ 时，常见的 clipping 区间就是：

$$
[0.8,1.2]
$$

---

## 为什么要取 min

Clipping 本身只是把 ratio 截到一定范围，但 PPO 还要取：

$$
\min(...)
$$

这样做的目的，是让目标函数选择更保守的那一项。

如果某个更新已经把策略推得太远，即使继续变化还能让原始 surrogate objective 看起来更大，PPO 也不会继续给予额外收益。

因此它的核心仍然是：

> **允许策略改进，但不给过度更新额外奖励。**

---

## 一个简单例子

假设某个动作的 Advantage 为正：

$$
\hat A_t>0
$$

说明这个动作比预期更好，希望提高它的概率。

如果：

```text
旧策略概率 = 0.50
新策略概率 = 0.55
```

那么：

$$
r_t=1.10
$$

变化不大。

如果：

```text
旧策略概率 = 0.50
新策略概率 = 0.80
```

那么：

$$
r_t=1.60
$$

当 $\epsilon=0.2$ 时，这个变化已经远远超过 clipping 范围，PPO 不会继续鼓励把这个动作概率推得更高。

---

## Actor-Critic

PPO 通常采用 Actor-Critic 结构。

| 模块 | 作用 |
|---|---|
| Actor | 输出动作策略 $\pi_\theta(a|s)$ |
| Critic | 估计状态价值 $V_\phi(s)$ |

Actor 决定动作，Critic 估计当前状态未来大概能获得多少回报。

Critic 的价值估计会进一步用于计算 Advantage。

---

## Advantage

Advantage 衡量当前动作相对于基准水平的好坏：

$$
A_t \approx R_t - V(s_t)
$$

其中：

- $R_t$：实际回报；
- $V(s_t)$：Critic 对当前状态的价值估计。

因此：

- $A_t>0$：当前动作比预期更好；
- $A_t<0$：当前动作比预期更差。

实际 PPO 中通常使用 GAE 来获得更稳定的 Advantage 估计。

---

## GAE

GAE（Generalized Advantage Estimation）首先定义 TD error：

$$
\delta_t
=
r_t+\gamma V(s_{t+1})-V(s_t)
$$

然后：

$$
\hat A_t
=
\delta_t
+
\gamma\lambda\delta_{t+1}
+
(\gamma\lambda)^2\delta_{t+2}
+\cdots
$$

初学阶段记住两个参数即可：

| 参数 | 含义 |
|---|---|
| $\gamma$ | 对未来奖励的重视程度 |
| $\lambda$ | Advantage 估计中 bias / variance 的折中 |

PPO 中经常看到 $\gamma=0.99$、$\lambda=0.95$，但它们并不是固定值。

---

## PPO Loss

实际训练时通常同时包含 Policy Loss、Value Loss 和 Entropy Bonus：

$$
L
=
L_{\mathrm{policy}}
+
c_vL_{\mathrm{value}}
-
c_eH(\pi)
$$

### Policy Loss

Policy Loss 就是前面的 clipped objective，主要负责更新 Actor。

它根据 Advantage 调整动作概率，同时通过 clipping 限制新旧策略变化过大。

### Value Loss

Critic 需要拟合实际回报，常见形式为：

$$
L_{\mathrm{value}}
=
\left(
V_\phi(s_t)-R_t
\right)^2
$$

Value Loss 长期很大，通常意味着 Critic 对回报的估计不够准确，这会进一步影响 Advantage。

### Entropy Bonus

Entropy 用于保留一定探索能力。

如果策略很快变得非常确定，可能过早收敛到局部解。因此训练中通常会给 entropy 一个小的奖励项。

---

## old policy 怎么理解

PPO 中：

$$
\pi_{\theta_{\mathrm{old}}}
$$

指的是采集当前 rollout 时使用的策略。

假设先用 old policy 采集了一批数据，然后在这批数据上训练 5 个 epoch。

这 5 个 epoch 中分母里的 old policy 都不变。

也就是说：

```text
Epoch 1
当前 policy / rollout policy

Epoch 2
当前 policy / rollout policy

Epoch 3
当前 policy / rollout policy
```

而不是：

```text
Epoch 2
当前 policy / Epoch 1 policy
```

等这一批数据训练结束后，再用更新后的策略重新采样下一批 rollout。

---

## 训练流程

PPO 的训练循环可以概括为：

1. 用当前策略采集一批 rollout；
2. 保存对应的 old log probability；
3. 根据 reward 计算 return；
4. 用 Critic 计算 value；
5. 计算 Advantage；
6. 将 rollout 划分成 minibatch；
7. 对同一批数据训练若干 epoch；
8. 使用 clipped objective 更新 Actor，同时更新 Critic；
9. 丢弃这批 rollout，用新策略重新采样。

因此 PPO 虽然会对同一批数据训练多个 epoch，但整体仍然属于 On-Policy 方法。

---

## TRPO 与 PPO

TRPO 和 PPO 解决的是同一个核心问题：

> **如何避免一次策略更新过大。**

区别主要在更新方式。

| | TRPO | PPO |
|---|---|---|
| 限制对象 | 新旧策略分布 | 新旧策略概率比 |
| 主要约束 | KL Divergence | Clipping |
| 优化形式 | 约束优化 | 普通一阶优化 |
| Conjugate Gradient | 需要 | 不需要 |
| Line Search | 通常需要 | 通常不需要 |
| Minibatch + Adam | 不自然 | 非常方便 |
| 实现复杂度 | 较高 | 较低 |

可以把二者的关系概括成：

```text
TRPO
显式构造 Trust Region
        ↓
理论上更直接

PPO
用 clipping 近似限制策略变化
        ↓
实现更简单
```

PPO 并不是“完全不同于 TRPO 的另一套方法”，而是沿用了 Trust Region 的核心思想，只是把优化过程做得更适合现代深度学习训练。

---

## 为什么 PPO 更常用

PPO 可以直接使用：

```text
minibatch
+
backpropagation
+
Adam
```

因此：

- 实现简单；
- 易于并行训练；
- 更容易放进现有深度学习代码；
- 适合大规模神经网络；
- 调参和排查更方便。

这也是 PPO 后来在机器人控制、RLHF 和 VLA 后训练中被大量采用的重要原因。

---

## 常用超参数

| 参数 | 作用 |
|---|---|
| `learning_rate` | 控制参数更新速度 |
| `gamma` | 控制长期奖励权重 |
| `gae_lambda` | 控制 Advantage 估计 |
| `clip_range` | 限制策略更新幅度 |
| `entropy_coef` | 控制探索强度 |
| `value_coef` | 控制 Value Loss 权重 |
| `num_epochs` | 每批 rollout 重复优化多少轮 |
| `batch_size` | 每次梯度更新使用多少样本 |

初学时优先关注：

```text
learning rate
clip range
gamma
gae lambda
reward scale
```

---

## 训练时看哪些指标

常见监控项：

| 指标 | 主要看什么 |
|---|---|
| Reward / Return | 策略是否真的在变好 |
| Value Loss | Critic 是否能拟合回报 |
| Entropy | 策略是否过早失去探索 |
| KL Divergence | 新旧策略是否变化过大 |
| Clip Fraction | 有多少样本触发 clipping |

其中 KL 虽然不再像 TRPO 那样作为硬约束，但仍然是观察 PPO 更新幅度的重要指标。

---

## PPO 用在 VLA 里

VLA 通常先经过预训练或 SFT，再用 PPO 做后训练：

```text
Pretrained / SFT VLA
        ↓
Environment Rollout
        ↓
Reward
        ↓
PPO Update
        ↓
Updated Policy
```

SFT 主要从示范数据中学习基本行为，PPO 则进一步利用真实环境反馈调整策略。

---

## Action Chunk

VLA 中很多模型一次不是只预测一个动作，而是预测一段动作：

$$
a_t,a_{t+1},\ldots,a_{t+k-1}
$$

这就是 Action Chunk。

此时需要先明确 PPO 的 timestep 定义：

- 一个底层 action 算一个 timestep；
- 或一个 action chunk 算一个 timestep。

如果使用：

```text
1 action chunk = 1 PPO timestep
```

那么 reward、discount、TD 和 GAE 最好也统一按 chunk-level 定义。

否则很容易出现时间尺度不一致的问题。

---

## Reward

PPO 本身不规定 reward 来自哪里。

VLA 后训练中常见的 reward 包括：

- Sparse task reward；
- Dense reward；
- Reward Model；
- Process Reward Model；
- Potential-Based Reward Shaping。

所以需要区分：

| 模块 | 作用 |
|---|---|
| Reward / Reward Model | 判断行为好不好 |
| PPO | 根据这个评价更新策略 |

Reward 设计不好，即使 PPO 本身实现完全正确，也可能学不到理想行为。

---

## VLA + PPO 常见问题

!!! warning "实验排查"
    - reward 太稀疏，rollout 中缺少有效学习信号；
    - Critic 学不稳，导致 Advantage 噪声很大；
    - rollout policy 与计算 ratio 时使用的 old policy 不一致；
    - action chunk 和 PPO timestep 定义不一致；
    - discount 仍按底层 action 设置，但训练实际按 chunk 更新；
    - reward scale 不合适；
    - PPO 更新过猛，破坏了 SFT 阶段已经学到的能力。

---

## 和 SFT、Reward Model 的关系

| 方法 | 主要作用 |
|---|---|
| SFT | 从示范数据学习基本行为 |
| Reward Model | 判断当前行为好不好 |
| PPO | 根据 reward 调整策略 |

整体可以理解为：

```text
SFT
↓
得到一个已经具备基本能力的 policy

Reward / Reward Model
↓
评价 rollout

PPO
↓
根据评价继续优化 policy
```

---

## 常见问题

!!! warning "容易混淆的地方"

    **1. PPO 的 clip 不是裁剪机器人动作**

    clip 的是新旧策略的 probability ratio。

    **2. old policy 不是上一小步梯度更新后的 policy**

    它是采集当前 rollout 时使用的策略。

    **3. PPO 会重复使用一批 rollout，但仍然属于 On-Policy**

    一批数据通常会训练若干 epoch，但不会像 Replay Buffer 那样长期复用旧数据。

    **4. PPO 不是 Reward Model**

    PPO 负责更新策略，Reward Model 负责提供评价信号。

    **5. PPO 的 clipping 不是严格的 Trust Region**

    它是更容易优化的一种近似限制方式。

---

## 需要记住的几点

!!! abstract "PPO 核心"
    - PPO 延续了 **限制策略更新幅度** 的思想；
    - 它使用 **Probability Ratio + Clipping** 代替显式的 KL 约束优化；
    - Actor 输出策略，Critic 估计 Value；
    - Advantage 决定当前动作应该被鼓励还是抑制；
    - old policy 是采集当前 rollout 时的策略；
    - 相比 TRPO，PPO 最大的优势是 **实现简单、易于 minibatch 和一阶优化**；
    - 在 VLA 中还要额外关注 **Reward、Action Chunk 和时间尺度**。

---

## 参考资料

1. **Proximal Policy Optimization Algorithms**  
   John Schulman, Filip Wolski, Prafulla Dhariwal, Alec Radford, Oleg Klimov, 2017.

2. **Trust Region Policy Optimization**  
   John Schulman, Sergey Levine, Philipp Moritz, Michael I. Jordan, Pieter Abbeel.  
   ICML, 2015.

3. **High-Dimensional Continuous Control Using Generalized Advantage Estimation**  
   John Schulman et al.  
   ICLR, 2016.
