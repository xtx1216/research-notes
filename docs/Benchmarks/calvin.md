# CALVIN

<span class="page-subtitle">
Language-Conditioned Robot Manipulation · Long Horizon · Evaluation
</span>

<div class="tags">
  <span>Benchmark</span>
  <span>Manipulation</span>
  <span>Language</span>
  <span>Long Horizon</span>
</div>


CALVIN 是一个用于评测 **语言条件机器人操作策略** 的 Benchmark。

它最有代表性的特点是：

> 不只看机器人能不能完成一个任务，而是看它能不能根据语言指令，**连续完成多个任务**。

---

## 一句话理解

假设机器人面前有：

- 抽屉；
- 滑动门；
- 不同颜色的积木；
- 灯和按钮。

你依次告诉机器人：

```text
打开抽屉
→ 拿起红色积木
→ 把积木放进抽屉
→ 打开灯
→ 关闭抽屉
```

CALVIN 关注的就是：

**机器人到底能连续执行到第几步。**

因此它特别适合研究：

- VLA；
- 长程操作；
- 语言条件控制；
- 多任务策略；
- 机器人长期规划能力。

---

## 基本信息

| 项目      | 内容                                       |
| --------- | ------------------------------------------ |
| Benchmark | CALVIN                                     |
| 全称      | Composing Actions from Language and Vision |
| 年份      | 2022                                       |
| Simulator | PyBullet                                   |
| Robot     | Franka Emika Panda                         |
| 场景      | A / B / C / D 四个环境                     |
| 原子任务  | 34 个                                      |
| Language  | Yes                                        |
| 主要特点  | 连续执行多个语言任务                       |

---

## 环境长什么样

CALVIN 的场景是一个桌面机器人操作环境。

主要包括：

- Franka Panda 机械臂；
- 抽屉；
- sliding door；
- 红、蓝、粉色积木；
- LED；
- 灯泡；
- 按钮和开关。

机器人需要根据自然语言完成不同操作。

例如：

```text
open the drawer
```

```text
lift the red block
```

```text
move the slider to the left
```

```text
turn on the light
```

任务本身并不复杂。

**CALVIN 真正难的是把这些简单任务连续组合起来。**

---

## 有哪些任务

CALVIN 一共有 34 个原子任务。

不需要死记具体 34 个任务，可以把它们理解成下面几类：

| 类型   | 示例            |
| ------ | --------------- |
| Push   | 推动积木        |
| Rotate | 旋转积木        |
| Lift   | 拿起积木        |
| Place  | 放置积木        |
| Drawer | 打开 / 关闭抽屉 |
| Slider | 移动滑动门      |
| Stack  | 堆叠积木        |
| Light  | 打开 / 关闭灯   |

因此 CALVIN 的基本思想其实很简单：

```text
简单技能
    ↓
组合
    ↓
长程任务
```

---

## Observation

策略通常可以观察：

```text
RGB Image
+
Gripper Camera
+
Robot State
+
Language Instruction
```

可以简单理解为：

```text
机器人看到什么？
+
机器人现在在哪里？
+
人让它做什么？
```

然后模型根据这些信息预测下一步动作。

---

## Action

CALVIN 中最常见的是 7 维机器人动作：

```text
[x, y, z,
 rx, ry, rz,
 gripper]
```

也就是：

| 部分     | 含义           |
| -------- | -------------- |
| xyz      | 末端执行器位置 |
| rotation | 末端执行器旋转 |
| gripper  | 夹爪开合       |

因此对于 VLA 来说，可以简单理解为：

```text
Image
+
Language
+
Robot State
        ↓
      VLA
        ↓
7D Robot Action
```

---

## CALVIN 最重要的评测方式

这是 CALVIN 最需要理解的地方。

CALVIN 会随机生成很多条：

```text
5 个连续任务组成的任务链
```

例如：

```text
Task 1
打开抽屉

↓

Task 2
拿起红色积木

↓

Task 3
把积木放进抽屉

↓

Task 4
打开 LED

↓

Task 5
移动滑动门
```

机器人完成一个任务后：

**不会重置环境。**

而是直接继续执行下一个任务。

所以前面任务执行得不好，很可能会影响后面的任务。

这就是 CALVIN 的 Long-Horizon 特性。

---

## 怎么看 CALVIN 的结果

论文中经常会看到：

```text
Len 1
Len 2
Len 3
Len 4
Len 5
```

或者：

```text
SR@1
SR@2
SR@3
SR@4
SR@5
```

它们表示：

| 指标 | 含义                  |
| ---- | --------------------- |
| SR@1 | 至少连续完成 1 个任务 |
| SR@2 | 至少连续完成 2 个任务 |
| SR@3 | 至少连续完成 3 个任务 |
| SR@4 | 至少连续完成 4 个任务 |
| SR@5 | 5 个任务全部完成      |

例如：

```text
SR@1 = 90%
SR@2 = 80%
SR@3 = 65%
SR@4 = 50%
SR@5 = 35%
```

可以理解成：

> 100 条任务链里，大约 35 条可以从第一个任务一直做到第五个任务。

---

## Average Length 是什么

CALVIN 还经常报告：

```text
Average Length
```

或者：

```text
Avg. Len.
```

它表示：

> 一条 5-task chain 平均能够连续完成几个任务。

范围：

```text
0 ~ 5
```

例如：

```text
Avg. Len. = 2.5
```

可以粗略理解成：

> 平均每条任务链能连续完成 2.5 个任务。

因此：

```text
越接近 5
→ 长程执行能力越强
```

---

## 为什么 CALVIN 对 VLA 很重要

普通 Benchmark 很多时候只看：

```text
Instruction
    ↓
完成一个任务
    ↓
Success / Failure
```

而 CALVIN 更像：

```text
Instruction 1
    ↓
Action
    ↓
环境变化

Instruction 2
    ↓
Action
    ↓
环境继续变化

Instruction 3
    ↓
...
```

因此它可以测试 VLA 的几个重要问题：

### 1. 是否真的理解语言

模型需要把：

```text
open the drawer
```

和视觉中的 drawer 对应起来。

### 2. 是否能处理连续任务

不能只记住单个动作模板。

### 3. 是否会错误累积

比如：

```text
Task 1
抓取位置稍微偏了
```

虽然勉强成功，但可能导致：

```text
Task 2
完全无法继续
```

### 4. 是否具有长程能力

这也是为什么很多 VLA 工作喜欢在 CALVIN 上测试。

---

## CALVIN 和 LIBERO 的直观区别

初学时可以先这么理解：

|            | CALVIN               | LIBERO           |
| ---------- | -------------------- | ---------------- |
| 主要特点   | 长程连续操作         | 多任务机器人操作 |
| Language   | Yes                  | Yes              |
| 单任务     | 有                   | 有               |
| 连续任务链 | **重点**             | 不是最核心       |
| 常见指标   | Avg. Length / SR@1~5 | Success Rate     |
| VLA 常用   | Yes                  | Yes              |

一句话：

> **LIBERO 更常看“某个任务做不做得成”，CALVIN 更强调“连续做很多事情还能不能坚持下去”。**

这个理解对于入门已经足够了。

---

## 常见模型结果怎么看

后面看论文时，CALVIN 经常会出现：

| Model        | Avg. Length |
| ------------ | ----------: |
| RoboFlamingo |         2.x |
| GR-1         |         3.x |
| 新模型       |         4.x |

这里不要把：

```text
4.x
```

理解成：

```text
成功率 4.x%
```

它表示的是：

> 平均一条包含 5 个任务的 sequence，模型能够连续完成大约 4 个任务。

因此：

```text
Avg. Length = 4.7
```

已经说明大多数任务链可以做到非常后面。

---

## 我的实验

以后自己跑模型时，只需要记录这些：

| Model | Setting | SR@1 | SR@2 | SR@3 | SR@4 | SR@5 | Avg. Len. |
| ----- | ------- | ---: | ---: | ---: | ---: | ---: | --------: |
|       |         |      |      |      |      |      |           |

如果有特殊设置，再加一列：

```text
Notes
```

就够了。

不需要把所有工程参数全部塞到这一页。

---

## 常见问题

!!! warning "容易混淆的地方"

    **1. Avg. Length 不是成功率**
    
    它表示平均连续完成多少个任务，最大值为 5。
    
    **2. CALVIN 最重要的是连续任务**
    
    只看单任务成功率无法体现它最大的特点。
    
    **3. 不同论文的训练设置可能不同**
    
    比较结果时要确认是不是使用了相同的训练 / 测试设置。
    
    **4. 前一个任务会影响后一个任务**
    
    因为任务之间不会自动 reset，这也是 CALVIN 比普通单任务评测更难的原因。

---

## 初学者需要记住的 5 件事

!!! abstract "CALVIN 核心"

    1. CALVIN 是一个 **语言条件机器人操作 Benchmark**；
    2. 它包含 **34 个基础操作任务**；
    3. 最经典的评测是一条 sequence 连续执行 **5 个任务**；
    4. 最重要的指标是 **SR@1 ~ SR@5 和 Average Length**；
    5. 它最大的价值是评测 **VLA 的长程连续执行能力**。

---

## 参考资料

1. **CALVIN: A Benchmark for Language-Conditioned Policy Learning for Long-Horizon Robot Manipulation Tasks**  
   Oier Mees et al., IEEE RA-L, 2022.

2. **CALVIN Official Repository**  
   `mees/calvin`

3. **CALVIN Official Website / Leaderboard**  
   CALVIN Benchmark 官方网站。