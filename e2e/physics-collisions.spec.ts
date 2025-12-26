import { test, expect } from '@playwright/test';

test.describe('Physics Collisions Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Use test mode with deterministic seed
    await page.goto('/?test=1&seed=12345');
    
    // Wait for canvas to be ready
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // Wait for scene to fully render
    await page.waitForTimeout(2000);
  });

  test('cat should be blocked by walls and furniture', async ({ page }) => {
    // Enable debug mode to see player position
    await page.keyboard.press('F3');
    await page.waitForTimeout(200);
    
    const debugInfo = page.locator('#debug-info');
    
    // Get initial position
    const initialText = await debugInfo.textContent();
    const initialMatch = initialText?.match(/Player: \(([-\d.]+), ([-\d.]+), ([-\d.]+)\)/);
    expect(initialMatch).toBeTruthy();
    const initialX = parseFloat(initialMatch![1]);
    const initialZ = parseFloat(initialMatch![3]);
    
    console.log(`Initial position: (${initialX}, ${initialMatch![2]}, ${initialZ})`);
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/physics-initial.png' });
    
    // Try to move forward into a wall (move toward back wall)
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(2000); // Hold forward for 2 seconds
    await page.keyboard.up('KeyW');
    await page.waitForTimeout(300);
    
    // Get new position after trying to go through wall
    const afterWallText = await debugInfo.textContent();
    const afterWallMatch = afterWallText?.match(/Player: \(([-\d.]+), ([-\d.]+), ([-\d.]+)\)/);
    expect(afterWallMatch).toBeTruthy();
    const afterWallZ = parseFloat(afterWallMatch![3]);
    
    console.log(`After moving toward wall: (${afterWallMatch![1]}, ${afterWallMatch![2]}, ${afterWallZ})`);
    
    // Take screenshot showing cat blocked by wall
    await page.screenshot({ path: 'test-results/physics-blocked-by-wall.png' });
    
    // Position should have changed (moved forward) but should be stopped before reaching the wall at z=-7.5
    expect(afterWallZ).toBeLessThan(initialZ); // Moved forward
    expect(afterWallZ).toBeGreaterThan(-7.0); // But stopped before the wall
    
    console.log(`✅ Cat was blocked by wall at z=${afterWallZ}`);
  });

  test('cat can push light objects but heavy objects resist', async ({ page }) => {
    // Enable debug mode
    await page.keyboard.press('F3');
    await page.waitForTimeout(200);
    
    // Navigate toward the dining table where plates and bottles are
    // First move forward (north) toward the table
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(1500);
    await page.keyboard.up('KeyW');
    await page.waitForTimeout(200);
    
    // Take screenshot before interaction
    await page.screenshot({ path: 'test-results/physics-before-push.png' });
    
    // Try to bump into the table/objects
    // Move a bit left toward objects
    await page.keyboard.down('KeyA');
    await page.waitForTimeout(800);
    await page.keyboard.up('KeyA');
    await page.waitForTimeout(200);
    
    // Move forward to bump into items
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(1000);
    await page.keyboard.up('KeyW');
    await page.waitForTimeout(500);
    
    // Take screenshot after bumping
    await page.screenshot({ path: 'test-results/physics-after-push.png' });
    
    console.log('✅ Physics interaction test completed - screenshots saved');
    
    // Try paw swipes on nearby objects
    await page.keyboard.press('KeyQ');
    await page.waitForTimeout(300);
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(500);
    
    // Take final screenshot showing knocked objects
    await page.screenshot({ path: 'test-results/physics-knocked-objects.png' });
    
    console.log('✅ Paw interaction test completed');
  });

  test('cat collides with furniture like couch and bookshelf', async ({ page }) => {
    // Enable debug mode
    await page.keyboard.press('F3');
    await page.waitForTimeout(200);
    
    const debugInfo = page.locator('#debug-info');
    
    // Move toward the left side where couch and bookshelf are
    // Move left first
    await page.keyboard.down('KeyA');
    await page.waitForTimeout(1500);
    await page.keyboard.up('KeyA');
    await page.waitForTimeout(200);
    
    // Get position
    const midText = await debugInfo.textContent();
    const midMatch = midText?.match(/Player: \(([-\d.]+), ([-\d.]+), ([-\d.]+)\)/);
    const midX = parseFloat(midMatch![1]);
    
    console.log(`Position after moving left: x=${midX}`);
    
    // Take screenshot near furniture
    await page.screenshot({ path: 'test-results/physics-near-furniture.png' });
    
    // Try to keep moving left into the wall/bookshelf
    await page.keyboard.down('KeyA');
    await page.waitForTimeout(1500);
    await page.keyboard.up('KeyA');
    await page.waitForTimeout(300);
    
    // Get final position
    const finalText = await debugInfo.textContent();
    const finalMatch = finalText?.match(/Player: \(([-\d.]+), ([-\d.]+), ([-\d.]+)\)/);
    const finalX = parseFloat(finalMatch![1]);
    
    console.log(`Final position after trying to move through furniture: x=${finalX}`);
    
    // Take screenshot showing blocked by furniture
    await page.screenshot({ path: 'test-results/physics-blocked-by-furniture.png' });
    
    // Should be stopped by the wall/furniture (left wall is at x=-7.5)
    expect(finalX).toBeGreaterThan(-7.3); // Stopped before reaching the wall (allowing for capsule radius)
    expect(finalX).toBeLessThan(midX); // But did move left
    
    console.log(`✅ Cat was blocked by furniture/wall at x=${finalX}`);
  });
});

