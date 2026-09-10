// Each object owns its phrase lengths. Changing cards or objects starts at the word.
export class PhrasePractice {
  photo = null;
  level = 0;
  objectWord = null;
  selectPhoto(photo) {
    this.photo = photo;
    this.level = 0;
    this.objectWord = photo.objects[0].word;
  }
  selectObject(word) {
    if (!this.photo?.objects.some(obj => obj.word === word)) throw new Error('Unknown photo object');
    if (this.objectWord !== word) {
      this.objectWord = word;
      this.level = 0;
    }
  }
  setLevel(level) {
    const last = this.levels.length - 1;
    this.level = Math.max(0, Math.min(last, level));
  }
  get levels() {
    const object = this.photo?.objects.find(obj => obj.word === this.objectWord);
    return object?.levels || this.photo?.levels || (object ? [object.word] : []);
  }
  get word() { return this.levels[this.level]; }
}
