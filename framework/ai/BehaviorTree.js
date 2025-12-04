/**
 * BehaviorTree - AI behavior tree implementation
 * Supports composite nodes (sequence, selector, parallel) and decorators
 */

// Node statuses
export const NodeStatus = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  RUNNING: 'running'
};

/**
 * Base behavior tree node
 */
export class BehaviorNode {
  constructor(name = 'Node') {
    this.name = name;
    this.status = null;
  }

  tick(context) {
    throw new Error('tick() must be implemented by subclass');
  }

  reset() {
    this.status = null;
  }
}

/**
 * Action node - executes a function
 */
export class Action extends BehaviorNode {
  constructor(name, action) {
    super(name);
    this.action = action;
  }

  tick(context) {
    this.status = this.action(context);
    return this.status;
  }
}

/**
 * Condition node - checks a condition
 */
export class Condition extends BehaviorNode {
  constructor(name, condition) {
    super(name);
    this.condition = condition;
  }

  tick(context) {
    this.status = this.condition(context) ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
    return this.status;
  }
}

/**
 * Sequence node - executes children in order until one fails
 */
export class Sequence extends BehaviorNode {
  constructor(name, children = []) {
    super(name);
    this.children = children;
    this.currentIndex = 0;
  }

  tick(context) {
    while (this.currentIndex < this.children.length) {
      const child = this.children[this.currentIndex];
      const status = child.tick(context);

      if (status === NodeStatus.FAILURE) {
        this.reset();
        this.status = NodeStatus.FAILURE;
        return this.status;
      }

      if (status === NodeStatus.RUNNING) {
        this.status = NodeStatus.RUNNING;
        return this.status;
      }

      this.currentIndex++;
    }

    this.reset();
    this.status = NodeStatus.SUCCESS;
    return this.status;
  }

  reset() {
    super.reset();
    this.currentIndex = 0;
    for (const child of this.children) {
      child.reset();
    }
  }
}

/**
 * Selector node - executes children until one succeeds
 */
export class Selector extends BehaviorNode {
  constructor(name, children = []) {
    super(name);
    this.children = children;
    this.currentIndex = 0;
  }

  tick(context) {
    while (this.currentIndex < this.children.length) {
      const child = this.children[this.currentIndex];
      const status = child.tick(context);

      if (status === NodeStatus.SUCCESS) {
        this.reset();
        this.status = NodeStatus.SUCCESS;
        return this.status;
      }

      if (status === NodeStatus.RUNNING) {
        this.status = NodeStatus.RUNNING;
        return this.status;
      }

      this.currentIndex++;
    }

    this.reset();
    this.status = NodeStatus.FAILURE;
    return this.status;
  }

  reset() {
    super.reset();
    this.currentIndex = 0;
    for (const child of this.children) {
      child.reset();
    }
  }
}

/**
 * Parallel node - executes all children simultaneously
 */
export class Parallel extends BehaviorNode {
  constructor(name, children = [], successThreshold = 1, failureThreshold = 1) {
    super(name);
    this.children = children;
    this.successThreshold = successThreshold;
    this.failureThreshold = failureThreshold;
  }

  tick(context) {
    let successCount = 0;
    let failureCount = 0;
    let runningCount = 0;

    for (const child of this.children) {
      const status = child.tick(context);

      if (status === NodeStatus.SUCCESS) successCount++;
      else if (status === NodeStatus.FAILURE) failureCount++;
      else if (status === NodeStatus.RUNNING) runningCount++;
    }

    if (successCount >= this.successThreshold) {
      this.reset();
      this.status = NodeStatus.SUCCESS;
      return this.status;
    }

    if (failureCount >= this.failureThreshold) {
      this.reset();
      this.status = NodeStatus.FAILURE;
      return this.status;
    }

    this.status = NodeStatus.RUNNING;
    return this.status;
  }

  reset() {
    super.reset();
    for (const child of this.children) {
      child.reset();
    }
  }
}

/**
 * Inverter decorator - inverts child result
 */
export class Inverter extends BehaviorNode {
  constructor(name, child) {
    super(name);
    this.child = child;
  }

  tick(context) {
    const status = this.child.tick(context);

    if (status === NodeStatus.SUCCESS) {
      this.status = NodeStatus.FAILURE;
    } else if (status === NodeStatus.FAILURE) {
      this.status = NodeStatus.SUCCESS;
    } else {
      this.status = NodeStatus.RUNNING;
    }

    return this.status;
  }

  reset() {
    super.reset();
    this.child.reset();
  }
}

/**
 * Repeater decorator - repeats child N times
 */
export class Repeater extends BehaviorNode {
  constructor(name, child, count = -1) {
    super(name);
    this.child = child;
    this.count = count; // -1 = infinite
    this.currentCount = 0;
  }

  tick(context) {
    if (this.count !== -1 && this.currentCount >= this.count) {
      this.reset();
      this.status = NodeStatus.SUCCESS;
      return this.status;
    }

    const status = this.child.tick(context);

    if (status === NodeStatus.SUCCESS || status === NodeStatus.FAILURE) {
      this.currentCount++;
      this.child.reset();

      if (this.count !== -1 && this.currentCount >= this.count) {
        this.reset();
        this.status = NodeStatus.SUCCESS;
        return this.status;
      }
    }

    this.status = NodeStatus.RUNNING;
    return this.status;
  }

  reset() {
    super.reset();
    this.currentCount = 0;
    this.child.reset();
  }
}

/**
 * UntilFail decorator - repeats child until it fails
 */
export class UntilFail extends BehaviorNode {
  constructor(name, child) {
    super(name);
    this.child = child;
  }

  tick(context) {
    const status = this.child.tick(context);

    if (status === NodeStatus.FAILURE) {
      this.reset();
      this.status = NodeStatus.SUCCESS;
      return this.status;
    }

    if (status === NodeStatus.SUCCESS) {
      this.child.reset();
    }

    this.status = NodeStatus.RUNNING;
    return this.status;
  }

  reset() {
    super.reset();
    this.child.reset();
  }
}

/**
 * Succeeder decorator - always returns success
 */
export class Succeeder extends BehaviorNode {
  constructor(name, child) {
    super(name);
    this.child = child;
  }

  tick(context) {
    this.child.tick(context);
    this.status = NodeStatus.SUCCESS;
    return this.status;
  }

  reset() {
    super.reset();
    this.child.reset();
  }
}

/**
 * Wait action - waits for a duration
 */
export class Wait extends BehaviorNode {
  constructor(name, duration) {
    super(name);
    this.duration = duration;
    this.elapsed = 0;
  }

  tick(context) {
    this.elapsed += context.deltaTime || 0;

    if (this.elapsed >= this.duration) {
      this.reset();
      this.status = NodeStatus.SUCCESS;
      return this.status;
    }

    this.status = NodeStatus.RUNNING;
    return this.status;
  }

  reset() {
    super.reset();
    this.elapsed = 0;
  }
}

/**
 * BehaviorTree - Main behavior tree class
 */
export class BehaviorTree {
  constructor(root) {
    this.root = root;
  }

  tick(context) {
    return this.root.tick(context);
  }

  reset() {
    this.root.reset();
  }
}

/**
 * Builder for creating behavior trees fluently
 */
export class BehaviorTreeBuilder {
  constructor() {
    this.stack = [];
    this.current = null;
  }

  sequence(name) {
    const node = new Sequence(name);
    this.addNode(node);
    this.stack.push(node);
    return this;
  }

  selector(name) {
    const node = new Selector(name);
    this.addNode(node);
    this.stack.push(node);
    return this;
  }

  parallel(name, successThreshold = 1, failureThreshold = 1) {
    const node = new Parallel(name, [], successThreshold, failureThreshold);
    this.addNode(node);
    this.stack.push(node);
    return this;
  }

  action(name, action) {
    const node = new Action(name, action);
    this.addNode(node);
    return this;
  }

  condition(name, condition) {
    const node = new Condition(name, condition);
    this.addNode(node);
    return this;
  }

  inverter(name) {
    const parent = this.stack[this.stack.length - 1];
    const child = parent.children.pop();
    const node = new Inverter(name, child);
    this.addNode(node);
    return this;
  }

  repeater(name, count = -1) {
    const parent = this.stack[this.stack.length - 1];
    const child = parent.children.pop();
    const node = new Repeater(name, child, count);
    this.addNode(node);
    return this;
  }

  wait(name, duration) {
    const node = new Wait(name, duration);
    this.addNode(node);
    return this;
  }

  end() {
    this.stack.pop();
    return this;
  }

  build() {
    if (this.stack.length > 0) {
      throw new Error('Unbalanced tree: missing end() calls');
    }
    return new BehaviorTree(this.current);
  }

  addNode(node) {
    if (this.stack.length === 0) {
      this.current = node;
    } else {
      const parent = this.stack[this.stack.length - 1];
      parent.children.push(node);
    }
  }
}
