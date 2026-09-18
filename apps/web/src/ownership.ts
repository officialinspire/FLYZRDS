/** Fail closed when Web Locks is unavailable; no unsafe localStorage lease. */
export class Ownership {
  private release: (() => void) | undefined;
  async claim(
    locks: LockManager | undefined = navigator.locks,
  ): Promise<boolean> {
    if (!locks) return false;
    return new Promise((resolve, reject) => {
      void locks
        .request(
          "flyzrds:active-pet:v1",
          { ifAvailable: true },
          async (lock) => {
            if (!lock) {
              resolve(false);
              return;
            }
            await new Promise<void>((done) => {
              this.release = done;
              resolve(true);
            });
          },
        )
        .catch(reject);
    });
  }
  dispose() {
    this.release?.();
    this.release = undefined;
  }
}
