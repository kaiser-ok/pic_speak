import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PhrasePractice } from '../dist/practice-state.mjs';
const data = JSON.parse(readFileSync(new URL('../dist/data.json', import.meta.url)));
const cards = data.photos.filter(p => p.category === 'needs');

test('each needs card exposes three complete, selectable utterances with bounded navigation', () => {
  const state = new PhrasePractice();
  for (const card of cards) {
    state.selectPhoto(card);
    for (let level = 0; level < 3; level++) {
      state.setLevel(level);
      assert.equal(state.word, card.levels[level]);
      assert.ok(data.words[state.word].zhAudio);
      assert.ok(data.words[state.word].twAudio);
    }
    state.setLevel(3);
    assert.equal(state.word, card.levels[2]);
    state.setLevel(-1);
    assert.equal(state.word, card.levels[0]);
  }
});

test('switching between needs cards and ordinary photos resets the selected length', () => {
  const state = new PhrasePractice();
  state.selectPhoto(cards[0]);
  state.setLevel(2);
  const ordinary = data.photos.find(p => p.category === 'life');
  state.selectPhoto(ordinary);
  assert.equal(state.word, ordinary.objects[0].word);
  assert.equal(state.level, 0);
  state.selectPhoto(cards[0]);
  assert.equal(state.level, 0);
  assert.equal(state.word, cards[0].levels[0]);
});
