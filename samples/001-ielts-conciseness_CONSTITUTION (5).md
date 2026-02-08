# 專案憲章: IELTS Writing Conciseness Coach

**版本**: 1.0.0  
**批准日期**: 2024-05-28

## 原則一：程式碼品質
**描述**: 任何進入主線的程式碼都必須具備可讀性、可維護性與一致性，並遵循 Python PEP8／JavaScript Standard Airbnb Style。

### 必須規則 (MUST)
- pre-commit hooks（black、isort、flake8）必須全部通過才能提交。
- docstring & type-hint覆蓋率達100%，否則 CI/CD Pipeline自動失敗。

### 應當規則 (SHOULD)
- PR Review至少由兩名團隊成員核准後方可合併。

## 原則二：測試覆蓋
**描述**: 「能測就測」；任何新功能或缺陷修復都需伴隨自動化測試，確保回歸安全網完整。

### 必須規則 (MUST)
- unit test覆蓋率≥90%，低於門檻時CI拒絕合併。
- API端點整合測試使用pytest + FastAPI TestClient，每個公開路由至少一條正向與一條異常案例。

### 應當規則 (SHOULD)
- e2e場景每日夜間排程執行；失敗時次日10:00前完成修復或降級處理。

## 原則三：架構簡潔
**描述**: Keep It Simple, Stupid。僅在「必要複雜度」出現時才引入抽象層，避免過早優化與過度工程化。

### 必須規則 (MUST)
- core business logic不得依賴第三方框架細節（如FastAPI/Django ORM），透過Repository/Service層隔離。
- infra資料夾僅存放外部服務實作（DB、快取、LLM Client），禁止在此撰寫商業邏輯。

### 應當規則 (SHOULD)
- PR若新增超過3個以上設計模式或額外套件，需在PR說明中提供「為何必要」佐證文件。