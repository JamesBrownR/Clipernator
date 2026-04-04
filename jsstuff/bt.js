// ── Behavior Tree base classes ──
const BT = { SUCCESS: 'S', FAILURE: 'F', RUNNING: 'R' };

class BTAction {
  constructor(fn) { this.fn = fn; }
  tick(id, gs) { return this.fn(id, gs); }
}
class BTCondition {
  constructor(fn) { this.fn = fn; }
  tick(id, gs) { return this.fn(id, gs) ? BT.SUCCESS : BT.FAILURE; }
}
class BTSequence {
  constructor(...children) { this.children = children; }
  tick(id, gs) {
    for (const c of this.children) {
      const r = c.tick(id, gs);
      if (r !== BT.SUCCESS) return r;
    }
    return BT.SUCCESS;
  }
}
class BTSelector {
  constructor(...children) { this.children = children; }
  tick(id, gs) {
    for (const c of this.children) {
      const r = c.tick(id, gs);
      if (r !== BT.FAILURE) return r;
    }
    return BT.FAILURE;
  }
}
