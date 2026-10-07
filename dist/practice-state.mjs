// Each object owns its phrase lengths. Changing cards or objects starts at the word.
export class PhrasePractice {
  photo = null;
  level = 0;
  variant = 0;
  objectWord = null;
  selectPhoto(photo) {
    this.photo = photo;
    this.level = 0;
    this.variant = 0;
    this.objectWord = photo.objects[0].word;
  }
  selectObject(word) {
    if (!this.photo?.objects.some(obj => obj.word === word)) throw new Error('Unknown photo object');
    if (this.objectWord !== word) {
      this.objectWord = word;
      this.level = 0;
      this.variant = 0;
    }
  }
  setLevel(level) {
    const last = this.levels.length - 1;
    const next = Math.max(0, Math.min(last, level));
    if (next !== this.level) this.variant = 0;
    this.level = next;
  }
  setVariant(variant) { this.variant = Math.max(0, Math.min(this.choices.length - 1, variant)); }
  get levels() {
    const object = this.photo?.objects.find(obj => obj.word === this.objectWord);
    return object?.levels || this.photo?.levels || (object ? [object.word] : []);
  }
  get choices() {
    const object = this.photo?.objects.find(obj => obj.word === this.objectWord);
    return object?.levelChoices?.[this.level] || [this.levels[this.level]];
  }
  get word() { return this.choices[this.variant]; }
}
