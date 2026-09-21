# XTX Research Notes

这是一个使用 [MkDocs Material](https://squidfunk.github.io/mkdocs-material/) 构建的个人科研与工程知识库，主要记录：

- Vision-Language-Action（VLA）模型与强化学习后训练
- PPO 等强化学习方法
- LIBERO、CALVIN、ManiSkill、SimplerEnv、RoboCasa、Meta-World 等机器人 Benchmark
- VLA 论文阅读笔记
- Linux、Git、CUDA/NCCL、FSDP 等工程实践与排障经验

在线站点：<https://xtx1216.github.io/research-notes/>

## 项目结构

```text
.
├── docs/
│   ├── VLA/            # VLA 模型与 RL 后训练
│   ├── RL/             # 强化学习方法
│   ├── Benchmarks/     # 机器人 Benchmark
│   ├── Paper-Notes/    # 论文阅读笔记与模板
│   ├── Engineering/    # 工程记录与问题排查
│   └── index.md        # 站点首页
├── mkdocs.yml          # 站点与导航配置
├── requirements.txt    # Python 依赖
├── start.sh            # Linux/macOS 本地启动脚本
└── .github/workflows/deploy.yml
                         # GitHub Pages 自动部署工作流
```

## 本地运行

环境要求：Python 3，建议使用虚拟环境。

### 使用启动脚本

在 Linux 或 macOS 下执行：

```bash
bash start.sh
```

脚本会在项目目录创建 `.venv`、安装依赖并启动开发服务器。随后访问：

```text
http://127.0.0.1:8000
```

### 手动启动

```bash
conda create -n note python=3.12
conda activate note
python -m pip install -r requirements.txt
mkdocs serve
```

Windows PowerShell 可使用：

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
mkdocs serve
```

## 构建检查

提交前建议执行严格构建：

```bash
mkdocs build --strict
```

生成的静态站点位于 `site/`，该目录不会提交到 Git。

## 自动部署

推送到 `main` 分支后，[GitHub Actions](.github/workflows/deploy.yml) 会自动：

1. 使用 Python 3.12 安装 `requirements.txt` 中的依赖；
2. 执行 `mkdocs build --strict`；
3. 上传生成的 `site/`；
4. 部署到 GitHub Pages。

首次配置仓库时，需要在 GitHub 的 **Settings → Pages → Build and deployment** 中将 Source 设置为 **GitHub Actions**。当前流程不使用 `gh-pages` 分支。

也可以在仓库的 Actions 页面手动运行部署工作流。

## 日常更新

```bash
git add .
git commit -m "update notes"
git push
```

笔记仍在持续整理中，部分模型和 Benchmark 页面目前保留了待补充项与实验记录模板。
