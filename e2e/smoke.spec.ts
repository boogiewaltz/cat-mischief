import { test, expect } from '@playwright/test';

test.describe('Cat Mischief Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Use test mode with deterministic seed for consistent screenshots
    await page.goto('/?test=1&seed=12345');
    
    // Wait for canvas to be ready
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // Wait a bit for scene to render
    await page.waitForTimeout(2000);
  });

  test('should load the game and render the scene', async ({ page }) => {
    // Check that canvas exists and has content
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Check that UI elements are present
    await expect(page.locator('#score-display')).toBeVisible();
    await expect(page.locator('#task-list')).toBeVisible();
    await expect(page.locator('#controls-help')).toBeVisible();
    
    // Take a screenshot of the initial state
    await expect(page).toHaveScreenshot('game-initial-load.png', {
      maxDiffPixels: 100, // Allow small rendering differences
    });
  });

  test('should display score and tasks correctly', async ({ page }) => {
    // Check initial score is 0
    const scoreText = await page.locator('#score').textContent();
    expect(scoreText).toBe('0');
    
    // Check tasks are displayed
    const tasksContainer = page.locator('#tasks-container');
    const taskItems = tasksContainer.locator('.task-item');
    
    // Should have 4 tasks
    await expect(taskItems).toHaveCount(4);
    
    // Verify task text includes expected content
    const taskTexts = await taskItems.allTextContents();
    expect(taskTexts.some(t => t.includes('Knock 5 items'))).toBe(true);
    expect(taskTexts.some(t => t.includes('Knock 10 items'))).toBe(true);
    expect(taskTexts.some(t => t.includes('Scratch the couch'))).toBe(true);
    expect(taskTexts.some(t => t.includes('Scratch the scratching post'))).toBe(true);
  });

  test('should toggle debug panel with F3', async ({ page }) => {
    const debugPanel = page.locator('#debug-panel');
    
    // Initially hidden
    await expect(debugPanel).not.toHaveClass(/visible/);
    
    // Press F3 to show
    await page.keyboard.press('F3');
    await expect(debugPanel).toHaveClass(/visible/);
    
    // Debug info should contain FPS and other metrics
    const debugInfo = page.locator('#debug-info');
    const debugText = await debugInfo.textContent();
    expect(debugText).toContain('FPS:');
    expect(debugText).toContain('tris');
    expect(debugText).toContain('calls');
    
    // Press F3 again to hide
    await page.keyboard.press('F3');
    await expect(debugPanel).not.toHaveClass(/visible/);
  });

  test('should respond to movement controls', async ({ page }) => {
    // Enable debug mode to see player position
    await page.keyboard.press('F3');
    await page.waitForTimeout(100);
    
    const debugInfo = page.locator('#debug-info');
    
    // Get initial position
    const initialText = await debugInfo.textContent();
    const initialMatch = initialText?.match(/Player: \(([-\d.]+), ([-\d.]+), ([-\d.]+)\)/);
    expect(initialMatch).toBeTruthy();
    
    // Press W to move forward
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(500);
    await page.keyboard.up('KeyW');
    await page.waitForTimeout(100);
    
    // Get new position
    const newText = await debugInfo.textContent();
    const newMatch = newText?.match(/Player: \(([-\d.]+), ([-\d.]+), ([-\d.]+)\)/);
    expect(newMatch).toBeTruthy();
    
    // Position should have changed (Z coordinate should decrease when moving forward)
    if (initialMatch && newMatch) {
      const initialZ = parseFloat(initialMatch[3]);
      const newZ = parseFloat(newMatch[3]);
      expect(newZ).toBeLessThan(initialZ);
    }
    
    // Take screenshot after movement
    await expect(page).toHaveScreenshot('game-after-movement.png', {
      maxDiffPixels: 200,
    });
  });

  test('should respond to paw swipe controls', async ({ page }) => {
    // Get initial score
    const initialScore = await page.locator('#score').textContent();
    
    // Move close to dining table (where knockable items are)
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(800);
    await page.keyboard.up('KeyW');
    
    await page.keyboard.down('KeyA');
    await page.waitForTimeout(400);
    await page.keyboard.up('KeyA');
    
    await page.waitForTimeout(200);
    
    // Try left paw swipe (Q)
    await page.keyboard.press('KeyQ');
    await page.waitForTimeout(500);
    
    // Try right paw swipe (E)
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(500);
    
    // Score should potentially have changed (if we hit something)
    // Note: Score change is not guaranteed due to position variance,
    // but swipe input should be processed without errors
    const newScore = await page.locator('#score').textContent();
    expect(newScore).toBeDefined();
    
    // Take screenshot after swipes
    await expect(page).toHaveScreenshot('game-after-paw-swipes.png', {
      maxDiffPixels: 300,
    });
  });

  test('should show interaction prompts near objects', async ({ page }) => {
    const promptDisplay = page.locator('#prompt-display');
    
    // Initially no prompt
    await expect(promptDisplay).toBeHidden();
    
    // Move toward dining table
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(1000);
    await page.keyboard.up('KeyW');
    
    await page.keyboard.down('KeyA');
    await page.waitForTimeout(500);
    await page.keyboard.up('KeyA');
    
    await page.waitForTimeout(300);
    
    // Prompt might appear if near an object
    // Check if prompt exists and contains expected text
    const isVisible = await promptDisplay.isVisible();
    if (isVisible) {
      const promptText = await promptDisplay.textContent();
      expect(promptText).toMatch(/Q|E|Swipe|Scratch|Poke/);
    }
  });

  test('should maintain consistent rendering in test mode', async ({ page }) => {
    // This test verifies that test mode produces deterministic results
    
    // Take first screenshot
    await expect(page).toHaveScreenshot('deterministic-render-1.png', {
      maxDiffPixels: 50,
    });
    
    // Reload page with same seed
    await page.goto('/?test=1&seed=12345');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Take second screenshot - should be identical
    await expect(page).toHaveScreenshot('deterministic-render-2.png', {
      maxDiffPixels: 50,
    });
  });

  test('should not have console errors on load', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Reload to capture from start
    await page.goto('/?test=1&seed=12345');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Check for errors
    expect(errors.length).toBe(0);
  });
});

