// ============================================================
// CLIPBLAST: PARTY HUNTER — ECS Core + Behavior Tree
// ============================================================

// ─── ECS ───
const ECS = {
  _nextId: 0,
  entities: new Set(),
  _comps: {},

  createEntity() {
    const id = this._nextId++;
    this.entities.add(id);
    return id;
  },
  destroyEntity(id) {
    this.entities.delete(id);
    for (const k in this._comps) this._comps[k].delete(id);
  },
  add(id, type, data) {
    if (!this._comps[type]) this._comps[type] = new Map();
    this._comps[type].set(id, data);
    return data;
  },
  get(id, type) {
    return this._comps[type] ? this._comps[type].get(id) : undefined;
  },
  has(id, type) {
    return !!(this._comps[type] && this._comps[type].has(id));
  },
  remove(id, type) {
    if (this._comps[type]) this._comps[type].delete(id);
  },
  query(...types) {
    const result = [];
    for (const id of this.entities) {
      if (types.every(t => this.has(id, t))) result.push(id);
    }
    return result;
  },
  clear() {
    this._nextId = 0;
    this.entities.clear();
    this._comps = {};
  }
};

// ─── Behavior Tree ───
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

// ─── Helper ───
function playerPos(gs) {
  const ids = ECS.query('player', 'pos');
  if (!ids.length) return null;
  return ECS.get(ids[0], 'pos');
}
