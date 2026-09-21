# TRPO

<span class="page-subtitle">
Trust Region Policy Optimization · Policy Gradient · Trust Region
</span>

<div class="tags">
  <span>Reinforcement Learning</span>
  <span>Policy Gradient</span>
  <span>Actor-Critic</span>
  <span>On-Policy</span>
</div>

TRPO（**Trust Region Policy Optimization**）是一种经典的策略梯度算法。它关注的核心问题是：

> **策略需要更新，但一次不能改得太大。**

如果策略每次变化过于剧烈，前一轮采样得到的数据就很难继续准确反映新策略的表现，训练也容易出现性能突然下降。因此 TRPO 引入 **Trust Region（信赖域）**，把每次策略更新限制在一个相对可靠的范围内。

---

## 核心思路

普通 Policy Gradient 会沿着提高目标函数的方向更新参数：

$$
\theta
\leftarrow
\theta + \alpha \nabla_\theta J(\theta)
$$

但“参数只变化一点”并不一定意味着“策略分布只变化一点”。

对于神经网络策略，参数上的小变化也可能让动作概率发生明显改变。因此 TRPO 不直接限制参数距离，而是限制：

$$
\pi_{\theta_{\mathrm{old}}}(a|s)
\quad\text{和}\quad
\pi_{\theta}(a|s)
$$

之间的差异。

可以把 TRPO 的思路概括为：

```text
找到一个更好的更新方向
        ↓
限制策略不要变化过大
        ↓
在可信范围内完成更新
```

---

## 为什么叫 Trust Region

Trust Region 原本是数值优化中的概念。

它的基本思想是：

> 当前点附近的局部近似通常比较可信，但离当前点太远之后，这个近似就未必可靠。

放到强化学习中，当前 rollout 是由旧策略采集得到的：

$$
\pi_{\theta_{\mathrm{old}}}
$$

这些数据最能反映旧策略附近的情况。如果新策略一下跳得太远，旧数据对新策略的参考价值就会下降。

因此 TRPO 希望每次只在旧策略附近寻找一个更好的策略。

---

## Probability Ratio

TRPO 会比较新旧策略对同一个动作给出的概率：

$$
r_t(\theta)
=
\frac{
\pi_\theta(a_t|s_t)
}{
\pi_{\theta_{\mathrm{old}}}(a_t|s_t)
}
$$

其中：

- $\pi_{\theta_{\mathrm{old}}}$：采集当前 rollout 时使用的策略；
- $\pi_\theta$：正在优化的新策略；
- $\hat A_t$：当前动作的 Advantage。

基于这个比例，可以构造 surrogate objective：

$$
L(\theta)
=
\mathbb{E}_t
\left[
r_t(\theta)\hat A_t
\right]
$$

当 $\hat A_t>0$ 时，希望提高当前动作在新策略中的概率；当 $\hat A_t<0$ 时，希望降低它的概率。

---

## KL 约束

TRPO 最关键的一步，是用 KL Divergence 限制新旧策略之间的距离：

$$
\mathbb{E}_{s}
\left[
D_{\mathrm{KL}}
\left(
\pi_{\theta_{\mathrm{old}}}(\cdot|s)
\;\|\;
\pi_{\theta}(\cdot|s)
\right)
\right]
\leq
\delta
$$

这里的 $\delta$ 决定允许策略变化多大。

如果：

$$
D_{\mathrm{KL}} \approx 0
$$

说明新旧策略非常接近。

如果 KL 很大，则说明策略分布已经发生明显变化。

所以 TRPO 实际上在求解：

$$
\max_{\theta}
\quad
\mathbb{E}_t
\left[
\frac{
\pi_\theta(a_t|s_t)
}{
\pi_{\theta_{\mathrm{old}}}(a_t|s_t)
}
\hat A_t
\right]
$$

同时满足：

$$
\mathbb{E}_{s}
\left[
D_{\mathrm{KL}}
\left(
\pi_{\theta_{\mathrm{old}}}
\|
\pi_{\theta}
\right)
\right]
\leq \delta
$$

也就是：

> **在策略变化不能太大的前提下，让新的策略尽可能变好。**

---

## KL Divergence 怎么理解

可以把 KL Divergence 简单理解成两个策略分布之间的差异。

例如同一个状态下：

| Action | Old Policy | New Policy A | New Policy B |
|---|---:|---:|---:|
| Left | 0.50 | 0.48 | 0.10 |
| Right | 0.50 | 0.52 | 0.90 |

New Policy A 和旧策略非常接近，而 New Policy B 已经明显改变了行为偏好。

TRPO 要避免的就是后一种“单次更新过猛”的情况。

---

## Actor-Critic 与 Advantage

TRPO 通常也放在 Actor-Critic 框架下使用。

| 模块 | 作用 |
|---|---|
| Actor | 输出动作策略 $\pi_\theta(a|s)$ |
| Critic | 估计状态价值 $V_\phi(s)$ |

Critic 的作用之一，是帮助估计 Advantage：

$$
A_t \approx R_t - V(s_t)
$$

实际训练中通常会使用 GAE 来得到更稳定的 Advantage。

Advantage 的含义仍然是：

- $A_t>0$：当前动作比预期更好；
- $A_t<0$：当前动作比预期更差。

TRPO 主要解决的不是“Advantage 怎么算”，而是：

> **有了 Advantage 之后，Actor 应该怎么安全地更新。**

---

## TRPO 为什么实现比较复杂

TRPO 不是一个简单的：

```text
loss.backward()
optimizer.step()
```

因为它需要在优化目标的同时满足 KL 约束。

实际求解时通常会涉及：

- Fisher Information Matrix；
- Hessian-vector product；
- Conjugate Gradient；
- Line Search。

初学阶段不需要推导这些数学细节，只需要理解它们分别在做什么。

### Conjugate Gradient

用来近似求解一个合适的更新方向，而不是显式计算完整的大矩阵逆。

### Line Search

得到更新方向后，再尝试不同步长。

如果某一步：

- KL 超过限制；
- 或 surrogate objective 没有改善；

就缩小步长重新尝试。

因此 TRPO 的策略更新通常比较谨慎。

---

## old policy 是什么

这一点非常重要。

假设第 $k$ 轮开始时，用：

$$
\pi_{\theta_{\mathrm{old}}}
$$

采集了一批 rollout。

接下来所有基于这批 rollout 的策略优化，都以这个采样策略作为参考。

也就是说，分母里的：

$$
\pi_{\theta_{\mathrm{old}}}(a_t|s_t)
$$

在这一轮更新过程中保持不变。

它不是：

```text
每优化一步
→ 就把上一小步更新后的策略重新当成 old policy
```

而是：

```text
当前候选策略
────────────
采样时的策略
```

等这一批 rollout 用完，再用新的策略重新与环境交互，进入下一轮。

---

## 训练流程

TRPO 的整体流程可以写成：

1. 使用当前策略与环境交互，采集一批 rollout；
2. 计算 reward、return 和 Advantage；
3. 固定当前 rollout 对应的 old policy；
4. 构造 surrogate objective；
5. 根据 KL 约束求一个合适的更新方向；
6. 使用 Line Search 找到满足约束的步长；
7. 更新 Actor；
8. 更新 Critic；
9. 用新策略重新采样下一批 rollout。

从整体结构看，它仍然是一种 On-Policy 方法。

---

## 优点与局限

TRPO 的优点在于，它直接从策略分布角度限制每次更新幅度，因此训练通常比最基础的 Policy Gradient 更稳定。

它的主要缺点是实现复杂。为了满足 KL 约束，需要额外进行二阶近似、Conjugate Gradient 和 Line Search，这使得：

- 代码更复杂；
- 调试成本更高；
- 大模型上的计算开销更明显；
- 不容易直接套用普通深度学习优化器。

所以学习 TRPO 最重要的不是记住每个二阶优化细节，而是理解：

> **为什么策略更新需要一个“安全范围”。**

---

## 在 VLA 中怎么理解

如果把 TRPO 放到 VLA 后训练中，整体逻辑仍然是：

```text
Pretrained / SFT VLA
        ↓
Environment Rollout
        ↓
Reward
        ↓
Advantage
        ↓
Policy Update
```

对于大规模 VLA，真正值得保留的是 TRPO 的思想：

> **后训练不能只追求当前 batch 上的 reward 提升，还要控制 policy drift。**

如果一次更新把原本已经通过 SFT 学到的策略改得太远，很可能出现已有能力退化的问题。

---

## 常见问题

!!! warning "容易混淆的地方"

    **1. Trust Region 不是限制参数变化大小**

    它主要限制的是新旧 **策略分布** 之间的差异。

    **2. KL 小不代表策略一定更好**

    KL 只说明新旧策略接近，策略是否改善仍然取决于 reward 和 Advantage。

    **3. old policy 在一轮 rollout 更新中保持固定**

    它指的是采集当前这批数据时使用的策略。

    **4. TRPO 主要解决的是策略更新稳定性**

    它并不负责定义 reward，也不负责决定 Advantage 的具体估计方式。

---

## 需要记住的几点

!!! abstract "TRPO 核心"
    - TRPO 是一种 **On-Policy Policy Gradient** 方法；
    - 它引入 **Trust Region** 来限制策略更新幅度；
    - 新旧策略距离主要通过 **KL Divergence** 衡量；
    - 更新目标仍然依赖 **Probability Ratio + Advantage**；
    - `old policy` 是采集当前 rollout 时的策略；
    - 真正重要的思想是：**策略要改进，但不能一次走得太远。**

---

## 参考资料

1. **Trust Region Policy Optimization**  
   John Schulman, Sergey Levine, Philipp Moritz, Michael I. Jordan, Pieter Abbeel.  
   ICML, 2015.

2. **High-Dimensional Continuous Control Using Generalized Advantage Estimation**  
   John Schulman et al.  
   ICLR, 2016.
