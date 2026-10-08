import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5174', '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] });
let serverLog = '';
server.stdout.on('data', data => { serverLog = (serverLog + data).slice(-6000); });
server.stderr.on('data', data => { serverLog = (serverLog + data).slice(-6000); });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const base = 'http://127.0.0.1:5174';
let browser;
let activePage;
const errors = [];

async function checkLayout(page, label) {
  // ResizeObserver aligns overlay anchors after responsive wrapping settles.
  await page.waitForFunction(() => {
    const root = document.querySelector('.command-center');
    const dock = root?.querySelector('.command-dock');
    const stack = root?.querySelector('.game-top-stack');
    if (!root || !dock || !stack) return false;
    const style = getComputedStyle(root);
    return Math.abs(parseFloat(style.getPropertyValue('--command-dock-height')) - dock.getBoundingClientRect().height) < 1 &&
      Math.abs(parseFloat(style.getPropertyValue('--game-top-stack-offset')) - stack.getBoundingClientRect().height - 8) < 1;
  });
  const layout = await page.evaluate(() => {
    const rect = selector => {
      const r = document.querySelector(selector).getBoundingClientRect();
      return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    };
    return { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, dock: rect('.command-dock'), briefing: rect('.turn-briefing'), header: rect('.game-top-stack'), end: rect('.turn-control__button') };
  });
  console.log(JSON.stringify({ label, layout }));
  assert(layout.scrollWidth <= layout.width + 1, label + ': horizontal overflow ' + JSON.stringify(layout));
  assert(layout.dock.bottom <= layout.height + 1 && layout.dock.x >= 0 && layout.dock.right <= layout.width + 1, label + ': dock clipped');
  assert(layout.briefing.bottom < layout.dock.y, label + ': briefing overlaps commands ' + JSON.stringify(layout));
  assert(layout.header.height >= 32, label + ': header must participate in layout');
  assert(layout.header.bottom < layout.dock.y, label + ': header covers map');
  assert(layout.end.height >= 44 && layout.end.right <= layout.width, label + ': end-turn touch target');
  const reachable = await page.evaluate(() => {
    const button = document.querySelector('.turn-control__button');
    const rect = button.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return hit === button || button.contains(hit);
  });
  assert(reachable, label + ': end turn must not be covered by notifications or advisors');
  await page.screenshot({ path: 'test-results/command-center/' + label + '.png' });
}
 
try {
  for (let attempt = 0; attempt < 120; attempt++) {
    try { if ((await fetch(base + '/tests/browser/command-center.html')).ok) break; } catch {}
    await pause(250);
  }
  await mkdir('test-results/command-center', { recursive: true });
  browser = await chromium.launch({ args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  activePage = page;
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/tests/browser/command-center.html');
  await page.waitForFunction(() => !!window.commandSmoke);
  await checkLayout(page, 'desktop');
  console.log('UI_PREVIEW_FIXTURE:' + (await page.screenshot({ type: 'jpeg', quality: 55 })).toString('base64'));
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await page.getByRole('button', { name: 'Continue planning' }).click();
  assert.equal(await page.evaluate(() => window.commandSmoke.snapshot().turn), 1);
  await page.getByRole('button', { name: 'Research', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search programs' }).fill('Improved Fission');
  await page.getByRole('button', { name: 'Start Improved Fission Packages' }).click();
  assert.equal(await page.evaluate(() => window.commandSmoke.snapshot().production), 80);
  await page.getByRole('button', { name: 'Close', exact: true }).first().click();
  await page.getByRole('button', { name: 'Build', exact: true }).click();
  await page.getByRole('button', { name: 'Build city #2', exact: true }).click();
  await page.getByRole('button', { name: 'Build', exact: true }).click();
  assert(await page.getByRole('button', { name: 'Build city #2', exact: true }).isDisabled(), 'Duplicate city orders must be disabled');
  await page.getByRole('button', { name: 'Build missile', exact: true }).click();
  assert.equal(await page.evaluate(() => window.commandSmoke.snapshot().actions), 0);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  const afterOne = await page.evaluate(() => window.commandSmoke.snapshot());
  assert.equal(afterOne.turn, 2); assert.equal(afterOne.research.turnsRemaining, 1); assert.equal(afterOne.construction.turnsRemaining, 2);
  await page.getByRole('button', { name: /Briefing & events/ }).click();
  await page.getByRole('progressbar', { name: 'Improved Fission Packages' }).waitFor();
  await page.screenshot({ path: 'test-results/command-center/briefing.png' });
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await page.getByRole('button', { name: 'End turn anyway' }).click();
  assert.equal(await page.evaluate(() => window.commandSmoke.snapshot().completed), true);
  await page.evaluate(() => window.commandSmoke.phase('AI'));
  assert(await page.getByRole('button', { name: 'End turn', exact: true }).isDisabled());
  await page.evaluate(() => window.commandSmoke.phase('PLAYER'));

  for (const theme of ['synthwave', 'retro80s', 'wargames', 'highcontrast']) {
    await page.evaluate(value => window.commandSmoke.theme(value), theme);
    for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1280, height: 800 }]) {
      await page.setViewportSize(viewport);
      await checkLayout(page, theme + '-' + viewport.width + 'x' + viewport.height);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: /Briefing & events/ }).click();
  await page.getByRole('button', { name: 'More', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Leader', exact: true }).click();
  await page.getByRole('heading', { name: 'Leader abilities' }).waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Build', exact: true }).click();
  await page.screenshot({ path: 'test-results/command-center/mobile-production.png' });
  await page.keyboard.press('Escape');

  // Start the real campaign as well as the focused fixture.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    localStorage.setItem('norad_option_coop_enabled', 'false');
    localStorage.setItem('norad_has_seen_tutorial', 'true');
    localStorage.setItem('norad_audio_music_enabled', 'false');
    localStorage.setItem('norad_audio_sfx_enabled', 'false');
  });
  await page.goto(base + '/');
  console.log('CAMPAIGN_START:' + JSON.stringify({ url: page.url(), errors, body: await page.locator('body').innerText() }));
  await page.getByRole('button', { name: /Start Game/i }).waitFor();
  const logoBounds = await page.locator('.intro-screen__logo').evaluate(svg => {
    const view = svg.viewBox.baseVal;
    return [...svg.querySelectorAll('text')].map(text => {
      const box = text.getBBox();
      return { text: text.textContent.trim(), x: box.x, y: box.y, right: box.x + box.width, bottom: box.y + box.height, width: view.width, height: view.height };
    });
  });
  assert(logoBounds.every(box => box.x >= 0 && box.right <= box.width && box.y >= 0 && box.bottom <= box.height), 'Intro wordmark must fit its viewBox: ' + JSON.stringify(logoBounds));
  await page.screenshot({ path: 'test-results/command-center/intro.png' });
  console.log('UI_PREVIEW_INTRO:' + (await page.screenshot({ type: 'jpeg', quality: 55 })).toString('base64'));
  await page.getByRole('button', { name: /Start Game/i }).click();
  await page.getByRole('button', { name: /^Select / }).click();
  await page.locator('.command-dock').waitFor({ timeout: 30000 });
  await page.locator('.globe-scene__overlay').waitFor();
  await checkLayout(page, 'campaign-desktop');
  const desktopPreview = await page.screenshot({ type: 'jpeg', quality: 55 });
  console.log('UI_PREVIEW_DESKTOP:' + desktopPreview.toString('base64'));
  await page.getByRole('button', { name: 'Research', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search programs' }).pressSequentially('Fission 123');
  assert.equal(await page.getByRole('dialog').count(), 1, 'Typing must not open extra map dialogs');
  await page.screenshot({ path: 'test-results/command-center/campaign-research.png' });
  await page.keyboard.press('Escape');
  await page.keyboard.press('1');
  await page.getByRole('heading', { name: 'STRATEGIC PRODUCTION', exact: true }).waitFor();
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  await checkLayout(page, 'campaign-mobile');
  const mobilePreview = await page.screenshot({ type: 'jpeg', quality: 55 });
  console.log('UI_PREVIEW_MOBILE:' + mobilePreview.toString('base64'));
  assert.deepEqual(errors, [], 'Unhandled browser errors');
  console.log(JSON.stringify({ result: 'passed', productionAfterOrders: afterOne.production, researchTurnsAfterOneTurn: afterOne.research.turnsRemaining, cityTurnsAfterOneTurn: afterOne.construction.turnsRemaining, checks: 'desktop, portrait, landscape, themes, production, research, turn review, real campaign' }));
} catch (error) {
  console.error(error); console.error(serverLog); console.error('BROWSER_ERRORS:' + JSON.stringify(errors));
  if (activePage) {
    console.error('BROWSER_BODY:' + (await activePage.locator('body').innerText()).slice(0, 4000));
    console.log('UI_PREVIEW_FAILURE:' + (await activePage.screenshot({ type: 'jpeg', quality: 55 })).toString('base64'));
  }
  process.exitCode = 1;
} finally {
  await browser?.close(); server.kill('SIGTERM');
}
