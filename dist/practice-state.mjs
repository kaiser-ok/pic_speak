// Shared state for the needs-card controls. Changing an item starts a fresh attempt.
export class PhrasePractice {
  photo = null;
  level = 0;
  selfPractice = false;
  revealed = false;
  selectPhoto(photo) {
    this.photo = photo;
    this.level = 0;
    this.revealed = false;
  }
  setLevel(level) {
    const last = (this.photo?.levels?.length || 1) - 1;
    this.level = Math.max(0, Math.min(last, level));
    this.revealed = false;
  }
  setSelfPractice(enabled) {
    this.selfPractice = enabled;
    this.revealed = false;
  }
  reveal() { this.revealed = true; }
  resetAnswer() { this.revealed = false; }
  get word() { return this.photo?.levels?.[this.level] || this.photo?.objects[0].word; }
  get concealed() { return !!this.photo?.levels && this.selfPractice && !this.revealed; }
}
