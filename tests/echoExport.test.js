import test from 'node:test';
import assert from 'node:assert/strict';
import { exportEchoPng, ECHO_EXPORT_SIZE } from '../src/echoes/echoExport.js';

function harness({ nullBlob = false, throwClick = false, context = {} } = {}) {
  const calls = [];
  const canvas = { width: 0, height: 0, getContext: () => context, toBlob: (callback, mime) => { calls.push(mime); callback(nullBlob ? null : { type: mime }); } };
  const link = { remove: () => calls.push('remove'), click: () => { calls.push('click'); if (throwClick) throw new Error('download failed'); } };
  const options = {
    document: { createElement: type => type === 'canvas' ? canvas : link, body: { appendChild: () => calls.push('append') } },
    URL: { createObjectURL: () => 'blob:echo', revokeObjectURL: value => calls.push(`revoke:${value}`) },
    schedule: fn => fn(),
    draw: (ctx, records, width, height) => calls.push({ ctx, records, width, height }),
  };
  return { calls, canvas, link, options };
}
const records = [{ id: '1', mode: 'FLOW', points: [{ x: .2, y: .3 }] }];
test('PNG export renders actual records at 2048 square and disposes download resources', async () => {
  const h = harness();
  assert.equal(await exportEchoPng(records, h.options), true);
  assert.equal(h.calls[0].records, records);
  assert.equal(h.calls[0].width, ECHO_EXPORT_SIZE);
  assert.equal(h.calls[0].height, ECHO_EXPORT_SIZE);
  assert.equal(h.link.download, 'lumen-echoes.png');
  assert.ok(h.calls.includes('image/png'));
  assert.ok(h.calls.includes('revoke:blob:echo'));
  assert.deepEqual([h.canvas.width, h.canvas.height], [0, 0]);
});
test('PNG failures release canvas and download resources', async () => {
  for (const failure of [{ nullBlob: true }, { throwClick: true }, { context: null }]) {
    const h = harness(failure);
    await assert.rejects(exportEchoPng(records, h.options));
    assert.equal(h.canvas.width, 0);
    if (failure.throwClick) assert.ok(h.calls.includes('revoke:blob:echo'));
  }
});
test('empty and invalidated exports cannot create downloads', async () => {
  await assert.rejects(exportEchoPng([]), /Create an echo/);
  const h = harness();
  assert.equal(await exportEchoPng(records, { ...h.options, isCurrent: () => false }), false);
  assert.ok(!h.calls.includes('click'));
  assert.equal(h.canvas.width, 0);
});
