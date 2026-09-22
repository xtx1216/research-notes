# iRe-VLA：Improving Vision-Language-Action Model with Online Reinforcement Learning

## 1. 这篇论文在解决什么问题

现有 VLA 通常先使用机器人专家数据进行监督微调：

$$
\text{Pretrained VLM}
\xrightarrow{\text{Robot SFT}}
\text{VLA}
$$

问题是，SFT 很依赖高质量专家数据，而且部署以后，机器人实际遇到的状态分布可能和 demonstration 中不同。因此作者希望让已经训练好的 VLA 继续通过**与环境在线交互**来提升。

最直接的想法就是：

$$
\text{SFT VLA}\rightarrow\text{Online RL}
$$

但作者发现，直接对整个大规模 VLA 做强化学习存在两个明显问题：

**训练不稳定**：RL 的梯度可能破坏已经学好的 VLM 表征，甚至使性能下降。

**计算成本高**：VLM 有数十亿参数，真实机器人在线 RL 时很难一直端到端训练整个模型。

所以论文真正研究的问题是：

> **如何在保留 VLA 原有能力的同时，用在线 RL 安全、低成本地继续提升它？**

---

## 2. 核心思想

这篇论文最重要的思想可以概括成：

$$
\boxed{\text{RL负责探索，SFT负责吸收}}
$$

作者没有让 RL 一直更新整个 VLA，而是把训练拆成两个阶段：

$$
\text{RL Stage}
\rightarrow
\text{Successful Trajectories}
\rightarrow
\text{SFT Stage}
$$

然后不断循环。

整体流程：

```text
专家机器人数据
      ↓
Stage 0：SFT
      ↓
初始 VLA
      ↓
Stage 1：Online RL
冻结 VLM，只训练 Action Head
      ↓
收集成功轨迹
      ↓
Stage 2：Supervised Learning
Expert Data + RL Success Data
训练 VLM + Action Head
      ↓
更新后的 VLA
      ↓
进入下一个任务继续 RL
```

论文将这种方法称为：

**iRe-VLA：Iterative Reinforcement Learning for VLA。** 

---

## 3. VLA 模型结构

模型输入：

$$
(o,l)
$$

其中：

* \(o\)：视觉 observation；
* \(l\)：自然语言 instruction。

输出：

$$
a
$$

即低层机器人动作。

整体模型为：

$$
\text{Image + Language}
\rightarrow
\text{VLM}
\rightarrow
\text{Token Learner}
\rightarrow
\text{MLP Action Head}
\rightarrow
a
$$

作者使用 **BLIP-2 3B** 作为 VLM backbone。VLM 最后的 hidden representation 为：

$$
h\in \mathbb{R}^{m\times d}
$$

Token Learner 将多个 token 压缩成：

$$
h'\in\mathbb{R}^{d}
$$

之后 MLP 输出：

$$
a\in\mathbb{R}^{d_a}
$$

动作主要对应：

* 末端执行器姿态变化；
* gripper 状态。

为了减少大模型微调成本，VLM 部分采用 **LoRA**，因此主要可训练参数可以记成：

$$
\theta=\text{VLM LoRA parameters}
$$

$$
\phi=\text{Action Head parameters}
$$



---

## 4. Stage 0：专家数据监督学习

首先使用专家机器人数据：

$$
D_e=\{(o_i,l_i,a_i)\}
$$

训练初始 VLA。

目标函数就是行为克隆中的 MSE：

$$
J^0(\theta,\phi)
=
\mathbb E_{(o,l,a)\sim D_e}
\left[
\|\pi_{\theta,\phi}(o,l)-a\|_2^2
\right]
$$

得到：

$$
\pi^0_{\theta,\phi}
$$

这个 SFT policy 非常重要，因为后面的 RL **不是从随机策略开始学**，而是在已经具有机器人操作能力的 VLA 上继续优化。

---

## 5. Stage 1：冻结 VLM 做 Online RL

这是论文最核心的设计。

进入 RL 后：

$$
\boxed{\theta\text{ frozen}}
$$

只训练：

$$
\boxed{\phi}
$$

也就是：

```text
Image + Language
       ↓
      VLM
   （冻结）
       ↓
    Feature
       ↓
 Action Head
   （RL训练）
       ↓
     Action
```

同时增加一个 **Critic Head**，结构与 Action Head 类似，但是最终输出维度为 1，用来估计 value。

RL 的目标写成：

$$
J^1(\phi)
=
\mathbb E_{\tau\sim p_\phi}
\left[
\sum_t\gamma^tR(o_t,a_t)
\right]
$$

这里最重要的是：

$$
J^1(\phi)
$$

而不是：

$$
J^1(\theta,\phi)
$$

也就是说 RL gradient 不进入 VLM。

---

## 6. 为什么 RL 阶段一定要冻结 VLM

作者观察到：

如果直接让 RL 更新整个 VLA，训练很容易不稳定。

原因可以理解成：

VLM 原本已经学习到了很好的视觉—语言表示：

$$
z=f_\theta(o,l)
$$

而在线 RL 的梯度具有：

* reward sparse；
* gradient variance 较大；
* 数据分布不断变化；
* critic estimate 存在噪声。

如果直接使用：

$$
\nabla_\theta J_{RL}
$$

去更新大 VLM，可能把原来的 representation 破坏掉。

最终出现：

> 不仅新任务没学好，原来的任务也退化。

作者在实验中把 PPO-Replay 的性能下降主要归因于 noisy RL gradients 对 pretrained representation 的破坏。

所以 Stage 1 实际上是在做：

$$
z_t=f_{\theta_{\text{SFT}}}(o_t,l)
$$

固定 \(z_t\) 的表示空间，只优化：

$$
a_t=g_\phi(z_t)
$$

优化空间更小，也更稳定。

---

## 7. RL 阶段真正负责什么

Stage 1 最重要的任务其实不是“彻底把模型训练好”。

而是：

$$
\boxed{\text{探索新的成功轨迹}}
$$

当机器人通过 RL 成功完成任务以后，把轨迹：

$$
\tau_i=
(o_0,a_0,o_1,a_1,\dots,o_T,a_T)
$$

加入：

$$
D_{RL}
$$

即：

$$
D_{RL}\leftarrow D_{RL}\cup\tau_i
$$

因此可以把 Stage 1 理解成：

> **Discovery / Exploration。**

---

## 8. Stage 2：把 RL 成功经验重新写回 VLA

有了成功轨迹以后，作者重新进行 supervised learning。

训练数据变成：

$$
D_e\cup D_{RL}
$$

目标为：

$$
J^2(\theta,\phi)
=
\mathbb E_{(o,l,a)\sim D_e\cup D_{RL}}
\left[
\|\pi_{\theta,\phi}(o,l)-a\|_2^2
\right]
$$

这一次：

$$
\boxed{\theta,\phi\text{ 都训练}}
$$

也就是说，RL 找到的新行为最终不是靠 RL gradient 写入 VLM，而是通过更加稳定的 supervised gradient 写进去。

因此：

$$
\boxed{
\text{High-variance RL gradient}
\not\rightarrow
VLM
}
$$

而是：

$$
\boxed{
\text{Successful RL Data}
\rightarrow
\text{Supervised Gradient}
\rightarrow
VLM
}
$$

这是理解 iRe-VLA 最关键的一点。

---

## 9. 为什么 Stage 2 还要加入原来的 Expert Data

如果只训练：

$$
D_{RL}
$$

模型很容易：

> 学会新任务，但忘掉旧任务。

也就是 **catastrophic forgetting**。

因此作者始终保留：

$$
D_e
$$

并使用：

$$
D_e+D_{RL}
$$

共同训练。

可以理解成一种 rehearsal：

```text
旧的专家技能
      +
新探索出的成功技能
      ↓
重新 SFT
```

这样既吸收新经验，也尽量保持旧能力。

---

## 10. 为什么不能一直冻结 VLM

一个很自然的问题是：

> 既然冻结 VLM 做 RL 更稳定，那为什么不永远冻结？

论文专门做了：

**iRe-VLA-freeze**

即两个阶段都冻结 VLM。

结果性能明显低于完整 iRe-VLA，尤其是 RL Tasks 和 Unseen Tasks。

原因是：

Action Head 的表达能力有限。

如果：

$$
f_\theta(o,l)
$$

永远不更新，那么新的机器人 interaction 数据无法改变 VLM 内部的视觉语言 representation。

所以论文真正的结论不是：

> “VLM 不应该训练。”

而是：

$$
\boxed{\text{VLM应该在稳定的监督学习阶段训练，而不是直接接受RL梯度}}
$$



---

## 11. 任务设置

实验用了三个环境：

| 环境             | Expert Tasks | RL Tasks | Unseen Tasks |
| -------------- | -----------: | -------: | -----------: |
| MetaWorld      |           25 |        5 |           10 |
| Franka Kitchen |            5 |        2 |            1 |
| Real Panda     |           10 |        2 |            8 |

三种任务的意义不同：

**Expert Tasks**：初始 demonstration 中出现过。

**RL Tasks**：SFT 没见过，但是后续用 RL 训练。

**Unseen Tasks**：SFT 没见过，RL 也不训练，只用于最后测试 generalization。

因此真正能够体现泛化能力的是：

$$
\boxed{\text{Unseen Tasks}}
$$



---

## 12. 为什么不用直接 PPO

作者首先做了一个很重要的对比：

* Learn from Scratch
* Full VLM RL
* Freeze VLM RL

Figure 4 表明：

SFT 初始化明显比从零开始 RL 更容易学习。

同时，直接 fine-tune 整个 VLA 的 RL 在 5 个 MetaWorld sparse-reward task 中有 4 个出现了明显的 performance drop。

而冻结 VLM 后，训练明显更稳定。

这其实就是整篇论文方法设计最直接的实验依据。

---

## 13. MetaWorld 主要结果

Table I：

| 方法         | Original 25 |   Button |   Drawer |     Door | Window Open | Window Close |   Unseen |
| ---------- | ----------: | -------: | -------: | -------: | ----------: | -----------: | -------: |
| SFT        |        0.83 |     0.56 |     0.48 |     0.40 |        0.32 |         0.28 |     0.51 |
| PPO-Replay |        0.69 |     0.80 |     0.24 |     0.32 |        0.04 |         0.36 |     0.39 |
| iRe-VLA    |    **0.83** | **1.00** | **0.84** | **0.84** |    **0.80** |     **0.96** | **0.80** |



这里最值得关注三个现象。

### 原任务没有被明显遗忘

SFT：

$$
0.83
$$

iRe-VLA：

$$
0.83
$$

而 PPO-Replay 降到：

$$
0.69
$$

说明 iRe-VLA 更好地避免了 catastrophic forgetting。

### RL Tasks 明显提升

例如 Window-Close：

$$
0.28
\rightarrow
0.96
$$

说明 online interaction 确实能够补充原专家数据的不足。

### Unseen Tasks 也提升

$$
0.51
\rightarrow
0.80
$$

这比单纯“RL 任务成功率变高”更值得注意，因为这些任务并没有直接进行 RL training。

作者据此认为，Stage 2 中 online data 对 VLM representation 的更新提高了泛化能力。

---

## 14. Franka Kitchen 结果

其中比较典型的是：

$$
\text{Left-door-open}
$$

SFT：

$$
0.43
$$

PPO-Replay：

$$
0.12
$$

iRe-VLA：

$$
0.83
$$

以及：

$$
\text{Slide-door-open-red}
$$

从：

$$
0.46
\rightarrow0.99
$$

整体结果仍然说明：

> 直接 PPO 容易破坏模型原本能力，而 iRe-VLA 能在学习新任务的同时较好地保留旧能力。

---

## 15. 真机实验

真实机器人使用：

**Franka Panda。**

初始 VLA 使用：

$$
2000
$$

条 demonstration 训练。

expert task 包含：

* pick/grasp
* place
* button press
* cable route
* drawer operation



真机部分和模拟环境有一个重要区别：

模拟环境主要使用 PPO，

真机为了提高 sample efficiency，采用：

**SACfD。**

---

## 16. 真机 RL 的几个工程技巧

首先，新任务并不是完全从零开始。

作者先通过 zero-shot VLA 收集：

$$
20
$$

条 successful trajectories。

形成 demonstration buffer。

RL 训练时：

$$
50\%
$$

数据来自 demonstration buffer，

另外：

$$
50\%
$$

来自 online buffer。

另外还有一个很实用的技巧：

每张 image observation 只通过 VLM **一次**：

$$
I_t
\rightarrow
z_t
$$

然后直接把：

$$
z_t
$$

存入 replay buffer。

后面的 SACfD 直接在 latent space 上训练，而不是每次 replay 都重新跑一次 3B VLM。

这大幅降低了 real-world RL 的计算成本。

---

## 17. 真机结果

专家 demonstration 主要使用规则彩色 block。

RL task 则扩展到了：

* eggplant
* carrot

这种不规则物体。

结果：

| Task         |  SFT | iRe-VLA |
| ------------ | ---: | ------: |
| Expert Tasks | 0.73 |    0.74 |
| RL Tasks     | 0.35 |    0.80 |
| Unseen Tasks | 0.37 |    0.61 |



说明：

原技能基本保持；

新 RL task 明显提升；

同时对新的 unseen object 也有一定迁移。

---

## 18. 这篇论文真正的创新点

它并没有提出新的：

* PPO objective；
* critic；
* advantage estimator；
* reward function；
* VLM architecture。

真正的创新主要是：

$$
\boxed{\text{把RL探索和大模型表征学习解耦}}
$$

传统端到端 RL：

$$
\theta,\phi
\leftarrow
\theta,\phi+\alpha\nabla J_{RL}
$$

iRe-VLA：

### RL 阶段

$$
\phi
\leftarrow
\phi+\alpha\nabla_\phi J_{RL}
$$

### SFT 阶段

$$
\theta,\phi
\leftarrow
\theta,\phi-\beta\nabla L_{SFT}
$$

因此，大模型 backbone 主要接受的是：

$$
\text{稳定的监督梯度}
$$

而不是：

$$
\text{高方差RL梯度}
$$

---

## 19. 我认为这篇论文最值得记住的地方

整篇文章真正值得带走的不是：

> “VLA 可以用 PPO。”

而是：

$$
\boxed{
\text{大模型不一定适合直接持续接受online RL gradient}
}
$$

更合理的思路可能是：

$$
\text{RL Exploration}
\rightarrow
\text{Reliable Experience}
\rightarrow
\text{Supervised Consolidation}
$$

也就是：

**小模块负责探索，大模型负责吸收。**

这个思路具有很强的通用性。

---

## 20. 局限

论文自己明确承认：

> iRe-VLA 主要能够提升已经见过的 skill type，很难在 sparse reward 条件下学习完全新的 skill。

例如：

原来会：

$$
\text{grasp block}
$$

那么可能继续学：

$$
\text{grasp eggplant}
$$

但是如果完全没学过：

$$
\text{tie knot}
$$

单纯依靠：

$$
R=
\begin{cases}
1,&success\\
0,&failure
\end{cases}
$$

很难通过 sparse RL 自己发现完整的新技能。

另外还有一个值得注意的问题：

iRe-VLA 把**整条成功轨迹**加入 SFT 数据。

但：

$$
\text{trajectory success}
$$

并不意味着：

$$
\text{every action is good}
$$

一条轨迹可能经历：

```text
错误动作
→ 偏离
→ 修正
→ 最终成功
```

最终 reward 仍然是 1。

因此论文并没有解决：

> **轨迹中哪些中间状态和动作是真正高质量的？**

---

## 21. 和 Process Reward / PRM 的关系

iRe-VLA 主要解决：

$$
\boxed{\text{如何稳定地进行VLA online RL}}
$$

它没有重点解决：

$$
\boxed{\text{如何给长程任务提供更好的学习信号}}
$$

它使用的主要还是：

$$
R_{\text{env}}
$$

尤其是 sparse binary success reward。

因此它缺少类似：

$$
\Phi(s)
$$

这样的状态进度评价。

例如机器人已经：

```text
接近物体
→ 对准
→ 抓住
→ 运输
```

但最终 place 失败，

环境可能仍然只给：

$$
R=0
$$

那么前面的有效 progress 没有得到充分利用。

所以从研究延伸来看，一个很自然的方向就是：

$$
\boxed{
\text{iRe-VLA稳定训练}
+
\text{Process Reward / Reward Shaping}
}
$$

也就是一个解决：

**“怎么稳定学”**

另一个解决：

**“用什么信号学”。**

---

## 22. 一句话记忆

以后再看到这篇论文，只需要想到：

> **iRe-VLA 不让 noisy RL gradient 直接更新大 VLM，而是让 RL 冻结 VLM、只训练 Action Head 来探索成功轨迹，再通过 SFT 将这些成功经验稳定地写回整个 VLA。**

或者更短：

$$
\boxed{\text{RL探索，SFT吸收}}
$$

这基本就是整篇论文的灵魂。
