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



    //--- 1. Try to spawn a Cowboy --\\

    log('spawning my brawler')

    spawn(context, 'Brawler');
    spawn(context, 'Sharpshooter');
    spawn(context, 'Bartender');


    /*
    // Randomly select a job.
    var callInJob = context.game.jobs.randomElement();
    var jobCount = 0;
    for(i = 0; i < context.player.cowboys.length; i++) {
        var myCowboy = context.player.cowboys[i];
        if(!myCowboy.isDead && myCowboy.job === callInJob) {
            jobCount++;
        }
    }

    // Call in the new cowboy with that job if there aren't too many
    //   cowboys with that job already.
    if(context.player.youngGun.canCallIn && jobCount < context.game.maxCowboysPerJob) {
        log("1. Calling in: " + callInJob);
        context.player.youngGun.callIn(callInJob);
    }
    */

    for(let cowboy of context.player.cowboys.filter(i => !i.isDead)) {
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
        }
    }

    // Now let's use him
    if(activeCowboy) {
        //--- 2. Try to move to a Piano ---\\

        // find a piano
        /*
        var piano;
        for(i = 0; i < context.game.furnishings.length; i++) {
            var furnishing = context.game.furnishings[i];
            if(furnishing.isPiano && !furnishing.isDestroyed) {
                piano = furnishing;
                break;
            }
        }
        

        // There will always be pianos or the game will end. No need to check for existence.
        // Attempt to move toward the piano by finding a path.
        if(activeCowboy.canMove && !activeCowboy.isDead) {
            log("Trying to do stuff with Cowboy #" + activeCowboy.id);

            // find a path from the Tile context cowboy is on to the tile the piano is on
            var path = context.findPath(activeCowboy.tile, piano.tile);

            // if there is a path, move to it
            //      length 0 means no path could be found to the tile
            //      length 1 means the piano is adjacent, and we can't move onto the same tile as the piano
            if(path.length > 1) {
                log("2. Moving to Tile #" + path[0].id);
                activeCowboy.move(path[0]);
            }
        }
        */



        //--- 3. Try to play a piano ---\\\

        // make sure the cowboy is alive and is not busy
        if(!activeCowboy.isDead && activeCowboy.turnsBusy === 0) {
            // look at all the neighboring (adjacent) tiles, and if they have a piano, play it
            var neighbors = activeCowboy.tile.getNeighbors();
            for(i = 0; i < neighbors.length; i++) {
                var neighbor = neighbors[i];

                // if the neighboring tile has a piano
                if(neighbor.furnishing && neighbor.furnishing.isPiano) {
                    // then play it
                    log("3. Playing Furnishing (piano) #" + neighbor.furnishing.id);
                    activeCowboy.play(neighbor.furnishing);
                    break;
                }
            }
        }



        //--- 4. Try to act ---\\

        // make sure the cowboy is alive and is not busy
        if(!activeCowboy.isDead && activeCowboy.turnsBusy === 0) {
            // Get a random neighboring tile.
            var randomNeighbor = activeCowboy.tile.getNeighbors().randomElement();

            // Based on job, act accordingly.
            switch(activeCowboy.job) {
                case "Bartender":
                    // Bartenders throw Bottles in a direction, and the Bottle makes cowboys drunk which causes them to walk in random directions
                    // so throw the bottle on a random neighboring tile, and make drunks move in a random direction
                    var direction = activeCowboy.tile.directions.randomElement();
                    log("4. Bartender acting on Tile #" + randomNeighbor.id + " with drunkDirection " + direction);
                    activeCowboy.act(randomNeighbor, direction);
                    break;
                case "Brawler":
                    // Brawlers cannot act, they instead automatically attack all neighboring tiles on the end of their owner's turn.
                    log("4. Brawlers cannot act.");
                    break;
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

function getClosestPianoPath(context, cowboy) {
    const pianos = context.game.furnishings.filter(i => i.isPiano && !i.isDestroyed && !i.targetedBy);
    const paths = pianos.map(i => ({piano: i, path: context.findPath(cowboy.tile, i.tile)}));
    const smallestLength = Math.min.apply(null, paths.map(i => i.path.length));
    //log(paths)
    const path = paths.find(i => i.path.length === smallestLength);

    return path;
}

function getFurnishing(context, id) {
    return context.game.furnishings.find(i => i.id === id);
}