# ManiSkill

<span class="page-subtitle">
Robot Simulation · Manipulation Skills · GPU Parallelism
</span>

<div class="tags">
  <span>Benchmark</span>
  <span>Simulation</span>
  <span>Robot Manipulation</span>
  <span>GPU Parallel</span>
</div>

ManiSkill 是一个面向 **机器人操作学习** 的开源仿真与训练框架。

它建立在 SAPIEN 之上，提供统一的机器人环境、任务、观测、动作和评测接口。当前主线版本是 **ManiSkill 3**。

理解 ManiSkill 时，最重要的一点是：

> **它不只是一个“任务集合”，而是一整套用来构建、训练和评测机器人操作策略的仿真平台。**

---

## 1. ManiSkill 在做什么

机器人学习通常需要反复进行：

```text
观察环境
→ 输出动作
→ 环境变化
→ 获得奖励 / 判断成功
→ 继续交互
```

ManiSkill 把这一整套过程封装成标准环境。

一个任务可以简单写成：

$$
s_t
\longrightarrow
a_t
\longrightarrow
s_{t+1}
$$

其中：

- $s_t$：机器人和环境当前的状态；
- $a_t$：策略输出的动作；
- $s_{t+1}$：执行动作后的新状态。

因此对于学习算法来说，ManiSkill 提供的就是一个可以不断交互的机器人世界。

---

## 2. 任务是什么样的

ManiSkill 中有很多不同类型的机器人操作任务。

比较典型的包括：

```text
PickCube
PushCube
StackCube
PegInsertionSide
```

这些任务分别对应不同的基本操作能力。

例如 PickCube：

> 控制机械臂抓住一个方块，并把它移动到目标位置。

PegInsertionSide：

> 控制机械臂把 peg 对准并插入目标孔中。

随着任务复杂度提高，模型需要处理的不只是“移动到目标”，还包括：

- 抓取；
- 接触；
- 对齐；
- 插入；
- 堆叠；
- 多物体交互。

因此 ManiSkill 的核心对象就是：

> **Manipulation Skill，也就是机器人操作技能。**

---

## 3. 一个环境包含什么

一个 ManiSkill 任务通常由几部分组成：

```text
Robot
+
Scene
+
Objects
+
Observation
+
Action
+
Reward
+
Success Condition
```

其中 Robot 是执行任务的机器人，Scene 和 Objects 构成操作环境。

环境每执行一步，都会根据当前状态返回新的 observation，并判断：

- 任务是否成功；
- 是否达到时间上限；
- 当前获得多少 reward。

---

## 4. Observation

ManiSkill 支持不同形式的 observation。

常见模式包括：

```text
state
rgbd
pointcloud
```

### State

直接使用仿真器中的状态信息，例如：

- 机器人关节状态；
- 末端执行器位置；
- 物体位置和姿态；
- 目标位置。

这种方式适合研究控制和强化学习本身。

### RGB-D

使用相机产生的：

```text
RGB
+
Depth
```

此时策略需要从视觉中理解环境，而不是直接获得物体的真实坐标。

### Point Cloud

还可以把深度等信息转换成三维点云。

因此 ManiSkill 可以研究：

> **从真实状态控制机器人，也可以研究从视觉观测控制机器人。**

---

## 5. Action

ManiSkill 的动作空间取决于所使用的机器人和控制器。

常见控制方式包括：

```text
Joint Space
```

也就是直接控制机器人关节；

或者：

```text
End-Effector Space
```

控制机械臂末端执行器的位置和姿态。

例如：

$$
(\Delta x,\Delta y,\Delta z,
\Delta r_x,\Delta r_y,\Delta r_z)
$$

再加上夹爪控制。

所以同一个任务可以使用不同的控制方式完成。

需要注意的是：

> **ManiSkill 中的 action 并不是固定一种格式，而是由 control mode 决定。**

---

## 6. Reward 和 Success

机器人任务通常同时存在两个概念：

```text
Reward
```

和：

```text
Success
```

Reward 用来告诉学习算法：

> 当前这个状态或动作有多好。

Success Condition 则用于判断：

> 任务最终到底有没有完成。

例如 PickCube 中，可以把目标理解成：

```text
抓住 Cube
→ 移动到 Goal
→ Cube 足够接近 Goal
→ Robot 稳定
→ Success
```

因此训练过程中可能不断获得 reward，但真正评测时通常更关注任务是否成功。

---

## 7. Episode

在 ManiSkill 中，一次完整的任务执行通常称为一个：

```text
Episode
```

流程大致是：

```text
env.reset()
    ↓
得到初始 Observation
    ↓
Policy 输出 Action
    ↓
env.step(action)
    ↓
得到新的 Observation / Reward
    ↓
继续执行
    ↓
Success 或达到最大步数
```

完成以后再重新 reset，开始下一个 episode。

因此机器人策略最终就是在大量 episode 中不断学习。

---

## 8. 为什么要做 GPU Parallel Simulation

机器人强化学习通常需要非常多的环境交互。

如果一次只运行一个环境：

```text
Env 1
→ step
→ step
→ step
```

采样速度会很慢。

ManiSkill 支持在 GPU 上同时运行大量环境：

```text
Env 1 ─┐
Env 2  │
Env 3  ├→ GPU Parallel Simulation
...    │
Env N ─┘
```

这样就可以同时获得大量 rollout。

ManiSkill 3 同时支持 GPU 并行物理仿真和并行渲染，因此不仅 state-based 任务可以加速，视觉数据采集也可以并行进行。

这也是 ManiSkill 3 很重要的特点之一。

---

## 9. 不同机器人

ManiSkill 并不只绑定某一种机械臂。

框架中可以包含：

- 单臂机器人；
- 移动操作机器人；
- 双机器人任务；
- humanoid 等不同 embodiment。

部分任务也允许更换机器人。

这意味着同一个“操作技能”可以放到不同机器人身体上研究。

因此 ManiSkill 里的任务和机器人是两个相对独立的概念：

```text
Task
≠
Robot
```

任务描述“要做什么”，机器人决定“用什么身体去做”。

---

## 10. 数据和 Demonstration

除了在线与环境交互，ManiSkill 也支持机器人轨迹数据。

一条轨迹通常包含：

```text
Observation
+
Action
+
Reward
+
Next Observation
```

形成：

$$
(s_0,a_0,s_1,a_1,\ldots,s_T)
$$

这些轨迹可以作为 demonstration，用于训练模仿学习策略，也可以用来保存和分析机器人执行过程。

所以 ManiSkill 同时可以支持两种常见学习方式：

```text
直接和环境交互学习
```

以及：

```text
从已有轨迹中学习
```

---

## 11. 怎么看 ManiSkill 的结果

对于有明确成功条件的机器人操作任务，最直观的指标通常是：

```text
Success Rate
```

例如测试 100 个 episode，其中成功 82 次：

$$
\text{Success Rate}
=
\frac{82}{100}
=
82\%
$$

另外在强化学习过程中也经常观察：

```text
Episode Return
```

也就是一个 episode 内累计得到的 reward。

但二者含义不同：

- Return：训练过程中获得了多少奖励；
- Success Rate：最终任务完成了多少次。

对于操作任务，**Success Rate 通常更容易直接反映策略会不会完成任务。**

---

## 12. ManiSkill 最重要的理解

!!! abstract "ManiSkill 核心"

    理解 ManiSkill 时，记住下面几点就够了：

    1. ManiSkill 是一个 **机器人操作仿真与训练框架**；
    2. 当前主线是 **ManiSkill 3**，底层基于 SAPIEN；
    3. 一个任务包含 Robot、Scene、Observation、Action、Reward 和 Success Condition；
    4. Observation 可以是 state，也可以是 RGB-D、point cloud 等视觉信息；
    5. Action 由具体控制模式决定，可以控制关节或末端执行器；
    6. ManiSkill 3 的一个重要特点是 **GPU 并行物理仿真和渲染**；
    7. 最终核心目标仍然是：**训练并评测机器人是否能够完成各种 manipulation skills。**

---

## 参考资料

1. **ManiSkill3: GPU Parallelized Robotics Simulation and Rendering for Generalizable Embodied AI**  
   Stone Tao et al., RSS, 2025.

2. **ManiSkill Official Repository**  
   `mani-skill/ManiSkill`

3. **ManiSkill Documentation**  
   ManiSkill 官方文档。
