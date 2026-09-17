def test_project_layout():
    import os

    root = os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )
    for name in ("backend", "frontend", "docs", "data", "scripts"):
        assert os.path.isdir(os.path.join(root, name)), f"缺少資料夾: {name}"
    for name in ("README.md", ".gitignore", ".env.example"):
        assert os.path.isfile(os.path.join(root, name)), f"缺少檔案: {name}"