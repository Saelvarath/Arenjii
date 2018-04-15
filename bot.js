var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
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
*/
var routineTest = [1, 1, 2, 2, 3, 4, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 13, 14, 15];

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

bot.on('message', function (user, userID, channelID, message, evt) 
{
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if ( message.slice(0, 1) === '~' && message.length > 1 ) 
    {
        var args = message.split(' ');
        var firstCmd = args[0];

        var rollPattern = RegExp('~([b|g|w])([0-9]{1,2})(!?)', 'i');
        var TestPattern = RegExp('([a-z]{1,2})([0-9]{0,2})', 'i');

    //Help
        if( firstCmd.toLowerCase() === '~help')
        {
            var msg = '**' + user + ' has queried the cosmos.**\nI am Un-Arenjii, the White God of Progression\nI am still in development but I still have a few tricks up my sleeve!\n';
            msg += '`~dof`: will roll a Die of Fate. adding ` +#` and/or ` -#` can change the result of the roll.\n';
            msg += '`~b#`, `~g#`, `~w#` will roll a pool of `#` black, grey or white dice respectively. adding a `!` after # will make the roll open ended.\n    Adding ` ob#` anywhere after will set the obstacle of the task and allow me to tell you the difficulty of the test.\n';
            msg += 'please PM Saelvarath if you find any bugs or have other suggestions!'

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
            var DoFPattern = RegExp('([+|-])([1-6])', 'i');

            args.forEach( token => {
                var flag = DoFPattern.exec( token );

                if( flag )
                {
                    switch( flag[1] )
                    {
                        case '+':
                            bonus += Number.parseInt( flag[2] );
                            break;
                        case '-':
                            bonus -= flag[2];
                            break;
                    }
                }             
            });

            var DoF = roll();
            
            var msg = user + ' rolled a Die of Fate!\n[' + ( DoF + bonus ) + ']';

            bot.sendMessage(
                {
                    to: channelID,
                    message: msg
                });
        }
    //Standard Test
        else if( rollPattern.test( firstCmd ) )
        {

            var firstExp = rollPattern.exec( firstCmd );

            var baseRolled = firstExp[2];           //BASE number of dice rolled
            var totalRolled = baseRolled;           //how many dice ultimately end up being rolled
            var dice = [];                          //array of dice results
            var helperDice = [];                    //how much your companions 'helped' you
            var astroDice = [];                     //results of astrological FoRKs/Help

            var successes = 0;                      //the number of successes gained
            var obstacle = 0;                       //obstacle of the roll
            var shade = 4;                          //shade of the roll, 4 = black, 3 = grey, 2 = white
            var isOpenEnded = firstExp[3] === '!';  //do dice explode?
            
            var arthaDice = [];                     //number of dice added through spending Artha

            var beginnersLuck = false;              //do you actually have the right skill for the job?

            args.forEach(token => {

                var flag = TestPattern.exec( token.toLowerCase() );
                
                switch( flag[1] )
                {
                    /*case 'ar':  //artha
                    case 'as':  //astrology
                    case 'bl':  //beginner's Luck
                    case 'hp':  //help dice*/
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
            });

            totalRolled = Number.parseInt(baseRolled) + arthaDice.length + helperDice.length + astroDice.length;
            var msg = user + ' rolled ' + totalRolled;

    //shade 
            switch( firstExp[1].toLowerCase() ) 
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

            isOpenEnded ? msg += 'Open Ended dice.\n' : msg += 'shaded dice.\n';
        
        //Roll base dice 
            for( d = 0; d < baseRolled; d++)
            {
                var r = roll();

                if( r >= shade ) { successes++; }
                if( isOpenEnded && r === 6 ) { d--; }

                dice.push( r );
            }

        //roll Artha dice

        //roll help dice

        //roll astrology dice

            msg += '[' + dice.toString() + ']\n'
            
        //determine test difficulty
            
            if( obstacle > 0 )
            {
                successes >= obstacle ? msg += 'Thats a success of ' + ( successes - obstacle ) + ' and they get to mark off a ' : msg += 'Traitorous dice! Thats a *failure*...\nAt least they get to mark off a ';
            
                //+ this will have to change when Beginner's Luck, Ob*2, Ob*4 are implemented
                if( obstacle > baseRolled )
                {
                    msg += 'Challenging test!'
                }
                else if( obstacle > routineTest[baseRolled] )
                {
                    msg += 'Difficult test!'
                }
                else
                {
                    msg += 'Routine test.'
                }
            }
            else
            {
                successes > 0 ? msg += 'Thats ' + successes + ' succes(es)!' : msg += 'No successes? looks like things are about to get interesting!'
            }

            bot.sendMessage(
            {
                to: channelID,
                message: msg
            });
        }
        else
        {
            bot.sendMessage( {to: channelID, message: 'Pong!'} );
        }
    }
});

/*function roll( dieRolled = 1, openEnded = false )
{
    if( typeof roll.results == 'undefined' )
    {
        roll.results = [];
    }

    if( dieRolled > 0 )
    {
        roll.results.push( 1 + Math.floor( Math.random() * 6 ) ); 
        
        if( openEnded && roll.results[roll.results.length - 1] == 6 )
        {
            roll( dieRolled, true );
        }
        else
        {
            roll( dieRolled - 1, openEnded );
        }
    }

    return roll.results;
};*/

function roll ()
{
    return  1 + Math.floor( Math.random() * 6 );
}

/*function astrologyDice( dieRolled = 1 )
{
    //roll die, if 1 roll again, if die is traitorous: -1 success 
    var results = 0;
    for( i = 0; i < dieRolled; i++)
    {
        var d1 = 1 + Math.floor( Math.random() * 6 );

    }
}*/