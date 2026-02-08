/**
 * Reference Implementation for Data Simulation Service
 * 
 * Usage:
 * const service = new DataService({ useMock: true, latency: 800 });
 * const data = await service.getUserStats();
 */

class DataService {
    constructor(config = {}) {
        this.useMock = config.useMock !== undefined ? config.useMock : true;
        this.latency = config.latency || 800; // Simulated network delay in ms
    }

    // --- Public API ---

    async getUserStats() {
        if (this.useMock) {
            await this._simulateDelay();
            return this._mockUserStats();
        }
        return this._fetch('/api/user/stats');
    }

    async submitEssay(text) {
        if (this.useMock) {
            await this._simulateDelay();
            if (!text || text.length < 50) {
                throw new Error("Essay too short (Mock Validation)");
            }
            return {
                id: 'sub_' + Date.now(),
                score: (5.5 + Math.random() * 3).toFixed(1),
                feedback: "Good effort. Focus on cohesion in the second paragraph."
            };
        }
        return this._post('/api/essay/submit', { text });
    }

    // --- Internal Helpers ---

    _simulateDelay() {
        return new Promise(resolve => setTimeout(resolve, this.latency));
    }

    async _fetch(url) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn(`[DataService] Fetch failed for ${url}, falling back to mock.`);
            return this._mockUserStats(); // Fallback strategy
        }
    }

    async _post(url, body) {
        // Implementation for real POST
    }

    // --- Mock Generators ---

    _mockUserStats() {
        // Generate realistic, varied data to test UI adaptation
        return {
            username: "Student_" + Math.floor(Math.random() * 1000),
            sessionsCompleted: 12,
            averageScore: 7.5,
            level: "Advanced",
            recentActivity: Array.from({ length: 5 }, (_, i) => ({
                id: i,
                date: new Date(Date.now() - i * 86400000).toISOString(),
                score: (6 + Math.random() * 3).toFixed(1),
                type: i % 2 === 0 ? "Task 1" : "Task 2"
            }))
        };
    }
}

// Export for usage if using modules, or attach to window
window.DataService = DataService;
