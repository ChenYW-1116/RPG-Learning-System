---
name: spec-kit-data-simulation
description: Rules and patterns for mocking backend data and simulating API delays. Use this to prevent "fetch failed" errors and ensure the UI is populated with realistic test data in a standalone environment.
---

# 🤖 Data Simulation & Mocking

One of the most common causes of broken generated apps is **Backend Hallucination**—assuming a server exists when it doesn't. This skill enforces the creation of robust **Simulation Layers**.

## 1. 🚫 Problem: The "Fetch" Hallucination
**Bad Code:**
```javascript
// FAILS in standalone/file:// environment
const data = await fetch('/api/user/stats').then(res => res.json());
```

## 2. ✅ Solution: The Mock Adapter Pattern
Instead of direct `fetch` calls, create a `Service` class with a `useMock` toggle.

### ✨ Reference Implementation

> **Full Source File**: [examples/reference-sim.js](examples/reference-sim.js)

```javascript
class DataService {
    constructor(useMock = true) {
        this.useMock = useMock;
        this.latency = 800; // Simulated network delay
    }

    async getStats() {
        if (this.useMock) {
            await this.simulateDelay();
            return this.generateMockStats();
        }
        // Real implementation would go here
        return fetch('/api/stats').then(r => r.json());
    }

    simulateDelay() {
        return new Promise(resolve => setTimeout(resolve, this.latency));
    }

    generateMockStats() {
        // Return rich, realistic data, not just "Test"
        return {
            sessionsCompleted: 12,
            averageScore: 7.5,
            recentActivity: Array.from({ length: 5 }, (_, i) => ({
                id: i,
                date: new Date(Date.now() - i * 86400000).toISOString(),
                score: (6 + Math.random() * 3).toFixed(1)
            }))
        };
    }
}
```

## 3. 🎲 Realistic Data Generation
Do not use placeholder text like "Lorem Ipsum" or "Test 1".
- **Names**: Use realistic names (e.g., "Project Alpha", "IELTS Task 2").
- **Numbers**: Use varying numbers to test layout (e.g., `0`, `1`, `9999`).
- **Dates**: Use relative dates (e.g., "2 hours ago").

## 4. 🧪 Integration Strategy
1.  **Initialize** the service at app boot.
2.  **Bind** it to the global `window.app` for debugging.
3.  **Use** it in `init()` to populate the dashboard immediately.

```javascript
// Boot
window.service = new DataService(true); // Force Mock Mode
window.app = new App(window.service);
```
