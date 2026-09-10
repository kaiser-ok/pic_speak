// Shared state for the needs-card controls. Changing cards returns to the single word.
export class PhrasePractice {
  photo = null;
  level = 0;
  selectPhoto(photo) {
    this.photo = photo;
    this.level = 0;
  }
  setLevel(level) {
    const last = (this.photo?.levels?.length || 1) - 1;
    this.level = Math.max(0, Math.min(last, level));
  }
  get word() { return this.photo?.levels?.[this.level] || this.photo?.objects[0].word; }
}
