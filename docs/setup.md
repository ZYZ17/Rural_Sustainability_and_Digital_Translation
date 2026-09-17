# 環境設定與變數說明

## 環境變數

| 變數 | 說明 | 範例 |
| ---- | ---- | ---- |
| `APP_ENV` | 執行環境 | `development` / `production` |
| `APP_DEBUG` | 是否開啟除錯模式 | `true` / `false` |
| `APP_SECRET_KEY` | 應用程式簽章金鑰（請隨機產生） | `s3cr3t` |
| `PORT` | 服務監聽埠號 | `3000` |

### 產生隨機金鑰

```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

## 資料目錄

- `data/raw/`：原始資料，來源檔案不應修改。
- `data/processed/`：處理後資料。
- `data/raw/personal/` 與 `data/raw/private/`：含個人或敏感資訊，請勿上傳至版本控制（已在 `.gitignore` 排除）。

## 常用指令

```powershell
# 後端測試
py -m pytest backend/tests -v

# 前端建置
npm run build --prefix frontend
```