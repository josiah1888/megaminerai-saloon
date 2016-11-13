module.exports = function(context) {
    'use strict';
    // Put your game logic here for runTurn

    // context is "ShellAI", some basic code we've provided that does
    // everything in the game for demo purposed, but poorly so you
    // can get to optimizing or overwriting it ASAP
    //
    // ShellAI does a few things:
    // 1. Tries to spawn a new Cowboy
    // 2. Tries to move to a Piano
    // 3. Tries to play a Piano
    // 4. Tries to act

    log("Start of my turn: " + context.game.currentTurn);


    // for steps 2, 3, and 4 we will use context cowboy:
    var activeCowboy;
    for(var i = 0; i < context.player.cowboys.length; i++) {
        if(!context.player.cowboys[i].isDead) {
            activeCowboy = context.player.cowboys[i];
            break;
        }
    }

    spawn(context, 'Bartender');
    spawn(context, 'Sharpshooter');
    spawn(context, 'Brawler');

    for(let cowboy of context.player.cowboys.filter(i => !i.isDead)) {
       actBartender(context, cowboy);
       moveCowboy(context, cowboy);
       avoidBottles(context, cowboy);
       playPiano(context, cowboy);
    }

    // Now let's use him
    if(activeCowboy) {
        //--- 3. Try to play a piano ---\\\



        //--- 4. Try to act ---\\

        // make sure the cowboy is alive and is not busy
        if(!activeCowboy.isDead) {
            // Get a random neighboring tile.
            var randomNeighbor = activeCowboy.tile.getNeighbors().randomElement();

            // Based on job, act accordingly.
            switch(activeCowboy.job) {
               
                case "Sharpshooter":
                    // Sharpshooters build focus by standing still, they can then act(tile) on a neighboring tile to fire in that direction
                    if(activeCowboy.focus > 0) {
                        log("4. Sharpshooter acting on Tile #" + randomNeighbor.id);
                        activeCowboy.act(randomNeighbor); // fire in a random direction
                    }
                    else {
                        log("4. Sharpshooter doesn't have enough focus. (focus == " + activeCowboy.focus + ")");
                    }
                    break;
                default:
                    break;
            }
        }
    }

    log("Ending my turn.");

    // we are done, returning true tells the game server we are indeed done with our turn.
    return true;
}

function log(message) {
    true && console.log('>> ' + message);
}

function spawn(context, type) {
    context.player.youngGun.callIn(type);
}

function getClosestPianoPath(context, cowboy, checkTargeted, goBackwards) {
    checkTargeted = checkTargeted === false ? false : true;
    const pianos = context.game.furnishings.filter(i => i.isPiano && !i.isDestroyed && (!checkTargeted || !i.targetedBy));
    const paths = pianos.map(i => ({piano: i, path: context.findPath(cowboy.tile, i.tile)}));
    const lengthzzzzz = Math[goBackwards ? 'max' : 'min'].apply(null, paths.map(i => i.path.length));
    //log(paths)
    const path = paths.find(i => i.path.length === lengthzzzzz);

    return path;
}

function getFurnishing(context, id) {
    return context.game.furnishings.find(i => i.id === id);
}

function moveCowboy(context, cowboy) {
    const target = cowboy.target && getFurnishing(context, cowboy.target);
    cowboy.target = target && !target.isDestroyed ? cowboy.target : null;
    if (target && !target.isDestroyed) {
        const path = context.findPath(cowboy.tile, target.tile);
        path && path.length && cowboy.move(path[0])
    } else {
        const pianoPath = getClosestPianoPath(context, cowboy);
        if (pianoPath && pianoPath.path && pianoPath.path.length) {
            log('moving cowboy');
            cowboy.move(pianoPath.path[0]);
        }

        if (pianoPath) {
            pianoPath.piano.targetedBy = cowboy.id;
            cowboy.target = pianoPath.piano.id;

            log('setting id of ' + cowboy.target)
        }

        if (!pianoPath) {
            var newPath = getClosestPianoPath(context, cowboy, false, true);
            if (newPath && newPath.path && newPath.path.length) {
                cowboy.move(newPath.path[0]);
                cowboy.target = newPath.piano.id;
            }
        }
    }
}
function getRandDir(){
    var dirs = ['North', 'South', 'East', 'West'];
    var num = Math.floor(Math.random() * 4)
    return dirs[num];
    
}
function actBartender(context, bartender) {
    if (bartender.job === 'Bartender' && bartender.turnsBusy === 0) {
        const neighbors = bartender.tile.getNeighbors()
            .map(i => i.bartender).filter(i => i)
            .filter(i => i.owner && i.owner.name !== context.getName());

        if (neighbors.length) {
            bartender.act(neighbors[0], getRandDir);
        } else {
            var enemyTiles = context.game.currentPlayer.opponent.cowboys.map(i => i.tile);
            for(var tile of enemyTiles) {
                var path = context.findPath(bartender.tile, tile)
                if (path.length === 2){
                    bartender.move(path[0]);
                    bartender.act(path[1], getRandDir());
                }
            }
        }
   }
}

function playPiano(context, cowboy) {
     if(!cowboy.isDead) {
    // look at all the neighboring (adjacent) tiles, and if they have a piano, play it
        var neighbors = cowboy.tile.getNeighbors();
        for(i = 0; i < neighbors.length; i++) {
            var neighbor = neighbors[i];

        // if the neighboring tile has a piano
            if(neighbor.furnishing && neighbor.furnishing.isPiano) {
                // then play it
                log("3. Playing Furnishing (piano) #" + neighbor.furnishing.id);
                cowboy.play(neighbor.furnishing);
                return;
            } 
        }
    }
}

function avoidBottles(context, cowboy) {
     if(!cowboy.isDead) {
        const bottles = cowboy.tile.getNeighbors().filter(i => i.bottle);
        const freeTiles = cowboy.tile.getNeighbors().filter(i => !i.bottle && !i.cowboy && !i.furnishing && i.isPathable());
        if (bottles.length && freeTiles.length) {
            cowboy.move(freeTiles[0])
        }

     }
}
