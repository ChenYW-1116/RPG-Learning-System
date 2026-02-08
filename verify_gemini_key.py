import sys
import json
import requests
import time
import io

# Force UTF-8 Output for Windows Terminals
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='backslashreplace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='backslashreplace')

# Colors for console output
class Colors:
    RESET = "\033[0m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    CYAN = "\033[36m"
    BOLD = "\033[1m"

def verify_gemini_key(api_key):
    print(f"\n{Colors.CYAN}{Colors.BOLD}════════════════════════════════════════════{Colors.RESET}")
    print(f"{Colors.CYAN}   🔑 Gemini API Key Validator (Python Edition){Colors.RESET}")
    print(f"{Colors.CYAN}════════════════════════════════════════════{Colors.RESET}\n")

    if not api_key:
        print(f"{Colors.RED}❌ ERROR: API Key not provided{Colors.RESET}")
        print(f"{Colors.YELLOW}Usage:{Colors.RESET}")
        print(f"   python verify_gemini_key.py {Colors.BOLD}<YOUR_API_KEY>{Colors.RESET}")
        return

    model = 'gemini-2.5-flash'
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    print(f"📡 Connecting to Google Gemini API...")
    print(f"⚙️ Model: {Colors.GREEN}{model}{Colors.RESET}")
    
    if len(api_key) > 12:
        masked_key = f"{api_key[:8]}...{api_key[-4:]}"
    else:
        masked_key = "***"
    print(f"🔑 Key : {masked_key}\n")

    payload = {
        "contents": [{
            "parts": [{"text": "Reply with 'Valid' if you can read this."}]
        }],
        "generationConfig": {
            "maxOutputTokens": 20
        }
    }

    start_time = time.time()

    try:
        response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'}, timeout=10)
        duration = time.time() - start_time
        
        # Check HTTP status code
        if response.status_code == 200:
            try:
                data = response.json()
                candidates = data.get('candidates', [])
                if candidates:
                    parts = candidates[0].get('content', {}).get('parts', [])
                    if parts:
                        description = parts[0].get('text', '(No text content)').strip()
                    else:
                        description = "(No parts in content)"
                else:
                    description = "(No candidates returned)"
                
                print(f"{Colors.GREEN}✅ Validation Success!{Colors.RESET}")
                print(f"⏱️ Time: {duration:.2f}s")
                print(f"🤖 Response: {description}")
            except Exception as parse_err:
                print(f"{Colors.YELLOW}⚠️ Valid HTTP 200 but failed to parse response: {parse_err}{Colors.RESET}")
                print(f"Raw: {response.text[:100]}...")

        else:
            print(f"{Colors.RED}❌ Validation Failed!{Colors.RESET}")
            print(f"⏱️ Time: {duration:.2f}s")
            print(f"⚠️ Status: {response.status_code}")
            
            try:
                error_data = response.json()
                error_msg = error_data.get('error', {}).get('message', response.text)
                print(f"⚠️ Reason: {error_msg}")
                
                if response.status_code == 400:
                    print(f"{Colors.YELLOW}hint: Check if Key format is correct.{Colors.RESET}")
                elif response.status_code == 401:
                    print(f"{Colors.YELLOW}hint: Key is invalid or expired.{Colors.RESET}")
                elif response.status_code == 404:
                     print(f"{Colors.YELLOW}hint: Model '{model}' not found. Try a different model.{Colors.RESET}")
            except:
                print(f"⚠️ Response: {response.text}")

    except Exception as e:
        print(f"\n{Colors.RED}❌ Connection Error:{Colors.RESET} {str(e)}")
        print(f"{Colors.YELLOW}Check your internet connection or proxy settings.{Colors.RESET}")

    print(f"\n{Colors.CYAN}════════════════════════════════════════════{Colors.RESET}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        verify_gemini_key(sys.argv[1])
    else:
        # Prompt user if no arg provided
        print("Please enter your Gemini API Key:")
        try:
            key = input("> ").strip()
            verify_gemini_key(key)
        except EOFError:
            pass
