import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePrompt,summarizeNotes} from '../src/core.js';
test('normalizes notes',()=>assert.equal(validatePrompt(' notes '),'notes'));
test('rejects invalid notes',()=>{for(const value of [null, '', ' ', 'a'.repeat(24001)]) assert.throws(()=>validatePrompt(value));});
test('requires consent before processing',async()=>assert.rejects(summarizeNotes('notes'),/consent/));
