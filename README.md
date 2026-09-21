# Research Notes - MkDocs Starter

这是一个基于 **MkDocs Material** 的科研笔记站模板。

## 1. 本地运行

```bash
python -m venv .venv

# Linux / macOS
source .venv/bin/activate

# Windows PowerShell
# .venv\\Scripts\\Activate.ps1

pip install -r requirements.txt
mkdocs serve
```

打开：

```text
http://127.0.0.1:8000
```

## 2. 发布到 GitHub Pages

1. 在 GitHub 创建仓库，例如 `research-notes`。
2. 修改 `mkdocs.yml` 中的：
   - `YOUR_GITHUB_USERNAME`
   - `site_url`
   - `repo_url`
3. 提交代码到 `main` 分支。
4. GitHub Actions 会执行 `.github/workflows/deploy.yml`。
5. 在仓库 Settings → Pages 中，选择 `gh-pages` 分支作为 Pages 来源（如果 GitHub 没有自动配置）。

## 3. 日常更新

```bash
git add .
git commit -m "update notes"
git push
```

push 后网站会自动重新部署。
