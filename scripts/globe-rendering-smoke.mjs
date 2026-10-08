import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', data => { serverLog = (serverLog + data).slice(-6000); });
server.stderr.on('data', data => { serverLog = (serverLog + data).slice(-6000); });
let browser;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
try {
  let online = false;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try { online = (await fetch('http://127.0.0.1:5173/tests/browser/globe.html')).ok; } catch {}
    if (online) break;
    await pause(250);
  }
  assert(online, serverLog);
  await mkdir('test-results/globe', { recursive: true });
  browser = await chromium.launch({ args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 960, height: 640 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /WebGLProgram|shader error|Error compiling/i.test(message.text())) errors.push(message.text());
  });
  await page.goto('http://127.0.0.1:5173/tests/browser/globe.html');
  await page.waitForFunction(() => window.globeSmoke?.ready(), { timeout: 30000 });
  await pause(700);
  const day = await page.evaluate(() => [window.globeSmoke.sample(90, 0), window.globeSmoke.sample(40, 0)]);
  assert(day[0][0] > day[1][0] + 8, 'Outward normals must produce visible day shading: ' + JSON.stringify(day));
  await page.screenshot({ path: 'test-results/globe/day.png' });

  await page.evaluate(() => window.globeSmoke.setNight(true));
  await page.waitForFunction(() => window.globeSmoke.sample(90, 0)?.[0] > 240);
  const night = await page.evaluate(() => [window.globeSmoke.sample(90, 0), window.globeSmoke.sample(40, 0)]);
  assert(night[0][0] > 240 && Math.abs(night[0][0] - night[1][0]) <= 3, 'Night emission must remain bright on shaded pixels: ' + JSON.stringify(night));
  await page.screenshot({ path: 'test-results/globe/night.png' });

  await page.evaluate(() => window.globeSmoke.morph(true));
  await page.evaluate(() => window.globeSmoke.setNight(false));
  await page.waitForFunction(() => {
    const pixel = window.globeSmoke.sample(0, 0);
    return pixel && Math.abs(pixel[0] - pixel[1]) < 2;
  });
  assert.equal(await page.evaluate(() => window.globeSmoke.factor()), 1, 'Day/night changes must preserve the flat map');
  const flat = await page.evaluate(() => [window.globeSmoke.sample(0, 0), window.globeSmoke.sample(90, 0)]);
  assert(Math.abs(flat[0][0] - flat[1][0]) <= 3 && flat[0][0] > 120, 'Flat map must be evenly lit: ' + JSON.stringify(flat));
  await page.evaluate(() => window.globeSmoke.setVector(true));
  await pause(200);
  await page.evaluate(() => window.globeSmoke.setVector(false));
  await pause(200);
  assert.equal(await page.evaluate(() => window.globeSmoke.factor()), 1, 'Vector mode must preserve the flat map');
  await page.screenshot({ path: 'test-results/globe/flat.png' });

  await page.evaluate(() => window.globeSmoke.setMode('scene'));
  await pause(1200);
  await page.waitForFunction(() => window.globeSmoke.pick(480, 320)?.lon > 89);
  const center = await page.evaluate(() => ({ projected: window.globeSmoke.project(90, 0), picked: window.globeSmoke.pick(480, 320) }));
  assert(Math.abs(center.projected.x - 480) < 1 && Math.abs(center.projected.y - 320) < 1, 'Projector must use CSS dimensions');
  assert(Math.abs(center.picked.lon - 90) < 0.15 && Math.abs(center.picked.lat) < 0.15, 'Globe clicks must hit the rendered sphere');
  assert.equal(await page.evaluate(() => window.globeSmoke.project(-90, 0).visible), false);
  await page.screenshot({ path: 'test-results/globe/real-globe.png' });

  await page.evaluate(() => window.globeSmoke.morph(true));
  await pause(400);
  for (const coordinates of [[-95, 39], [37, 55], [116, 40], [-60, -15], [20, 0]]) {
    const result = await page.evaluate(([lon, lat]) => {
      const projected = window.globeSmoke.project(lon, lat);
      return { projected, picked: window.globeSmoke.pick(projected.x, projected.y) };
    }, coordinates);
    assert(result.projected.visible && result.picked, 'City anchor must be visible and selectable: ' + JSON.stringify(result));
    assert(Math.abs(result.picked.lon - coordinates[0]) < 0.2 && Math.abs(result.picked.lat - coordinates[1]) < 0.2, 'Flat city projection and picking must agree');
  }
  await page.screenshot({ path: 'test-results/globe/real-flat.png' });
  await context.close();

  const portrait = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  const phone = await portrait.newPage();
  phone.on('pageerror', error => errors.push(error.message));
  await phone.goto('http://127.0.0.1:5173/tests/browser/globe.html');
  await phone.waitForFunction(() => window.globeSmoke?.ready());
  await phone.evaluate(() => window.globeSmoke.setMode('scene'));
  await pause(1200);
  await phone.waitForFunction(() => window.globeSmoke.pick(195, 422)?.lon > 89);
  const phoneCenter = await phone.evaluate(() => window.globeSmoke.project(90, 0));
  assert(Math.abs(phoneCenter.x - 195) < 1 && Math.abs(phoneCenter.y - 422) < 1, 'DPR 3 must not move city markers');
  await phone.evaluate(() => window.globeSmoke.morph(true));
  await pause(400);
  for (const lon of [-170, 170]) {
    const point = await phone.evaluate(lon => window.globeSmoke.project(lon, 0), lon);
    assert(point.visible && point.x > 0 && point.x < 390, 'The full flat map must fit portrait screens');
  }
  await phone.screenshot({ path: 'test-results/globe/portrait-flat.png' });
  assert.deepEqual(errors, [], 'Browser and shader errors');
  console.log(JSON.stringify({ result: 'passed', day, night, flat, globeCenter: center, portraitCenter: phoneCenter }));
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
