# CALVIN

<span class="page-subtitle">
Composing Actions from Language and Vision · Long-Horizon Robot Manipulation
</span>

<div class="tags">
  <span>Benchmark</span>
  <span>Robot Manipulation</span>
  <span>Language</span>
  <span>Long Horizon</span>
</div>


CALVIN 是一个用于评测 **语言条件机器人操作策略** 的仿真 Benchmark。

它最核心的问题不是：

> 机器人能不能完成某一个任务？

而是：

> **机器人能不能根据连续给出的语言指令，在同一个环境中连续完成多个任务？**

---

## 1. CALVIN 在测什么

很多机器人 Benchmark 会把每个任务单独评测：

```text
给出一个任务
→ 执行
→ 判断成功或失败
→ Reset
```

CALVIN 更强调 **Long-Horizon**。

机器人完成一个任务之后，环境不会立刻重置，而是继续收到下一条语言指令：

```text
打开抽屉
→ 拿起积木
→ 把积木放进抽屉
→ 打开灯
→ 移动滑动门
```

前一个任务执行后的环境状态，会直接影响后一个任务。

因此 CALVIN 主要考察的是：

- 语言理解；
- 多任务操作；
- 连续执行；
- 长程稳定性。

---

## 2. 环境里有什么

CALVIN 是一个桌面机器人操作环境，使用 Franka Emika Panda 机械臂。

场景中常见的物体包括：

- 抽屉；
- sliding door；
- 红、蓝、粉色积木；
- LED；
- 灯泡；
- 按钮和开关。

机器人根据自然语言指令与这些物体交互。

例如：

```text
open the drawer
lift the red block
move the slider to the left
turn on the light
```

CALVIN 一共定义了 **34 个基础操作任务**。

这些任务大致可以分成：

| 类型   | 示例                |
| ------ | ------------------- |
| Push   | 推动积木            |
| Rotate | 旋转积木            |
| Lift   | 拿起积木            |
| Place  | 放置积木            |
| Drawer | 打开 / 关闭抽屉     |
| Slider | 移动滑动门          |
| Stack  | 堆叠 / 拆开积木     |
| Light  | 打开 / 关闭灯和 LED |

真正的难点并不在某一个单独任务，而在于：

> **这些简单技能能不能被稳定地连续组合起来。**

---

## 3. 输入和输出

一个 CALVIN 策略通常接收：

- 相机图像；
- 机器人自身状态；
- 当前语言指令。

可以简单写成：

$$
(\text{Image},\ \text{Robot State},\ \text{Language})
\longrightarrow
\text{Action}
$$

机器人动作通常控制：

- 末端位置；
- 末端旋转；
- 夹爪开合。

所以从整体上看，CALVIN 做的事情并不复杂：

> **观察当前环境，理解语言目标，然后不断输出机器人动作。**

---

## 4. 最重要的评测：5 个连续任务

CALVIN 最经典的是 **Long-Horizon Multi-Task Language Control（LH-MTLC）**。

官方评测使用：

```text
1000 条任务序列
```

每条序列包含：

```text
5 个连续的语言任务
```

例如：

```text
Task 1：打开抽屉
Task 2：拿起蓝色积木
Task 3：把积木放进抽屉
Task 4：打开 LED
Task 5：移动滑动门
```

评测时，从第一个任务开始执行。

如果 Task 1 成功，就继续 Task 2；如果 Task 2 也成功，就继续 Task 3。

一旦某个任务失败，这条任务序列就停止。

因此一条序列最终可能完成：

$$
0,\ 1,\ 2,\ 3,\ 4,\ 5
$$

个任务。

---

## 5. SR@1 ～ SR@5 怎么看

CALVIN 常见的结果是：

```text
SR@1
SR@2
SR@3
SR@4
SR@5
```

其中：

| 指标 | 含义                        |
| ---- | --------------------------- |
| SR@1 | 至少连续完成 1 个任务的比例 |
| SR@2 | 至少连续完成 2 个任务的比例 |
| SR@3 | 至少连续完成 3 个任务的比例 |
| SR@4 | 至少连续完成 4 个任务的比例 |
| SR@5 | 5 个任务全部完成的比例      |

例如：

| Metric | Result |
| ------ | -----: |
| SR@1   |    90% |
| SR@2   |    75% |
| SR@3   |    60% |
| SR@4   |    45% |
| SR@5   |    30% |

这表示：

- 90% 的任务链至少能完成第一个任务；
- 60% 的任务链能连续完成前三个任务；
- 30% 的任务链能从头到尾完成全部五个任务。

随着任务长度增加，成功率通常会逐渐下降。

这正是 CALVIN 想观察的：

> **策略在长程执行中会不会逐渐积累错误。**

---

## 6. Average Length 怎么看

CALVIN 还经常报告：

```text
Avg. Len.
```

也就是 **Average Length**。

它表示：

> 一条 5-task sequence 平均能够连续完成多少个任务。

取值范围：

$$
0 \leq \text{Avg. Len.} \leq 5
$$

例如：

```text
Avg. Len. = 2.8
```

表示模型平均每条任务链能够连续完成约 2.8 个任务。

如果：

```text
Avg. Len. = 4.7
```

说明模型通常可以执行到任务链的很后面。

因此读 CALVIN 结果时，可以先看：

> **Avg. Len. 有多接近 5。**

再结合 SR@1～SR@5 看模型具体从第几个任务开始明显掉性能。

---

## 7. 为什么连续任务更难

单任务成功，并不代表连续任务也能成功。

例如第一个任务是：

```text
拿起红色积木
```

机器人虽然被判定为成功，但抓取位置可能不够稳定。

接下来第二个任务：

```text
把红色积木放进抽屉
```

前一个任务留下的小误差就可能继续放大。

因此长程任务中会出现：

```text
小误差
↓
状态发生偏移
↓
下一任务更难
↓
继续积累误差
```

这也是为什么一个模型即使单任务成功率很高，SR@5 仍然可能明显下降。

---

## 8. A / B / C / D 环境

CALVIN 提供 A、B、C、D 四个相似但并不完全相同的环境。

它们的任务结构基本一致，但视觉外观和部分物体布局存在变化。

因此可以设计不同难度的训练与测试设置。

其中一个常见设置是：

```text
Train：A + B + C
Test：D
```

也就是训练时没有见过环境 D，测试模型能不能把已经学会的操作能力迁移到新的环境。

这里不需要记住所有组合，只需要知道：

> **A/B/C/D 的设计让 CALVIN 除了测试任务执行，也可以测试跨环境泛化。**

---

## 9. 怎么读一张 CALVIN 结果表

看到类似：

| Model   | SR@1 | SR@2 | SR@3 | SR@4 | SR@5 | Avg. Len. |
| ------- | ---: | ---: | ---: | ---: | ---: | --------: |
| Model A |   95 |   85 |   72 |   58 |   43 |      3.53 |
| Model B |   98 |   94 |   88 |   80 |   71 |      4.31 |

可以先看两个地方。

第一，看：

```text
Avg. Len.
```

判断整体长程执行能力。

第二，看：

```text
SR@1 → SR@5
```

观察随着任务链变长，性能下降得有多快。

如果 SR@1 很高，但 SR@5 很低，说明：

> **单个任务做得不错，但连续执行时容易累积错误。**

---

## 10. CALVIN 最重要的理解

!!! abstract "CALVIN 核心"

    CALVIN 最核心的不是某一个具体机器人任务，而是 **连续任务评测**。
    
    需要记住：
    
    1. CALVIN 是语言条件机器人操作 Benchmark；
    2. 包含 34 个基础操作任务；
    3. 最经典的评测由 1000 条任务链组成；
    4. 每条任务链连续执行 5 个语言任务；
    5. 核心指标是 SR@1～SR@5 和 Average Length；
    6. 它真正想测试的是：**任务越做越长以后，策略还能不能稳定地继续完成任务。**

---

## 参考资料

1. **CALVIN: A Benchmark for Language-Conditioned Policy Learning for Long-Horizon Robot Manipulation Tasks**  
   Oier Mees, Lukas Hermann, Erick Rosete-Beas, Wolfram Burgard.  
   IEEE Robotics and Automation Letters, 2022.

2. **CALVIN Official Website**  
   CALVIN Benchmark 官方网站。

3. **CALVIN Official Repository**  
   `mees/calvin`