# Implementation Plan

- [x] 1. Set up project structure and configuration



  - Create directory structure for framework, games, and shared assets
  - Set up package.json with Jest and fast-check dependencies
  - Create base HTML file for running games in browser
  - Configure Jest for testing with Canvas and Audio mocks
  - _Requirements: 1.5, 8.2_

- [x] 2. Implement core game loop system
  - Write GameLoop class with start, stop, pause, resume methods
  - Implement requestAnimationFrame-based timing with delta time calculation
  - Add FPS targeting and frame time smoothing
  - _Requirements: 1.1_

- [x] 2.1 Write property test for game loop timing
  - **Property 1: Game loop timing consistency**
  - **Validates: Requirements 1.1**

- [x] 3. Implement entity system
  - Write base Entity class with position, state, and config
  - Implement entity update and render method stubs
  - Create entity ID generation and tracking
  - Add entity interaction interface
  - _Requirements: 1.2, 3.2_

- [x] 3.1 Write property test for entity lifecycle
  - **Property 2: Entity lifecycle management**
  - **Validates: Requirements 1.2, 3.2**

- [x] 4. Implement scene management system
  - Write Scene class with entity collection and lifecycle methods
  - Write SceneManager class with scene registration and loading
  - Implement scene transition logic with cleanup
  - Add scene update and render methods that delegate to entities
  - _Requirements: 1.3, 3.3_

- [x] 4.1 Write property test for scene transitions
  - **Property 3: Scene transition state consistency**
  - **Validates: Requirements 1.3**

- [x] 5. Implement input handling system
  - Write InputHandler class with keyboard and mouse tracking
  - Implement key press/release event listeners
  - Add movement vector calculation from WASD/arrow keys
  - Create callback registration for input events
  - _Requirements: 1.4, 6.1_

- [x] 5.1 Write property test for movement vectors
  - **Property 4: Input movement vector calculation**
  - **Validates: Requirements 1.4, 6.1**


- [x] 6. Implement visibility system



  - Create framework/mechanics directory
  - Write VisibilitySystem class with configurable radius and mode
  - Implement circular visibility calculation based on distance
  - Add method to filter visible entities from entity list
  - Create visibility check for individual entities
  - _Requirements: 2.1, 7.5_


- [x] 6.1 Write property test for visibility filtering





  - **Property 5: Visibility radius filtering**
  - **Validates: Requirements 2.1, 7.5**


- [x] 7. Implement resource management system



  - Write ResourceManager class with resource tracking
  - Implement add, consume, and restore resource methods
  - Add bounds checking to prevent negative or over-max values
  - Implement auto-depletion for resources with deplete rates
  - _Requirements: 2.2_

- [x] 7.1 Write property test for resource bounds





  - **Property 6: Resource bounds enforcement**
  - **Validates: Requirements 2.2**


- [x] 8. Implement audio system


  - Write AudioSystem class with Web Audio API integration
  - Implement sound loading from URLs
  - Add playSound method for effects with volume control
  - Add playAmbient and stopAmbient for background music
  - Create sound tracking map for loaded audio
  - _Requirements: 2.3_

- [x] 8.1 Write property test for audio tracking






  - **Property 7: Audio system sound tracking**
  - **Validates: Requirements 2.3**


- [x] 9. Implement threat detection system



  - Write ThreatSystem class with threat registration
  - Implement threat detection based on distance radius
  - Add method to get nearby threats for a player position
  - Calculate overall threat level from nearby threats
  - _Requirements: 2.4_

- [x] 9.1 Write property test for threat detection






  - **Property 8: Threat detection radius**
  - **Validates: Requirements 2.4**


- [x] 10. Implement sanity system
















  - Write SanitySystem class with current and max sanity
  - Implement decrease and increase methods with bounds checking
  - Add threshold-based effect system
  - Implement effect activation/deactivation based on sanity level
  - _Requirements: 2.5_








-


- [x] 10.1 Write property test for sanity effects































  - **Property 9: Sanity threshold effects**
  - **Validates: Requirements 2.5**

- [x] 11. Implement configuration loader





  - Create framework/utils directory
  - Write ConfigLoader class with async JSON loading

  - Implement configuration validation against schemas
  - Add deep merge functionality for configuration overrides
  - Create clear error messages for validation failures
  - _Requirements: 3.1, 3.5_



- [x] 11.1 Write property test for config round-trip







  - **Property 10: Configuration round-trip consistency**

  - **Validates: Requirements 3.1**



- [x] 11.2 Write property test for config validation







  - **Property 11: Configuration va
lidation error messages**
  - **Validates: Requirements 3.5**
-

- [x] 12. Implement renderer system









- [x] 12. Implement renderer system
  - Write Renderer class with Canvas 2D context
  - Implement clear, drawEntity, and drawUI methods
  - Add camera system with position and zoom
  - Create entity rendering with visibility filtering
  - Track render calls per frame for testing
  - _Requirements: 7.1, 7.2, 7.4_



- [x] 12.1 Write property test for render coverage





  - **Property 19: Render call coverage**

  - **Validates: Requirements 7.1, 7.4**



- [x] 12.2 Write property test for UI dat






a completeness
  - **Property 20: UI data completeness**
  - **Validates: Requirements 7.2**
-
-

- [x] 13. Wire framework systems together







  - Create Game class that integrates all framework 
systems
  - Connect game loop to scene updates and rendering
  - Wire input handler to player entity control

  - Integrate visibility system with renderer
  - Connect resource manager and sanity system to game state
  - _Requirements: 1.1, 1.2, 1.3, 1.4_



- [x] 13.1 Write unit tests for system integration






  - Test that game loop triggers scene updates
  - Test that input affects player entity
  - Test that visibility affects rende


ring
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 14. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.




- [x] 15. Implement dungeon generation algorithm




  - Create games/dungeon-crawler/generation directory
  - Create DungeonGenerator class with room and corridor generation
  - Implement random room placement with collision detection
  - Add corridor generation connecting rooms
  - Ensure all rooms ar
e reachable (connected graph)
  - _Requirements: 4.1_


- [x] 15.1 Write property test for dungeon connectivity






  - **Property 12: Dungeon generati

on connectivity**
  - **Validates: Requirements 4.1**

- [x] 16. Create dungeon crawler entity types



  - Create games/dungeon-crawler/entities directory
  - Extend Entity class to create Player entity with movement
  - Create Enemy entity with chase AI behavior
  - Create Item entity with collection behavior
  - Add collision detection between entities
  - _Requirements: 4.2, 4.4_


- [x] 17. Implement combat system for dungeon crawler









  - Add health property to Player and Enemy entities
  - Implement damage dealing on entity collision
  - Add death state when health reaches zero
  - Remove dead entities from scene
  - _Requirements: 4.3_
-




- [x] 17.1 Write property test for combat damage












  - **Property 13: Combat damage application**
  - **Validates: Requirements 4.3**


- [x] 18. Implement item collection for dungeon crawler




  - Add inventory array to Player entity
  - Implement item pickup on collision
  - Remove collected items from scene
  - Apply item effects to player stats
  - _Requirements: 4.4_

- [x] 18.1 Write property test for item collection






  - **Property 14: Item collection inventory addition**
  - **Validates: Requirements 4.4**

- [x] 19. Implement permadeath for dungeon crawler







  - Detect player death (health <= 0)
  - Reset game state to initial configuration
  - Regenerate dungeon with new seed
  - Respawn player at starting position
  - _Requirements: 4.5_
-


- [x] 20. Create dungeon crawler configuration files




  - Create games/dungeon-crawler/config directory
  - Write game config JSON with dungeon crawler settings
  - Create entity type definitions for player, enemies, items
  - Define scene configuration for procedural dungeon
  - Set visibility, resources, and mechanics parameters
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 21. Create dungeon crawler entry point







  - Write main.js that loads dungeon crawler configuration
  - Initialize framework Game instance with config
  - Set up HTML page for dungeon crawler
  - Add basic UI for health, inventory display
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
- [x] 21.1 Write integration tests for dungeon crawler




- [x] 21.1 Write integration tests for dungeon crawler





  - Test complete game flow from start to death
  - Test item collection and usage
  - Test enemy spawning and combat
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_


- [x] 22. Checkpoint - Ensure all tests pass





 - Ensure all tests pass, ask the user if questions arise.


- [x] 23. Implement puzzle system





  - Create games/puzzle-game/puzzles directory
  - Create Puzzle class with state tracking and solution validation
  - Implement condition checking for puzzle solutions
  - Add puzzle state serialization for save/load
  - Create puzzle compl

etion callbacks
  - _Requirements: 5.3_
- [x] 23.1 Write property test for puzzle validation




- [x] 23.1 Write property test for puzzle validation



  - **Property 15: Puzzle state validation**
  - **Validates: Requirements 5.3**



- [x] 24. Create puzzle game entity types
  - Create games/puzzle-game/entities directory
  - Create InteractiveObject entity with examine and manipulate actions
  - Create Door entity with locked/unlocked states
  - Create Key entity that unlocks doors
  - Create Clue entity that reveals story text
  - _Requirements: 5.2, 5.4_

- [x] 25. Implement interaction system for puzzle game
  - Add interaction range checking to entities
  - Implement onInteract callbacks for puzzle entities
  - Create interaction feedback messages
  - Add interaction validation with error messages
  - _Requirements: 6.2, 6.5_

- [x] 25.1 Write property test for interaction range

  - **Property 17: Interaction range validation**
  - **Validates: Requirements 6.2, 6.5**



- [x] 26. Implement inventory system for puzzle game
  - Add inventory methods to Player entity (getInventory, addToInventory)
  - Implement inventory display with item list
  - Add item selection and usage from inventory
  - Track inventory state accurately
  - _Requirements: 6.3_

- [ ] 26.1 Write property test for inventory accuracy
  - **Property 18: Inventory state accuracy**
  - **Validates: Requirements 6.3**


- [x] 27. Implement save/load system for puzzle game




  - Create save state serialization for player, scene, and puzzles
  - Implement save to localStorage
  - Create load from localStorage with state restoration
  - Add checkpoint triggers in scenes
  - _Requirements: 5.5_
-

- [x] 27.1 Write property test for save/load round-trip





  - **Property 16: Save/load state round-trip**
  - **Validates: Requirements 5.5**

- [x] 28. Create fixed scene layouts for puzzle game
  - Create games/puzzle-game/config directory
  - Design 3-5 puzzle room layouts in JSON format
  - Define entity placements for each room
  - Create scene connections and transitions
  - Add puzzle elements to each room
  - _Requirements: 5.1, 3.3_

- [x] 28.1 Write property test for scene flexibility






  - **Property 21: Scene system flexibility**
  - **Validates: Requirements 9.4**

- [x] 29. Create puzzle game configuration files







  - Write game config JSON with puzzle game settings
  - Create entity type definitions for interactive objects
  - Define fixed scene configurations
  - Set visibility, resources, and mechanics parameters
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.1, 5.2, 5.3, 5.5_




- [x] 30. Create puzzle game entry point
  - Write main.js that loads puzzle game configuration
  - Initialize framework Game instance with config
  - Set up HTML page for puzzle game
  - Add UI for inventory, interactions, and story text
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 30.1 Write integration tests for puzzle game



  - Test puzzle solving flow

  - Test save/load functionality
  - Test item usage and door unlocking
  - _Requirements: 5.1, 5.2, 5.3, 5.5_


- [ ] 31. Verify framework flexibility
  - Test that both games use unmodified framework code
  - Verify scene system handles both procedural and fixed content
  - Verify game loop supports both continuous and turn-based modes
  - _Requirements: 9.1, 9.2, 9.4, 9.5_

- [ ] 31.1 Write property test for game loop flexibility
  - **Property 22: Game loop mode flexibility**
  - **Validates: Requirements 9.5**

- [x] 32. Fix failing unit and integration tests





  - Fix InputHandler test failures related to event listener mocking
  - Fix dungeon crawler entity test failures (takeDamage, collision detection)
  - Fix integration test timing and state management issues
  - Ensure all 454 tests pass consistently
  - _Requirements: All_


- [x] 33. Final checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.



- [x] 34. Create README documentation




  - Document framework architecture and systems
  - Provide guide for creating new games from framework
  - Include examples from dungeon crawler and puzzle game
  - Document configuration file formats and options
  - Add getting started guide with setup instructions
  - Document both game implementations (dungeon crawler and puzzle game)
  - Add instructions for running tests and development workflow
  - _Requirements: 8.5_
