# Meta-World

<span class="page-subtitle">
Multi-Task Reinforcement Learning · Meta-Reinforcement Learning · Robot Manipulation
</span>

<div class="tags">
  <span>Benchmark</span>
  <span>Reinforcement Learning</span>
  <span>Robot Manipulation</span>
  <span>Meta-RL</span>
</div>

Meta-World 是一个用于研究 **多任务强化学习（Multi-Task RL）** 和 **元强化学习（Meta-RL）** 的机器人操作 Benchmark。

它包含 **50 个不同的机械臂操作任务**。

Meta-World 最核心的问题是：

> **一个策略能不能学习多种不同的操作技能，并把已经学到的经验迁移到其他任务上？**

---

## 1. Meta-World 在测什么

如果只训练一个机器人任务，例如：

```text
Reach
```

策略只需要学会：

> 控制机械臂末端移动到目标位置。

但真实的机器人往往需要掌握很多不同技能，例如：

```text
Reach
Push
Pick and Place
Open Door
Open Drawer
Press Button
Insert Peg
...
```

Meta-World 把这些不同操作放进同一个 Benchmark 中，用来研究：

- 一个策略能不能同时学会多个任务；
- 不同任务之间能不能共享知识；
- 学过一些任务之后，能不能更快适应新的任务。

因此它的重点并不是某一个任务，而是：

> **多个机器人操作技能之间的学习和迁移。**

---

## 2. 任务是什么样的

Meta-World 使用 Sawyer 机械臂完成桌面操作任务。

50 个任务覆盖了很多常见的机器人操作技能，例如：

| 类型 | 示例 |
|---|---|
| Reach | 移动末端到目标位置 |
| Push | 推动物体 |
| Pick and Place | 抓起物体并放到目标位置 |
| Door | 打开门 |
| Drawer | 打开或关闭抽屉 |
| Button | 按下按钮 |
| Peg Insertion | 将物体插入孔中 |
| Window | 打开或关闭窗口 |

不同任务虽然目标不同，但都使用统一的机器人和接口。

这使得同一个策略可以在多个任务之间共享参数。

---

## 3. Observation

Meta-World 默认主要使用 **状态信息（State）** 作为 Observation。

状态中通常会包含：

- 机械臂末端位置；
- 夹爪状态；
- 物体的位置和姿态；
- 与当前任务有关的其他状态信息。

因此策略做的事情可以简单写成：

$$
\text{State}
\longrightarrow
\text{Policy}
\longrightarrow
\text{Action}
$$

这里的重点不是从图像中识别物体，而是研究：

> **在已知环境状态的情况下，策略如何学习不同的机器人操作技能。**

---

## 4. Action

Meta-World 中 Sawyer 机械臂使用统一的 4 维动作：

$$
a_t =
(\Delta x,\Delta y,\Delta z,g)
$$

其中：

- $\Delta x,\Delta y,\Delta z$：控制机械臂末端在三个方向上的移动；
- $g$：控制夹爪打开或闭合。

所以策略每一步都在决定：

> 末端执行器往哪里移动，以及夹爪应该开还是关。

统一的动作空间也是 Meta-World 能够使用一个策略学习多个任务的重要基础。

---

## 5. Reward 和 Success

每个 Meta-World 任务都有自己的 Reward。

Reward 通常会根据任务进度设计，例如：

```text
距离目标更近
→ Reward 增加

抓住物体
→ Reward 增加

完成任务
→ 获得更高 Reward
```

但是最终评测模型时，更重要的通常是：

```text
Success Rate
```

也就是：

> 多次执行任务时，有多少次真正完成了任务。

例如测试 100 个 episode，其中成功 78 次：

$$
\text{Success Rate}
=
\frac{78}{100}
=
78\%
$$

因此 Reward 更多用于训练，而 Success Rate 更直接反映策略是否真正学会了任务。

---

## 6. Multi-Task RL

Meta-World 中一类很重要的设置是 **Multi-Task Reinforcement Learning**。

目标是：

> **让一个策略同时完成多个不同任务。**

常见的任务集合包括：

```text
MT1
MT10
MT50
```

含义很直观：

| Benchmark | 含义 |
|---|---|
| MT1 | 学习 1 个任务 |
| MT10 | 同时学习 10 个任务 |
| MT50 | 同时学习全部 50 个任务 |

例如 MT10 中，一个策略可能同时需要学会：

```text
Reach
Push
Pick and Place
Open Door
Open Drawer
Press Button
...
```

此时真正困难的地方是：

> **一个模型怎样同时表示和完成不同的操作技能。**

在 MT10 和 MT50 中，策略通常会得到当前任务的 Task ID，从而知道现在需要完成哪个任务。

---

## 7. Meta-RL

Meta-World 的另一类重要设置是 **Meta-Reinforcement Learning**。

它关注的不是：

> 已经训练过的任务做得有多好。

而是：

> **学习过很多任务以后，面对一个新的任务，能不能很快学会？**

常见设置包括：

```text
ML1
ML10
ML45
```

### ML1

在一个任务内部改变目标位置。

例如一直做 Reach，但每次目标位置不同。

它主要测试：

> 能不能快速适应同一种技能中的不同目标。

### ML10

使用一部分任务进行训练，再在没有参与训练的新任务上进行适应。

核心问题是：

> 学过多个任务以后，能不能更快掌握新的操作技能。

### ML45

使用更多任务进行 meta-training，再在保留的新任务上测试适应能力。

训练任务更多，任务分布也更广。

因此 Meta-RL 的核心并不是简单记住训练任务，而是：

> **学会如何利用过去的经验快速学习新任务。**

---

## 8. MT 和 ML 分别表示什么

Meta-World 中最容易混淆的就是：

```text
MT
```

和：

```text
ML
```

可以直接这样记：

### MT：Multi-Task

关注：

> **一个策略能不能同时做好多个已经训练过的任务。**

### ML：Meta-Learning

关注：

> **在多个任务上训练以后，能不能快速适应新的任务或新的目标。**

所以看到：

```text
MT10
```

重点看的是“同时做 10 个任务”。

看到：

```text
ML10
```

重点看的是“从多个训练任务中学习可迁移的经验，再适应测试任务”。

---

## 9. Episode 是怎么进行的

一个 Meta-World episode 的基本过程很标准：

```text
env.reset()
    ↓
得到初始 State
    ↓
Policy 输出 Action
    ↓
env.step(action)
    ↓
环境返回新的 State 和 Reward
    ↓
继续执行
    ↓
任务成功或达到最大步数
```

然后环境重新 reset，开始下一次 episode。

强化学习算法就是通过大量这样的环境交互逐渐学会操作任务。

---

## 10. 怎么看 Meta-World 的结果

Meta-World 官方评测主要关注：

```text
Success Rate
```

例如一个 MT10 策略在 10 个任务上的成功率分别不同，最终可以统计各个任务上的成功表现以及整体平均成功率。

因此看到 Meta-World 的结果表时，首先关注：

> **策略到底能成功完成多少任务。**

对于 Meta-RL 设置，还要进一步关注：

> **面对训练阶段没有直接学过的任务或目标时，经过少量适应之后能达到怎样的成功率。**

---

## 11. Meta-World 最重要的理解

!!! abstract "Meta-World 核心"

    理解 Meta-World 时，记住下面几点就够了：

    1. Meta-World 是一个 **机器人操作强化学习 Benchmark**；
    2. 它包含 **50 个 Sawyer 机械臂操作任务**；
    3. 所有任务使用统一的 Observation 和 Action 接口；
    4. **MT1 / MT10 / MT50** 用于研究 Multi-Task RL；
    5. **ML1 / ML10 / ML45** 用于研究 Meta-RL；
    6. 主要评测指标是 **Success Rate**；
    7. 它最核心的问题是：**一个策略能否学习多种操作技能，并把已有经验迁移到其他任务。**

---

## 参考资料

1. **Meta-World: A Benchmark and Evaluation for Multi-Task and Meta Reinforcement Learning**  
   Tianhe Yu et al.  
   Conference on Robot Learning (CoRL), 2019.

2. **Meta-World Documentation**  
   Farama Foundation.

3. **Meta-World Official Repository**  
   `Farama-Foundation/Metaworld`
