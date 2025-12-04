/**
 * DialogueSystem - Branching dialogue and conversation management
 * Supports choices, conditions, and narrative progression
 */
export class DialogueSystem {
  constructor() {
    this.dialogues = new Map();
    this.currentDialogue = null;
    this.currentNode = null;
    this.history = [];
    this.variables = new Map();
    this.callbacks = {
      onDialogueStart: null,
      onDialogueEnd: null,
      onNodeChange: null,
      onChoiceSelected: null
    };
  }

  /**
   * Register a dialogue tree
   * @param {string} id - Dialogue identifier
   * @param {Object} dialogue - Dialogue definition
   */
  registerDialogue(id, dialogue) {
    this.dialogues.set(id, {
      id,
      title: dialogue.title || id,
      nodes: dialogue.nodes || {},
      startNode: dialogue.startNode || 'start',
      variables: dialogue.variables || {}
    });
  }

  /**
   * Start a dialogue
   * @param {string} dialogueId - Dialogue to start
   * @param {Object} context - Additional context data
   */
  startDialogue(dialogueId, context = {}) {
    const dialogue = this.dialogues.get(dialogueId);
    if (!dialogue) {
      console.warn(`Dialogue ${dialogueId} not found`);
      return false;
    }

    this.currentDialogue = dialogue;
    this.history = [];
    
    // Initialize dialogue variables
    for (const [key, value] of Object.entries(dialogue.variables)) {
      this.variables.set(key, value);
    }

    // Merge context variables
    for (const [key, value] of Object.entries(context)) {
      this.variables.set(key, value);
    }

    this.goToNode(dialogue.startNode);

    if (this.callbacks.onDialogueStart) {
      this.callbacks.onDialogueStart(dialogue, context);
    }

    return true;
  }

  /**
   * Go to a specific node in the dialogue
   * @param {string} nodeId - Node identifier
   */
  goToNode(nodeId) {
    if (!this.currentDialogue) return false;

    const node = this.currentDialogue.nodes[nodeId];
    if (!node) {
      console.warn(`Node ${nodeId} not found`);
      return false;
    }

    // Check conditions
    if (node.condition && !this.evaluateCondition(node.condition)) {
      // Skip to next node if condition fails
      if (node.onConditionFail) {
        return this.goToNode(node.onConditionFail);
      }
      return false;
    }

    this.currentNode = {
      id: nodeId,
      ...node
    };

    this.history.push(nodeId);

    // Execute node actions
    if (node.actions) {
      this.executeActions(node.actions);
    }

    if (this.callbacks.onNodeChange) {
      this.callbacks.onNodeChange(this.currentNode);
    }

    // Auto-advance if no choices
    if (!node.choices || node.choices.length === 0) {
      if (node.next) {
        setTimeout(() => this.goToNode(node.next), node.delay || 0);
      } else {
        this.endDialogue();
      }
    }

    return true;
  }

  /**
   * Select a choice
   * @param {number} choiceIndex - Index of the choice
   */
  selectChoice(choiceIndex) {
    if (!this.currentNode || !this.currentNode.choices) {
      return false;
    }

    const choice = this.currentNode.choices[choiceIndex];
    if (!choice) {
      console.warn(`Choice ${choiceIndex} not found`);
      return false;
    }

    // Check choice condition
    if (choice.condition && !this.evaluateCondition(choice.condition)) {
      return false;
    }

    // Execute choice actions
    if (choice.actions) {
      this.executeActions(choice.actions);
    }

    if (this.callbacks.onChoiceSelected) {
      this.callbacks.onChoiceSelected(choice, choiceIndex);
    }

    // Go to next node
    if (choice.next) {
      return this.goToNode(choice.next);
    } else {
      this.endDialogue();
      return true;
    }
  }

  /**
   * End the current dialogue
   */
  endDialogue() {
    const dialogue = this.currentDialogue;
    
    if (this.callbacks.onDialogueEnd) {
      this.callbacks.onDialogueEnd(dialogue, this.history);
    }

    this.currentDialogue = null;
    this.currentNode = null;
  }

  /**
   * Evaluate a condition
   * @param {string|Function} condition - Condition to evaluate
   * @returns {boolean} Result
   * @private
   */
  evaluateCondition(condition) {
    if (typeof condition === 'function') {
      return condition(this.variables);
    }

    if (typeof condition === 'string') {
      // Simple variable check: "hasKey", "!hasKey", "gold > 10"
      try {
        // Create a function from the condition string
        const vars = Object.fromEntries(this.variables);
        const func = new Function(...Object.keys(vars), `return ${condition}`);
        return func(...Object.values(vars));
      } catch (e) {
        console.warn(`Failed to evaluate condition: ${condition}`, e);
        return false;
      }
    }

    return Boolean(condition);
  }

  /**
   * Execute actions
   * @param {Array|Function} actions - Actions to execute
   * @private
   */
  executeActions(actions) {
    if (typeof actions === 'function') {
      actions(this.variables);
      return;
    }

    if (Array.isArray(actions)) {
      for (const action of actions) {
        if (action.type === 'setVariable') {
          this.variables.set(action.variable, action.value);
        } else if (action.type === 'incrementVariable') {
          const current = this.variables.get(action.variable) || 0;
          this.variables.set(action.variable, current + (action.amount || 1));
        } else if (action.type === 'custom' && action.execute) {
          action.execute(this.variables);
        }
      }
    }
  }

  /**
   * Get current dialogue state
   * @returns {Object} Current state
   */
  getCurrentState() {
    return {
      dialogue: this.currentDialogue?.id || null,
      node: this.currentNode?.id || null,
      text: this.currentNode?.text || '',
      speaker: this.currentNode?.speaker || null,
      choices: this.getAvailableChoices(),
      isActive: this.currentDialogue !== null
    };
  }

  /**
   * Get available choices (filtered by conditions)
   * @returns {Array} Available choices
   */
  getAvailableChoices() {
    if (!this.currentNode || !this.currentNode.choices) {
      return [];
    }

    return this.currentNode.choices
      .map((choice, index) => ({ ...choice, index }))
      .filter(choice => {
        if (!choice.condition) return true;
        return this.evaluateCondition(choice.condition);
      });
  }

  /**
   * Set a variable
   * @param {string} key - Variable name
   * @param {*} value - Variable value
   */
  setVariable(key, value) {
    this.variables.set(key, value);
  }

  /**
   * Get a variable
   * @param {string} key - Variable name
   * @returns {*} Variable value
   */
  getVariable(key) {
    return this.variables.get(key);
  }

  /**
   * Register callback
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (this.callbacks.hasOwnProperty(`on${event.charAt(0).toUpperCase()}${event.slice(1)}`)) {
      this.callbacks[`on${event.charAt(0).toUpperCase()}${event.slice(1)}`] = callback;
    }
  }

  /**
   * Check if dialogue is active
   * @returns {boolean} True if dialogue is active
   */
  isActive() {
    return this.currentDialogue !== null;
  }

  /**
   * Get dialogue history
   * @returns {Array} Array of visited node IDs
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Save dialogue state
   * @returns {Object} Serializable state
   */
  saveState() {
    return {
      currentDialogue: this.currentDialogue?.id || null,
      currentNode: this.currentNode?.id || null,
      history: [...this.history],
      variables: Object.fromEntries(this.variables)
    };
  }

  /**
   * Load dialogue state
   * @param {Object} state - Saved state
   */
  loadState(state) {
    if (state.currentDialogue) {
      this.startDialogue(state.currentDialogue);
      if (state.currentNode) {
        this.goToNode(state.currentNode);
      }
    }
    
    this.history = state.history || [];
    
    if (state.variables) {
      for (const [key, value] of Object.entries(state.variables)) {
        this.variables.set(key, value);
      }
    }
  }
}
