# TRPO

<span class="page-subtitle">
Trust Region Policy Optimization · Policy Gradient · Trust Region
</span>

<div class="tags">
  <span>Reinforcement Learning</span>
  <span>Policy Gradient</span>
  <span>On-Policy</span>
</div>

TRPO（**Trust Region Policy Optimization**）要解决的问题很直接：

> **策略当然要更新，但一次不能改得太多。**

策略更新太小，学习很慢；更新太大，又可能把原本还不错的策略直接改坏。TRPO 的核心就是给每次更新划定一个“安全范围”。

---

## 1. 为什么需要限制策略更新

普通策略梯度会沿着能够提高期望回报的方向更新参数：

$$
\theta \leftarrow \theta + \alpha \nabla_\theta J(\theta)
$$

但这里有一个问题：

**参数变化小，不等于策略变化小。**

神经网络参数只改了一点，动作概率分布也可能发生明显变化。这样一来，原本基于旧策略采集的数据，就不再能很好地描述新策略。

TRPO 因此不直接限制参数变化，而是限制：

$$
\pi_{\theta_{\mathrm{old}}}
\quad\text{和}\quad
\pi_\theta
$$

这两个策略之间的距离。

---

## 2. 先让“好的动作”概率变大

假设当前数据由旧策略 $\pi_{\theta_{\mathrm{old}}}$ 采集。

对某个状态 $s_t$ 和动作 $a_t$，定义概率比：

$$
r_t(\theta)
=
\frac{\pi_\theta(a_t|s_t)}
{\pi_{\theta_{\mathrm{old}}}(a_t|s_t)}
$$

其中：

- $r_t(\theta)>1$：新策略更倾向于这个动作；
- $r_t(\theta)<1$：新策略降低了这个动作的概率。

再结合 Advantage：

$$
\hat A_t
$$

就可以判断这个动作应不应该被加强。

- $\hat A_t>0$：这个动作比预期好，希望提高它的概率；
- $\hat A_t<0$：这个动作比预期差，希望降低它的概率。

于是可以写出策略优化目标：

$$
L(\theta)
=
\mathbb{E}_t
\left[
r_t(\theta)\hat A_t
\right]
$$

如果只优化这个目标，策略可能一步走得太远，所以还需要第二部分：**Trust Region**。

---

## 3. Trust Region：限制新旧策略距离

TRPO 用 KL Divergence 衡量新旧策略之间的差异：

$$
D_{\mathrm{KL}}
\left(
\pi_{\theta_{\mathrm{old}}}
\|
\pi_\theta
\right)
$$

KL 越小，说明两个策略越接近；KL 越大，说明策略发生了更明显的变化。

TRPO 要求：

$$
\mathbb{E}_s
\left[
D_{\mathrm{KL}}
\left(
\pi_{\theta_{\mathrm{old}}}(\cdot|s)
\|
\pi_\theta(\cdot|s)
\right)
\right]
\leq \delta
$$

因此完整思想就是：

$$
\max_\theta
\quad
\mathbb{E}_t
\left[
r_t(\theta)\hat A_t
\right]
$$

同时满足：

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

也就是：

> **在新策略不能离旧策略太远的前提下，让策略尽可能变好。**

---

## 4. 为什么叫 Trust Region

“Trust Region”可以理解成一个可信区域。

旧策略附近的数据是当前真正采样得到的，因此在这个区域附近，我们对“往哪个方向更新会更好”比较有把握。

但如果一次跳得太远：

- 新策略和旧策略差别很大；
- 旧数据对新策略的参考价值下降；
- 原来的局部近似可能不再可靠。

所以 TRPO 的思路不是一次找到最终最优策略，而是：

**每次只迈一个相对可靠的小步。**

---

## 5. TRPO 实际怎么更新

TRPO 需要求解一个带 KL 约束的优化问题，不能直接简单地：

```text
loss.backward()
optimizer.step()
```

实际实现通常会用：

- Conjugate Gradient：近似求一个合适的更新方向；
- Line Search：不断尝试步长，确保 KL 没有超出限制。

不需要记住具体推导，只要理解：

> **方向要能提高策略，步长又必须满足 Trust Region。**

---

## 6. old policy 是谁

这里的：

$$
\pi_{\theta_{\mathrm{old}}}
$$

指的是**采集当前这批 rollout 时使用的策略**。

在这一批数据对应的策略更新过程中，它保持固定。

也就是说：

```text
先用 old policy 采样
        ↓
固定 old policy
        ↓
寻找一个满足 KL 约束的新 policy
        ↓
更新完成
        ↓
再用新 policy 重新采样
```

不是每优化一步，就把上一步的策略重新当成 old policy。

---

## 7. TRPO 训练流程

1. 用当前策略与环境交互，采集一批数据；
2. 计算每个动作的 Advantage；
3. 固定采样时的 old policy；
4. 构造 surrogate objective；
5. 用 KL Divergence 限制策略变化；
6. 求出合适的更新方向和步长；
7. 得到新的策略；
8. 用新策略重新采样。

---

## 8. TRPO 最重要的理解

!!! abstract "TRPO 核心"

    TRPO 解决的核心问题不是“怎样计算 Reward”，而是：

    **有了策略梯度之后，怎样避免一次更新把策略改得太远。**

    它的答案是：

    **用 KL Divergence 构造 Trust Region，只允许策略在可信范围内更新。**

---

## 参考资料

1. **Trust Region Policy Optimization**  
   John Schulman, Sergey Levine, Philipp Moritz, Michael I. Jordan, Pieter Abbeel.  
   ICML, 2015.
