# PPO

## Clipped Objective

$$
L^{CLIP}(\theta)=\mathbb{E}_t\left[\min\left(r_t(\theta)\hat A_t,\operatorname{clip}(r_t(\theta),1-\epsilon,1+\epsilon)\hat A_t\right)\right]
$$

其中：

$$
r_t(\theta)=\frac{\pi_\theta(a_t|s_t)}{\pi_{\theta_{old}}(a_t|s_t)}
$$

## 实验排查

!!! warning "VLA + PPO 常见问题"
    - reward 太稀疏
    - value 学不稳
    - old policy / rollout policy 不一致
    - action chunk 的时间尺度没有和 discount 对齐
