# Chambers 🃏

[![Play on Unity](https://img.shields.io/badge/Play_Now-Unity_Play-black?style=for-the-badge&logo=unity)](https://play.unity.com/en/games/3972ee16-54f7-4d1c-9477-f5793e4b2ed0/chambers)
[![License](https://img.shields.io/github/license/MiChaelinzo/Chambers?style=for-the-badge)](LICENSE)

**Chambers** is a simple deckbuilder heavily inspired by *Slay the Spire*. 

This project was created primarily as a technical showcase to demonstrate how to architect deckbuilding systems (drawing, discarding, shuffling, and shop mechanics) within a game engine. While it focuses on system architecture over polished gameplay, it offers a functional survival loop for players to test.

## 🎮 Gameplay

Your goal is to survive for as long as you can against increasing odds. Management of your deck is key to survival.

*   **Deck Building:** Start with a basic deck and refine it.
*   **The Shop:** spend currency to **add new strong cards** to your deck or **remove bad cards** that are clogging your hand.
*   **Survival:** Face waves of enemies and see how long your build holds up.

### Controls
*   **Mouse:** Interact with cards and UI.
*   **`H` Key:** Press for **Help** if you get stuck or need a refresher on mechanics.

## 🛠️ Project Structure

This repository contains the source code and framework logic for the game.

*   `framework/`: Contains the core game systems and logic.
*   `tests/`: Unit tests ensuring the stability of card interactions and deck logic (run via Jest).
*   `.kiro/`: Framework specifications.

## 🚀 Getting Started

To explore the codebase or run tests locally:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/MiChaelinzo/Chambers.git
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run Tests:**
    ```bash
    npm test
    ```

## 🔗 Links

*   **Playable Build:** [Play Chambers on Unity Play](https://play.unity.com/en/games/3972ee16-54f7-4d1c-9477-f5793e4b2ed0/chambers)
*   **Author:** [NachSN / MiChaelinzo](https://github.com/MiChaelinzo)

---
*Note: This project is a systems showcase and may lack some "fun-factor" polish found in full commercial releases.*
