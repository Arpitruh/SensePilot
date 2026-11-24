import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeImage } from '../src/image-analysis.js';
test('requires permission before reading an image', async () => {
  await assert.rejects(analyzeImage('example.png'), /Permission/);
});
test('rejects unsupported formats', async () => {
  await assert.rejects(analyzeImage('example.exe', {consent:true}), /PNG or JPEG/);
});
