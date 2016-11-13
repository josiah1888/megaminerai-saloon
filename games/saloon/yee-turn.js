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

    var cowboys = context.player.cowboys
        .filter(i => !i.isDead)
        .sort((prev, curr) => {
            var prevJob = prev.job.toLowerCase();
            var currJob = curr.job.toLowerCase();

            if (prevJob === currJob) {
                return 0;
            } else if (prevJob === 'brawler') {
                return -1;
            } else if (prevJob === 'bartender' && currJob === 'sharpshooter') {
                return -1
            } else {
                return 1;
            }
        });

    var brawlers = cowboys.filter(i => i.job.toLowerCase() === 'brawler');
    if (brawlers.length === 2) {
        cowboys = [brawlers[0]].concat(cowboys.filter(i => i.job.toLowerCase() !== 'brawler')).concat(brawlers[1]);
    }

    for(let cowboy of cowboys) {
       actBartender(context, cowboy);
       actMarksman(context, cowboy);
       moveCowboy(context, cowboy);
       avoidBottles(context, cowboy);
       playPiano(context, cowboy);
    }

    log("Ending my turn.");

    // we are done, returning true tells the game server we are indeed done with our turn.
    return true;
}

function log(message) {
    true && console.log('>> ' + message);
}

function spawn(context, type) {
    var cowboy = context.player.youngGun.callInTile.cowboy;
    if ((!cowboy || cowboy.owner.id !== context.player.id) && context.player.cowboys.filter(i => i.job === type).length < 2) {
        context.player.youngGun.callIn(type);
    }
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
        path && path.length && cowboy.move(path[0]) && log('moving cowboy 1')
    } else {
        var pianoPath = getClosestPianoPath(context, cowboy);


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
                log('moving cowboy to new path')
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

function actMarksman(context, cowboy) {
    if (!cowboy.isDead && cowboy.job.toLowerCase() === 'sharpshooter') {
        var tiles = [];
        for(var i = 1; i <= cowboy.focus; i++) {
            tiles.push(context.game.getTileAt(cowboy.tile.x + i, cowboy.tile.y))
            tiles.push(context.game.getTileAt(cowboy.tile.x - i, cowboy.tile.y))
            tiles.push(context.game.getTileAt(cowboy.tile.x, cowboy.tile.y + i))
            tiles.push(context.game.getTileAt(cowboy.tile.x, cowboy.tile.y - i))
        }

        var enemyTile = tiles.find(i => i && i.cowboy && i.cowboy.owner.id !== context.game.currentPlayer.id);
        if (enemyTile) {
            var shootinTile;
            if (enemyTile.x === cowboy.tile.x) {
                shootinTile = enemyTile.y > cowboy.tile.y ? cowboy.tile.tileSouth : cowboy.tile.tileNorth;
            } else {
                shootinTile = enemyTile.x > cowboy.tile.x ? cowboy.tile.tileEast : cowboy.tile.tileWest;
            }

            log('HHEEEYYOOOO >> >> >> >> WE SHOT THE SHERIFF')
            cowboy.act(shootinTile);
        }
    }
}
