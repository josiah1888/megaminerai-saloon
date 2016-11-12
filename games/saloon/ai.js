// This is where you build your AI for the Saloon game.

var Class = require("classe");
var BaseAI = require(__basedir + "/joueur/baseAI");

/**
 * @class
 * @classdesc This is the class to play the Saloon game. This is where you should build your AI.
 */
var AI = Class(BaseAI, {
    /**
     * The reference to the Game instance this AI is playing.
     *
     * @member {Game} game
     * @memberof AI
     * @instance
     */

    /**
     * The reference to the Player this AI controls in the Game.
     *
     * @member {Player} player
     * @memberof AI
     * @instance
     */

    /**
     * This is the name you send to the server so your AI will control the player named this string.
     *
     * @memberof AI
     * @instance
     * @returns {string} - The name of your Player.
     */
    getName: function() {
        return "JS4life";
    },

    /**
     * This is called once the game starts and your AI knows its playerID and game. You can initialize your AI here.
     *
     * @memberof AI
     * @instance
     */
    start: function() {
        // pass
    },

    /**
     * This is called every time the game's state updates, so if you are tracking anything you can update it here.
     *
     * @memberof AI
     * @instance
     */
    gameUpdated: function() {
        // pass
    },

    /**
     * This is called when the game ends, you can clean up your data and dump files here if need be.
     *
     * @memberof AI
     * @instance
     * @param {boolean} won - True means you won, false means you lost.
     * @param {string} reason - The human readable string explaining why you won or lost.
     */
    ended: function(won, reason) {
        // pass
    },



    /**
     * This is called every time it is this AI.player's turn.
     *
     * @memberof AI
     * @instance
     * @returns {boolean} - Represents if you want to end your turn. True means end your turn, False means to keep your turn going and re-call this function.
     */
    runTurn: function() { require('./yee-turn')(this) },

    /**
     * A very basic path finding algorithm (Breadth First Search) that when given a starting Tile, will return a valid path to the goal Tile.
     *
     * @memberof AI
     * @instance
     * @param {Tile} start - the starting Tile
     * @param {Tile} goal - the goal Tile
     * @returns {Array.<Tile>} An array of Tiles representing the path, the the first element being a valid adjacent Tile to the start, and the last element being the goal.
     */
    findPath: function(start, goal) {
        if(start == goal) {
            // no need to make a path to here...
            return [];
        }

        // queue of the tiles that will have their neighbors searched for 'goal'
        var fringe = [];

        // How we got to each tile that went into the fringe.
        var cameFrom = {};

        // Enqueue start as the first tile to have its neighbors searched.
        fringe.push(start);

        // keep exploring neighbors of neighbors... until there are no more.
        while(fringe.length > 0) {
            // the tile we are currently exploring.
            var inspect = fringe.shift();

            // cycle through the tile's neighbors.
            var neighbors = inspect.getNeighbors();
            for(var i = 0; i < neighbors.length; i++) {
                var neighbor = neighbors[i];
                // if we found the goal, we have the path!
                if(neighbor === goal) {
                    // Follow the path backward to the start from the goal and return it.
                    var path = [ goal ];

                    // Starting at the tile we are currently at, insert them retracing our steps till we get to the starting tile
                    while(inspect !== start) {
                        path.unshift(inspect);
                        inspect = cameFrom[inspect.id];
                    }

                    return path;
                }
                // else we did not find the goal, so enqueue this tile's neighbors to be inspected

                // if the tile exists, has not been explored or added to the fringe yet, and it is pathable
                if(neighbor && neighbor.id && !cameFrom[neighbor.id] && neighbor.isPathable()) {
                    // add it to the tiles to be explored and add where it came from for path reconstruction.
                    fringe.push(neighbor);
                    cameFrom[neighbor.id] = inspect;
                }
            }
        }

        // if we got here, no path was found
        return [];
    },
});

module.exports = AI;
