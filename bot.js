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

/**/bot.on('message', function (user, userID, channelID, message, evt) 
{
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if ( message.substring(0, 1) == '!' && message.length > 1 ) 
    {
        var args = message.substring(1).split(' ');
        var cmd = parseInt( args[0] );
       
        args = args.splice(1);

        if( Number.isInteger( cmd ) ) 
        {
            var dice = [];
            var obstacle = 2;
            var shade = 2;
            var isOpenEnded = true;
            var successes = 0;
            var arthaDice = 0;
            var msg = user + ' rolled ' + cmd; 

            switch( shade ) {
                case 4:
                    msg += ' Black ';
                    break;
                case 3:
                    msg += ' Grey ';
                    break;
                case 2:
                    msg += ' White ';
                    break;
            }

            isOpenEnded ? msg += 'Open Ended dice.\n' : msg += 'shaded dice.\n';

            dice = roll( cmd, isOpenEnded );

            dice.sort();
            dice.forEach(die => {
                die >= shade ? ++successes : null;                
            });

            msg += '[' + dice.toString() + ']\n'
            
            successes >= obstacle ? msg += 'That\'s a success of ' + ( successes - obstacle ) + ' and they get to mark off a ' : msg += 'Traitorous dice! That\'s a *failure*...\nAt least they get to mark off a ';

            if( obstacle > dice.length )
            {
                msg += 'Challenging test!'
            }
            else if( obstacle > routineTest[dice.length] )
            {
                msg += 'Difficult test!'
            }
            else
            {
                msg += 'Routine test.'
            }

            bot.sendMessage(
            {
                to: channelID,
                message: msg
            });
         }
         else
         {
            bot.sendMessage(
                {
                    to: channelID,
                    message: 'Pong!'
                });
         }

         roll.results = [];
     }
});

//dice = roll( cmd, isOpenEnded );


function roll( dieRolled = 1, openEnded = false )
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
};/**/