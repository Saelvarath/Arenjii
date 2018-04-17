var Discord = require( 'discord.io' );
var logger = require( 'winston' );
var auth = require( './auth.json' );

// Configure logger settings
logger.remove( logger.transports.Console );
logger.add( logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

/*
Challenging = # of dice rolled +1
Difficult = # of dice rolled and below but above RoutineChallenge
if diceRolled > routineTest.length us use diceRolled-3?
*/
var routineTest = [1, 1, 2, 2, 3, 4, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];

bot.on( 'ready', function (evt) {
    logger.info( 'Connected' );
    logger.info( 'Logged in as: ' );
    logger.info( bot.username + ' - (' + bot.id + ')' );
});

bot.on( 'message', function ( user, userID, channelID, message, evt ) 
{
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if ( message.slice( 0, 1 ) === '~' && message.length > 1 ) 
    {
        var args = message.split( ' ' );
        var firstCmd = args[0];

        var rollPattern = RegExp( '~([b|g|w])([0-9]{1,2})(!?)', 'i' );
        var TestPattern = RegExp( '([a-z]{1,2})([0-9]{0,2})', 'i' );

    //Help
        if ( firstCmd.toLowerCase() === '~help' )
        {
            var msg = '**' + user + ' has queried the cosmos.**\nI am Un-Arenjii, the White God of Progression.\nI am still in development but I still have a few tricks up my sleeve!';
           
            msg += '\n`~dof`: __Die of Fate__: Rolls a single die.';
                msg += '\n\t` +#` adds `#` [1-6] to the result of the roll.';
                msg += '\n\t` -#` subtracts `#` [1-6] to the result of the roll.';
            
            msg += '\n`~fate`: See `~luck`.';
           
            msg += '\n`~luck`: __Luck, Fate point__ *Unimplemented* Rerolls all 6s in the previous roll if it wasn\'t open-ended or one traitor die if it was.';

            msg += '\n`~rdc X Y`: __Difficulty Calculator__ *Unimplemented* returns if roll of `X` dice against and Ob of `Y` is Routine, Difficult or Challenging.';

            msg += '\n`~vs`: __Versus Roll__ Unimplemented.';

            msg += '\n`~b#`, `~g#`, `~w#` rolls a pool of `#` [0-99] black, grey or white dice respectively. adding a `!` after `#` will make the roll open ended.';
              msg += '\n\t` bn#` __Boon, Deeds Point__: Adds `#` [1-3] dice to the roll that do no affect difficulty';
              msg += '\n\t` he#` __Helper Exponent__: Adds Help Dice from an Exponent of `#` [1-10]. if an Obstacle is specified I can tell how difficult their test is';
              msg += '\n\t` ob#` __Obstacle, Base__: Set the base obstacle of the task to `#` and allows me to tell you the difficulty of the test.';
              msg += '\n\t` as` __Astrology, FoRK__: Adds special Astrology FoRK dice. Rolls 1 die by default. `as2` will roll 2';
           
            msg += '\n\nPlease PM Saelvarath if you find any bugs or have other suggestions!';

            bot.sendMessage(
                {
                    to: channelID,
                    message: msg
                });
        }
    //Die of Fate 
        else if ( firstCmd === '~dof' )
        {
            var bonus = 0;
            var DoFPattern = RegExp( '([+|-])([1-6])', 'i' );

            args.forEach( token => {
                var flag = DoFPattern.exec( token );

                if ( flag )
                {
                    switch ( flag[1] )
                    {
                        case '+':
                            bonus += Number( flag[2] );
                            break;
                        case '-':
                            bonus -= flag[2];
                            break;
                    }
                }             
            });

            var DoF = roll();
            
            var msg = user + ' rolled a Die of Fate';
            if ( bonus > 0 ) { msg += ' +' + bonus; }
            else if ( bonus < 0 ) { msg += ' ' + bonus; }
            
            msg += '!\n[' + ( DoF + bonus ) + ']';

            bot.sendMessage(
                {
                    to: channelID,
                    message: msg
                });
        }
    //Luck; Fate point, retroactively make a roll Open-Ended
        else if ( firstCmd.toLowerCase() === '~luck' || firstCmd.toLowerCase() === '~fate' )
        {
            bot.sendMessage(
                {
                    to: channelID,
                    message: 'This feature is not implemented yet.'
                });
        }
    //Test Difficulty calculator
        else if ( firstCmd.toLowerCase() === '~rdc' )
        {
            if ( args[2] ) 
            {
                var d = Number.parseInt( args[1] );
                var o = Number.parseInt( args[2] );
                var msg = '';

                if ( typeof o != 'number' || typeof d != 'number' )
                {
                    bot.sendMessage(
                        {
                            to: channelID,
                            message: 'those are not valid numbers.' // + typeof args[1] + ', ' + typeof args[2] 
                        });
                }
                else
                {
                    if ( d > routineTest.length )
                    {
                        msg = 'Whoa there friend... That\'s an awful lot of dice you\'re slinging there...\n What do you think you are playing? Shadowrun? *Exalted?*';

                        bot.sendMessage(
                            {
                                to: channelID,
                                message: msg
                            });
                    }
                    else if ( o > 0 )
                    {
                        msg = d + 'D rolled Versus an Ob of ' + o + '?\nWhy, that would be a ';

                        if ( o > d )
                        {
                            msg += 'Challenging test!';
                        }
                        else if ( o > routineTest[d] )
                        {
                            msg += 'Difficult test!';
                        }
                        else
                        {
                            msg += 'Routine test.';
                        }

                        bot.sendMessage(
                            {
                                to: channelID,
                                message: msg
                            });
                    }
                }
            }
            else
            {
                bot.sendMessage(
                    {
                        to: channelID,
                        message: 'I need 2 numbers to compare. first, the number of dice rolled; second the Obstacle of the test.'
                    });
            }

            
        }
        else if ( firstCmd.toLowerCase() === '~vs' )
        {
            bot.sendMessage(
                {
                    to: channelID,
                    message: 'Ooh... that\'s a tricky one... Hmmmm... ask me again in a week.'
                });
        }
    //Standard Test
        else if ( rollPattern.test( firstCmd ) )
        {

            var firstExp = rollPattern.exec( firstCmd );

            var baseRolled = firstExp[2];           //BASE number of dice rolled
            var totalRolled = baseRolled;           //how many dice ultimately end up being rolled
            var dice = [];                          //array of dice results
            var astroDice = [];                     //results of astrological FoRKs/Help
            var arthaDice = [];                     //number of dice added through spending Artha
            var helperDice = [];                    //how much your companions 'helped' you
            var helperExponent = [];                //the exponent of your helpers
            
            var nonArtha = 0;                       //the number of non-artha dice added to the roll;

            var successes = 0;                      //the number of successes gained
            var obstacle = 0;                       //BASE obstacle of the roll
            var shade = 4;                          //shade of the roll, 4 = black, 3 = grey, 2 = white
            var isOpenEnded = firstExp[3] === '!';  //do dice explode?

            var beginnersLuck = false;              //do you actually have the right skill for the job?

        //read and interpret each token
            args.forEach( token => {

                var flag = TestPattern.exec( token.toLowerCase() );
                
                if ( flag )
                {
                    switch ( flag[1] )
                    {
                        case 'as':  //astrology
                            if ( flag[2] != 0 )
                            {
                                astroDice.push( 0 );
                                nonArtha++;

                                if ( flag[2] >= 2 )
                                {
                                    astroDice.push( 0 );
                                    nonArtha++;
                                }
                            }
                            break;
                        //case 'bl':  //beginner's Luck
                        case 'bn':  //Boon; Persona Point - +1D-3D to a roll 
                            flag[2] > 3 ? arthaDice += 3 : arthaDice += flag[2];
                            break;
                       // case 'di':  //Divine Inspiration; Deeds Point - doubles base Exponent
                        case 'he':  //helper dice*/
                            if ( flag[2] > 6 )
                            {
                                helperDice.push( [0, 0] );
                                nonArtha += 2;
                            } 
                            else
                            {
                                helperDice.push( [0] ); 
                                nonArtha++;
                            } 

                            helperExponent.push( flag[2] );
                            break;
                        case 'ob':  //base obstacle
                            obstacle = flag[2];
                            break;
                        /*case 'oe':  //open ended
                        case 'ox':  //base Obstacle multiplier
                        case 'o+'   //obstacle addition
                        case 'o-'   //obstacle subtraction
                        case 'vs':  //this is a VS test?
                        case '+':
                        case '-':*/
                    }
                }
            });

        //Find total dice rolled
            totalRolled = Number( baseRolled ) + Number( arthaDice ) + nonArtha;

            var msg = user + ' rolled ' + totalRolled;

        //determine shade 
            switch ( firstExp[1].toLowerCase() ) 
            {
                case 'b':
                    shade = 4;
                    msg += ' Black ';
                    break;
                case 'g':
                    shade = 3;
                    msg += ' Grey ';
                    break;
                case 'w':
                    shade = 2;
                    msg += ' White ';
                    break;
            }

            isOpenEnded ? msg += 'Open Ended dice' : msg += 'shaded dice';

            obstacle > 0 ?  msg += ' against an Ob of ' + obstacle + '.' : msg += '.';

        //roll astrology dice
            for ( a = 0; a < astroDice.length; a++ )
            {
                var astRoll = [roll()];

                successes += astRoll[a] >= shade;

                if ( astRoll.slice(-1) == 1 )
 	            {
                    var r = roll();
                    successes -= r < shade;
                    astRoll.push( r );
                }
                else
                {
                    while( astRoll.slice(-1) == 6 )
                    {
                        var r = roll();
                        successes += r >= shade;
                        astRoll.push( r );
                    }
                }
                
                astroDice[a] = astRoll;
            }

        //tally & output astrology results
            if ( astroDice.length )
            {
                msg += '\nThe Stars are ';
                successes >0 ? msg += 'right' : msg += 'wrong';
                msg += ' for ' + user + '. their fate gives them ' + successes + ' success this roll\nAstro Dice: [ ' + astroDice.toString() + ' ]';

            }

        //roll helper dice
            for ( h = 0; h < helperDice.length; h++ )
            {
                var helpRoll = [];
            
                for ( h2 = 0; h2 < helperDice[h].length; h2++ )
                {
                    var r = roll();
                    successes += r >= shade;
                    helpRoll.push( r );
                
                    while( isOpenEnded && r === 6 )
                    {
                        r = roll();
                        successes += r >= shade;
                        helpRoll.push( r );
                    }
                }

                helperDice[h] = helpRoll;
            }

        //determine helper test difficulty
            for ( helper = 0; helper < helperDice.length; helper++ ) 
            {
                msg += '\nHelper' + helper + ' added [ ' + helperDice[helper].toString() + ' ] to the roll';
                
                if ( obstacle > 0 )
                {
                    msg += ' and earns a ';

                    if ( obstacle > helperExponent[helper] )
                    {
                        msg += 'Challenging test!';
                    }
                    else if ( obstacle > routineTest[helperExponent[helper]] )
                    {
                        msg += 'Difficult test!';
                    }
                    else
                    {
                        msg += 'Routine test.';
                    }
                }
                else 
                { msg += '.'; }
            }
        //Roll base dice 
            for ( d = 0; d < Number( baseRolled ) + Number( arthaDice ); d++ )
            {
                var r = roll();

                if ( r >= shade ) { successes++; }
                if ( isOpenEnded && r === 6 ) { d--; }

                dice.push( r );
            }

            if ( dice.length )
            {
                msg += '\nBase dice: [ ' + dice.toString() + ' ] ';
                arthaDice > 0 ? msg += arthaDice + ' of which were gaing by spending Artha' : 0;
            }
           
        //determine Main test difficulty
            if ( obstacle > 0 )
            {
                successes >= obstacle ? msg += '\nThats a success of ' + ( successes - obstacle ) + ' and they get to mark off a ' : msg += '\nTraitorous dice! Thats a *failure*...\nAt least they get to mark off a ';
            
                //+ this will have to change when Beginner's Luck, Ob*2, Ob*4 are implemented
                if ( obstacle > baseRolled + nonArtha )
                {
                    msg += 'Challenging test!';
                }
                else if ( obstacle > routineTest[Number( baseRolled ) + Number( nonArtha )] )
                {
                    msg += 'Difficult test!';
                }
                else
                {
                    msg += 'Routine test.';
                }
            }
            else
            {
                successes > 0 ? msg += '\nThats ' + successes + ' succes(es)!' : msg += '\nNo successes? looks like things are about to get interesting!';
            }

            bot.sendMessage(
            {
                to: channelID,
                message: msg
            });
        }
    //Debug output 
        else
        {
            bot.sendMessage( {to: channelID, message: 'That\'s not a valid command.'} );
        }
    }
});

function roll ()
{
    return  1 + Math.floor( Math.random() * 6 );
}