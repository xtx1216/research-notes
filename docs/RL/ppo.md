# PPO

<span class="page-subtitle">
Proximal Policy Optimization · Policy Gradient · Clipped Objective
</span>

<div class="tags">
  <span>Reinforcement Learning</span>
  <span>Policy Gradient</span>
  <span>On-Policy</span>
</div>

PPO（**Proximal Policy Optimization**）和 TRPO 解决的是同一个核心问题：

> **策略要更新，但一次不能变化太大。**

TRPO 通过 KL Divergence 显式限制新旧策略的距离，而 PPO 把这个过程简化成了更容易优化的 **Clipping**。

---

## 1. 从 TRPO 到 PPO

TRPO 的基本形式是：

$$
\max_\theta
\quad
\mathbb{E}_t
\left[
r_t(\theta)\hat A_t
\right]
$$

同时要求：

$$
D_{\mathrm{KL}}
\left(
\pi_{\theta_{\mathrm{old}}}
\|
\pi_\theta
\right)
\leq \delta
$$

这个思路很好，但实际求解需要处理 KL 约束，优化过程比较复杂。

PPO 做了一件更简单的事：

> **不再显式求解 Trust Region，而是直接限制新旧策略的概率比。**

---

## 2. Probability Ratio

PPO 同样先定义：

$$
r_t(\theta)
=
\frac{\pi_\theta(a_t|s_t)}
{\pi_{\theta_{\mathrm{old}}}(a_t|s_t)}
$$

这个比例表示新策略相对于旧策略，对当前动作的偏好变化。

- $r_t=1$：新旧策略对这个动作的概率相同；
- $r_t>1$：新策略更喜欢这个动作；
- $r_t<1$：新策略更不喜欢这个动作。

例如：

$$
\pi_{\mathrm{old}}(a|s)=0.5,
\qquad
\pi_\theta(a|s)=0.6
$$

那么：

$$
r_t=1.2
$$

说明这个动作的概率提高了 20%。

---

## 3. Clipped Objective

PPO 最核心的公式是：

$$
L^{\mathrm{CLIP}}(\theta)
=
\mathbb{E}_t
\left[
\min
\left(
r_t(\theta)\hat A_t,
\operatorname{clip}
\left(
r_t(\theta),
1-\epsilon,
1+\epsilon
\right)\hat A_t
\right)
\right]
$$

看起来比较复杂，但重点只有两个：

1. 用 $r_t(\theta)$ 看新旧策略变化了多少；
2. 如果变化太大，就不再继续鼓励这种变化。

假设：

$$
\epsilon=0.2
$$

那么 clipping 区间就是：

$$
[0.8,1.2]
$$

---

## 4. Advantage 为正时发生什么

假设：

$$
\hat A_t>0
$$

说明当前动作比预期更好，我们希望提高它的概率。

如果：

$$
r_t=1.1
$$

说明概率只提高了 10%，可以继续优化。

但如果：

$$
r_t=1.5
$$

说明新策略已经明显提高了这个动作的概率。

此时 PPO 会把它截到：

$$
1+\epsilon=1.2
$$

也就是说：

> **这个动作确实是好的，但已经提高得够多了，不需要继续猛推。**

---

## 5. Advantage 为负时发生什么

如果：

$$
\hat A_t<0
$$

说明当前动作比预期差，希望降低它的概率。

但同样不能无限降低。

当 ratio 已经低于：

$$
1-\epsilon
$$

PPO 也会停止继续鼓励这种变化。

因此 clipping 对两种情况都有效：

- 好动作不能一次提高得太多；
- 坏动作也不能一次压得太狠。

---

## 6. 为什么还要取 min

公式中还有：

$$
\min(...)
$$

它的作用是选取更保守的那个目标。

也就是说：

> 如果策略已经变化得比较大，PPO 不允许仅仅因为原始目标还能继续增大，就继续把策略往同一方向推。

这就是 PPO 的“保守更新”。

---

## 7. 一个完整例子

假设某个动作：

$$
\hat A_t>0
$$

旧策略给它的概率是：

$$
0.5
$$

### 第一次更新

新策略概率变成：

$$
0.55
$$

那么：

$$
r_t=1.1
$$

还在 clipping 范围内，可以继续更新。

### 后面更新

新策略概率变成：

$$
0.75
$$

那么：

$$
r_t=1.5
$$

已经超过：

$$
1+\epsilon=1.2
$$

PPO 不再继续奖励这种过大的变化。

所以 PPO 不是不允许策略变化，而是：

> **变化到一定程度以后，就别再继续往同一个方向推。**

---

## 8. old policy 为什么保持不变

PPO 一般先用当前策略采集一批 rollout，然后在这批数据上训练多个 epoch。

例如：

```text
采集 rollout
      ↓
得到 old policy 的 log probability
      ↓
Epoch 1
Epoch 2
Epoch 3
Epoch 4
      ↓
重新采样
```

在这几个 epoch 中：

$$
\pi_{\theta_{\mathrm{old}}}
$$

始终是**采集这批数据时的策略**。

因此 ratio 始终是：

$$
\frac{\text{当前正在训练的策略}}
{\text{采样时的策略}}
$$

而不是：

$$
\frac{\text{当前策略}}
{\text{上一个 epoch 的策略}}
$$

这也是理解 PPO 代码里 `old_log_probs` 的关键。

---

## 9. PPO 训练流程

1. 用当前策略采集一批 rollout；
2. 保存动作以及对应的 old log probability；
3. 计算 Advantage；
4. 将 rollout 划分成 minibatch；
5. 计算新旧策略的 probability ratio；
6. 使用 clipped objective 更新策略；
7. 对同一批数据训练若干 epoch；
8. 丢弃这批 rollout，用更新后的策略重新采样。

---

## 10. TRPO 和 PPO 的区别

二者的目标基本一致：**限制策略单次更新过大**。

| | TRPO | PPO |
|---|---|---|
| 核心限制 | KL Divergence | Probability Ratio |
| 实现方式 | Trust Region 约束优化 | Clipping |
| 优化过程 | 较复杂 | 普通一阶梯度优化 |
| Line Search | 通常需要 | 不需要 |
| 常规 minibatch 训练 | 不方便 | 很方便 |

可以把它们的关系简单理解成：

```text
TRPO
用 KL 明确规定“不能走出信赖域”

        ↓

PPO
用 clipping 更简单地实现类似目的
```

PPO 的优势不在于提出了完全不同的目标，而在于：

> **保留了“限制策略更新”的核心思想，同时把优化过程大幅简化。**

---

## 11. PPO 最重要的理解

!!! abstract "PPO 核心"

    PPO 最重要的是理解三件事：

    1. $r_t(\theta)$ 衡量新旧策略对同一个动作的概率变化；
    2. Advantage 决定这个动作应该被鼓励还是抑制；
    3. Clipping 防止策略一次更新得太远。

    所以 PPO 的核心可以概括成：

    **好的动作可以提高概率，差的动作可以降低概率，但都不要一次改得太多。**

---

## 参考资料

1. **Proximal Policy Optimization Algorithms**  
   John Schulman, Filip Wolski, Prafulla Dhariwal, Alec Radford, Oleg Klimov, 2017.

2. **Trust Region Policy Optimization**  
   John Schulman et al., ICML, 2015.
