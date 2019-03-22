const Discord = require( 'discord.js' );
const config = require( './config.json' );

const Enmap = require('enmap');
//+ const EnmapMongo = require('enmap-mongo');

//+ TODO
    //+ Optimize Fate/Luck?
    //+ Ensure Versus test are correct?

class diePool
{
  // Constructor
    constructor( )
    {
        this.autoSuccess = 0;        // successes that don't need to be rolled
        this.cascade = [];           // die results that add another die to the pool
        this.cascadeMax = -1;        // max number of dice that can be added in a cascade
        this.difficulty = 0;         // number of successes needed
        this.double = 10;            // result that count as two successes
        this.numDice = 0;            // number of dice in the pool
        this.owner = 'Hugh Mann';    // Who rolled the dice
        this.pool = [];              // array of dice results
        this.reroll = [];            // die results that are rerolled until they do occur
        this.rerollMax = -1;         // max number of dice that can be rerolled
        this.successes = 0;          // the number of successes gained through rolls
        this.TN = 7;                 // die result that counts as a Success.
        this.reps = 0                // times this user has been added to the vs stack 
    }

  // DiePool.printPool()
  printPool( wordy = true )
  {
      let msg = `${this.owner.username} rolled **`;
      msg += `${this.successes + this.autoSuccess}**`;        

      if ( wordy )
      {
        if ( this.difficulty != 0 )
        {
            msg += ` against a difficulty of ${this.difficulty}`;
        }

        msg += '\n[ ';

        let cc = this.cascadeMax >= 0 ? this.cascadeMax : -1;
        let rr = this.rerollMax >= 0 ? this.rerollMax : -1;

        /**
         * italic = success *|_
         * bold = double **
         * Underline = cascade __
         * strikethrough = reroll ~~
         */

        for( let d = 0; d < this.pool.length; d++ ) 
        {
          // Reroll
            if ( rr !== 0 && this.reroll.includes( this.pool[d] ) )
            {
                msg += d === 0 ? '~~ ' : ',~~ ';
                msg += `${this.pool[d]}`;
                rr--;

                while ( rr !== 0 && this.reroll.includes( this.pool[d + 1] ) )
                {
                    ++d;
                    msg += ', ';
                    msg += `${this.pool[d]}`;
                    rr--;
                }

                msg += ' ~~';
            }
          // Cascade
            else if ( cc !== 0 && this.cascade.includes( this.pool[d] ) )
            {
                msg += d === 0 ? '__' : ', __';
                msg += this.pool[d] >= this.TN ? ( this.pool[d] >= this.double ? `**_${this.pool[d]}_**` : `*${this.pool[d]}*` ) : `${this.pool[d]}`;

                while ( cc !== 0 && this.cascade.includes( this.pool[d] ) )
                {
                    ++d;
                    msg += ', ';
                    msg += this.pool[d] >= this.TN ? ( this.pool[d] >= this.double ? `**_${this.pool[d]}_**` : `_${this.pool[d]}_` ) : `${this.pool[d]}`;
                    cc--;
                }
                
                msg += '__';
            }
          // success
            else if ( this.pool[d] >= this.TN )
            {
                msg += d === 0 ? '' : ', ';
                msg += this.pool[d] >= this.double ? `**_${this.pool[d]}_**` : `_${this.pool[d]}_`;
            }
            else
            {
                msg += d === 0 ? `${this.pool[d]}` : `, ${this.pool[d]}`;
            }
        }

        msg += ' ]';
      };
    
      return msg;
  }
}

// Initialize Discord Bot
const client = new Discord.Client(); //- { token: config.token, autorun: true });

//+ client.rollMap = new Enmap({ provider: new EnmapMongo({ name: "rollMap" }) }); // Persistant
client.rollMap = new Enmap(); // non-persistant

const prefix = config.prefix;

const rollPattern = RegExp( 'roll([0-9]{1,2})', 'i' );
const tagPattern = RegExp( '(cascade|difficulty|double|reroll|tn|[\+-])([0-9]{0,2})(failures|fives|liminal|non-ones|non-tens|ones|s|successes|tens)?', 'i' );

client.on ( "ready", () => { console.log( "I am ready!" ); });

client.on( 'message', ( message ) =>
{
   if ( !message.author.bot && message.content.length > 1 && message.content.slice( 0, prefix.length ) === prefix  )
    {
      // RegEx Setup
        let args = message.content.toLowerCase().slice( prefix.length ).trim().split(/ +/g);
        let firstCmd = args[0];

        let isVS = false;
        let saveRoll = true;

        let msg = '';

      // Roll
        if ( rollPattern.test( args[0] + args[1] ) )
        {
        // setup
            let firstExp = rollPattern.exec( args[0] + args[1] );

            var currPool = new diePool();

            currPool.owner = message.author;
            currPool.numDice = Number( firstExp[1] );

        // read and interpret each token
            args.forEach( token =>
            {
                let flag = tagPattern.exec( token.toLowerCase() );

                if ( flag )
                {
                    if ( flag[2] && !flag[3] || flag[3] === 's' )
                    {
                        let amount = Number( flag[2] );

                        switch ( flag[1] )
                        {
                            case 'cascade':  
                                currPool.cascade.push( amount );
                                break;
                            case 'difficulty':  
                                currPool.difficulty = amount;
                                break;
                            case 'double':
                                currPool.double = amount;
                                break;
                            case 'reroll':
                                currPool.reroll.push( amount );
                                break;
                            case 'tn':
                                currPool.TN = amount;
                            case '+':
                                currPool.autoSuccess += amount;
                                break
                            case '-':
                                currPool.autoSuccess -= amount;
                                break;
                        }
                    }
                    else
                    {
                        let amount = !flag[2] ? -1 : Number( flag[2] );
                        let sides = [];

                        switch ( flag[3] )
                        {
                            case 'failures':
                                for ( f = currPool.TN - 1; f > 0; f-- )
                                    {    sides.push( f );    }
                                break;
                            case 'fives':
                                sides.push( 5 );
                                break;
                            case 'liminal':
                                sides.push( 5, 6 );
                                break;
                            case 'non-ones':
                                for ( f = currPool.TN - 1; f > 1; f-- )
                                    {     sides.push( f );    }
                                break;
                            case 'non-tens':
                                for ( f = currPool.TN; f < 10; f++ )
                                    {    sides.push( f );    }
                                break;
                             case 'ones':
                                sides.push( 1 );
                                break;
                            case 'successes':
                                for ( f = currPool.TN; f <= 10; f++ )
                                    {    sides.push( f );    }
                                break;
                            case 'tens':
                                sides.push( 10 );
                                break;
                        }

                        switch ( flag[1] )
                        {
                            case 'cascade':  
                                currPool.cascadeMax = amount;
                                currPool.cascade = sides;
                                break;
                            case 'reroll':
                                currPool.rerollMax = amount;
                                currPool.reroll = sides;
                                break;
                            /*case '+':
                                currPool.autoSuccess += amount;
                                break
                            case '-':
                                currPool.autoSuccess -= amount;
                                break;*/
                        }
                    }
                }
            });

            let cm = currPool.cascadeMax;
            let rm = currPool.rerollMax;

        // Roll dice
            for ( d = 0; d < Number( currPool.numDice ); d++ )
            {
                let r = roll(); 

                currPool.pool.push( r );

                if ( r >= currPool.TN ) 
                    {   currPool.successes++;   }
                if ( r >= currPool.double ) 
                    {   currPool.successes++;   }

                if ( rm !== 0 && currPool.reroll.includes( r ) )
                {
                    rm--;
                    d--;
                    if ( r >= currPool.TN ) 
                        {   currPool.successes--;   }
                    if ( r >= currPool.double ) 
                        {   currPool.successes--;   }
                }

                if ( cm !== 0 && currPool.cascade.includes( r )  )
                {
                    cm--;
                    d--;
                }
            }

        // VS Test
            if ( isVS )
            {
                /*let vsRolls = client.rollMap.get( message.channel.id );

                if ( vsRolls === null )
                {
                    vsRolls = [];
                }
                else
                {
                    vsRolls.forEach ( participant =>
                    {
                        if ( participant.reps <= currPool.reps )
                        {
                            currPool.reps++;
                        }
                    });
                }

                vsRolls.push( currPool );

                client.rollMap.set( message.channel.id, vsRolls );

                msg += `${currPool.reps === 0 ? currPool.owner.username : currPool.owner.username + ' ' + currPool.reps} added a roll to the VS pile.`;*/
            }

        // Output
            if ( !isVS )
            {
                msg += currPool.printPool();
            }

        // Save Roll
            if ( saveRoll )
            {
                client.rollMap.set( message.author.id, currPool );
            }
        } 
      // Help
        else if ( firstCmd === 'help' )
        {
          //Flagged
            if ( args[1] )
            {
                switch ( args[1] )
                {
                    case 'help':
                        msg += '\n__Bot Manual__'
                        msg += "\n**Function:** displays information about the Loom's various functions.";
                        msg += '\n**Form:** `~help` optional: `command`. eg. `~help roll`';
                        msg += "\n**Notes:** if no commands are specified it will display a brief summary of all of the Loom's commands";
                        break;
                    case 'pr':
                    case 'prev':
                        msg += '\n__Display Previous Roll__';
                        msg += '\n**Function:** Displays your previous roll or that of the mentioned user, including all changes made to it afterwards.';
                        msg += '\n**Form:** `~pr` or `~prev` optional: `@user`. eg `~prev @Un-Arenjii#4939`';
                        break;
                    case 'test':
                        msg += '\n__Areas for Improvement__';
                        msg += '\n**Function:** Displays a list of things that need testing.';
                        msg += '\n**Form:** `~test`';
                        break;
                    case 'vs':
                        msg += '\n__Versus Test__\n**UNIMPLEMENTED**';
                        msg += '\n**Function:** Compares rolls. Which rolls are compared depends on how many mentions follow the command.';
                        msg += '\n**Form:** `~vs {@user...}`';
                        msg += "\n**Notes:**\n\t- No Mentions: compares all rolls in the VS stack (see the `vs` tag in the roll command). Clears the stack only if successful.\n\t- One Mention: Compares mentioned person's last roll vs your last roll.\n\t- Two+ Mentions: Compares the last rolls of every person mentioned.";
                        break;
                    case 'roll':
                        msg += '\n__Roll the Dice__';
                        msg += '\n**Function:** Rolls a pool of dice';
                        msg += '\n**Form:** `~roll # {tags...}`';
                        msg += '\n**Extra Tags:**\n\t`cascade#`: when a die turns up as a `#`, add another die to the pool.\n\t`difficulty#`: adds the number of successes needed to pass the roll.\n\t`double#`: causes die that result in a `#` or higher to count for 2 successes.\n\t`reroll#`: die that result in `#` get rerolled, keeping the second result.\n\t`tn#`: changes the number a die needs to be in order to count as a success. You sneaky Fate Ninja.\n\t`+#`: adds # automatic successes.\n\t`-#`: removes a success.';
                        msg += '\n**Notes:**\n\tto add more than one die face to `cascade` or `reroll` you can call them again OR you can use some preset options:\n\t`failures`: 1-TN.\n\t`fives`: 5.\n\t`liminal`: 5-6.\n\t`non-ones`: 2-TN.\n\t`non-tens`: TN-9.\n\t`ones`: 1.\n\t`successes`: TN-10. \n\t`tens`: 10.\nThis has the advantage of allowing you to specify how many times this happes.\n**Eg.**\n\t`~roll 5 rerollliminal` will cause 5s and 6s to be rerolled until they no longer appear\n\t`~roll 5 cascade3non-tens` will only add a maximum of 3 extra dice.';
                        break;
                    case 'prob':
                        msg += "This feature has not been implemented yet";    break;
                    default:
                        msg += `I don't have a "${args[1]}" command...`;
                    }
            }
          //No Flags
            else
            {
                msg += "'\nThe Loom of Fate and it's attendants, the Pattern Spiders, are a tool for the Maided to maintains the warp of causality and the weft of destiny.\nMay they ever favour you.";

                msg += '\n\nAll prayers are case insensitive so yell if you like. Speak clearly though, add spaces between tags so they can understand you.';
                msg += '\nCurly braces `{}` denote optional features explained in the help text for the individual command.';
                msg += '\nFor more detail on individual commands use `~help {command}`.\n\tExample: `~help roll`.';

                msg += '\n`~help {command}` __Bot Manual__: gives more details about commands.';
                msg += '\n`~prev {@user}` __Previous Roll__: displays previous rolls.';
                msg += '\n`~prob` __Probability__: **Unimplemented** Calculates the possible outcomes of a given roll.';
                msg += '\n`~roll # {@tags...}` __Tempt Fate__: rolls # (0 - 99) ten sided dice, double tens.';
                msg += '\n`~test` __How Can I Help?__: displays a list of things that need testing.';
                msg += '\n`~vs {@user...}` __Versus Test__: **Unimplemented** Pits two or more rolls against eachother.';

                msg += '\n\nPlease PM Saelvarath#5785 if you find any bugs or have other comments or suggestions!';
            }

            if ( msg !== "" )
            {
                message.author.send( msg );
                msg = `**${message.author.username} has queried the cosmos.**`;
            }
           
        }
      // Show previous rolls
        else if ( firstCmd === 'pr' || firstCmd === 'prev' )
        {
            let pr = null;

            if ( message.mentions.users.keyArray().length === 1 )
            {
                pr = client.rollMap.get( message.mentions.users.firstKey() );
            }
            else
                {   pr = client.rollMap.get( message.author.id );   }

            msg += pr === null ? `I got nothin'...` : `${pr.owner.username}'s last roll was:\n${pr.printPool()}`;
        }
      // Areas of improvement
        else if ( firstCmd === 'test' )
        {
            msg += 'the Loom of Fate is still new and in development, everything you see needs to be tested.'
        }
      // Versus Test
        else if ( firstCmd === 'vs' )
        {
        }
      // Invalid command
        else
        {    msg += "That's not a valid command.";    }

      // Output
        if ( msg !== '' )
        {
            message.channel.send( msg );
        }
    }
});

function roll ()
{
    return  1 + Math.floor( Math.random() * 10 );
}

client.login( config.token );
