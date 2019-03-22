const Discord = require( 'discord.js' );
const config = require( './config.json' );

//const Enmap = require('enmap');
//+ const EnmapMongo = require('enmap-mongo');

class diePool
{
  // Constructor
    constructor( rl = 0, kp = 0 )
    {
        this.bonus = 0;
        this.explodeOn = 10;
        this.emphasis = false;
        this.kept = 0;
        this.keptDice = kp;
        this.oopsed = false;
        this.owner = '';
        this.pool = [];
        this.raises = 0;
        this.rolledDice = rl;
        this.TN = 0;
    }

  // DiePool.printPool()
    printPool( wordy = true )
    {
        let msg = `${this.owner.username} rolled **`;
        msg += this.bonus != 0 ? `${this.kept + this.bonus}** (${this.kept} + ${this.bonus})` : `${this.kept}**`;        

        if ( wordy )
        {
            msg += this.explodeOn === 11 ? ` Unskilled` : ``;
            msg += this.emphasis ? ` with Emphasis` : ``;
            //+ "and mastery"

            if ( this.TN != 0 )
            {
                msg += ` against TN ${this.TN + this.raises * 5}`;
                if ( this.raises != 0)
                {
                    msg += ` (${this.TN} + ${this.raises} raises)`;
                }
            
                if ( this.kept >= this.TN + this.raises * 5 )
                {
                    msg += `\n**Success!** you passed by ${ this. kept - ( this.TN + this.raises * 5 ) }`
                }
                else
                {
                    msg += `\n**Failure!** you missed by ${ ( this.TN + this.raises * 5 ) - this. kept }`;
                }
            }

            msg += '\n[ **';
            for ( let k = 0; k < this.keptDice; k++ )
            {
                msg += `${this.pool[k]}`;

                msg += k + 1 < this.pool.length ? ',' : '';
            }

            msg += `**`;

            for ( let r = this.keptDice; r < this.pool.length; r++ )
            {
                msg += `${this.pool[r]}`;
                msg += r + 1 < this.pool.length ? ',' : '';
            }

            msg += ` ]`;

            msg += this.oopsed ? '\n__this roll has been modified__' : '';
        };
      
        return msg;
    }
}

var testRoll = new diePool();

// Initialize Discord Bot
const client = new Discord.Client(); //-{ token: config.token, autorun: true });

//+ client.rollMap = new Enmap({ provider: new EnmapMongo({ name: "rollMap" }) }); //Persistant
//client.rollMap = new Enmap(); //non-persistant

const prefix = config.prefix;

client.on ( "ready", () => { console.log( "I am ready!" ); });

client.on( 'message', ( message ) =>
{
   if ( message.content.slice( 0, config.prefix.length ) === prefix && message.content.length > 1 && !message.author.bot )
    {
      // RegEx Setup
        //- let args = message.split( ' ' );
        let args = message.content.slice( config.prefix.length ).trim().split(/ +/g);
        let firstCmd = args[0];

        let saveRoll = true;
        let isTestRoll = false;
        let wordy = true

        let msg = ''; //-message.author.id === config.boss ? 'Sure thing, Boss!\n' : '';

        const rollPattern = RegExp( '([0-9]{1,2})k([0-9]{1,2})(\.?!?)', 'i' );
        const tagPattern = RegExp( '(tn|raise|[\+-])([0-9]{1,2})', 'i' );

      // Help
        if ( firstCmd.toLowerCase() === 'help' )
        {
            //message.delete();

          //Flagged
            if ( args[1] )
            {
                switch ( args[1] )
                {
                    case 'help':
                        msg += '\n__Instruction Manual__';
                        msg += '\nFunction: displays command funtionality and option features';
                        msg += '\nForm: `~help {cmd}`';
                        msg += '\n\t` {cmd}` *optional* the name of another valid bot command.';
                        break;
                    /*case 'oops':
                        break;
                    case 'pr':
                    case 'prev':
                        break;*/
                    case 'roll':
                        msg += '\n__Roll the Dice__';
                        msg += '\nFunction: Rolls a pool of dice. Obeys the rule of 10.';
                        msg += '\nForm: `~xKy{!|.}`';
                          msg += '\n\t`x` a number from 0 to 99, how many dice are rolled.';
                          msg += '\n\t`y` a number from 0 to 99, how many dice are kept.';
                          msg += '\n\t`!` *optional*; adding this makes dice explode on 9s.';
                          msg += '\n\t`.` *optional*; adding this prevents dice from exploding.';
                        msg += '\nExtra Tags:';
                          msg += "\n\t`-#` subtract # from the roll's result";
                          msg += "\n\t`+#` add # to the roll's result";
                          //msg += '\n\t` no_save` does not save this roll for later.';
                          //msg += "\n\t` test_roll` saves this roll under no one's name";
                          msg += "\n\t`emphasis` causes natural 1's to be rerolled once";
                          msg += '\n\t`mastery` makes dice explode on 9s.';
                          msg += '\n\t`no_show` only display the final result of the roll.';
                          msg += "\n\t`tn#` sets the Target Number for the roll";
                          msg += "\n\t`raise#` calls # raises on the roll, increasing the TN";
                          msg += '\n\t`unskilled` prevents dice from exploding';
                        break;   
                }
            }
          //No Flags
            else
            {
                msg += '\nI am Onnotangu, the Lord Moon. My whims shall determine your fate!';

                msg += '\nAll prayers are case insensitive so yell if you like.\nSpeak slowly though, add spaces between tags so I can understand you.';

                //msg += '\n`~pr`: See `~prev`';
                //msg += '\n`~prev`: __Previous Roll__ - displays the previous roll.';
                msg += '\n\n `~#k#`: __Roll Dice__ - Will roll a pool of dice and keep a portion of the [# = 0-99]. see `~help roll` for more.';
                msg += '\n`~help {command}`: __Manual__ - displays detailed information about other commands';
                //msg += '\n`~oops`: __Unimplimented__ allows you to add forgotten void points, bonuses etc to your previous roll.'

                msg += '\n\nPlease PM Saelvarath if you find any bugs or have other suggestions!';
            }

            message.author.send( msg );
            msg = `**${message.author.username} has consulted the kami.**`;

        }
      // alternate help for the roll command
        else if ( firstCmd === 'roll' )
        {
            //message.delete();

            msg += '\n__Roll the Dice__';
            msg += '\nFunction: Rolls a pool of dice. Obeys the rule of 10.';
            msg += '\nForm: `~xKy{!|.}`';
                msg += '\n\t`x` a number from 0 to 99, how many dice are rolled.';
                msg += '\n\t`y` a number from 0 to 99, how many dice are kept.';
                msg += "\n\t`!` *optional*; adding  causes natural 1's to be rerolled once.";
                msg += '\n\t`.` *optional*; adding this prevents dice from exploding.';
            msg += '\nExtra Tags:';
                msg += "\n\t`-#` subtract # from the roll's result.";
                msg += "\n\t`+#` add # to the roll's result.";
                //msg += '\n\t` no_save` does not save this roll for later.';
                //msg += "\n\t` test_roll` saves this roll under no one's name";
                msg += "\n\t`emphasis` causes natural 1's to be rerolled once.";
                msg += '\n\t`mastery` makes dice explode on 9s.';
                msg += '\n\t`no_show` only display the final result of the roll.';
                msg += "\n\t`tn#` sets the Target Number for the roll.";
                msg += "\n\t`raise#` calls # raises on the roll, increasing the TN.";
                msg += '\n\t`unskilled` prevents dice from exploding.';

            message.author.send( msg );
            msg = `**${message.author.username} has consulted the kami.**`;
        }
      //Standard Test
        else if ( rollPattern.test( firstCmd ) )
        {
          //setup
            let firstExp = rollPattern.exec( firstCmd );

            var currPool = new diePool( Number.parseInt( firstExp[1] ), Number.parseInt( firstExp[2] ) );

            if ( firstExp[3] === '!' )
            {   currPool.emphasis = true; }
            else if ( firstExp[3] === '.' )
            {   currPool.explodeOn = 11;    }

            currPool.owner = message.author;

          //read and interpret each token
            args.forEach( token =>
            {
                if ( !tagPattern.test( token.toLowerCase() ) )
                {
                    switch ( token )
                    {
                        //case 'ns':
                        case 'no_save':
                            saveRoll = false;
                            break;
                        //case 'tr':
                        case 'test_roll':
                            isTestRoll = true;
                            break;
                        /*case 'tn':
                            currPool.TN = ;
                            break;*/
                        //case 'em':
                        case 'emphasis':
                            currPool.emphasis = true;
                            break;
                        //case 'ma':
                        case 'mastery':
                            currPool.explodeOn = currPool.explodeOn === 11 ? 11 : 9;
                            break;
                        //case 'ns':
                        case 'no_show':
                            wordy = false;
                            break;
                        //case 'un':
                        case 'unskilled':
                            currPool.explodeOn = currPool.explodeOn === 9 ? 9 : 11;
                            break;
                    }
                }
                else
                {
                    let ex = tagPattern.exec( token.toLowerCase() );
                    switch ( ex[1] )
                    {
                        case '+':
                            currPool.bonus += Number.parseInt( ex[2] );
                            break;
                        case '-':
                            currPool.bonus -= Number.parseInt( ex[2] );
                            break;
                        case 'tn':
                            currPool.TN = Number.parseInt( ex[2] );
                            break;
                        case 'raise':
                            currPool.raises = Number.parseInt( ex[2] );
                            break;
                    }
                }
            });

          //Rule of 10
            while ( currPool.rolledDice > 10 )
            {
                if ( currPool.rolledDice >= 10 && currPool.keptDice >= 10 )
                {
                    currPool.bonus += ( currPool.rolledDice + currPool.keptDice - 20 ) * 2
                    currPool.rolledDice = 10;
                    currPool.keptDice = 10;
                }
                else if ( currPool.rolledDice == 11 && currPool.keptDice < 10 )
                {
                    currPool.rolledDice = 10;
                }
                else if ( currPool.keptDice < 10 )
                {
                    currPool.rolledDice -= 2;
                    currPool.keptDice += 1;
                }
            }

          //Roll the dice
            for (let r = 0; r < currPool.rolledDice; r++)
            {
                currPool.pool.push( roll( currPool.explodeOn, currPool.emphasis ) );
            }

            currPool.pool.sort( function ( a, b ) { return b-a } );

            for ( let k = 0; k < currPool.keptDice; k++ )
            {
                currPool.kept += currPool.pool[k];
            }

            msg += currPool.printPool( wordy );


          //Save Roll
            /*if ( saveRoll )
            {
                //-client.rollMap.set( message.channel.id, currPool ); //is there any reason to save this?
                client.rollMap.set( message.author.id, currPool );
            }

            if ( isTestRoll )
            {
                testRoll = currPool;
                testRoll.owner = 'Test';
                msg = `Sure thing, Boss!\n${msg}\nThis is now the Versus Test Roll`;
            }*/
        }
      //Invalid command
        else
        {
            message.author.send( 'That\'s not a valid command.' );
        }

      //Output
        if ( msg !== '' )
        {
            message.channel.send( msg );
        }
    }
});

function roll ( expOn = '10', emph = false )
{
    let r =  1 + Math.floor( Math.random() * 10 );
    let final = 0;

    if ( emph && r === 1 )
    {
        r =  1 + Math.floor( Math.random() * 10 );
    }
    final += r;

    while ( r >= expOn )
    {
        r =  1 + Math.floor( Math.random() * 10 );
        final += r;
    }

    return final;
}

client.login( config.token );
