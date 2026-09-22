# LIBERO

<span class="page-subtitle">
Lifelong Robot Learning · Language-Conditioned Manipulation · Knowledge Transfer
</span>

<div class="tags">
  <span>Benchmark</span>
  <span>Robot Manipulation</span>
  <span>Lifelong Learning</span>
  <span>Language</span>
</div>

LIBERO 是一个面向 **机器人终身学习（Lifelong Robot Learning）** 的操作 Benchmark。

它最核心的问题是：

> **机器人在不断学习新任务时，能不能把之前学到的知识迁移到后续任务中，同时尽量不忘掉已经学会的内容？**

所以理解 LIBERO 时，重点不是记住每个具体任务，而是理解它如何组织任务，以及它想测什么样的“知识迁移”。

---

## 1. LIBERO 在测什么

普通的机器人学习可以只训练一个任务：

```text
学习 Task A
→ 测试 Task A
```

LIBERO 更关注连续学习：

```text
学习 Task A
→ 学习 Task B
→ 学习 Task C
→ ...
```

问题是，当机器人学习 Task B、Task C 之后：

- Task A 还会不会做？
- Task A 中学到的知识能不能帮助 Task B？
- 学到的新知识能不能继续迁移到后面的任务？

因此 LIBERO 关注两个核心问题：

**知识迁移** 和 **知识遗忘**。

---

## 2. 两类知识

LIBERO 特别强调机器人任务中两种不同的知识。

### Declarative Knowledge

可以理解成：

> **“知道什么”**

例如：

- 哪个物体是杯子；
- 某个物体在哪里；
- 两个物体之间是什么空间关系；
- 当前任务需要操作哪个目标。

这类知识更多和物体、场景以及语义有关。

### Procedural Knowledge

可以理解成：

> **“知道怎么做”**

例如：

- 怎么抓取；
- 怎么移动机械臂；
- 怎么打开抽屉；
- 怎么把物体放进容器。

这类知识更接近具体的动作和操作技能。

LIBERO 的一个重要设计就是：

> **分别研究这两类知识，以及它们混合在一起时，策略能不能有效迁移。**

---

## 3. LIBERO 的任务是什么样的

LIBERO 中的任务都是桌面机器人操作任务。

每个任务通常由：

```text
场景
+
物体
+
语言指令
+
目标状态
```

共同定义。

例如一个任务可能是：

```text
put the red mug on the plate
```

机器人需要：

1. 从视觉中找到 red mug；
2. 找到 plate；
3. 抓起 mug；
4. 移动到 plate；
5. 放下物体；
6. 达到任务规定的成功状态。

因此一个 LIBERO 任务并不只是动作控制，还需要把：

> **语言、物体、空间关系和操作技能联系起来。**

---

## 4. 四个主要 Task Suite

LIBERO 最重要的结构是它的几个任务集合。

### LIBERO-Spatial

主要改变：

> **空间关系**

任务中的物体和操作技能可能比较相似，但目标位置或空间关系发生变化。

它主要考察：

**空间知识能不能迁移。**

### LIBERO-Object

主要改变：

> **操作对象**

任务结构可能相似，但需要操作的物体发生变化。

它主要考察：

**关于物体的知识能不能迁移。**

### LIBERO-Goal

主要改变：

> **任务目标**

场景中的物体可能相似，但语言要求机器人完成不同的操作目标。

它主要考察：

**不同任务目标之间的知识迁移。**

### LIBERO-100

LIBERO-100 包含 **100 个机器人操作任务**。

相比前面三个 suite，它不再只控制某一种变化，而是同时包含：

```text
物体变化
+
空间关系变化
+
任务目标变化
+
操作技能变化
```

因此这里的知识迁移更加综合。

LIBERO-100 又常被划分为：

```text
LIBERO-90
+
LIBERO-10
```

其中 LIBERO-90 包含 90 个任务，LIBERO-10 包含 10 个任务。

---

## 5. 为什么要设计不同的 Suite

如果只把很多机器人任务全部混在一起，很难知道：

> 模型到底是哪一部分迁移能力比较好？

因此 LIBERO 把任务拆成不同 suite。

例如：

```text
LIBERO-Spatial
```

主要观察空间关系改变以后模型还能不能完成任务。

而：

```text
LIBERO-Object
```

更强调物体变化。

这样就可以更有针对性地分析：

> **模型究竟学到了可以迁移的知识，还是只记住了某个固定任务。**

---

## 6. 输入和输出

一个典型的 LIBERO 策略会接收：

- RGB 图像；
- 机器人自身状态；
- 当前语言任务。

可以简单写成：

$$
(\text{Image},\ \text{Robot State},\ \text{Language})
\longrightarrow
\text{Action}
$$

LIBERO 数据中通常包含来自：

- workspace camera；
- wrist camera；

的视觉信息，同时提供 proprioception 和语言任务描述。

策略根据这些信息不断输出机器人动作，直到任务成功或达到最大执行步数。

---

## 7. Demonstration Data

LIBERO 为任务提供了人类遥操作得到的 demonstration。

一条 demonstration 可以理解成：

```text
初始状态
→ 动作 1
→ 动作 2
→ 动作 3
→ ...
→ 任务成功
```

这些轨迹告诉策略：

> **在这个语言任务下，一个成功的操作过程是什么样的。**

因此 LIBERO 原始工作主要研究的是基于 demonstration 的机器人学习和终身模仿学习。

---

## 8. Success Rate 怎么看

LIBERO 中最直观的评测指标就是：

```text
Success Rate
```

也就是：

> 在多次 rollout 中，有多少次最终完成了任务。

例如某个任务评测 50 次，其中成功 42 次：

$$
\text{Success Rate}
=
\frac{42}{50}
=
84\%
$$

如果有多个任务，则通常分别计算每个任务的成功率，再统计整个 suite 的平均表现。

所以读 LIBERO 结果时，最重要的问题就是：

> **这个策略在当前任务集合中，有多少次能够真正完成语言指定的操作目标？**

---

## 9. Lifelong Learning 怎么评测

LIBERO 原始设计不只是把所有任务一起训练，而是特别关注：

```text
Task 1
→ Task 2
→ Task 3
→ ...
```

这样的连续学习过程。

这里会出现两个典型现象。

### Forward Transfer

前面已经学过的任务知识，是否能帮助后面的新任务学习得更快、更好。

可以理解成：

> **以前学到的东西有没有帮上忙？**

### Forgetting

学习新任务以后，之前已经学会的旧任务性能是否下降。

可以理解成：

> **学了新的以后，旧的是不是忘了？**

这两个问题构成了 LIBERO 最核心的 lifelong learning 视角。

---

## 10. LIBERO 最重要的理解

!!! abstract "LIBERO 核心"

    LIBERO 最重要的不是记住每一个具体任务，而是理解它的设计目的：

    1. LIBERO 是一个机器人终身学习 Benchmark；
    2. 任务由视觉、语言和机器人操作共同构成；
    3. 它区分 Declarative Knowledge 和 Procedural Knowledge；
    4. LIBERO-Spatial、Object、Goal 分别控制不同类型的知识变化；
    5. LIBERO-100 用更复杂的任务组合测试综合迁移能力；
    6. 最核心的问题是：**机器人不断学习新任务时，能不能迁移已有知识，同时避免遗忘。**

---

## 参考资料

1. **LIBERO: Benchmarking Knowledge Transfer for Lifelong Robot Learning**  
   Bo Liu, Yifeng Zhu, Chongkai Gao, Yihao Feng, Qiang Liu, Yuke Zhu, Peter Stone.  
   NeurIPS, 2023.

2. **LIBERO Official Repository**  
   `Lifelong-Robot-Learning/LIBERO`

3. **LIBERO Official Website**  
   LIBERO Project.
