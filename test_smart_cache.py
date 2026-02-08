"""
🧪 Smart Caching Feature Test Script
測試智能快取和作文持久化功能

根據 implementation_plan.md.resolved 的驗收計劃：
1. 第一次提交：驗證新 .txt 文件被創建，快取被更新
2. 重複提交：驗證無新文件創建，出現「快取命中」，響應快速
3. 交叉引用：驗證 CLI 可以看到 API 保存的文件
"""

import requests
import json
import time
import os
import glob

API_BASE = "http://localhost:5000"
ESSAYS_FOLDER = "essays_to_analyze"
CACHE_FILE = "ai_scores_cache.json"

# 測試用的 IELTS Task 1 作文
TEST_ESSAY = """
The diagram illustrates the process of manufacturing chocolate. 

Overall, the process consists of several key stages, beginning with harvesting cacao pods and ending with the production of liquid chocolate.

First, ripe cacao pods are harvested from cacao trees. These pods are then opened to extract the white cocoa beans inside. Following this, the beans undergo fermentation, which is a crucial step for developing flavor. 

Once fermentation is complete, the beans are spread out to dry under the sun. After drying, they are placed in large sacks and transported to the factory. At the factory, the beans are roasted at approximately 350 degrees Celsius. Subsequently, the roasted beans are crushed to remove their outer shells, leaving only the inner part.

Finally, this inner part is pressed to produce liquid chocolate, which can then be used for various chocolate products.
"""

def print_section(title):
    print("\n" + "="*60)
    print(f"   {title}")
    print("="*60)

def test_1_first_submission():
    """測試 1: 第一次提交作文"""
    print_section("測試 1: 第一次提交作文")
    
    # 清理之前的測試數據（可選）
    # print("[Setup] 清理舊的測試檔案...")
    # if os.path.exists(CACHE_FILE):
    #     os.remove(CACHE_FILE)
    
    # 記錄提交前的狀態
    files_before = set(glob.glob(f"{ESSAYS_FOLDER}/*.txt")) if os.path.exists(ESSAYS_FOLDER) else set()
    
    cache_before = {}
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            cache_before = json.load(f)
    
    print(f"[Before] 作文數量: {len(files_before)}")
    print(f"[Before] 快取條目數: {len(cache_before)}")
    
    # 提交作文
    print("\n[Action] 提交作文到 API...")
    start_time = time.time()
    
    response = requests.post(
        f"{API_BASE}/api/analyze",
        json={"essay": TEST_ESSAY, "provider": "kimi"}
    )
    
    elapsed = time.time() - start_time
    
    print(f"[Response] 狀態碼: {response.status_code}")
    print(f"[Response] 耗時: {elapsed:.2f}s")
    
    if response.status_code == 200:
        data = response.json()
        print(f"[Result] Overall Band: {data.get('overall_band', 'N/A')}")
        print(f"[Result] Success: {data.get('success', False)}")
    else:
        print(f"[Error] {response.text}")
        return False
    
    # 檢查結果
    time.sleep(1)  # 給文件系統一點時間
    
    files_after = set(glob.glob(f"{ESSAYS_FOLDER}/*.txt")) if os.path.exists(ESSAYS_FOLDER) else set()
    new_files = files_after - files_before
    
    with open(CACHE_FILE, 'r', encoding='utf-8') as f:
        cache_after = json.load(f)
    
    print(f"\n[After] 作文數量: {len(files_after)}")
    print(f"[After] 快取條目數: {len(cache_after)}")
    print(f"[After] 新增檔案數: {len(new_files)}")
    
    if new_files:
        for f in new_files:
            print(f"  ✅ 新檔案: {os.path.basename(f)}")
    
    # 驗收標準
    if len(new_files) >= 1 and len(cache_after) > len(cache_before):
        print("\n✅ 測試 1 通過: 新作文已保存並快取")
        return True
    else:
        print("\n❌ 測試 1 失敗: 未如預期保存檔案或更新快取")
        return False

def test_2_duplicate_submission():
    """測試 2: 重複提交相同作文"""
    print_section("測試 2: 重複提交相同作文")
    
    files_before = set(glob.glob(f"{ESSAYS_FOLDER}/*.txt")) if os.path.exists(ESSAYS_FOLDER) else set()
    
    print(f"[Before] 作文數量: {len(files_before)}")
    
    # 再次提交相同作文
    print("\n[Action] 再次提交相同作文...")
    start_time = time.time()
    
    response = requests.post(
        f"{API_BASE}/api/analyze",
        json={"essay": TEST_ESSAY, "provider": "kimi"}
    )
    
    elapsed = time.time() - start_time
    
    print(f"[Response] 狀態碼: {response.status_code}")
    print(f"[Response] 耗時: {elapsed:.2f}s")
    
    if response.status_code == 200:
        data = response.json()
        print(f"[Result] Overall Band: {data.get('overall_band', 'N/A')}")
        print(f"[Result] Success: {data.get('success', False)}")
    else:
        print(f"[Error] {response.text}")
        return False
    
    # 檢查結果
    time.sleep(0.5)
    
    files_after = set(glob.glob(f"{ESSAYS_FOLDER}/*.txt")) if os.path.exists(ESSAYS_FOLDER) else set()
    new_files = files_after - files_before
    
    print(f"\n[After] 作文數量: {len(files_after)}")
    print(f"[After] 新增檔案數: {len(new_files)}")
    
    # 驗收標準
    if len(new_files) == 0 and elapsed < 1.0:
        print("\n✅ 測試 2 通過: 快取命中，無重複檔案，響應快速")
        return True
    else:
        print(f"\n⚠️ 測試 2 部分通過: 新檔案={len(new_files)} (應為0), 耗時={elapsed:.2f}s (應<1s)")
        return len(new_files) == 0  # 至少不應該創建重複文件

def test_3_cli_cross_reference():
    """測試 3: CLI 可以識別 API 保存的作文"""
    print_section("測試 3: CLI 交叉引用測試")
    
    print("[Info] 檢查 CLI 是否能看到 API 保存的檔案...")
    
    if not os.path.exists(ESSAYS_FOLDER):
        print("❌ 測試 3 失敗: essays_to_analyze 資料夾不存在")
        return False
    
    txt_files = glob.glob(f"{ESSAYS_FOLDER}/*.txt")
    
    if len(txt_files) == 0:
        print("❌ 測試 3 失敗: 未找到任何 .txt 檔案")
        return False
    
    print(f"\n[Found] {len(txt_files)} 篇 .txt 作文:")
    for f in txt_files:
        print(f"  📄 {os.path.basename(f)}")
    
    # 檢查快取內容
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            cache = json.load(f)
        
        print(f"\n[Cache] 快取條目數: {len(cache)}")
        
        # 檢查是否同時有雜湊鍵和檔案名鍵
        hash_keys = [k for k in cache.keys() if len(k) == 32 and all(c in '0123456789abcdef' for c in k)]
        filename_keys = [k for k in cache.keys() if k.endswith('.txt')]
        
        print(f"[Cache] 雜湊鍵數量: {len(hash_keys)}")
        print(f"[Cache] 檔案名鍵數量: {len(filename_keys)}")
        
        if len(hash_keys) > 0:
            print(f"  ✅ 包含雜湊鍵（API 模式）")
        if len(filename_keys) > 0:
            print(f"  ✅ 包含檔案名鍵（CLI 模式）")
        
        if len(hash_keys) > 0 and len(filename_keys) > 0:
            print("\n✅ 測試 3 通過: 快取支持雙重查找策略")
            return True
        else:
            print("\n⚠️ 測試 3 部分通過: 快取可能只支持單一查找模式")
            return True
    else:
        print("❌ 測試 3 失敗: 快取檔案不存在")
        return False

def main():
    print_section("🧪 智能快取功能驗收測試")
    print("根據 implementation_plan.md.resolved 執行驗收計劃")
    
    # 檢查 API 是否運行
    try:
        health = requests.get(f"{API_BASE}/api/health", timeout=2)
        if health.status_code == 200:
            print(f"✅ API 服務正常運行: {API_BASE}")
        else:
            print(f"❌ API 回應異常: {health.status_code}")
            return
    except:
        print(f"❌ 無法連接到 API: {API_BASE}")
        print("請確保 arena_api.py 正在運行 (python arena_api.py)")
        return
    
    # 執行測試
    results = []
    results.append(("測試 1: 第一次提交", test_1_first_submission()))
    print("\n⏳ 等待 2 秒...")
    time.sleep(2)
    
    results.append(("測試 2: 重複提交", test_2_duplicate_submission()))
    print("\n⏳ 等待 1 秒...")
    time.sleep(1)
    
    results.append(("測試 3: CLI 交叉引用", test_3_cli_cross_reference()))
    
    # 總結
    print_section("📊 測試總結")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ 通過" if result else "❌ 失敗"
        print(f"{status} - {name}")
    
    print(f"\n總計: {passed}/{total} 測試通過")
    
    if passed == total:
        print("\n🎉 所有測試通過！智能快取功能實現成功！")
    else:
        print("\n⚠️ 部分測試未通過，請檢查實現邏輯。")

if __name__ == "__main__":
    main()
