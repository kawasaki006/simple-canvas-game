// Player constants
export const PLAYER = {
    INITIAL_SIZE: 10,
    SPEED: 2,
    SPAWN_OFFSET: 4,  // Divider for initial spawn position (width/4, height/4)
};

// Bullet constants
export const BULLET = {
    PLAYER: {
        POOL_SIZE: 100,
        SPEED: 20,
        SIZE: 5,
        COOLDOWN: 1000,  // ms
        SPAWN_DISTANCE_RATIO: 2,  // Divider for spawn distance from player center
    },
    ENEMY: {
        POOL_SIZE: 100,
        SPEED: 5,
        SIZE: 3,
        MAX_BOUNCES: 4,
        BOUNCE_SPEED_MULTIPLIER: 0.75,
        TARGET_DISTANCE: 100,  // Distance for calculating bullet trajectory
    }
};

// Objective constants
export const OBJECTIVE = {
    SIZE: 30,
    ROTATION_SPEED: 0.02,
    HIT_ZONE: {
        RADIUS: 5,
        VISIBLE_DURATION: 10000,  // ms
        REQUIRED_PINK_HITS: 3,
    },
    SHOOTING: {
        INTERVAL: 1000,  // ms
        PINK_BULLET_WAVE: 3,  // Every Nth wave has pink bullet
        CORNER_CUT_RATIO: 0.5,  // How much of corner to cut off when destroyed
    },
    SPAWN: {
        PADDING: 50,  // Padding from canvas edges
    },
    ANGLES: {
        SECOND_POINT: 2.0944,  // 120 degrees in radians
        THIRD_POINT: 4.1888,   // 240 degrees in radians
    },
    COLOR: '#00ff00', // Green color
    COLOR_RGB: '0, 255, 0', // RGB values for green
};

// Frame rate constants
export const FRAME = {
    TARGET_MS: 16.67,  // Target frame time for 60 FPS
};

export const SECOND_STAGE = {
    MAX_COPIES: 5,
    SPAWN_INTERVAL: 3000, // 3 seconds between spawns
    SPAWN_ANIMATION_START: 2000, // When to start spawn animation
    SPAWN_ANIMATION_DURATION: 1000, // How long the spawn animation lasts
    FLICKER_DURATION: 1000, // How long the true objective flickers
    DEATH_DELAY: 1000, // Delay before win screen after killing true objective
    HITS_TO_KILL: 2, // Number of hits needed to kill true objective
    TARGETING_DURATION: 1000, // How long objective spends targeting
    RESTING_DURATION: 1000, // How long objective rests between attacks
    DASH_SPEED: 600, // Pixels per second
}; 