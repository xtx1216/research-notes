# CUDA / NCCL

## NCCL Timeout 排查

```bash
export NCCL_DEBUG=INFO
export TORCH_NCCL_TRACE_BUFFER_SIZE=1048576
```

重点检查：

- 某个 rank 是否 OOM / 卡死
- dataloader 是否不同步
- GPU P2P / NVLink / PCIe 状态
- collective 输入 shape 是否一致
