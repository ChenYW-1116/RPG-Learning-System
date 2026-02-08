
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Tic-Tac-Toe Game Verification', () => {
    test.beforeEach(async ({ page }) => {
        // Point to the local file
        const filePath = path.resolve(__dirname, 'samples/井字遊戲自動生成.html');
        await page.goto(`file://${filePath}`);
    });

    test('Should display the game title', async ({ page }) => {
        const title = await page.textContent('h1');
        expect(title).toContain('井字遊戲');
    });

    test('Should render a 3x3 grid', async ({ page }) => {
        // Assuming standard grid structure (adjust selector based on actual generated code)
        // Usually cells are buttons or divs in a grid container
        const cells = await page.$$('.cell, .grid button, [data-cell]');
        expect(cells.length).toBeGreaterThanOrEqual(9);
    });

    test('Should handle player click', async ({ page }) => {
        // Find first cell and click
        const cell = page.locator('.cell, .grid button, [data-cell]').first();
        await cell.click();

        // Expect 'X' or 'O' or some mark
        const content = await cell.textContent();
        expect(['X', 'O']).toContain(content.trim());
    });
});
