# 鄉村永續與數位轉譯

鄉村永續發展與數位轉譯專案（Rural Sustainability & Digital Translation）。

## 專案簡介

本專案以鄉村永續發展為核心，結合數位轉譯方法，蒐集、整理並再現地方知識與永續發展資料。

## 套件與環境

| 工具 | 版本 |
| ---- | ---- |
| Git | git 2.42.0 |
| Python | Python 3.13/3.12 |
| Node.js | v22.12.0 |
| npm | 10.9.0 |
| GitHub CLI | 2.101.0 |

## 專案結構

```
.
├── .github/          # GitHub workflows 與 PR 範本
├── backend/          # Python 後端應用
│   ├── app/          # 應用程式主程式
│   └── tests/        # 後端測試
├── data/             # 資料檔案（原始資料與整理資料）
├── docs/             # 專案文件
├── frontend/         # Web 前端應用
├── scripts/          # 公用工具腳本
└── .env.example      # 環境變數範本
```

## 快速開始

### Python 後端

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 前端

```powershell
cd frontend
npm install
npm run dev
```

## 環境變數

複製 `.env.example` 為 `.env` 並填入實際值。設定檔說明請見 [docs/setup.md](docs/setup.md)。

## 授權

保留所有權利。版權所有 (C) 2026。