# CSS 檢查清單

## 選擇器與特異性
- [ ] 有無使用過於寬泛的選擇器（`div`, `*`）？
- [ ] 有無濫用 `!important`？特異性是否衝突？
- [ ] `id` vs. `class` 是否正確使用？

## 盒模型與佈局
- [ ] `width`/`height` 是否合理，`box-sizing` 是否正確？
- [ ] `margin`/`padding` 是否造成預期外的位移？
- [ ] `display` (`block`/`inline`/`flex`/`grid`), `position` (`relative`/`absolute`/`fixed`) 是否正確？
- [ ] `@media` 斷點是否與規格（mobile/tablet/desktop）一致？

## 視覺正確性
- [ ] `color`、`font-size`、`font-family` 是否符合設計 token？
- [ ] `border`、`border-radius`、`box-shadow` 是否正確？
- [ ] `z-index` 是否導致層疊錯誤（例如 Dropdown 被蓋過）？

## 狀態與動態樣式
- [ ] `:hover`, `:focus`, `:active` 是否有定義且生效？
- [ ] `:disabled`, `.loading`, `.error` 等狀態類別是否正確切換？

## 架構與框架
- [ ] class 命名是否符合 BEM / CSS Modules / Tailwind 等規範？
- [ ] Tailwind 中有無 `tw` 混合非 Tailwind 樣式，造成衝突？
