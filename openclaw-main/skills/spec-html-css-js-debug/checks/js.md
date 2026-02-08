# JavaScript 檢查清單

## DOM 與事件
- [ ] `querySelector` / `getElementById` 是否有拼錯或找不到元素？
- [ ] 事件監聽（`addEventListener` / 框架 `onClick`）是否正確掛在目標元素？
- [ ] 有無忘記 `event.preventDefault()`，導致 `a` 跳轉、`form`重整？

## 非同步與錯誤處理
- [ ] `fetch` / `axios` 是否有 `try-catch` 或 `.catch`？
- [ ] `async`/`await` 是否有 `await` 關鍵字？
- [ ] `Promise` 有無處理 `reject` 情況？

## 狀態與條件
- [ ] `state` 是否正確更新（React `setState` / Vue `data`）？
- [ ] `if` / `switch` / `for` 是否遺漏 `null`/`undefined`/`0`/`''` 等邊界？
- [ ] `==` vs. `===` 是否正確，避免類型陷阱？

## 框架問題
- React：`key` 是否正確，`useEffect` 有無依賴問題？
- Vue：`v-if` vs. `v-show`，`props` 有無 `emit` 正確事件？
- Angular：`@Input`/`@Output`、`ChangeDetection` 問題？

## 第三方與 API
- [ ] 表單驗證（Formik、Zod、Vuelidate）是否正確設定？
- [ ] Modal、Dropdown、Slider 等元件 props 是否傳遞正確？
- [ ] API 請求路徑、Payload、`Content-Type` 是否正確？
- [ ] 有無 `CORS`、`4xx`/`5xx` 等錯誤訊息？
