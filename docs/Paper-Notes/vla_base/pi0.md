# π₀：A Vision-Language-Action Flow Model for General Robot Control

> Kevin Black et al., Physical Intelligence  
> Robotics: Science and Systems（RSS 2025）

## 1. 这篇论文在解决什么问题

π₀ 想解决的不是某一个单独的机器人任务，而是：

> **能不能像训练大语言模型一样，先在大规模、多机器人、多任务数据上预训练一个通用机器人基础模型，再通过少量高质量数据把它适配到具体复杂任务？**

机器人学习长期面临三个问题：

- 数据量远小于语言/视觉领域；
- 不同机器人、不同任务之间的数据形式差异很大；
- 真正复杂的操作任务需要高频、连续、精细的动作，而不是只会简单 pick-and-place。

π₀ 的整体思路是把这三个问题一起处理：

```text
Internet-scale VLM knowledge
          +
大规模 cross-embodiment robot data
          ↓
      π₀ 预训练
          ↓
得到通用 robot foundation model
          ↓
   高质量任务数据后训练
          ↓
复杂、灵巧、长时程机器人任务
```

论文最核心的两个关键词：

1. **VLM + Flow Matching 的 VLA 架构**
2. **Pre-training + Post-training 的训练范式**

---

## 2. 一句话理解 π₀

π₀ 可以理解成：

\[
\boxed{
\text{PaliGemma VLM}
+
\text{Action Expert}
+
\text{Flow Matching Action Chunking}
}
\]

其中 VLM 负责理解：

- 图像；
- 语言；
- 语义和任务信息。

Action Expert 负责根据这些条件产生：

\[
\text{连续机器人动作序列}
\]

而不是像早期一些 VLA 那样把动作离散化成 token 后逐个 autoregressive 地生成。

论文的目标是同时获得：

- VLM 的语义泛化能力；
- diffusion / flow matching 对连续动作分布的建模能力；
- action chunking 的高频灵巧控制能力。

---

## 3. 整体框架

论文 Figure 3 可以概括为：

```text
             Internet-scale Pretraining
                      ↓
                 PaliGemma VLM
                      │
                      │ 初始化
                      ▼
┌──────────────────────────────────────────┐
│                  π₀                      │
│                                          │
│   Images + Language ──→ VLM Backbone    │
│                            │             │
│   Robot State ─────────────┼──→ Action  │
│                            │    Expert   │
│   Noisy Action Chunk ──────┘      │      │
│                                   ↓      │
│                           Flow Matching  │
│                                   ↓      │
│                           Action Chunk   │
└──────────────────────────────────────────┘
                      ↑
                      │
          Cross-embodiment Robot Data
```

训练数据来自多个机器人平台，模型需要统一处理不同：

- camera 数量；
- state dimension；
- action dimension；
- 单臂 / 双臂；
- 固定机械臂 / 移动操作机器人。

---

## 4. 输入和输出到底是什么

π₀ 要学习：

\[
p(A_t\mid o_t)
\]

这里不是预测单步动作 \(a_t\)，而是一次预测未来一段动作：

\[
A_t=[a_t,a_{t+1},\dots,a_{t+H-1}]
\]

论文中：

\[
H=50
\]

也就是一次输出 **50 步 action chunk**。

Observation 为：

\[
o_t=[I_t^1,\dots,I_t^n,\ell_t,q_t]
\]

包含：

- \(I_t^i\)：多个 RGB camera 图像；
- \(\ell_t\)：语言指令；
- \(q_t\)：机器人 proprioceptive state，例如关节状态。

因此整个模型学习的是：

```text
多视角图像
   +
语言指令
   +
机器人自身状态
   ↓
未来 50 步连续动作
```

---

## 5. 为什么不用传统的 Action Token

早期 VLA 常见做法是把连续机器人动作离散化，然后像语言一样 autoregressive 生成：

```text
Action token 1
      ↓
Action token 2
      ↓
Action token 3
      ↓
...
```

这种方法对于低频、相对简单的机器人任务是可行的，但 π₀ 面向的是：

- 双臂；
- 高频控制；
- 柔性物体；
- 精细接触；
- 长时间连续操作。

论文希望控制频率最高达到：

\[
50\text{ Hz}
\]

因此 π₀ 直接建模连续 action chunk 的分布，并使用 **Flow Matching** 来生成动作。

---

## 6. Flow Matching 是整篇论文最核心的动作建模方法

π₀ 并不是直接回归：

\[
o_t\rightarrow A_t
\]

而是从随机噪声开始，逐渐把噪声变成合理动作。

可以理解成：

```text
随机动作噪声
    ↓
修正一点
    ↓
再修正一点
    ↓
...
    ↓
真实可执行 Action Chunk
```

它和 diffusion 的思想非常接近，但使用的是 conditional flow matching。

---

## 7. Flow Matching 的训练过程

真实 action chunk：

\[
A_t
\]

首先采样噪声：

\[
\epsilon\sim\mathcal N(0,I)
\]

再随机采样一个 flow timestep：

\[
\tau\in[0,1]
\]

构造 noisy action：

\[
A_t^{\tau}
=
\tau A_t+(1-\tau)\epsilon
\]

当：

\[
\tau=0
\]

时基本是纯噪声：

\[
A_t^0\approx\epsilon
\]

当：

\[
\tau=1
\]

时就是实际动作：

\[
A_t^1=A_t
\]

模型需要学习一个 vector field：

\[
v_\theta(A_t^\tau,o_t)
\]

目标方向为：

\[
u(A_t^\tau|A_t)=A_t-\epsilon
\]

训练目标：

\[
\mathcal L^\tau(\theta)
=
\mathbb E
\left[
\|v_\theta(A_t^\tau,o_t)-(A_t-\epsilon)\|_2^2
\right]
\]

简单理解：

> 给模型一个“被噪声污染的动作”，同时告诉它机器人当前看到什么、任务是什么，让模型学习应该朝哪个方向修正，最终把噪声移动到真实动作分布。

---

## 8. 推理时 Flow Matching 怎么生成动作

推理时没有真实动作 \(A_t\)。

所以首先随机生成：

\[
A_t^0\sim\mathcal N(0,I)
\]

然后不断积分 learned vector field：

\[
A_t^{\tau+\delta}
=
A_t^\tau+
\delta v_\theta(A_t^\tau,o_t)
\]

论文使用 Forward Euler，并设置：

\[
\delta=0.1
\]

因此一共进行：

\[
10
\]

次 flow matching integration。

最终：

\[
A_t^0
\rightarrow
A_t^{0.1}
\rightarrow
\cdots
\rightarrow
A_t^1
\]

得到一个完整的 action chunk。

---

## 9. Action Expert 是什么

这是 π₀ 架构里非常重要的设计。

模型不是简单把机器人 action token 直接塞进原来的 VLM 参数中，而是设置了一套单独的机器人权重：

> **Action Expert**

可以粗略理解成一个两专家结构：

```text
Image + Language
      ↓
VLM Expert
(PaliGemma 初始化)

Robot State + Action
      ↓
Action Expert
(机器人专用参数)
```

两个部分不是两个完全独立的网络，它们处于同一个 Transformer 中，并通过 self-attention 相互交换信息。

论文将：

- 图像和语言 token 路由给 VLM backbone；
- robot state 和 noisy action token 路由给 Action Expert。

这样做的意义是：

> 不强迫 Internet 预训练得到的 VLM 参数直接同时承担机器人 state / action 建模，而为机器人连续控制保留一套专门参数。

---

## 10. 模型有多大

基础模型使用：

**PaliGemma 3B**。

在此基础上新增：

\[
\sim300M
\]

参数的 Action Expert。

因此 π₀ 总参数量大约：

\[
\boxed{3.3B}
\]

Action Expert 比 VLM backbone 小很多，这也是为了降低多次 flow matching forward 的推理成本。

论文还训练了一个对照模型：

**π₀-small**

参数量：

\[
470M
\]

它没有使用完整的 Internet-scale VLM initialization，主要用于研究 VLM pre-training 到底带来了什么。

---

## 11. Attention 的设计

π₀ 使用 blockwise causal attention，把输入大体分成三块：

```text
Block 1：Images + Language
Block 2：Robot State
Block 3：Noisy Action Chunk
```

块内部使用双向 attention，但前面的 block 不允许看到未来 block。

所以：

- Image / Language 不需要看到 robot action；
- Robot State 不需要看到 noisy future action；
- Action tokens 可以读取前面所有 observation information。

这样还带来一个工程优势：

> 在 flow matching 的 10 次迭代中，observation 没有变化，因此前面的 attention key/value 可以 cache，只需要反复计算 Action Expert 对 action token 的部分。

---

## 12. 为什么需要 Action Chunking

π₀ 每次预测：

\[
H=50
\]

步动作，而不是一步动作。

好处有两个。

第一，能够直接学习：

\[
(a_t,a_{t+1},\dots,a_{t+49})
\]

之间的动作相关性。

对于：

- 折衣服；
- 双臂协同；
- 折纸箱；
- 处理柔性物体；

这种动作，单步控制很难表达完整运动模式。

第二，可以降低推理频率。

模型不需要每执行一个 action 都重新推理一次整个 3.3B 模型。

---

## 13. 实际 Action Chunk 怎么执行

虽然模型预测：

\[
50
\]

步 action，但论文不一定全部执行完才重新推理。

对于 20 Hz 的 UR5e 和 Franka：

- 每次执行 16 步；
- 约 0.8 s 后重新 inference。

对于 50 Hz 机器人：

- 每次执行 25 步；
- 约 0.5 s 后重新 inference。

论文早期尝试过 temporal ensembling，但发现效果反而下降，因此最终采用：

> **直接 open-loop 执行 action chunk，不做 temporal aggregation。**

---

## 14. 推理速度

论文在 RTX 4090、3 路 camera 输入下报告：

| 模块                      |  时间 |
| ------------------------- | ----: |
| Image encoders            | 14 ms |
| Observation forward       | 32 ms |
| 10 次 action flow forward | 27 ms |
| 网络延迟（off-board 时）  | 13 ms |
| On-board 总推理           | 73 ms |
| Off-board 总推理          | 86 ms |

所以虽然 π₀ 有约 3.3B 参数，但由于：

- action chunk；
- KV cache；
- 较小 Action Expert；

实际仍然可以用于实时机器人控制。

---

## 15. π₀ 的另一个核心不是架构，而是训练方式

论文反复强调：

> 一个好架构还不够，robot foundation model 同样需要正确的 training recipe。

π₀ 直接借鉴了 LLM 的思路：

\[
\boxed{
\text{Pre-training}
\rightarrow
\text{Post-training}
}
\]

两阶段承担的任务不同。

---

## 16. Pre-training：先追求广度

Pre-training 的目的不是让某一个任务做到极致，而是：

> 建立广泛的机器人操作能力和泛化基础。

因此预训练数据强调：

- 多机器人；
- 多任务；
- 多物体；
- 多环境；
- 多种操作策略；
- 包含失败后的修正和 recovery 行为。

论文使用超过：

\[
\boxed{10,000\text{ hours}}
\]

机器人数据。

自己的数据包含：

\[
903M
\]

timesteps，其中：

- 106M：single-arm；
- 797M：dual-arm。

覆盖：

- 7 种 robot configurations；
- 68 个大类任务。

此外加入 OXE、Bridge v2、DROID 等开放数据。

---

## 17. 68 个任务并不意味着只有 68 个简单动作

论文特别提醒：他们对“task”的定义比较宽。

例如：

**bussing** 不只是“拿一个杯子”。

它需要机器人面对很多：

- plate；
- cup；
- utensil；
- trash；

并判断：

```text
这是餐具 → 放入 bussing bin
这是垃圾 → 放入 trash bin
```

所以一个 task 本身就可能包含大量不同 object、configuration 和 behavior。

因此不能简单把“68 tasks”理解成类似 benchmark 中的 68 个单动作任务。

---

## 18. Cross-Embodiment 怎么统一不同机器人

不同机器人 action dimension 不一样。

数据中最大的 state/action representation 维数设为：

\[
18
\]

对于动作维度更小的机器人：

> 使用 zero padding。

摄像头数量也不同。

不足 3 个 camera 的机器人：

> 对缺失 image slot 做 mask。

因此一个 π₀ 模型可以联合训练：

- UR5e；
- Bimanual UR5e；
- Franka；
- Bimanual Trossen；
- Bimanual ARX / AgileX；
- Mobile Trossen / ARX；
- Mobile Fibocom。

这就是 **cross-embodiment training**。

---

## 19. 数据并不是直接按数量随机采样

因为不同任务数据量非常不平衡，比如 laundry folding 数据很多。

论文对每个 task-robot combination 使用：

\[
n^{0.43}
\]

进行 weighting，其中 \(n\) 是该组合的数据量。

这样大数据集仍然占更高权重，但不会完全淹没小数据集。

这一步很重要，因为 robot foundation model 不只是“把所有数据堆一起”。

---

## 20. Language Label 不只是一个整段任务名称

预训练时语言信息包括：

1. 整体 task name；
2. 更细粒度的 **segment annotation**。

Segment 通常大约：

\[
2\text{ s}
\]

例如完整任务可能叫：

```text
bus the table
```

但中间 segment 可以对应：

```text
pick up the napkin
throw the napkin in the trash
pick up the plate
place plate in the bin
```

这让 π₀ 不只是学习一个任务名字，还能建立语言和局部机器人行为之间的对应关系。

---

## 21. Post-training：再追求“做得好”

预训练解决：

> **会不会做。**

Post-training 解决：

> **能不能稳定、流畅、高质量地做。**

后训练数据不再追求最大 diversity，而强调：

- high-quality；
- consistent；
- fluent；
- task-specific。

不同任务需要的数据规模差异很大：

- 简单任务约 5 小时；
- 最复杂任务需要 100 小时甚至更多。

---

## 22. 为什么“高质量数据越多越好”并不是全部答案

这是这篇论文一个很值得记住的观点。

如果只使用高质量 post-training data：

> 模型看不到错误和恢复过程。

因为高质量 demonstration 通常全是很顺畅的成功轨迹。

于是机器人一旦在线执行时偏离专家轨迹，就可能不知道怎么恢复。

而大规模 pre-training data 虽然没有那么整齐，但包含更多：

- variation；
- correction；
- recovery；
- unusual states。

因此作者认为：

```text
Diverse Pre-training Data
        ↓
泛化 + Recovery 能力

High-quality Post-training Data
        ↓
高效 + 流畅 + 稳定策略
```

组合起来才是理想状态。

---

## 23. High-Level VLM Policy

对于长时程任务，只给一句：

```text
bus the table
```

可能还不够。

因此论文也使用一个 high-level VLM，把长任务拆成中间语言指令：

```text
bus the table
      ↓
pick up the napkin
      ↓
throw the napkin in trash
      ↓
pick up the plate
      ↓
place the plate in bin
      ↓
...
```

π₀ 作为 low-level VLA，再执行这些语言 subgoal。

因此这里形成：

\[
\text{High-level VLM}
\rightarrow
\text{Language Subgoal}
\rightarrow
\pi_0
\rightarrow
\text{Robot Action}
\]

---

## 24. 实验一：Base Model 直接能做什么

作者首先不做额外 post-training，直接测试预训练后的 base π₀。

任务包括：

- Shirt Folding；
- Bussing Easy；
- Bussing Hard；
- Grocery Bagging；
- Toast out of Toaster。

这些任务同时涉及：

- dexterous manipulation；
- multi-stage execution；
- object recognition；
- semantic reasoning。

对比方法包括：

- OpenVLA；
- Octo；
- π₀-small；
- π₀ parity（只训练 160k steps）；
- 完整 π₀（700k steps）。

论文结果显示：

> 完整 π₀ 在所有 out-of-box task 上整体最好；即使只训练到 compute-parity 的 π₀，也优于这些 baseline。

作者认为这同时说明了：

- flow/action chunk 架构的重要性；
- 大模型 representation capacity 的重要性；
- VLM pre-training 的价值。

---

## 25. 为什么 OpenVLA 在这些任务上比较吃亏

论文给出的主要解释是：

OpenVLA 使用 autoregressive action discretization，而且不支持 π₀ 这种高频 action chunking。

这对于：

- 双臂；
- 50 Hz；
- 高灵巧度连续动作；

比较不利。

Octo 虽然能生成 action chunk，也使用 diffusion 风格动作模型，但模型 representation capacity 明显更小。

π₀ 希望同时结合：

\[
\boxed{
\text{Large VLM representation}
+
\text{Continuous action distribution modeling}
}
\]

---

## 26. 实验二：Language Following 到底来自哪里

作者专门比较：

**π₀ vs π₀-small**。

因为 π₀-small 没有相同的 VLM initialization。

任务包括：

- Bussing；
- Table Setting；
- Grocery Bagging。

设置有三种：

### Flat

只给总体命令：

```text
bag the groceries
```

### Human

人类给出中间指令：

```text
pick coffee
put coffee into bag
pick spaghetti
...
```

### HL

由 high-level VLM 自动给出中间指令。

结果表明：

> π₀ 能明显利用这些 intermediate language commands，而 π₀-small 的 language following 能力弱得多。

尤其 π₀-small 即使加入 high-level expert，整体收益也有限。

说明 Internet-scale VLM pre-training 不只是提供视觉 feature，也真正提供了：

\[
\boxed{\text{Language grounding ability}}
\]

---

## 27. 实验三：学习新任务

作者进一步测试：

> 一个预训练 π₀ 到了一个新任务，能不能比从头训练更快学会？

选了五个不同难度的新任务。

### Easy

**Stack Bowls**

和预训练中的 dish manipulation 比较接近。

**Towel Folding**

和 shirt folding 比较接近。

### 中间难度

**Tupperware in Microwave**

容器 manipulation 类似，但 microwave 是新元素。

### Hard

**Paper Towel Replacement**

包含预训练中没有的新物体和新动作。

**Franka Items in Drawer**

Franka 上没有类似预训练任务。

---

## 28. 新任务实验比较了什么

比较：

- π₀ pretrained → fine-tune；
- π₀ scratch；
- ACT；
- Diffusion Policy；
- Octo；
- OpenVLA。

同时改变 fine-tuning data：

\[
1\text{ h},\quad5\text{ h},\quad10\text{ h}
\]

因此实验真正研究的是：

\[
\boxed{\text{Pre-training 能否提高下游数据效率？}}
\]

---

## 29. Fine-tuning 实验得到什么结论

整体上：

> π₀ fine-tuning 后通常优于其他方法。

一个比较重要的现象是：

**pre-training 的优势在低数据场景更明显。**

例如论文指出，在部分任务上：

\[
1\text{ hour}
\]

fine-tuning data 时，预训练模型就明显优于其他方法。

而随着 task-specific data 越来越多：

\[
10\text{ h}
\]

从 scratch 的 policy 也能逐渐追上。

另外，pre-training 对与原训练分布更接近的任务通常帮助更明显。

论文中某些设置下，预训练模型相对 scratch 可以达到接近：

\[
2\times
\]

的提升。

---

## 30. 一个很有意思的实验现象

作者指出：

在一些新任务上， prior methods 中最强的反而常常是：

> **直接在目标任务上从 scratch 训练的 ACT / Diffusion Policy。**

也就是说：

> “有预训练模型”并不自动意味着可以有效 transfer。

真正困难的是：

\[
\boxed{
\text{怎样把大规模机器人预训练真正转化成下游收益}
}
\]

π₀ 的贡献之一就是证明，在它的架构和训练 recipe 下，这种 transfer 可以比较稳定地发生。

---

## 31. 实验四：最复杂的长时程任务

最后一部分是整篇论文最“秀肌肉”的实验。

任务包括：

### Laundry Folding

从随机皱成一团的衣服开始：

```text
从箱子拿出
→ 展平
→ 折叠
→ 放到已经折好的衣服堆上
```

### Mobile Laundry

移动双臂机器人完成同类任务，同时还要控制移动底盘。

### Dryer Unloading

移动机器人靠近烘干机：

```text
放下衣篮
→ 打开 dryer
→ 把衣服取出
→ 放入篮子
→ 关门
```

### Table Bussing

需要：

- 判断垃圾和餐具；
- 处理 clutter；
- 操作未见物体；
- 处理大盘子、细玻璃杯等不同形状；
- 决定合理执行顺序。

### Box Building

把一个平的纸板盒折起来。

需要：

- 双臂配合；
- 一只手固定、一只手折叠；
- 利用桌面支撑；
- 失败后 retry。

### Packing Eggs

把 6 个鸡蛋从碗中拿出，逐个放进蛋盒，再关闭盒子。

### To-go Box

把食物从盘子装进打包盒，并最终合上盒子。

---

## 32. 复杂任务的结果说明什么

作者比较：

```text
完整 Pre-training + Post-training

vs

Pre-training only（out-of-box）

vs

只用 post-training 数据从 scratch 训练
```

结果是：

> 完整的 pre-training + post-training recipe 在这些复杂任务上整体最好。

论文 Figure 13 中，完整 π₀ 在所有这些复杂任务上的平均得分都超过各任务最高分的 50%。

而且任务越复杂，pre-training 往往越重要。

这说明 π₀ 想强调的并不是：

> “预训练模型 zero-shot 什么都会。”

而是：

> **先建立广泛能力，再用高质量数据把这些能力组织成稳定的复杂任务策略。**

---

## 33. Pre-training 和 Post-training 到底分别学什么

这是整篇论文非常值得记住的一个理解。

可以粗略写成：

### Pre-training

学习：

\[
\boxed{\text{What can I do?}}
\]

获得：

- general manipulation prior；
- object knowledge；
- language understanding；
- recovery behavior；
- cross-task experience；
- cross-robot experience。

### Post-training

学习：

\[
\boxed{\text{How should I do this task well?}}
\]

获得：

- fluent strategy；
- consistent behavior；
- high success rate；
- downstream task specialization。

这和现代 LLM 的：

```text
Pre-training
→ broad knowledge

Post-training
→ desired behavior
```

非常相似。

---

## 34. π₀ 最主要的创新点

我会把它整理成四点。

### 1. VLM + Flow Matching VLA

把 Internet-scale VLM 表征能力和 continuous flow matching action generation 放到同一个模型里。

---

### 2. Action Expert

给 robot state 和 action 单独一套 expert weights，而不是完全依赖原 VLM 参数处理机器人控制。

---

### 3. High-frequency Action Chunking

一次产生：

\[
50
\]

步连续动作，并支持最高约：

\[
50\text{ Hz}
\]

的灵巧控制。

---

### 4. Robot Foundation Model 的 Pre-training / Post-training Recipe

不再把所有机器人数据简单混在一起训练一次，而是区分：

```text
大规模、多样数据
→ Pre-training

高质量、任务专用数据
→ Post-training
```

这个训练范式本身也是论文的重要贡献。

---

## 35. π₀ 真正强在哪里

如果只看 action generation，Flow Matching 并不是凭空出现的新东西。

如果只看 VLM，PaliGemma 也不是 π₀ 自己提出的。

如果只看 action chunk，ACT、Diffusion Policy 等工作也已经有类似思想。

π₀ 真正重要的是把这些东西组合成了一个可扩展的 generalist robot policy：

\[
\boxed{
\text{Internet VLM prior}
+
\text{Cross-embodiment data}
+
\text{Flow Matching}
+
\text{Action Chunking}
+
\text{Large-scale Pretraining}
+
\text{Task-specific Post-training}
}
\]

然后证明这个组合可以支撑：

- 多机器人；
- 多任务；
- 长时程；
- 双臂；
- 柔性物体；
- 高精度 manipulation。

---

## 36. 论文的局限

作者自己明确提出几个还没解决的问题。

### 1. 不知道最优的 Pre-training Data Recipe

目前基本是：

> 把能得到的数据尽量组合起来。

但仍不清楚：

- 什么数据最有价值；
- 不同数据应该怎么 weighting；
- 新增哪一种数据对性能提升最大。

---

### 2. 任务还不能做到接近 100% 可靠

部分复杂任务虽然可以完成，但并不稳定。

现在仍然不知道：

\[
\text{一个任务需要多少数据？}
\]

以及：

\[
\text{到底需要什么类型的数据？}
\]

才能达到 near-perfect performance。

---

### 3. Cross-Embodiment Transfer 的边界还不清楚

实验主要还是 manipulation robot。

虽然多个机械臂平台之间存在 transfer，但还不能证明这种 universal robot model 可以自然扩展到：

- autonomous driving；
- navigation；
- legged locomotion。

所以论文证明的是：

> manipulation 范围内的通用 robot foundation model 很有潜力。

还不是：

> 一个模型已经能统一所有 embodied intelligence。

---

## 37. 我认为最值得记住的几个结论

### 结论 1

Robot foundation model 和 LLM 越来越像：

\[
\boxed{
\text{大规模预训练}
+
\text{高质量后训练}
}
\]

可能比“为每个任务单独训练一个 policy”更有扩展性。

### 结论 2

VLM 的价值不只是“能理解一句语言”。

Internet-scale VLM pre-training 还给机器人带来了：

- semantic representation；
- language grounding；
- object understanding；
- 更好的 downstream adaptation 起点。

### 结论 3

对于灵巧操作，动作表示非常重要。

π₀ 不采用简单 autoregressive discrete action，而是：

\[
\boxed{\text{Continuous Flow Matching + Action Chunk}}
\]

这使模型更适合高频、连续、多模态机器人动作。

### 结论 4

预训练并不是为了让模型 zero-shot 解决所有任务。

更现实的价值是：

\[
\boxed{\text{让下游任务更容易、更省数据地学会}}
\]

尤其是在复杂任务和少量 fine-tuning data 下。

---

## 38. 和普通 VLA 的区别，可以这样记

```text
普通 VLA：
Image + Language
      ↓
     VLM
      ↓
Action Tokens / Action Head
      ↓
    Action
```

π₀：

```text
Image + Language ─→ VLM Backbone
                         │
Robot State ─────────────┤
                         ↓
                    Action Expert
                         ↑
                  Noisy Action Chunk
                         │
                  Flow Matching ×10
                         ↓
                Continuous Action Chunk
```

所以 π₀ 的核心不是简单“VLM 后面接一个 action head”。

而是：

> **让 VLM 提供语义条件，再让专门的 Action Expert 通过 Flow Matching 生成连续的动作分布。**

---

## 39. 最简版流程

```text
            PaliGemma
                │
                ▼
        Internet VLM Prior
                │
                ▼
      ┌──────────────────┐
      │       π₀         │
      │                  │
Image ─→ VLM Backbone    │
Text  ─→ VLM Backbone    │
State ─→ Action Expert   │
Noise ─→ Action Expert   │
      │                  │
      │ Flow Matching    │
      └────────┬─────────┘
               ↓
        Action Chunk H=50
               ↓
        Robot Execution
```

训练：

```text
10,000+ h diverse robot data
            ↓
       Pre-training
            ↓
     Generalist π₀
            ↓
High-quality task-specific data
            ↓
       Post-training
            ↓
Complex downstream robot task
```

---

## 40. 一句话记忆

以后再看到 π₀，只要记住：

> **π₀ 是一个以 PaliGemma 为 VLM backbone、增加机器人 Action Expert，并通过 Flow Matching 一次生成连续 action chunk 的通用 VLA；它利用大规模 cross-embodiment 数据做 pre-training，再用高质量任务数据做 post-training，从而兼顾语义泛化、灵巧控制和复杂任务适配。**

更短一点：

\[
\boxed{
\text{VLM理解世界}
+
\text{Flow Matching生成动作}
+
\text{Pre-training学广度}
+
\text{Post-training学质量}
}
\]

---

## 41. 阅读后最值得留下的思考

这篇论文真正值得关注的不是“又一个更大的 VLA”，而是它把机器人学习的范式进一步往 foundation model 推了一步。

过去更常见的是：

```text
一个任务
→ 收集这个任务的数据
→ 训练一个 policy
```

π₀ 想做的是：

```text
很多机器人 + 很多任务 + 很多环境
              ↓
       学一个通用 base policy
              ↓
       少量任务数据适配
              ↓
          下游复杂任务
```

如果这条路线继续成立，那么以后真正重要的问题可能不再只是：

> “这个任务应该设计什么网络？”

而会越来越变成：

> “基础模型应该如何预训练、使用什么数据、怎样表示动作，以及怎样进行高效后训练？”

这也是 π₀ 最核心的研究意义。