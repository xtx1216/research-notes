# VLA-RL：Towards Masterful and General Robotic Manipulation with Scalable Reinforcement Learning

> Guanxing Lu et al.  
> arXiv:2505.18719v1, 2025

## 1. 这篇论文在解决什么问题

现有大型 VLA，例如 OpenVLA，主要通过大量机器人 demonstration 做 imitation learning / SFT。

这种方式的问题是：

- 训练数据只能覆盖有限的状态；
- 模型实际执行时会进入训练集中没有出现过的状态；
- 一旦抓偏、走偏或提前闭合夹爪，SFT 模型往往缺少恢复经验；
- 因此 offline imitation learning 在 OOD state 下容易失败。

VLA-RL 想解决的核心问题是：

> **能不能把已经训练好的大型 VLA 当作初始策略，再通过在线强化学习，让机器人利用自己实际探索到的数据继续提升？**

整体思路：

```text
Offline Demonstrations
        ↓
      SFT
        ↓
  OpenVLA-7B
        ↓
 Online Rollout
        ↓
Reward + PPO
        ↓
 Improved VLA
```

论文的核心目标不是从头训练 RL policy，而是：

\[
\boxed{
\text{VLA Pretraining / SFT}
\rightarrow
\text{Online RL Post-training}
}
\]

---

## 2. 一句话理解 VLA-RL

VLA-RL 可以理解成：

\[
\boxed{
\text{OpenVLA-7B}
+
\text{Online PPO}
+
\text{Robotic Process Reward Model}
+
\text{Scalable RL System}
}
\]

其中：

- OpenVLA-7B：作为已经具有机器人操作能力的初始 policy；
- PPO：利用在线 rollout 数据继续优化 policy；
- RPRM：给中间操作过程提供稠密 reward；
- 系统优化：让 7B VLA 的 online RL 真正稳定、并行地跑起来。

---

## 3. 为什么 VLA 还需要 RL

SFT 学到的是：

\[
\pi_{\text{SFT}}(a|s)
\]

但训练状态 \(s\) 主要来自 expert demonstrations。

例如专家轨迹：

```text
正确靠近
→ 正确抓取
→ 正确移动
→ 正确放置
```

而模型实际运行时可能变成：

```text
靠近
→ 抓偏
→ 进入陌生状态
→ 不知道如何恢复
```

因此问题不只是模型“动作预测不准”，更重要的是：

\[
\boxed{
D_{\text{offline}}
\neq
D_{\text{policy rollout}}
}
\]

Online RL 的优势在于让模型直接训练在：

> **自己真正会访问到的状态分布上。**

所以 RL 不只是“换一个 loss”，而是在改变训练数据的来源。

---

## 4. 为什么不是从头做 RL

传统机器人 RL 经常需要：

- 大量探索；
- 手工 reward engineering；
- 小规模网络；
- 单任务训练；
- 非常高的样本成本。

VLA-RL 不从随机策略开始，而是直接从：

\[
\text{OpenVLA-7B SFT checkpoint}
\]

开始。

因此模型已经具备：

- 视觉理解；
- 语言理解；
- 基本机器人操作能力；
- 多任务 manipulation prior。

RL 只需要继续搜索：

> **如何在已有能力基础上做得更好。**

这就是 RL post-training 和 RL from scratch 的核心区别。

---

## 5. Base Policy：OpenVLA-7B

VLA-RL 使用 **OpenVLA-7B** 作为基础策略。

OpenVLA 的核心结构包括：

- Llama-2-7B；
- SigLIP；
- DINOv2；
- autoregressive action token generation。

每个环境时间步输入：

\[
(o_t,v_t^{in})
\]

其中：

- \(o_t\)：当前第三人称相机图像；
- \(v_t^{in}\)：当前任务语言指令。

模型输出：

\[
v_t^{out}
\]

即离散 action token sequence。

再通过 action detokenizer：

\[
a_t=f(v_t^{out})
\]

得到真正机器人动作。

---

## 6. 一个动作到底由几个 token 组成

OpenVLA 在这里一个环境 timestep 生成：

\[
v_t^{out}
=
[v_{t,1},v_{t,2},...,v_{t,7}]
\]

论文中：

\[
|A|=7
\]

对应机器人动作的 7 个自由度，可以理解成：

\[
3\text{ 位移}
+
3\text{ 旋转}
+
1\text{ gripper}
\]

因此执行过程是：

```text
Image + Instruction
        ↓
OpenVLA
        ↓
7 Action Tokens
        ↓
Action Detokenizer
        ↓
One Robot Action
        ↓
env.step()
        ↓
Next Image
```

这里要特别注意：

> **7 个 token 表示一个动作的 7 个维度，不是未来 7 步 action chunk。**

---

## 7. 整体框架

VLA-RL 的完整系统主要由三个模型组成：

```text
                  ┌───────────────┐
Observation ─────→│ Policy Network│
Instruction ─────→│   OpenVLA     │
                  └──────┬────────┘
                         ↓
                      Action
                         ↓
                    Environment
                         ↓
              Sparse Environment Reward
                         +
                  ┌───────────────┐
                  │      RPRM     │
                  │ Process Reward│
                  └───────────────┘
                         ↓
                    Total Reward
                         ↓
                  Value Network
                         ↓
                        GAE
                         ↓
                        PPO
                         ↓
                  Update OpenVLA
```

三个核心模型：

1. **Policy Network**：OpenVLA；
2. **Value Network**：估计 \(V(s_t)\)；
3. **Robotic Process Reward Model**：生成过程 reward。

RPRM 在 RL 阶段保持冻结。

---

## 8. 把机器人轨迹看成 Multi-modal Multi-turn Conversation

这是论文在形式化上的一个核心思想。

普通 LLM 多轮对话：

```text
User₁ → Assistant₁
User₂ → Assistant₂
User₃ → Assistant₃
```

机器人 interaction：

```text
(Image₀, Instruction) → Action₀
(Image₁, Instruction) → Action₁
(Image₂, Instruction) → Action₂
...
```

因此一整条 manipulation trajectory 可以写成：

\[
(o_0,l)\rightarrow a_0
\rightarrow(o_1,l)\rightarrow a_1
\rightarrow\cdots
\]

作者把它称为：

\[
\boxed{
\text{Multi-modal Multi-turn Conversation}
}
\]

其中：

- multi-modal：输入包含图像和语言；
- multi-turn：机器人不断执行动作，再观察新的环境状态。

这样就可以把 LLM 中成熟的 RL 框架迁移到 autoregressive VLA。

---

## 9. VLA 的动作概率如何接入 PPO

传统 PPO 使用：

\[
\pi_\theta(a_t|s_t)
\]

但 OpenVLA 的一个动作由多个 token 组成。

因此整个 action 的 log probability 被写成：

\[
\log\pi_\theta(a_t|o_t,v_t^{in})
=
\sum_{i=1}^{7}
\log
\pi_\theta
(v^{out}_{t,i}|o_t,v_t^{in})
\]

直观理解：

```text
一个机器人动作
=
7 个 action token
```

所以：

\[
P(a_t)
=
\prod_{i=1}^{7}P(v_{t,i})
\]

取 log 后：

\[
\log P(a_t)
=
\sum_{i=1}^{7}\log P(v_{t,i})
\]

这样 autoregressive VLA 的 token probability 就可以转换成 PPO 所需要的 action probability。

---

## 10. PPO 怎么更新 OpenVLA

Rollout 阶段使用旧策略：

\[
\pi_{\theta_{\text{old}}}
\]

收集：

\[
(o_t,a_t,r_t,\log\pi_{\text{old}}(a_t),V_t)
\]

随后使用 GAE 计算：

\[
A_t
\]

再计算 PPO ratio：

\[
r_t(\theta)
=
\frac{
\pi_\theta(a_t|o_t,l)
}{
\pi_{\theta_{\text{old}}}(a_t|o_t,l)
}
\]

PPO objective：

\[
L_{\text{PPO}}
=
E_t
\left[
\min
\left(
r_t(\theta)A_t,
\operatorname{clip}
(r_t(\theta),1-\epsilon,1+\epsilon)A_t
\right)
\right]
\]

所以论文并没有重新发明 PPO。

真正关键的是：

> **怎样把 autoregressive VLA 的 token generation 变成可以稳定进行 trajectory-level PPO 的 policy。**

---

## 11. 为什么需要 Robotic Process Reward Model

LIBERO 中最直接的环境 reward 往往非常稀疏。

例如：

```text
靠近物体
→ 抓取
→ 抬起
→ 移动
→ 放到目标位置
```

可能只有任务最终完成时：

\[
r=1
\]

之前大量步骤：

\[
r=0
\]

这样 PPO 很难判断：

> 中间到底哪一步在朝成功方向前进。

因此作者提出：

\[
\boxed{
\text{RPRM：Robotic Process Reward Model}
}
\]

它类似 LLM 中的 Process Reward Model：

> 不只看最终结果，而是评价中间过程是否有进展。

最终 reward：

\[
r_t
=
r_t^{sparse}
+
r_t^{rprm}
\]

---

## 12. RPRM 的核心思想

RPRM 使用 pretrained Vision-Language Model 进行 fine-tuning。

作者没有把 reward modeling 当成普通 scalar regression，而是利用 autoregressive VLM 的形式，把它写成：

> **next-token prediction problem**

输入包含：

- 当前视觉 observation；
- 任务 instruction；
- 当前 action 信息。

模型预测对应的 process reward signal。

因此 RPRM 的目的不是直接控制机器人，而是：

\[
\boxed{
\text{判断当前动作是否推动任务向成功方向发展}
}
\]

---

## 13. RPRM 的 pseudo label 从哪里来

为了避免人工逐帧标 reward，作者设计了一套自动 pseudo-label pipeline。

### Step 1：Milestone Segmentation

先收集成功 trajectory。

根据：

\[
\text{gripper openness}
\]

的明显变化，把 trajectory 切成多个 segment。

原因是夹爪开合经常对应功能阶段变化：

```text
Open → Close
≈ 抓取完成

Close → Open
≈ 放置完成
```

因此一个完整任务可以被分成：

```text
Approach
→ Grasp
→ Transport
→ Place
```

---

## 14. Progress Labeling

在每个 segment 内寻找：

\[
\text{end-effector velocity}\approx0
\]

的 keyframe。

这些点通常对应：

- 到达抓取位置；
- 完成一个精细动作；
- 到达稳定状态；
- 一个局部动作阶段结束。

作者把：

> **导致这些 keyframe 的 action sequence**

标成 positive pseudo-reward。

这样就不用人工标注每一个中间状态。

---

## 15. RPRM 的局限

这套 pseudo-label 方法明显带有 heuristic。

它主要依赖：

\[
\text{gripper openness}
\]

和：

\[
\text{end-effector velocity}
\]

所以比较适合：

- pick-and-place；
- grasp；
- transport；
- place。

但对更复杂的 manipulation：

- insertion；
- rotation；
- pushing；
- tool use；
- dual-arm coordination；
- dexterous manipulation；

速度接近 0 并不一定代表任务取得进展。

因此 RPRM 的 reward quality 仍然依赖任务结构。

---

## 16. Curriculum Selection Strategy

VLA-RL 不均匀采样所有任务，而是根据当前成功率动态调整训练任务。

论文给出：

\[
P(task_j)
\propto
\exp
\left(
\frac{0.5-s_j}{\tau}
\right)
\]

其中：

- \(s_j\)：任务当前成功率；
- \(\tau\)：控制采样随机程度。

作者希望重点训练：

> **位于当前能力边界附近的任务。**

直觉：

```text
已经完全会的任务
→ 学习价值低

完全不会的任务
→ 很难得到有效学习信号

中等难度任务
→ 最适合继续学习
```

需要注意的是，论文给出的公式本身与“在 50% 成功率附近达到最高采样概率”的文字描述并不完全一致，因此具体实现最好结合源码确认。

---

## 17. Critic Warmup

PPO 同时需要：

\[
\text{Actor}
\quad+\quad
\text{Critic}
\]

但训练开始时：

- OpenVLA policy 已经通过 SFT 训练得很好；
- Value Network 还没有学会准确估计 \(V(s)\)。

如果立刻联合 PPO：

\[
V(s)\text{ 不准}
\rightarrow
A_t\text{ 不准}
\rightarrow
Policy Gradient\text{ 不准}
\]

因此作者先：

```text
SFT Policy Rollout
        ↓
Collect Trajectories
        ↓
Only Train Critic
        ↓
Critic Warmup
        ↓
Actor + Critic Joint PPO
```

这个设计对训练稳定性非常重要。

---

## 18. GPU-balanced Vectorized Environments

Online RL 需要大量环境并行 rollout。

VLA-RL 使用：

\[
N
\]

个 vectorized environments。

问题在于 LIBERO rendering 本身也占 GPU 资源。

因此作者把环境分散到不同 GPU worker：

```text
GPU 0 → Env Group 0
GPU 1 → Env Group 1
GPU 2 → Env Group 2
...
```

再利用 distributed communication 汇总环境状态，用于 batch inference 和 learning。

这样可以降低：

- 单 GPU 环境显存压力；
- env.step() 的时间开销；
- rollout 阶段的等待时间。

---

## 19. 整套 RL Infrastructure

系统使用：

- **bfloat16**：降低显存占用；
- **vLLM**：加速 OpenVLA batch inference；
- **Ray**：组织分布式 learning；
- **FSDP**：进行大模型分布式训练；
- **LoRA**：更新 VLA 参数。

总共有 \(G\) 块 GPU 时：

```text
1 GPU
→ 专门负责 inference / rollout model

G - 1 GPUs
→ PPO learning
```

作者还专门为 vLLM 实现 OpenVLA plugin，因为原始 HuggingFace generation 在 large batch 下会产生问题。

因此 VLA-RL 的贡献不仅是算法，也包括：

\[
\boxed{
\text{Large VLA Online RL Infrastructure}
}
\]

---

## 20. 完整训练循环

整个 VLA-RL 可以压缩成：

```text
1. 当前 Observation + Instruction
              ↓
2. OpenVLA 生成 7 个 Action Tokens
              ↓
3. Detokenize 得到机器人 Action
              ↓
4. env.step(Action)
              ↓
5. 得到 Sparse Reward
              +
6. RPRM 得到 Process Reward
              ↓
7. Total Reward
              ↓
8. Value Network
              ↓
9. GAE
              ↓
10. PPO Update
              ↓
11. 更新 OpenVLA LoRA
              ↓
12. 重新 Online Rollout
```

不断重复：

\[
\boxed{
\text{Rollout}
\rightarrow
\text{Reward}
\rightarrow
\text{PPO}
\rightarrow
\text{New Rollout}
}
\]

---

## 21. 实验平台：LIBERO

论文在 LIBERO 上验证。

使用四个 task suite：

- LIBERO-Spatial；
- LIBERO-Object；
- LIBERO-Goal；
- LIBERO-Long / LIBERO-10。

它们分别更偏向：

- 空间关系；
- 不同物体；
- 目标条件；
- 长时程多阶段 manipulation。

RL 从每个 suite 对应的 OpenVLA SFT checkpoint 开始。

测试阶段：

> 每个 suite 使用 500 episodes 进行评估。

---

## 22. 主要实验结果

核心结果：

| 方法             |  Spatial |   Object |     Goal |     Long |  Average |
| ---------------- | -------: | -------: | -------: | -------: | -------: |
| Diffusion Policy |     78.3 |     92.5 |     68.3 |     50.5 |     72.4 |
| Octo             |     78.9 |     85.7 |     84.6 |     51.1 |     75.1 |
| OpenVLA SFT      |     84.7 |     88.4 |     79.2 |     53.7 |     76.5 |
| GRAPE DPO        |     87.6 |     91.2 |     82.2 |     55.8 |     79.2 |
| π₀-FAST          |     96.4 |     96.8 |     88.6 |     60.2 |     85.5 |
| **VLA-RL**       | **90.2** | **91.8** | **82.2** | **59.8** | **81.0** |

相对于 OpenVLA SFT：

\[
76.5
\rightarrow
81.0
\]

提升：

\[
\boxed{+4.5\text{ percentage points}}
\]

相对于 DPO：

\[
79.2
\rightarrow
81.0
\]

提升：

\[
+1.8
\]

说明在这个实验中：

\[
\boxed{
\text{Online RL}

>\text{Only SFT / Preference Optimization}
>}
>\]

---

## 23. 和 π₀-FAST 的结果怎么看

论文中使用了“matches π₀-FAST”这样的表述。

但从平均成功率看：

\[
VLA\text{-}RL=81.0
\]

\[
\pi_0\text{-FAST}=85.5
\]

因此更准确的理解是：

> **VLA-RL 显著缩小了 OpenVLA 与 π₀-FAST 的差距，并且在 LIBERO-Long 上接近 π₀-FAST，但整体平均成功率仍低于 π₀-FAST。**

其中 Long：

\[
59.8
\quad vs \quad
60.2
\]

确实非常接近。

---

## 24. Test-time Scaling

作者每训练约 2500 steps 就重新评估一次。

整体趋势是：

\[
\text{RL Steps}\uparrow
\Rightarrow
\text{Success Rate}\uparrow
\]

例如 LIBERO-Spatial 最终提升到：

\[
90.2\%
\]

LIBERO-Long 最终提升到：

\[
59.8\%
\]

作者把这种现象称为：

> **robotics 中 inference / test-time scaling law 的 early spark。**

不过更准确地说，这里主要是：

\[
\boxed{
\text{更多 Online RL Optimization Compute}
}
\]

因为训练过程中模型参数仍然在继续更新，并不是完全固定模型后单纯增加推理计算。

---

## 25. Training Dynamics

作者重点观察了几个训练指标。

### Episode Length

随着 RL：

\[
\text{Episode Length}\downarrow
\]

说明机器人越来越少走弯路，完成任务更高效。

这和 LLM RL 很不同。

LLM reasoning 有时表现为：

\[
\text{能力提高}
\rightarrow
\text{reasoning length 增加}
\]

而机器人更可能：

\[
\text{能力提高}
\rightarrow
\text{动作更准确}
\rightarrow
\text{episode 更短}
\]

---

## 26. Reward 和 Entropy Dynamics

训练过程中 reward 整体提升，但会出现 plateau。

作者认为这和 curriculum 变化有关：

```text
学会当前任务
→ 进入更难任务
→ Reward 暂时平台
→ 再次提升
```

同时 policy entropy：

\[
H(\pi)
\]

开始相对较高，然后逐渐下降。

含义是：

- 前期保留更多 exploration；
- 后期策略逐渐稳定；
- entropy 过低会限制探索；
- entropy 过高则容易造成训练不稳定。

---

## 27. Ablation Study

LIBERO-Spatial 上：

| 设置                                           | Success Rate |
| ---------------------------------------------- | -----------: |
| **VLA-RL**                                     |     **90.2** |
| Remove RPRM                                    |         85.8 |
| Remove Curriculum                              |         88.0 |
| Temperature 1.5 → 1.0                          |         85.8 |
| Critic Warmup 5 → 0                            |         80.0 |
| LR \(2\times10^{-5}\rightarrow2\times10^{-4}\) |          0.2 |

这个表说明：

> VLA Online RL 对训练细节极其敏感。

尤其两个现象最明显。

---

## 28. Critic Warmup 非常重要

去掉 critic warmup：

\[
90.2
\rightarrow
80.0
\]

下降：

\[
10.2
\]

个百分点。

说明如果 critic 一开始估计很差：

\[
V(s)\text{ error}
\rightarrow
A_t\text{ error}
\rightarrow
Policy Gradient\text{ error}
\]

很容易损坏原本已经不错的 SFT policy。

所以：

\[
\boxed{
\text{稳定的 Critic 是大型 VLA PPO 的关键}
}
\]

---

## 29. Learning Rate 极其敏感

论文默认：

\[
2\times10^{-5}
\]

提高到：

\[
2\times10^{-4}
\]

成功率直接：

\[
90.2
\rightarrow
0.2
\]

几乎完全 collapse。

这说明：

> **RL post-training 并不是“把 PPO 套到 VLA 上就行”。**

如果 update 太激进，很容易发生：

\[
\boxed{
\text{Catastrophic Policy Collapse}
}
\]

所以稳定性本身就是 VLA-RL 的核心研究问题。

---

## 30. RL vs. SFT：RL 为什么更鲁棒

论文分析了 action coverage。

Offline demonstration 中的 action：

> 更集中在专家经常访问的区域。

Online RL 收集到的 action：

> 分布更广，覆盖更多机器人自己可能进入的状态。

可以理解成：

\[
D_{\text{SFT}}
=
\text{Expert State Distribution}
\]

而：

\[
D_{\text{RL}}
=
\text{Policy-induced State Distribution}
\]

Online RL 会经历：

- 抓偏；
- 接触位置不准；
- 提前闭合夹爪；
- 非专家路径；
- 错误后的恢复动作。

因此模型能够直接学习：

> **自己犯错以后应该怎么办。**

---

## 31. Case Study：具体提升在哪里

论文展示了 contact-rich manipulation 的案例。

任务要求：

```text
pick up the black bowl
→ place it on the plate
```

SFT baseline：

> 抓取位置有偏差，导致失败。

VLA-RL：

> 能够更准确地对齐目标并完成抓取。

作者特别指出 RL 有助于：

- contact alignment；
- 减少 premature gripper closure；
- 提升精细抓取中的 robustness。

所以 RL 的优势在这种：

\[
\boxed{
\text{需要纠错 + 精细接触}
}
\]

的任务中尤其明显。

---

## 32. 论文真正的三个核心贡献

### 1. Large VLA + Online PPO

证明：

\[
\boxed{
\text{大型 Autoregressive VLA 可以通过 Online RL Post-training 继续提升}
}
\]

而不需要从头训练 RL policy。

---

### 2. Robotic Process Reward Model

通过：

\[
r_t
=
r_t^{sparse}
+
r_t^{rprm}
\]

缓解 sparse reward 问题。

并通过成功 trajectory 自动构造 pseudo reward labels，减少人工 reward engineering。

---

### 3. Scalable RL System

真正让 7B VLA online RL 跑起来需要：

```text
Curriculum
+
Critic Warmup
+
Low Learning Rate
+
Vectorized Environments
+
Batch Decoding
+
vLLM
+
FSDP
```

所以论文的贡献不仅是 PPO formulation，也是系统工程。

---

## 33. 这篇论文真正重要的地方

如果只看 PPO：

> 没有提出新的 PPO 算法。

如果只看 reward model：

> Process Reward Model 的思想也来自大模型 RL。

VLA-RL 真正重要的是把这些东西组合到大型机器人 foundation model 中：

\[
\boxed{
\text{Autoregressive VLA}
+
\text{Trajectory-level PPO}
+
\text{Process Reward}
+
\text{Online Exploration}
+
\text{Large-scale RL Infrastructure}
}
\]

并证明：

> **SFT 之后继续做 online RL，在多任务 VLA 上确实可以继续获得性能提升。**

---

## 34. 和普通 SFT VLA 的区别

普通 VLA：

```text
Offline Demonstrations
        ↓
       SFT
        ↓
       VLA
        ↓
   Deployment
```

VLA-RL：

```text
Offline Demonstrations
        ↓
       SFT
        ↓
   OpenVLA Base
        ↓
 Online Interaction
        ↓
Sparse Reward + RPRM
        ↓
       PPO
        ↓
 Better Policy
        ↓
New Online Interaction
```

最大的区别：

\[
\boxed{
\text{模型开始从自己的真实执行经验中继续学习}
}
\]

---

## 35. 论文的局限

### 1. RPRM pseudo label 比较 heuristic

主要依赖：

- gripper openness；
- end-effector velocity。

对复杂 dexterous manipulation 未必适用。

### 2. 主要验证仍然在 simulation

实验集中在 LIBERO。

论文还没有证明这种 large-scale online RL recipe 可以直接在真实机器人上大规模稳定运行。

### 3. 当前只研究 autoregressive VLA

未来作者希望扩展到：

- diffusion policy；
- flow-based VLA；
- real-world online self-improvement。

### 4. RL 对实现细节高度敏感

从 ablation 可以看到：

- critic；
- learning rate；
- entropy；
- curriculum；
- reward densification；

任何一个设置不合适都可能明显掉点甚至 collapse。

---

## 36. 最值得记住的几个结论

### 结论 1

VLA 的训练范式开始越来越像 LLM：

\[
\boxed{
\text{Pretraining / SFT}
\rightarrow
\text{RL Post-training}
}
\]

SFT 不一定是 VLA 训练的终点。

---

### 结论 2

Online RL 最大的价值不只是优化 reward。

更重要的是：

\[
\boxed{
\text{让模型训练在自己真正会访问到的状态上}
}
\]

因此能够学习：

- recovery；
- correction；
- contact alignment；
- 非专家状态下的行为。

---

### 结论 3

Sparse reward 是 VLA RL 的核心困难之一。

因此需要：

\[
\boxed{
\text{Process Reward / Dense Reward}
}
\]

帮助 credit assignment。

---

### 结论 4

大型 VLA 做 PPO 时，系统稳定性非常重要。

特别是：

\[
\boxed{
\text{Critic Warmup + Small LR}
}
\]

否则很容易把已经训练好的 SFT policy 直接更新坏。

---

## 37. 最简版流程

```text
          OpenVLA-7B SFT
                │
                ▼
      Image + Instruction
                │
                ▼
      Autoregressive Action Tokens
                │
                ▼
          Robot Action
                │
                ▼
        LIBERO Environment
          │             │
          │             └── Sparse Reward
          │
          └── Observation / Action
                       │
                       ▼
                     RPRM
                       │
                 Process Reward
                       │
                       ▼
        Sparse + Process Reward
                       │
                       ▼
                 Value Network
                       │
                       ▼
                      GAE
                       │
                       ▼
                      PPO
                       │
                       ▼
               Update OpenVLA
                       │
                       └────→ New Rollout
```

---

## 38. 一句话记忆

以后再看到 VLA-RL，只要记住：

> **VLA-RL 是一个在 SFT OpenVLA-7B 基础上进行在线 PPO 后训练的框架：它把机器人轨迹视为多模态多轮对话，用 action-token log probability 接入 PPO，并利用 Robotic Process Reward Model 缓解稀疏奖励，再通过 critic warmup、curriculum、并行环境和 vLLM/FSDP 等系统设计实现可扩展的大模型机器人强化学习。**

更短一点：

\[
\boxed{
\text{SFT VLA}
+
\text{Online Exploration}
+
\text{Process Reward}
+
\text{PPO}
}
\]

---

## 39. 阅读后最值得留下的思考

这篇论文真正值得关注的不是：

> “PPO 又在机器人上用了一次。”

而是：

```text
过去：
Demonstration
→ SFT
→ Deployment

VLA-RL：
Demonstration
→ SFT
→ Deployment / Exploration
→ Collect Policy-induced Data
→ RL Post-training
→ Better Policy
```

它把 VLA 的学习方式从：

> **只学习人类给出的经验**

进一步推进到：

> **模型通过自己的执行经验继续自我改进。**

如果这条路线继续成立，那么未来 VLA 的关键问题可能越来越从：

> “怎么收集更多 demonstration？”

变成：

> **“怎样让 foundation VLA 在部署环境里安全、稳定、高效地进行持续 RL post-training 和 self-improvement？”**