# HTML 與規格對應檢查

- [ ] 結構與標籤是否與 spec 中定義的元件結構一致（例如 spec 要求用 `<button>`，不能用 `div` + `onclick`）。
- [ ] 語意是否正確，特別檢查：
  - 表單：`<form>`、`<input name="..." id="...">`、`<label for="...">`
  - 按鈕：`<button type="...">`，非 `div`
  - 導航：`<nav>`、`<main>`、`<aside>` 是否正確使用
- [ ] class 命名是否符合規範（如 BEM、`btn-primary`，或 Tailwind 類別）？
- [ ] 有無遺漏必要的屬性（`required`、`disabled`、`readonly`、`data-*` 狀態屬性）？
- [ ] 可及性（A11y）：
  - 所有互動元素是否可 focus？
  - `aria-*` 是否完整（`aria-label`、`aria-describedby`、`aria-invalid`）？
