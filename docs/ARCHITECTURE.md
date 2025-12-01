# System Architecture

Chambers is designed as a deck-building framework. The core logic is decoupled from the rendering engine to allow for easy unit testing.

## Core Concepts

### 1. The Game Loop
The game operates on a turn-based cycle handled by the `framework/` core:
1.  **Draw Phase:** Player draws cards from the `Deck` to the `Hand`.
2.  **Action Phase:** Player plays cards, triggering specific `Effects`.
3.  **Discard Phase:** Remaining cards in hand are moved to the `DiscardPile`.
4.  **Enemy Turn:** Enemies execute their queued intents.

### 2. Card Lifecycle
Cards flow through three main states:
*   **Draw Pile:** Cards available to be drawn. When empty, the Discard Pile is shuffled into the Draw Pile.
*   **Hand:** Cards currently available to play.
*   **Discard Pile:** Used cards wait here until the deck cycles.

### 3. Folder Structure
*   `framework/`: Contains the pure logic (Health, Damage, Deck management).
*   `tests/`: Jest test suites verifying the logic integrity.
