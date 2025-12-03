/**
 * Example usage of the DungeonGenerator
 * Run with: node games/dungeon-crawler/generation/example.js
 */
import { DungeonGenerator } from './DungeonGenerator.js';

// Create a dungeon generator with configuration
const generator = new DungeonGenerator({
  width: 50,
  height: 50,
  minRooms: 5,
  maxRooms: 10,
  minRoomSize: 4,
  maxRoomSize: 10
});

// Generate a dungeon with a specific seed for reproducibility
const dungeon = generator.generate(12345);

console.log('Dungeon Generated!');
console.log(`Dimensions: ${dungeon.width}x${dungeon.height}`);
console.log(`Number of rooms: ${dungeon.rooms.length}`);
console.log(`Number of corridors: ${dungeon.corridors.length}`);
console.log(`All rooms connected: ${DungeonGenerator.isFullyConnected(dungeon)}`);

// Display a simple ASCII representation
console.log('\nASCII Map (# = wall, . = floor):');
for (let y = 0; y < Math.min(dungeon.height, 30); y++) {
  let row = '';
  for (let x = 0; x < Math.min(dungeon.width, 60); x++) {
    row += dungeon.tiles[y][x] === 1 ? '.' : '#';
  }
  console.log(row);
}

// Show room details
console.log('\nRoom Details:');
dungeon.rooms.forEach((room, index) => {
  console.log(`  Room ${index + 1}: Position (${room.x}, ${room.y}), Size ${room.width}x${room.height}`);
});
