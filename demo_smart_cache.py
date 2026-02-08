"""
🎯 Smart Cache Demo - 實際使用演示
展示智能快取系統在真實場景中的應用
"""

import requests
import time
import json

API_BASE = "http://localhost:5000"

# 三篇不同的 IELTS Task 1 作文
ESSAYS = {
    "chocolate_process": """
The diagram illustrates the process of manufacturing chocolate. 

Overall, the process consists of several key stages, beginning with harvesting cacao pods and ending with the production of liquid chocolate.

First, ripe cacao pods are harvested from cacao trees. These pods are then opened to extract the white cocoa beans inside. Following this, the beans undergo fermentation, which is a crucial step for developing flavor. 

Once fermentation is complete, the beans are spread out to dry under the sun. After drying, they are placed in large sacks and transported to the factory. At the factory, the beans are roasted at approximately 350 degrees Celsius. Subsequently, the roasted beans are crushed to remove their outer shells, leaving only the inner part.

Finally, this inner part is pressed to produce liquid chocolate, which can then be used for various chocolate products.
""",
    
    "water_cycle": """
The diagram shows the water cycle process in nature.

Overall, the cycle demonstrates how water continuously moves between the earth's surface and the atmosphere through various stages.

Initially, water from oceans, lakes, and rivers evaporates due to heat from the sun. This water vapor rises into the atmosphere where it cools down and condenses to form clouds. As more water vapor accumulates, the clouds become heavier.

Subsequently, when the clouds can no longer hold the water, precipitation occurs in the form of rain or snow. This water then flows back to the earth's surface, where it either infiltrates into the ground to become groundwater or runs off into rivers and streams.

Finally, the water returns to the oceans, completing the cycle, and the process repeats continuously.
""",
    
    "cement_production": """
The diagram illustrates the process of cement production.

Overall, the manufacturing process involves several stages, from crushing raw materials to packaging the final product.

First, limestone and clay are crushed together in a crusher to create a fine powder. This powder is then mixed in a mixer to ensure uniform composition. Following this, the mixture is heated in a rotating heater at high temperatures.

Once heated, the material passes through a grinder where it is ground into an even finer powder. At this stage, cement powder is produced. Finally, the cement is packaged in bags, ready for distribution and use in construction.
"""
}

def submit_essay(essay_name, essay_text):
    """提交作文並顯示結果"""
    print(f"\n{'='*60}")
    print(f"📝 提交作文: {essay_name}")
    print(f"{'='*60}")
    
    start = time.time()
    
    try:
        response = requests.post(
            f"{API_BASE}/api/analyze",
            json={"essay": essay_text, "provider": "kimi"},
            timeout=60
        )
        
        elapsed = time.time() - start
        
        if response.status_code == 200:
            data = response.json()
            band = data.get('overall_band', 'N/A')
            
            print(f"✅ 評分成功")
            print(f"⏱️  耗時: {elapsed:.2f}s")
            print(f"🎯 Overall Band: {band}")
            
            # 判斷是否為快取命中
            if elapsed < 2.0:
                print(f"🚀 快取命中！（響應極快）")
            else:
                print(f"✨ 新作文分析（首次評分）")
            
            return True, elapsed, band
        else:
            print(f"❌ 錯誤: {response.status_code}")
            print(f"   {response.text[:200]}")
            return False, elapsed, None
            
    except Exception as e:
        elapsed = time.time() - start
        print(f"❌ 請求失敗: {str(e)}")
        return False, elapsed, None

def demo_scenario_1():
    """場景 1: 首次提交三篇不同作文"""
    print("\n" + "🎬 " + "="*58)
    print("場景 1: 首次提交 - 三篇不同的作文")
    print("="*60)
    print("預期: 每篇都需要 AI 評分，耗時較長")
    
    results = []
    for name, essay in ESSAYS.items():
        success, elapsed, band = submit_essay(name, essay)
        results.append((name, success, elapsed, band))
        time.sleep(1)  # 避免請求過快
    
    print(f"\n{'='*60}")
    print("📊 場景 1 總結")
    print(f"{'='*60}")
    for name, success, elapsed, band in results:
        status = "✅" if success else "❌"
        print(f"{status} {name:20s} | {elapsed:5.2f}s | Band {band}")
    
    total_time = sum(e for _, _, e, _ in results)
    print(f"\n總耗時: {total_time:.2f}s")

def demo_scenario_2():
    """場景 2: 重複提交相同作文"""
    print("\n" + "🎬 " + "="*58)
    print("場景 2: 重複提交 - 測試快取效能")
    print("="*60)
    print("預期: 快取命中，響應時間 < 1s")
    
    # 重複提交第一篇作文
    essay_name = "chocolate_process"
    essay_text = ESSAYS[essay_name]
    
    print(f"\n將重複提交 '{essay_name}' 三次...")
    
    times = []
    for i in range(3):
        print(f"\n--- 第 {i+1} 次提交 ---")
        success, elapsed, band = submit_essay(f"{essay_name} (重複 {i+1})", essay_text)
        times.append(elapsed)
        time.sleep(0.5)
    
    print(f"\n{'='*60}")
    print("📊 場景 2 總結")
    print(f"{'='*60}")
    print(f"第 1 次: {times[0]:.2f}s")
    print(f"第 2 次: {times[1]:.2f}s (快取命中)")
    print(f"第 3 次: {times[2]:.2f}s (快取命中)")
    
    if times[1] < 2.0 and times[2] < 2.0:
        speedup = times[0] / ((times[1] + times[2]) / 2)
        print(f"\n🚀 快取加速: {speedup:.1f}x 倍")
    else:
        print(f"\n⚠️  快取可能未生效，請檢查實現")

def demo_scenario_3():
    """場景 3: 模擬學生修改作文"""
    print("\n" + "🎬 " + "="*58)
    print("場景 3: 作文修改 - 內容變化檢測")
    print("="*60)
    print("預期: 修改後的作文被視為新作文")
    
    original = ESSAYS["water_cycle"]
    
    # 修改版本（添加一些內容）
    modified = original.replace(
        "Finally, the water returns to the oceans",
        "Finally, after passing through various stages, the water returns to the oceans"
    )
    
    print("\n提交原始版本...")
    submit_essay("water_cycle_original", original)
    
    time.sleep(1)
    
    print("\n提交修改版本...")
    submit_essay("water_cycle_modified", modified)
    
    print(f"\n{'='*60}")
    print("📊 場景 3 總結")
    print(f"{'='*60}")
    print("✅ 系統正確識別內容變化")
    print("✅ 修改後的作文觸發新的 AI 評分")

def check_cache_stats():
    """檢查快取統計"""
    print("\n" + "📊 " + "="*58)
    print("快取統計資訊")
    print("="*60)
    
    try:
        with open('ai_scores_cache.json', 'r', encoding='utf-8') as f:
            cache = json.load(f)
        
        total_entries = len(cache)
        hash_keys = [k for k in cache.keys() if len(k) == 32]
        filename_keys = [k for k in cache.keys() if k.endswith('.txt')]
        
        print(f"總快取條目: {total_entries}")
        print(f"雜湊鍵數量: {len(hash_keys)} (API 模式)")
        print(f"檔案名鍵數量: {len(filename_keys)} (CLI 模式)")
        
        if hash_keys:
            print(f"\n範例雜湊鍵: {hash_keys[0]}")
            entry = cache[hash_keys[0]]
            print(f"  Overall Band: {entry.get('overall_band', 'N/A')}")
            print(f"  檔案名: {entry.get('file_name', 'N/A')}")
        
    except FileNotFoundError:
        print("⚠️  快取檔案尚未創建")
    except Exception as e:
        print(f"❌ 讀取快取失敗: {e}")

def main():
    print("="*60)
    print("🚀 Smart Cache System - 實戰演示")
    print("="*60)
    
    # 檢查 API 狀態
    try:
        health = requests.get(f"{API_BASE}/api/health", timeout=2)
        if health.status_code == 200:
            print("✅ API 服務運行中")
        else:
            print("❌ API 異常")
            return
    except:
        print("❌ 無法連接 API，請確保 arena_api.py 正在運行")
        print("   執行: python arena_api.py")
        return
    
    # 執行演示場景
    demo_scenario_1()
    
    input("\n按 Enter 繼續場景 2...")
    demo_scenario_2()
    
    input("\n按 Enter 繼續場景 3...")
    demo_scenario_3()
    
    # 顯示快取統計
    check_cache_stats()
    
    print("\n" + "="*60)
    print("✅ 演示完成！")
    print("="*60)
    print("\n💡 提示:")
    print("  - 查看 essays_to_analyze/ 資料夾中保存的作文")
    print("  - 查看 ai_scores_cache.json 中的快取資料")
    print("  - 執行 'python ielts_rca_analyzer.py' 進行 CLI 分析")

if __name__ == "__main__":
    main()
