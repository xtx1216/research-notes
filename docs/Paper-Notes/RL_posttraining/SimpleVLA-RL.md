# SimpleVLA-RL：Scaling VLA Training via Reinforcement Learning

> Haozhan Li et al.  
> Technical Report，arXiv:2509.09674（2025）

## 1. 这篇论文在解决什么问题

当前 VLA 的主流训练范式通常是：

```text
大规模多模态 / 机器人数据预训练
              ↓
      高质量机器人轨迹 SFT
              ↓
             VLA
```

这种路线已经取得很强的效果，但继续扩大 SFT 会遇到两个核心瓶颈：

- **机器人示范数据昂贵且稀缺**：真实轨迹需要机器人、场景、物体和人工遥操作，难以像文本数据一样大规模扩展；
- **SFT 泛化能力有限**：模型容易贴着示范分布学习，在新物体、新空间关系、新任务组合和长时程任务上性能下降。

SimpleVLA-RL 想回答的问题是：

> **VLA 能不能像大语言模型一样，在 SFT 之后继续通过在线强化学习，从环境试错中提升能力，而不是一直依赖更多人工示范？**

整篇论文最核心的训练路线是：

\[
\boxed{
\text{Pretraining}
\rightarrow
\text{SFT}
\rightarrow
\text{Online RL}
}
\]

---

## 2. 一句话理解 SimpleVLA-RL

SimpleVLA-RL 可以概括为：

\[
\boxed{
\text{VLA Interactive Rollout}
+
\text{Binary Outcome Reward}
+
\text{GRPO}
+
\text{Exploration Enhancement}
}
\]

也就是：

```text
先用 SFT 让机器人“基本会做”
              ↓
在模拟环境中不断 Rollout
              ↓
       成功 = 1，失败 = 0
              ↓
比较同一组轨迹谁成功、谁失败
              ↓
            GRPO
              ↓
强化成功行为，削弱失败行为
```

它不是用 RL 从零训练机器人，而是把 RL 作为 **VLA 的后训练（post-training）阶段**。

---

## 3. 为什么作者会想到把 LLM 的 RL 搬到 VLA

论文的直接灵感来自 DeepSeek-R1 一类大推理模型。

LLM 中可以通过：

```text
Prompt
  ↓
生成多个回答
  ↓
根据最终答案是否正确给 Reward
  ↓
RL
  ↓
提升推理能力
```

作者提出一个对应关系：

| LLM                  | VLA                                |
| -------------------- | ---------------------------------- |
| Prompt               | Language instruction + observation |
| Token                | Robot action token                 |
| Token sequence       | Robot trajectory                   |
| Final answer         | Task execution result              |
| Correct / Wrong      | Success / Failure                  |
| Reasoning trajectory | Manipulation trajectory            |

因此作者的问题可以写成：

\[
\boxed{
\text{RL 能否像提升 LLM 的 step-by-step reasoning 一样，
提升 VLA 的 step-by-step acting？}
}
\]

---

## 4. LLM Rollout 和 VLA Rollout 的根本区别

LLM rollout 基本是：

```text
Prompt
 ↓
Token
 ↓
Token
 ↓
Token
 ↓
Answer
```

生成过程中不需要真正改变外部世界。

但机器人必须闭环交互：

```text
当前 Observation
       ↓
      VLA
       ↓
 Action / Action Chunk
       ↓
 Environment.step()
       ↓
环境和机器人状态发生变化
       ↓
  新 Observation
       ↓
      VLA
       ↓
继续生成动作
```

所以 VLA 的 RL rollout 是：

> **Interactive Rollout**

而不是一次 `generate()` 就结束。

这也是 SimpleVLA-RL 需要专门改造 veRL 的主要原因。

---

## 5. VLA 的状态和动作

论文将 VLA 状态写成：

\[
s_t=
(o_t^{vis},o_t^{prop},l^{task})
\]

其中包括：

- \(o_t^{vis}\)：RGB、Depth、Point Cloud 等视觉信息；
- \(o_t^{prop}\)：关节角、末端执行器位姿等 proprioception；
- \(l^{task}\)：语言任务指令。

机器人动作一般是：

\[
a_t\in\mathbb R^d
\]

例如 7 维动作：

\[
[\Delta x,\Delta y,\Delta z,
\Delta r_x,\Delta r_y,\Delta r_z,
g]
\]

实际执行时，VLA 通常一次产生一个 action chunk：

\[
(a_t,a_{t+1},\dots,a_{t+k-1})
\]

执行一段后重新观察环境，再生成下一段动作。

---

## 6. 为什么论文选择 Action Token VLA

PPO / GRPO 需要计算：

\[
\pi_\theta(a_t\mid s_t)
\]

以及 importance ratio：

\[
r_t(\theta)
=
\frac{\pi_\theta(a_t\mid s_t)}
{\pi_{\theta_{\text{old}}}(a_t\mid s_t)}
\]

因此策略最好天然能够给出：

> **某个动作的概率。**

Action-token VLA 正好满足这一点：

```text
Observation
    ↓
Transformer
    ↓
Action Token Distribution
    ↓
随机采样 Action Token
```

而纯 MLP deterministic regression：

```text
Observation → Continuous Action
```

通常没有天然的 \(\log \pi(a\mid s)\)。

因此论文认为：

> **Token-based VLA 与 PPO / GRPO 一类 policy-gradient RL 更天然兼容。**

---

## 7. GRPO 是整篇方法的 RL 核心

SimpleVLA-RL 使用 **Group Relative Policy Optimization（GRPO）**。

它和 PPO 最大的区别之一是：

> **不需要单独训练 Critic / Value Network。**

对于同一个初始状态，旧策略采样 \(G\) 条 trajectory：

\[
\tau_1,\tau_2,\dots,\tau_G
\]

每条 trajectory 得到一个总 reward：

\[
R_1,R_2,\dots,R_G
\]

然后使用组内相对 reward 构造 advantage：

\[
\hat A_i
=
\frac{
R_i-\operatorname{mean}(R)
}{
\operatorname{std}(R)
}
\]

简单理解：

```text
同一个任务采 8 次

τ1  success  1
τ2  failure  0
τ3  failure  0
τ4  success  1
τ5  failure  0
τ6  success  1
τ7  failure  0
τ8  failure  0
```

那么：

- 成功轨迹的 advantage 为正；
- 失败轨迹的 advantage 为负。

训练结果就是：

```text
成功轨迹中的动作概率 ↑
失败轨迹中的动作概率 ↓
```

---

## 8. SimpleVLA-RL 的完整训练流程

论文 Figure 2 可以概括为：

```text
                SFT Policy
                    │
                    ▼
          ┌─────────────────┐
          │ Parallel Envs   │
          │ Env1 ... EnvN   │
          └────────┬────────┘
                   │
          Interactive Rollout
                   │
                   ▼
        τ1  τ2  τ3 ... τG
                   │
                   ▼
        Success / Failure
           1 / 0 Reward
                   │
                   ▼
        Group Advantage
                   │
                   ▼
                GRPO
                   │
                   ▼
             Updated Policy
                   │
                   └────→ 下一轮 Rollout
```

和 SFT 最大的区别是：

> SFT 的训练轨迹来自人类示范，而 SimpleVLA-RL 的训练轨迹主要由当前 policy 自己在环境中产生。

---

## 9. Outcome Reward：奖励函数极其简单

SimpleVLA-RL 不使用复杂的人工 dense reward。

整条 trajectory 最后：

\[
R=
\begin{cases}
1,&\text{task success}\\
0,&\text{task failure}
\end{cases}
\]

也就是说它不关心：

- 离目标还有多远；
- 是否已经抓住；
- 是否已经抬起；
- 是否完成 transport；
- 中间动作是否漂亮。

只判断：

> **最终任务有没有完成。**

trajectory-level reward 会传播给这一轨迹中的 action token，用于 GRPO 更新。

---

## 10. 为什么这么稀疏的 Reward 还能学

关键原因是：

\[
\boxed{\text{它不是从随机策略开始 RL}}
\]

实际路线是：

```text
Pretrained VLA
     ↓
    SFT
     ↓
获得一定非零成功率
     ↓
Online RL
```

只要 rollout 中能够同时出现：

```text
success
failure
success
failure
```

GRPO 就能比较不同轨迹。

如果策略完全不会任务：

```text
0 0 0 0 0 0 0 0
```

那么所有 trajectory reward 相同，几乎没有有效的相对学习信号。

因此 SimpleVLA-RL 更准确的定位是：

\[
\boxed{\text{RL for VLA Post-training}}
\]

而不是：

\[
\text{RL from Scratch}
\]

---

## 11. Exploration 是论文最重要的算法设计

作者发现，VLA RL 中真正的核心问题之一不是 reward，而是：

> **如何让 policy 持续产生有差异、有价值的轨迹。**

因此论文加入三个 exploration enhancement：

1. **Dynamic Sampling**
2. **Clip-Higher**
3. **Higher Rollout Temperature**

三者实际上形成一个完整链条：

```text
Higher Temperature
       ↓
产生更多不同轨迹
       ↓
Dynamic Sampling
       ↓
保证同组中同时有成功和失败
       ↓
Clip-Higher
       ↓
让新发现的好行为更快提高概率
```

---

## 12. Dynamic Sampling

GRPO 的一个明显问题是：

如果同一组 trajectory 全成功：

```text
1 1 1 1 1 1 1 1
```

或者全失败：

```text
0 0 0 0 0 0 0 0
```

则组内没有 reward 差异：

\[
\hat A_i\approx0
\]

训练信号会消失。

因此作者只保留：

\[
0<N_{\text{success}}<G
\]

也就是：

> 一个 group 中必须同时存在 success 和 failure。

如果全成功或全失败，就继续采样。

这就是 **Dynamic Sampling**。

---

## 13. Clip-Higher

普通 PPO / GRPO 常使用对称 clipping：

\[
[0.8,1.2]
\]

SimpleVLA-RL 将它改成：

\[
\boxed{[0.8,1.28]}
\]

也就是：

- 下界仍然约为 0.8；
- 上界从 1.2 放宽到 1.28。

原因是：

> 一些原本概率很低的 action，可能在探索时偶然发现非常有效。

如果上界限制太紧，它们的概率无法快速提高。

因此 Clip-Higher 的目标是：

\[
\boxed{\text{给有价值的低概率行为更多上升空间}}
\]

---

## 14. Higher Rollout Temperature

作者将 rollout temperature 从：

\[
1.0
\]

提高到：

\[
\boxed{1.6}
\]

温度越高，action-token distribution 越平：

\[
T\uparrow
\Rightarrow
\text{随机性增加}
\Rightarrow
\text{trajectory diversity 增加}
\]

训练时使用随机采样增强探索。

Evaluation 时则使用：

> **Greedy Sampling**

保证测试稳定性。

---

## 15. 最终训练目标

SimpleVLA-RL 最终仍然使用 PPO-style clipped objective：

\[
J(\theta)
=
\mathbb E
\left[
\min
\left(
r_{i,t}(\theta)\hat A_i,
\operatorname{clip}
(
r_{i,t}(\theta),
1-\epsilon_{low},
1+\epsilon_{high}
)
\hat A_i
\right)
\right]
\]

其中：

\[
r_{i,t}(\theta)
=
\frac{
\pi_\theta(a_{i,t}\mid s_{i,t})
}{
\pi_{\theta_{\text{old}}}(a_{i,t}\mid s_{i,t})
}
\]

而 advantage 来自整条轨迹的 group-relative reward。

论文还做了一个重要修改：

> **去掉 KL regularization。**

也就是不再强制：

\[
\pi_\theta
\approx
\pi_{\text{ref}}
\]

好处是：

- 不需要额外 reference model，降低显存；
- 减少计算开销；
- 不限制 policy 离开原 SFT 行为分布，有利于探索新策略。

---

## 16. Backbone：并不是直接使用官方 OpenVLA-OFT

SimpleVLA-RL 主要应用在 **OpenVLA-OFT** 上。

但论文使用的版本和官方实现不同。

作者主要保留：

- parallel decoding；
- action chunking。

同时改成：

```text
Single-view Image
      +
Language
      +
Proprioception
      ↓
OpenVLA Backbone
      ↓
LLaMA2 Output Head
      ↓
Action Tokens
```

在 LIBERO 中甚至不使用 proprioception。

官方 OpenVLA-OFT 使用 MLP 生成 continuous action，并采用 L1 regression；论文版本改成 action-token prediction 和 cross-entropy。

因此：

> **论文无法直接使用官方 OpenVLA-OFT checkpoint，而是重新进行 SFT。**

这一点对复现非常重要。

---

## 17. 训练配置

论文主要训练配置：

| 项目                   | 设置                 |
| ---------------------- | -------------------- |
| GPU                    | 8 × NVIDIA A800 80GB |
| Training               | Full-parameter       |
| Learning Rate          | \(5\times10^{-6}\)   |
| Batch Size             | 64                   |
| Group / Sampling Count | 8                    |
| \(\epsilon_{low}\)     | 0.20                 |
| \(\epsilon_{high}\)    | 0.28                 |
| Rollout Temperature    | 1.6                  |
| Action Tokens          | 256                  |
| LIBERO Action Chunk    | 8                    |
| RoboTwin Action Chunk  | 25                   |

训练阶段：

> Random Sampling

测试阶段：

> Greedy Sampling

---

## 18. 实验平台

论文主要测试三个 benchmark：

\[
\boxed{
\text{LIBERO}
+
\text{RoboTwin1.0}
+
\text{RoboTwin2.0}
}
\]

### LIBERO

主要使用：

- LIBERO-Spatial；
- LIBERO-Object；
- LIBERO-Goal；
- LIBERO-Long。

每个 suite：

\[
10\text{ tasks}\times50\text{ demos}=500\text{ demos}
\]

### RoboTwin

RoboTwin1.0 / 2.0 主要测试：

> **双臂机器人 manipulation。**

RoboTwin2.0 进一步加入大量 domain randomization，并将任务按执行步数分成：

```text
Short
Medium
Long
Extra-Long
```

最长任务约需要：

\[
637\text{ steps}
\]

用于验证 sparse outcome reward 在长时程任务中是否仍然有效。

---

## 19. Main Results

主要结果可以压缩成：

| Benchmark   | SFT OpenVLA-OFT | + SimpleVLA-RL |
| ----------- | --------------: | -------------: |
| LIBERO Avg  |            91.0 |       **99.1** |
| RoboTwin1.0 |            39.8 |       **70.4** |
| RoboTwin2.0 |            38.3 |       **68.8** |

LIBERO-Long：

\[
86.5
\rightarrow
98.5
\]

RoboTwin2.0 中，不同 horizon 都得到提升：

```text
Short:       21.3 → 64.9
Medium:      47.1 → 72.5
Long/Extra:  46.5 → 69.0
```

说明：

> **简单的 trajectory-level outcome reward 并不只适用于短任务，在数百步的长时程 manipulation 中也可以有效提升策略。**

---

## 20. 最重要的实验：Data Scarcity

作者故意把 SFT 数据压缩到极低水平：

> **每个 task 只使用 1 条 demonstration。**

LIBERO 一个 suite 有 10 个 task，因此总共只有：

\[
10\text{ demonstrations}
\]

称为：

> **One-Trajectory SFT**

结果：

| Setting             |  Spatial |   Object |     Goal |     Long |      Avg |
| ------------------- | -------: | -------: | -------: | -------: | -------: |
| One-Trajectory SFT  |     63.6 |     54.9 |     59.6 |     17.3 |     48.9 |
| + SimpleVLA-RL      | **98.2** | **98.7** | **98.8** | **91.7** | **96.9** |
| Full-Trajectory SFT |     91.6 |     95.3 |     90.6 |     86.5 |     91.0 |
| + SimpleVLA-RL      |     99.4 |     99.1 |     99.2 |     98.5 |     99.1 |

最明显的是 LIBERO-Long：

\[
\boxed{17.3\%\rightarrow91.7\%}
\]

而：

\[
\text{One-Trajectory SFT + RL}=96.9
\]

甚至超过：

\[
\text{Full-Trajectory SFT}=91.0
\]

---

## 21. Data Scarcity 实验真正说明什么

它并不意味着：

> “只用一条 demonstration 就可以从零训练 VLA。”

更准确的理解是：

```text
已有大规模预训练 VLA Prior
           ↓
每任务 1 条 Demo 提供基本 Task Grounding
           ↓
Policy 已经有少量成功概率
           ↓
大量 Simulation Rollout
           ↓
环境 Success / Failure Feedback
           ↓
Online RL
```

因此 SimpleVLA-RL 实际上把一部分训练成本从：

\[
\text{Human Demonstrations}
\]

转移到：

\[
\boxed{
\text{Policy-generated Experience}
+
\text{Simulation Feedback}
}
\]

所以论文所谓解决 data scarcity，更准确地说是：

> **降低对昂贵人工示范数据扩展的依赖。**

---

## 22. Generalization Analysis

作者专门比较：

\[
\boxed{\text{SFT vs Online RL}}
\]

对 OOD generalization 的影响。

实验覆盖三种泛化：

- Spatial；
- Object；
- Goal / Task。

每个 LIBERO suite 有 10 个任务。

作者使用：

\[
9\text{ seen tasks}
\]

训练，留下：

\[
1\text{ unseen task}
\]

做 OOD evaluation。

两种方法都从相同的 One-Trajectory SFT base model 出发。

结果显示：

```text
Seen Task Performance ↑

SFT：
Unseen Task Performance ↓ / 甚至降到 0

RL：
Unseen Task Performance 整体继续 ↑
```

作者认为 SFT 更容易贴着训练任务分布拟合，而 RL 只关心：

> **最终有没有成功。**

因此同一个任务允许多个不同的动作策略，更容易跳出 demonstration pattern。

---

## 23. Sim-to-Real 实验

作者进一步测试：

> 只在 simulation 中做 RL，能不能提升真实机器人的表现？

训练阶段：

```text
1000 Simulation Trajectories
          ↓
         SFT
          ↓
1000 Simulation Scenarios
          ↓
   SimpleVLA-RL
```

整个训练过程：

\[
\boxed{\text{不使用真实机器人 RL 数据}}
\]

然后直接在真实 AgileX Piper 机器人上测试。

平均成功率：

| Model        | Real-world Avg SR |
| ------------ | ----------------: |
| OpenVLA-OFT  |              17.5 |
| RDT          |              23.5 |
| SimpleVLA-RL |          **38.5** |

这说明一种可能的 scaling 路线：

\[
\boxed{
\text{Large-scale Simulation RL}
\rightarrow
\text{Sim-to-Real Improvement}
}
\]

也就是把昂贵的真实机器人试错尽量转移到 simulation。

> 注：技术报告正文和 Table 6 中个别任务名称、数字存在轻微不一致，阅读时以表格结果为主。

---

## 24. Pushcut：RL 学出了示范中没有的策略

论文观察到一个很有意思的 emergent behavior：

> **Pushcut**

例如 `Move Can Pot` 任务。

示范数据全部使用：

```text
Grasp
  ↓
Move
  ↓
Place
```

但 RL 后的模型自己发现：

```text
Push
 ↓
Target
```

不再抓起物体，而是直接把物体推到目标位置。

类似现象也出现在 `Place A2B Left / Right`。

作者将其称为：

> **Push-driven Shortcut**

---

## 25. 为什么 Pushcut 会出现

因为 reward 只有：

\[
R=
\begin{cases}
1,&success\\
0,&failure
\end{cases}
\]

所以对于 RL：

```text
Grasp → Move → Place → Success
```

和：

```text
Push → Success
```

得到完全相同的最终奖励。

模型并没有被要求：

> “必须按照 demonstration 的过程完成任务。”

因此：

\[
\boxed{
\text{Outcome Reward}
+
\text{Exploration}
\rightarrow
\text{Behavior Outside Demonstration Distribution}
}
\]

作者将其类比于 DeepSeek-R1 中的 “Aha Moment”。

更谨慎地理解，这说明的是：

> **RL 可以发现示范数据中没有出现过、但能够完成任务的新行为模式。**

---

## 26. Failure Mode：RL 不能凭空创造任务能力

这是论文非常重要的一部分。

作者比较不同 SFT 初始化：

| Initialization      | Before RL | After RL |
| ------------------- | --------: | -------: |
| 0-Trajectory SFT    |       0.0 |      0.0 |
| 100-Trajectory SFT  |       7.3 |     25.4 |
| 1000-Trajectory SFT |      28.2 |     50.4 |

当 base policy：

\[
SR=0
\]

时：

```text
τ1 → 0
τ2 → 0
τ3 → 0
...
τ8 → 0
```

无法得到成功轨迹，也没有有效的 group-relative advantage。

因此：

\[
\boxed{
\text{SimpleVLA-RL 需要一个具有非零任务能力的初始策略}
}
\]

---

## 27. RL 存在一个“能力阈值”

论文进一步发现：

> 初始成功率越高，RL 通常越有效。

例如 `Pick Dual Bottles`：

100-demo SFT：

\[
1.2\rightarrow4.3
\]

几乎没有明显提升。

1000-demo SFT：

\[
29.7\rightarrow68.3
\]

提升非常明显。

可以理解为：

```text
更好的初始 Policy
        ↓
更容易探索到 Success
        ↓
更稳定的 Reward Difference
        ↓
更有效的 GRPO Update
        ↓
更好的 Policy
```

形成正反馈。

因此 sparse outcome reward RL 更适合：

```text
模型已经“基本会做”
        ↓
但成功率还不够高
        ↓
通过 Trial-and-Error 持续优化
```

而不是：

```text
完全不会
  ↓
0% Success
  ↓
靠 0/1 Reward 从零学会
```

---

## 28. SimpleVLA-RL 真正的贡献

可以压缩成四点。

### 1. 将 LLM 风格的 Online Rule-based RL 搬到 VLA

核心路线：

\[
\text{SFT}
\rightarrow
\text{Interactive Rollout}
\rightarrow
\text{Outcome Reward}
\rightarrow
\text{GRPO}
\]

---

### 2. 为 VLA 构建可扩展 Interactive Rollout Infrastructure

在 veRL 基础上加入：

- VLA-specific trajectory sampling；
- 多环境并行；
- rendering / inference / training 集成；
- VLA-specific loss computation。

解决机器人 rollout 比 LLM generation 更昂贵的问题。

---

### 3. 提出一套针对 VLA RL 的 Exploration Recipe

\[
\boxed{
\text{Dynamic Sampling}
+
\text{Clip-Higher}
+
\text{Higher Temperature}
}
\]

这部分实际上是 SimpleVLA-RL 最有直接复现价值的方法设计。

---

### 4. 系统验证 RL 对 VLA Scaling 的价值

论文不仅看 benchmark success rate，还专门研究：

- demonstration scarcity；
- OOD generalization；
- long-horizon manipulation；
- sim-to-real；
- emergent behavior；
- RL failure threshold。

---

## 29. 论文最大的优点

### 1. 方法足够简单

没有设计复杂：

- handcrafted dense reward；
- reward model；
- process reward；
- value model。

只使用：

\[
\boxed{Success / Failure}
\]

非常容易理解，也容易扩展到不同环境。

### 2. 实验覆盖比较完整

不仅测试：

> “RL 能不能提高 SR”

还测试：

- 少数据；
- 泛化；
- 长时程；
- 真实机器人；
- 新行为发现；
- 失败条件。

### 3. 明确揭示 RL 的适用边界

作者没有只展示成功案例，而是直接证明：

\[
SR=0
\Rightarrow
\text{Sparse RL 基本学不动}
\]

这对理解 VLA RL 非常重要。

---

## 30. 论文的局限

### 1. 强依赖初始 Policy

SimpleVLA-RL 不能真正解决：

\[
\text{Zero-Success Exploration}
\]

如果初始 policy 完全不会，binary reward 很难提供有效学习信号。

---

### 2. Temporal Credit Assignment 很粗糙

整条 trajectory 只有最终：

\[
0/1
\]

无法判断：

- 哪一步真正做对了；
- 哪一步导致失败；
- 哪个 action chunk 应该被重点强化。

所以长时程任务中的 credit assignment 仍然比较粗。

---

### 3. Dynamic Sampling 可能带来额外 Rollout 成本

全失败或者全成功的 group 都被丢弃。

在：

- 极难任务；
- 极简单任务；

中，都可能需要额外采样很多 trajectory。

---

### 4. 主要适用于具有显式 Success Signal 的环境

LIBERO / RoboTwin 可以由 simulator 判断：

\[
\text{success or failure}
\]

但真实开放世界任务的“成功”并不一定容易自动判断。

因此真实机器人上的大规模 RL 仍然需要：

- reward model；
- verifier；
- VLM judge；
- process reward；

等更通用的反馈机制。

---

## 31. 和传统 SFT 的区别

可以这样记：

```text
SFT

Human Demonstration
       ↓
(s, a*) Pair
       ↓
最大化 π(a*|s)
       ↓
学习“人是怎么做的”
```

SimpleVLA-RL：

```text
Environment
    ↑   ↓
 State Action
    ↑   ↓
   Policy
     ↓
很多完整 Trajectory
     ↓
 Success / Failure
     ↓
    GRPO
     ↓
学习“什么行为最终有效”
```

因此两者的核心区别是：

\[
\boxed{
\text{SFT：Imitate Demonstrations}
}
\]

\[
\boxed{
\text{RL：Optimize Task Outcome}
}
\]

---

## 32. SFT 和 RL 在这篇论文里不是替代关系

论文最重要的训练观念之一是：

\[
\boxed{
\text{SFT 负责获得初始能力}
+
\text{RL 负责进一步搜索和优化}
}
\]

可以理解为：

### SFT

解决：

\[
\boxed{\text{Can I do it?}}
\]

让机器人至少知道：

- 操作哪个物体；
- 大致动作流程；
- 基本任务语义；
- 如何产生合理动作。

### RL

解决：

\[
\boxed{\text{Can I do it better?}}
\]

进一步提高：

- 成功率；
- 长时程稳定性；
- 泛化；
- 新策略探索；
- 对示范数据的利用效率。

---

## 33. 最值得记住的几个结论

### 结论 1

VLA 的 scaling 不一定只能继续堆 human demonstrations。

还可以：

\[
\boxed{
\text{Scale Environment Interaction}
}
\]

把更多训练信号来自：

> policy 自己产生的经验。

---

### 结论 2

Sparse outcome reward 可以很强，但有明确前提：

\[
\boxed{
P(\text{success})>0
}
\]

如果模型完全不会，RL 很难启动。

---

### 结论 3

VLA RL 中 **Exploration 极其重要**。

这篇论文真正有效的 recipe 不只是 GRPO，而是：

\[
\boxed{
\text{GRPO}
+
\text{Dynamic Sampling}
+
\text{Clip-Higher}
+
\text{Temperature}=1.6
}
\]

---

### 结论 4

RL 和 SFT 学到的东西并不完全一样。

SFT 更倾向：

\[
\text{复制示范中的动作模式}
\]

RL 更倾向：

\[
\text{搜索任何能够获得成功 Reward 的策略}
\]

Pushcut 就是非常直观的例子。

---

### 结论 5

真正有潜力的未来路线可能是：

```text
大规模 VLA Pretraining
          ↓
少量高质量 SFT
          ↓
大规模 Simulation Online RL
          ↓
更可靠的 Process / Outcome Feedback
          ↓
Real-world Deployment
```

---

## 34. 最简版流程

```text
                Pretrained VLA
                     ↓
                    SFT
                     ↓
           Non-zero Success Policy
                     ↓
       ┌────────────────────────┐
       │ Parallel Simulation Env│
       └────────────┬───────────┘
                    ↓
             G Trajectories
                    ↓
          Success = 1 / Fail = 0
                    ↓
           Dynamic Sampling
                    ↓
       Group-relative Advantage
                    ↓
                  GRPO
                    ↓
            Updated VLA Policy
                    ↓
             Next RL Rollout
```

探索增强：

```text
Temperature 1.6
      +
Dynamic Sampling
      +
Clip [0.8, 1.28]
```

---

## 35. 一句话记忆

以后再看到 SimpleVLA-RL，只要记住：

> **SimpleVLA-RL 是一个把 LLM 中的 rule-based online RL 思路迁移到 VLA 的后训练框架：先通过 SFT 获得非零任务能力，再让 VLA 在并行模拟环境中随机探索，用最终 success/failure 作为 0/1 reward，通过 GRPO 和 Dynamic Sampling、Clip-Higher、高温采样持续优化策略，从而减少对大量人工示范的依赖，并提升成功率、泛化能力和长时程表现。**

更短一点：

\[
\boxed{
\text{SFT 让机器人会做}
+
\text{RL 让机器人自己试着做得更好}
}
\]

---

## 36. 阅读后最值得留下的思考

这篇论文真正值得关注的并不是“又把一个 RL 算法用到了机器人上”。

它代表的是 VLA 训练范式正在发生变化。

过去更接近：

```text
需要更强的 Policy
      ↓
收集更多 Demonstration
      ↓
继续 SFT
```

SimpleVLA-RL 给出的另一条路线是：

```text
先用有限 Demonstration 建立基本能力
               ↓
让机器人自己在 Simulation 中 Trial-and-Error
               ↓
用环境反馈产生新的训练信号
               ↓
持续 Post-training
```

因此未来 VLA 的关键问题可能越来越从：

> “还要再收集多少 demonstration？”

转向：

> **“如何让已经具备基本能力的 VLA，通过可靠、高效、可扩展的环境反馈继续自我提升？”**

而 SimpleVLA-RL 给出的第一个非常直接的答案就是：

\[
\boxed{
\text{Interactive Rollout}
+
\text{Outcome Reward}
+
\text{Exploration}
+
\text{GRPO}
}
\]