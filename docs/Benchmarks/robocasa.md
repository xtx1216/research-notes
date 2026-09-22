# RoboCasa

<span class="page-subtitle">
Household Robot Manipulation · Kitchen Simulation · Long-Horizon Tasks
</span>

<div class="tags">
  <span>Benchmark</span>
  <span>Simulation</span>
  <span>Household Manipulation</span>
  <span>Kitchen</span>
</div>

RoboCasa 是一个面向 **家庭场景机器人操作** 的大规模仿真平台。

它主要围绕厨房环境展开，希望机器人不仅会完成简单抓取，还能处理更加接近真实家庭生活的任务。

理解 RoboCasa 时，最重要的一点是：

> **它在尽量把“真实家庭环境中的多样任务”搬进仿真。**

---

## 1. RoboCasa 在做什么

很多机器人任务都可以写成：

```text
观察环境
→ 理解任务
→ 控制机器人
→ 完成目标
```

RoboCasa 也是这个过程，但它特别强调：

- 场景要足够真实；
- 物体种类要足够多；
- 任务不能只是一两个简单动作；
- 同一个任务要能出现在不同厨房里。

因此 RoboCasa 不只是让机器人学：

```text
抓起一个方块
```

而是希望它进一步学会：

```text
打开柜门
取出杯子
把杯子放到咖啡机附近
关闭柜门
```

这种更接近日常生活的操作。

---

## 2. 为什么主要选择厨房

厨房非常适合研究通用机器人操作。

因为一个厨房里同时包含：

```text
大量物体
+
不同家具
+
不同容器
+
可开关设备
+
复杂空间关系
```

例如机器人可能需要与：

- 柜子；
- 抽屉；
- 冰箱；
- 微波炉；
- 烤箱；
- 水槽；
- 台面；
- 各种食物和餐具；

进行交互。

这些物体对应的操作也很多：

```text
Pick
Place
Open
Close
Insert
Press
Turn
Navigate
```

所以一个厨房本身就能形成大量不同的操作任务。

---

## 3. 场景为什么很多

RoboCasa 不希望策略只记住某一个固定厨房。

因此它构建了大量不同的厨房场景。

当前 RoboCasa365 包含超过：

```text
2500 个 Kitchen Scenes
```

这些场景会在：

- 布局；
- 家具；
- 材质；
- 颜色；
- 物体位置；
- 装饰风格；

等方面发生变化。

因此同一个任务可能出现在很多不同厨房中。

例如同样是：

```text
open the drawer
```

抽屉的位置、样式和周围环境都可能不一样。

RoboCasa 希望策略学到的是：

> **“怎么打开抽屉”这个能力，而不是记住某个固定场景。**

---

## 4. 物体和资产

除了厨房场景，RoboCasa 还提供大量三维物体和家具资产。

当前 RoboCasa365 中包含超过：

```text
3200 个 3D Objects
```

这些物体覆盖很多日常厨房类别。

例如：

```text
杯子
碗
盘子
水果
蔬菜
调料
锅具
厨具
食品包装
```

大量资产让同一种任务可以使用不同物体实例。

例如：

```text
把杯子放进柜子
```

每次出现的杯子、柜子以及厨房布局都可以不同。

---

## 5. Atomic Task

RoboCasa 中一类最基础的任务叫：

```text
Atomic Task
```

也就是单一操作技能。

当前 RoboCasa365 包含 **65 个 Atomic Tasks**。

这些任务主要围绕一些基础技能展开，例如：

| 类型 | 示例 |
|---|---|
| Pick / Place | 拿起物体并放到目标位置 |
| Open | 打开柜门、抽屉、冰箱等 |
| Close | 关闭柜门、抽屉、设备等 |
| Turn | 转动旋钮或把手 |
| Press | 按下按钮 |
| Insert | 将物体放入指定位置 |
| Navigate | 移动机器人到目标区域 |

Atomic Task 可以理解成：

> **机器人的基础操作技能库。**

---

## 6. Composite Task

RoboCasa 更有代表性的是：

```text
Composite Task
```

也就是由多个基础技能组合起来的任务。

例如：

```text
准备咖啡
```

可能需要：

```text
找到杯子
→ 拿起杯子
→ 移动到咖啡机
→ 放下杯子
→ 操作咖啡机
```

或者：

```text
整理厨房用品
```

可能包含：

```text
打开柜门
→ 拿起物体
→ 放入柜子
→ 再拿另一个物体
→ 关闭柜门
```

当前 RoboCasa365 包含 **300 个 Composite Tasks**。

加上 65 个 Atomic Tasks，一共：

$$
365
$$

个任务。

因此 “RoboCasa365” 中的 365，指的就是这一整套日常操作任务规模。

---

## 7. 为什么 Composite Task 更重要

Atomic Task 主要看：

> 一个单独技能会不会。

Composite Task 看的是：

> **多个技能能不能按正确顺序组合起来。**

例如机器人可能会：

```text
Open Drawer
```

也会：

```text
Pick Object
```

但这并不代表它一定会完成：

```text
打开抽屉
→ 找到目标物体
→ 拿出来
→ 放到桌面
→ 关闭抽屉
```

长任务中更容易出现：

```text
前一步有误差
↓
影响下一步
↓
错误不断累积
```

所以 RoboCasa 中很多复杂任务真正考察的是：

> **技能组合和长程执行能力。**

---

## 8. 输入和输出

一个典型的 RoboCasa 策略会使用：

- 多个相机图像；
- 机器人自身状态；
- 当前语言任务。

数据中常见的视觉输入包括：

```text
第三人称相机
+
腕部相机
```

可以简单写成：

$$
(\text{Image},\ \text{Robot State},\ \text{Language})
\longrightarrow
\text{Action}
$$

动作通常包含：

- 末端执行器位置；
- 末端旋转；
- 夹爪控制；

对于移动机器人，还可能包含底盘运动。

因此策略需要同时理解：

> **看到了什么、当前要做什么、机器人接下来应该怎么动。**

---

## 9. Demonstration Data

RoboCasa 很重要的一部分是大量机器人 demonstration。

一条 demonstration 可以理解成：

```text
语言任务
+
连续视觉观测
+
机器人状态
+
连续动作
```

形成一条完整的成功轨迹。

当前 RoboCasa365 提供了两类很重要的数据：

### Human Demonstration

由人通过遥操作机器人采集。

这类数据质量较高，能够展示人是怎样完成任务的。

### Synthetic Demonstration

利用自动轨迹生成方法，在已有示范基础上生成大量新的机器人轨迹。

这样可以把数据规模进一步扩大。

当前 RoboCasa365 整体提供了超过 **2200 小时** 的机器人示范数据。

---

## 10. Pretrain 和 Target

RoboCasa365 中还区分：

```text
Pretrain
```

和：

```text
Target
```

可以简单理解成：

### Pretrain

在大规模场景和任务上提前学习通用操作能力。

### Target

再到另一组不同的厨房场景和任务中进行训练或测试。

这里的重要思想是：

> **先从大量任务中学习通用能力，再观察这些能力能不能迁移到新的场景和任务。**

官方设置中，pretrain 和 target 使用不同的厨房场景和物体集合。

---

## 11. 怎么看 RoboCasa 的结果

RoboCasa 最直观的指标仍然是：

```text
Task Success Rate
```

也就是：

> 多次执行任务时，有多少次真正达到任务成功条件。

例如某个任务测试 50 次，其中成功 30 次：

$$
\text{Success Rate}
=
\frac{30}{50}
=
60\%
$$

对于多个任务，通常再统计不同任务上的平均成功率。

在复杂 Composite Task 中，Success Rate 往往会明显低于简单 Atomic Task，因为任务越长，需要连续正确完成的步骤越多。

---

## 12. RoboCasa 最重要的理解

!!! abstract "RoboCasa 核心"

    理解 RoboCasa 时，记住下面几点就够了：

    1. RoboCasa 是一个面向 **家庭机器人操作** 的大规模仿真平台；
    2. 场景主要集中在真实、多样的 **Kitchen Environment**；
    3. 当前 RoboCasa365 包含 **2500+ 厨房场景** 和 **3200+ 3D 物体**；
    4. 任务分为 **Atomic Task** 和 **Composite Task**；
    5. 当前共有 **65 个 Atomic Tasks + 300 个 Composite Tasks = 365 个任务**；
    6. 提供大量 human 和 synthetic demonstration；
    7. 核心目标是：**让机器人在多样家庭场景中学习并完成真实、复杂、长程的日常操作任务。**

---

## 参考资料

1. **RoboCasa: Large-Scale Simulation of Everyday Tasks for Generalist Robots**  
   Soroush Nasiriany et al.  
   Robotics: Science and Systems (RSS), 2024.

2. **RoboCasa365: A Large-Scale Simulation Framework for Training and Benchmarking Generalist Robots**  
   Soroush Nasiriany, Sepehr Nasiriany, Abhiram Maddukuri, Yuke Zhu.  
   ICLR, 2026.

3. **RoboCasa Official Repository**  
   `robocasa/robocasa`

4. **RoboCasa Official Documentation**  
   RoboCasa Documentation.
