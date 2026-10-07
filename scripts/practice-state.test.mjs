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

test('every life-photo object has its own three lengths, including the secondary objects', () => {
  const state = new PhrasePractice();
  const photos = data.photos.filter(p => p.category === 'life');
  for (const photo of photos) {
    state.selectPhoto(photo);
    for (const object of photo.objects) {
      state.selectObject(object.word);
      assert.equal(state.word, object.word);
      assert.equal(state.levels.length, 3);
      state.setLevel(2);
      assert.equal(state.word, object.levels[2]);
      // Clicking the same object again repeats the currently selected sentence.
      state.selectObject(object.word);
      assert.equal(state.level, 2);
      assert.equal(state.word, object.levels[2]);
    }
  }
});

test('switching between a sink and faucet resets length without selecting the wrong audio', () => {
  const state = new PhrasePractice();
  const photo = data.photos.find(p => p.id === 'IMG_4321');
  state.selectPhoto(photo);
  state.setLevel(2);
  assert.equal(state.word, 'life_sink_sentence');
  state.selectObject('faucet');
  assert.equal(state.level, 0);
  assert.equal(state.word, 'faucet');
  state.setLevel(1);
  assert.equal(state.word, 'life_faucet_phrase');
  state.selectObject('sink');
  assert.equal(state.word, 'sink');
  assert.throws(() => state.selectObject('tv'), /Unknown photo object/);
  assert.equal(state.word, 'sink');
});

test('all vocabulary categories support words, phrases and sentences', () => {
  const state = new PhrasePractice();
  for (const category of ['body', 'kitchen', 'weather', 'feelings', 'faith']) {
    const photos = data.photos.filter(p => p.category === category);
    assert.ok(photos.length > 0);
    for (const photo of photos) {
      state.selectPhoto(photo);
      for (const object of photo.objects) {
        state.selectObject(object.word);
        assert.equal(state.level, 0);
        assert.equal(state.word, object.word);
        for (const level of [1, 2, 1, 0]) {
          state.setLevel(level);
          assert.equal(state.word, object.levels[level]);
          assert.ok(data.words[state.word].zhAudio);
          assert.ok(data.words[state.word].twAudio);
        }
      }
    }
  }
});

test('shared phrases retain each category’s base word and reset on navigation', () => {
  const state = new PhrasePractice();
  const foot = data.photos.find(p => p.category === 'body' && p.objects[0].word === 'foot');
  const pain = data.photos.find(p => p.id === 'need_pain');
  state.selectPhoto(foot);
  assert.equal(state.word, 'foot');
  state.setLevel(2);
  assert.equal(state.word, 'need_pain_sentence');
  state.selectPhoto(pain);
  assert.equal(state.word, 'pain');
  assert.equal(state.level, 0);
  state.setLevel(2);
  assert.equal(state.word, 'need_pain_sentence');
});
