# Potential-Based Reward Shaping

经典 PBRS：

$$
F(s_t,s_{t+1})=\gamma\Phi(s_{t+1})-\Phi(s_t)
$$

## VLA / Action Chunk 场景

若一个 action chunk 包含 $m_k$ 个底层环境步，可记录为：

$$
F_{SMDP}=\gamma^{m_k}\Psi(s_{k+1})-\Psi(s_k)
$$

!!! note
    这里尤其要区分 true terminal 与 time-limit truncation。
