# GAE

$$
\delta_t=r_t+\gamma V(s_{t+1})-V(s_t)
$$

$$
\hat A_t=\sum_{l=0}^{\infty}(\gamma\lambda)^l\delta_{t+l}
$$

## 直觉

- $\lambda$ 小：偏向低方差、高偏差。
- $\lambda$ 大：使用更长时间跨度的信息。
