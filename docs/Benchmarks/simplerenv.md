# SimplerEnv

<span class="page-subtitle">
Real-to-Sim Evaluation · Robot Manipulation · Policy Evaluation
</span>

<div class="tags">
  <span>Benchmark</span>
  <span>Simulation</span>
  <span>Robot Manipulation</span>
  <span>Real-to-Sim</span>
</div>

SimplerEnv 是一个用于 **在仿真中评测真实机器人操作策略** 的 Benchmark。

它最核心的问题是：

> **能不能用一个尽量接近真实机器人的仿真环境，提前判断一个策略在真实世界里表现得好不好？**

所以理解 SimplerEnv 时，重点不在“怎么训练机器人”，而在：

> **怎么让仿真评测尽可能有现实参考价值。**

---

## 1. SimplerEnv 在解决什么问题

机器人策略最终还是要放到真实机器人上测试。

但真实评测有几个很明显的问题：

- 速度慢；
- 成本高；
- 需要人工反复复位场景；
- 同一个实验很难完全复现；
- 大量 checkpoint 不可能都拿到真实机器人上测试。

因此更理想的做法是：

```text
很多 Policy / Checkpoint
        ↓
先在 Simulation 中评测
        ↓
筛选出表现较好的策略
        ↓
再进行 Real-World Evaluation
```

问题是：

> 如果仿真结果和真实世界没有关系，那么这个仿真评测也没有太大意义。

SimplerEnv 因此重点研究：

**怎样让模拟环境中的策略表现，尽可能反映真实机器人中的表现。**

---

## 2. 什么是 Real-to-Sim

通常我们经常听到：

```text
Sim-to-Real
```

也就是：

> 在仿真里训练，然后迁移到真实机器人。

SimplerEnv 更强调：

```text
Real-to-Sim
```

这里的目标不是把仿真策略迁移出去，而是反过来：

> **把真实机器人所在的环境尽量复现到仿真中，然后直接评测真实机器人策略。**

可以简单理解为：

```text
真实机器人场景
        ↓
在 Simulation 中复现
        ↓
加载已有 Robot Policy
        ↓
运行大量 Rollout
        ↓
观察仿真结果是否能反映真实表现
```

---

## 3. 两套机器人设置

SimplerEnv 主要复现了两类真实机器人设置。

### Google Robot

一类是 Google Robot 相关的操作环境。

其中包括一些桌面操作任务，例如：

```text
Pick
Move Near
Open / Close Drawer
Place Object
```

策略需要根据视觉观测和任务指令控制机械臂完成操作。

### WidowX + Bridge

另一类是 WidowX 机械臂以及 Bridge 数据集对应的操作环境。

典型任务包括：

```text
把物体放到指定位置
把物体放入容器
堆叠物体
```

这里的重点不是记住所有任务，而是知道：

> SimplerEnv 尝试把真实世界中已经存在的机器人设置重新构建到仿真里。

---

## 4. 为什么“看起来像真实环境”很重要

很多机器人策略直接使用相机图像作为输入：

$$
\text{Image}
\longrightarrow
\text{Policy}
\longrightarrow
\text{Action}
$$

这意味着：

> 图像外观发生变化，策略行为也可能发生变化。

如果真实环境里是：

```text
白色桌面
+
真实机器人
+
某种灯光
+
真实背景
```

而仿真里却是完全不同的：

```text
深色桌面
+
不同机器人纹理
+
不同光照
+
不同背景
```

即使物理任务完全一样，策略看到的图像分布也已经变了。

因此 SimplerEnv 很重视：

> **缩小真实图像与仿真图像之间的视觉差异。**

---

## 5. Visual Matching

SimplerEnv 的一种核心评测方式叫：

```text
Visual Matching
```

它的思路非常直接：

> **尽可能把仿真环境调得和真实环境看起来一样。**

例如会调整：

- 背景；
- 桌面；
- 机器人颜色和纹理；
- 物体外观；
- 相机视角。

甚至可以利用真实图像中的背景，让模拟画面更接近真实机器人实际看到的画面。

最终希望：

```text
Real Observation
≈
Sim Observation
```

这样视觉策略在仿真中接收到的输入，就更接近真实部署时的输入。

---

## 6. Variant Aggregation

另一种评测方式叫：

```text
Variant Aggregation
```

它不要求找到唯一一个“最像真实世界”的模拟场景。

而是主动生成很多环境变化，例如：

```text
不同背景
不同光照
不同桌面纹理
不同物体位置
不同干扰物
```

然后让同一个策略在这些不同环境中重复评测。

最后把多个环境变体的结果综合起来：

$$
\text{Simulation Score}
=
\text{Aggregate of Multiple Variants}
$$

它背后的想法是：

> 真实世界本来就存在各种变化，因此不要把结论建立在某一个固定模拟场景上。

---

## 7. 一个策略是怎么被评测的

SimplerEnv 的基本流程可以概括成：

```text
加载 Robot Policy
        ↓
初始化模拟任务
        ↓
得到相机 Observation
        ↓
Policy 输出 Action
        ↓
Simulation 执行动作
        ↓
继续 Observation → Action
        ↓
成功 / 失败
```

然后改变：

- 初始物体位置；
- 机器人初始状态；
- 场景外观；
- 环境变体；

重复大量 rollout。

最终得到这个策略在模拟环境中的成功率。

---

## 8. Success Rate

最直观的评测指标仍然是：

```text
Success Rate
```

例如一个任务运行 100 次，其中成功 63 次：

$$
\text{Success Rate}
=
\frac{63}{100}
=
63\%
$$

但是对 SimplerEnv 来说，只看这个数字还不够。

真正重要的问题是：

> **仿真的 Success Rate 和真实机器人的 Success Rate 有没有一致的趋势？**

比如两个策略：

```text
Policy A
Policy B
```

如果真实机器人中 A 明显优于 B，那么理想的模拟评测也应该尽量得到：

```text
A > B
```

这才说明仿真评测具有参考价值。

---

## 9. 为什么还要看 Real-Sim Correlation

SimplerEnv 的目标不是单纯追求：

```text
仿真成功率越高越好
```

而是希望：

```text
Sim Evaluation
```

能够预测：

```text
Real Evaluation
```

因此它会关注：

> **不同策略在仿真中的相对表现，和真实世界中的相对表现是否一致。**

论文中使用了包括 Pearson Correlation 和 MMRV 在内的指标，来衡量模拟评测与真实评测的一致程度。

初学阶段不需要记具体公式，只需要理解：

> **一个好的 SimplerEnv 评测，不只是“能跑”，而是仿真结论要尽可能和真实机器人结论一致。**

---

## 10. SimplerEnv 最重要的理解

!!! abstract "SimplerEnv 核心"

    理解 SimplerEnv 时，记住下面几点就够了：

    1. SimplerEnv 是一个 **真实机器人策略的仿真评测框架**；
    2. 它的重点不是训练，而是 **Evaluation**；
    3. 核心思想是 **Real-to-Sim**：把真实机器人环境尽量复现到仿真中；
    4. 主要包含 Google Robot 和 WidowX + Bridge 两类真实机器人设置；
    5. 两种核心评测方式是 **Visual Matching** 和 **Variant Aggregation**；
    6. 最重要的不是单纯看模拟成功率，而是看：
       **仿真评测能不能反映真实机器人策略的表现。**

---

## 参考资料

1. **Evaluating Real-World Robot Manipulation Policies in Simulation**  
   Xuanlin Li et al.  
   CoRL, 2024.

2. **SimplerEnv Official Repository**  
   `simpler-env/SimplerEnv`

3. **SimplerEnv Project Website**  
   SimplerEnv Project.
