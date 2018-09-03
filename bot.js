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
    constructor( ard = 0, asd = 0, asp = [], asr = 0, bl = false, bn = 0, bp = [], co = false, ex = 0, fd = false, gr = false, hd = 0, hx = [], hp = [], ins = false, oe = false, na = 0, oa = 0, om = 1, ob = 0, ow = '', sh = 4, sc = 0, tr = 0 )
    {
        this.arthaDice = ard;       // number of dice added through spending Artha
        this.astroDice = asd;       // number of dice added through Astrology FoRK
        this.astroPool = asp;       // results of astrological FoRKs/Help
        this.astroResult = asr;     // Successes gained or lost through Astrology
        this.beginnersLuck = bl;    // do you actually have the right skill for the job?
        this.booned = bn;           // How many Persona Points have been spent on this roll?
        this.basePool = bp;         // array of dice results, includes FoRKs, Artha Dice, Advantage Dice
        this.calledOn = co;         // if a Call-on Trait has been used on this roll.
        this.exponent = ex;         // BASE number of dice rolled, Exponent of the roll.
        this.fated = fd;            // if a Fate point has been spent on this roll
        this.graced = gr;           // if a Saving Grace has been employed on this roll
        this.helperDice = hd;       // number of dice added by helpers
        this.helperExponent = hx;   // the exponent of your helpers
        this.helperPool = hp;       // how much your companions 'helped' you
        this.inspired = ins;        // has Divine Inspiration struck this roll?
        this.isOpenEnded = oe;      // do dice explode?
        this.nonArtha = na;         // the number of non-artha dice added to the roll
        this.ObAddition = oa;       // added to Base Obstacle after it's multiplied
        this.ObMultiplier = om;     // for all you double Ob needs.
        this.obstacle = ob;         // BASE obstacle of the roll
        this.owner = ow;            // Who rolled the dice
        this.shade = sh;            // shade of the roll, 4 = black, 3 = grey, 2 = white
        this.successes = sc;        // the number of successes gained through rolls
        this.totalRolled = tr;      // how many dice ultimately end up being rolled (before rerolls)
    }

  // DiePool.printPool()
    printPool()
    {
        let msg = `${this.owner} rolled ${this.totalRolled}`;

      // determine shade
        switch ( this.shade )
        {
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

        msg += this.isOpenEnded ? 'Open-Ended dice' : 'shaded dice';

        msg += this.beginnersLuck ? ", Beginner's Luck," : '';

        msg += this.obstacle > 0 ? ` against an Ob of ${this.obstacle * this.ObMultiplier + this.ObAddition}` : '';

        msg += this.ObMultiplier > 1 && this.obstacle > 0 ? ` [${this.obstacle}*${this.ObMultiplier}+${this.ObAddition}].` : '.';

      // tally & output astrology results
        if ( this.astroDice > 0 )
        {
            msg += '\nThe Stars were ';
            msg += this.astroResult >0 ? 'right' : 'wrong';
            msg += ` and their fate gives them ${this.astroResult} success this roll\nAstro Dice: ${diceSugar( this.astroPool, this.shade, 2 )}`;
            //-msg += '\n' + this.astroPool.toString();
        }

      // determine helper test difficulty
        for ( let helper = 0; helper < this.helperPool.length; helper++ )
        {
            msg += `\nHelper${helper} added ${diceSugar( this.helperPool[helper], this.shade, this.isOpenEnded )} to the roll`;

            if ( this.obstacle > 0 )
            {
                msg += ` and earned a ${RDC( this.helperExponent[helper], this.obstacle + this.ObAddition )} test`;
            }

            msg += '.';
        }
      // print base dice
        if ( this.basePool.length )
        {
            msg += `\nBase dice: ${diceSugar( this.basePool, this.shade, this.isOpenEnded )}`;
            msg += this.arthaDice > 0 ? ` ${this.arthaDice} of which were gained by spending Artha` : '';
            //-msg += '\nActual roll: {' + this.basePool.toString() + '}';
        }
      // determine Main test difficulty
        let totesSuccessess = this.successes + this.astroResult;
        let totesObstacle = this.obstacle * this.ObMultiplier + this.ObAddition;

        if ( this.obstacle > 0 )
        {
            msg += totesSuccessess >= totesObstacle ? `\nThats a success with a margin of ${totesSuccessess - totesObstacle} and they got to mark off a ` : '\nTraitorous dice! Thats a *failure*...\nAt least they got to mark off a ';

            let bl = RDC( this.exponent + this.nonArtha + this.astroDice + this.helperDice, this.obstacle + this.ObAddition );

            if ( this.beginnersLuck )
            {
                msg += bl  === 'Routine' ? 'test towards learning a new Skill!' : `${bl} test towards advancing their Root Stat!`;
            }
            else
            {
                msg += bl;
            }
        }
        else
        {
            if ( this.ObMultiplier > 1 )
            {
                msg += `\nThat's ${totesSuccessess} in total and effective success of ${Math.floor( ( totesSuccessess - this.ObAddition ) / this.ObMultiplier )} on a graduated test.`;
            }
            else
            {
                msg += totesSuccessess > 0 ? `\nThats ${totesSuccessess} succes(es)!` : '\nNo successes? looks like things are about to get interesting!';
            }
        }
        return msg;
    }
}

// Initialize Discord Bot
const client = new Discord.Client(); //- { token: config.token, autorun: true });

//+ client.rollMap = new Enmap({ provider: new EnmapMongo({ name: "rollMap" }) }); // Persistant
client.rollMap = new Enmap(); // non-persistant

const routineTest = [0, 1, 1, 2, 2, 3, 4, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];

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

        let isVS = false;
        let saveRoll = true;

        let msg = ''; //- message.author.id === config.boss ? 'Sure thing, Boss!\n' : '';

        const rollPattern = RegExp( '([b|g|w])([0-9]{1,2})(!?)', 'i' );
        const testPattern = RegExp( '([a-z\+]{1,2})([0-9]{0,2})', 'i' );

      // Help
        if ( firstCmd.toLowerCase() === 'help' )
        {
            msg += `**${message.author.username} has queried the cosmos.**`;

          //Flagged
            if ( args[1] )
            {
                switch ( args[1] )
                {
                    case 'co':
                    case 'callon':
                        msg += '\n__Call-On Trait__';
                        msg += '\nFunction: Rerolls all traitor dice in your previous roll. Usable once per roll.';
                        msg += '\nForm: `~co` or `~callon`';
                        break;
                    case 'dof':
                        msg += '\n__Die of Fate__';
                        msg += '\nFunction: Rolls a single die.';
                        msg += '\nForm: `~dof` {tags}';
                        msg += '\nExtra Tags:';
                        msg += '\n\t` +#` adds `#` [1-9] to the result of the roll.';
                        msg += '\n\t` -#` subtracts `#` [1-9] to the result of the roll.';
                        break;
                    case 'fate':
                    case 'luck':
                        msg += '\n__Luck, Fate point__';
                        msg += "\nFunction: Rerolls all 6s in your previous roll if it wasn't open-ended or one traitor die if it was. Usable once per roll.";
                        msg += '\nForm: `~fate` or `~luck`';
                        break;
                    case 'grace':
                        msg += '\n__Saving Grace, Deeds Point__'
                        msg += '\nFunction: Rerolls all Traitor Dice in your previous roll. Usable once per roll.';
                        msg += '\nForm: `~grace`';
                        break;
                    case 'help':
                        msg += '\n__Bot Manual__'
                        msg += "\nFunction: displays information about Arenjii's various uses.";
                        msg += '\nForm: `~help` optional `command`. eg. `~help diff`';
                        msg += "\nNotes: if no commands are specified it will display a brief summary of all of arenjii's commands";
                        break;
                    case 'pr':
                    case 'prev':
                        msg += '\n__Display Previous Roll__';
                        msg += '\nFunction: Displays your previous roll or that of the mentioned user, including all changes made to it afterwards such as with `~callon`, `~fate` and `~vs`';
                        msg += '\nForm: `~pr` or `~prev` optional: `@user`. eg `~prev @Un-Arenjii#4939`';
                        break;
                    case 'diff':
                    case 'difficulty':
                    case 'rdc':
                        msg += '\n__Difficulty Calculator__';
                        msg += '\nFunction: Returns if a test is Routine, Difficult or Challenging.';
                        msg += '\nForm: `~diff X Y` or `~difficulty X Y` or ~rdc X Y`';
                        msg += '\n\t` X` is the number of dice rolled.';
                        msg += '\n\t` Y` is the Obstacle of the test.';
                        break;
                    case 'test':
                        msg += '\n__Areas for Improvement__';
                        msg += '\nFunction: Displays a list of things that need testing.';
                        msg += '\nForm: `~test`';
                        break;
                    case 'vs':
                        msg += '\n__Versus Test__';
                        msg += '\nFunction: Compares rolls. Which rolls are compared depends on how many mentions follow the command.';
                        msg += '\nForm: `~vs {@user...}`';
                        msg += "\nNotes:\n\t- No Mentions: compares all rolls in the VS stack (see the `vs` tag in the roll command). Clears the stack if successful.\n\t- One Mention: Compares mentioned person's last roll vs your last roll.\n\t- Two+ Mentions: Compares the last rolls of every person mentioned.";
                        break;
                    case 'roll':
                        msg += '\n__Roll the Dice__';
                        msg += '\nFunction: Rolls a pool of dice';
                        msg += '\nForm: `~X#{!}`';
                          msg += '\n\t`X` Accepts `b`, `g` or `w`. Determines the Shade (Black, Grey or White respectively) of the roll.';
                          msg += '\n\t`#` the Exponent of the Test to be rolled [0 to 99]. Dice multipliers like the `di` tag only affect this number.';
                          msg += '\n\t`!` *optional*; adding this makes the roll Open-Ended';
                        msg += '\nExtra Tags:';
                          msg += '\n\t`ad#` __Advantage__ Adds `#` dice to the roll, unaffected by dice multipliers';
                          msg += '\n\t`as#` __Astrology, FoRK__: Adds special Astrology FoRK dice. # = [your Astrology exponent].';
                          msg += "\n\t`bl ` __Beginners' Luck__: Multiplies Base Obstacle by 2, calculates if the test goes towards the ability or the skill";
                          msg += '\n\t`bn#` __Boon, Deeds Point__: Adds `#` (3 Maximum) dice to the roll that do no affect difficulty. Unaffected by dice multipliers';
                          msg += '\n\t`di ` __Divine Inspiration, Deeds Point__: Multiplies Exponent Dice by 2 and counts these extra dice as gained through Artha expenditure.';
                          msg += '\n\t`ds#` __Disadvantage__: Adds `#` to the Base Obstacle, unaffected by Ob multipliers.';
                          msg += '\n\t`fk#` __FoRK__: Functionally identical to `ad`. See `as` to FoRK in Astrology';
                          msg += '\n\t`he#` __Helper Exponent__: Adds Help Dice from an Exponent of `#` [1-10]. if an Obstacle is specified I will say how difficult their test is';
                          msg += '\n\t`ns`  __Not Saved__: Do not save this roll. Several features use your previous roll';
                          msg += '\n\t`ob#` __Obstacle, Base__: Set the Base Obstacle of the task to `#` and returns the difficulty of the test. Obstacle multipliers only affect this number';
                          msg += '\n\t`ox#` __Obstacle, Multiplier__: Multiplies the Base Obstacle by `#`.';
                          msg += '\n\t`vs ` __Versus Test__: Hide the results of the roll and add it to the VS Pile. Trigger the Versus Test with `~vs`.';
                        msg += "\nNotes:\n\t- Its usually okay to include FoRKs and Advantage dice in your Exponent. The exception being when the `di` tag is included.\n\t- Similarly, unless the `bl` or `ox` tags are included it's alright to forgo the `ds` tag";
                        break;
                }
            }
          //No Flags
            else
            {
                msg += '\nI am Arenjii, the White God of Progression.';

                msg += '\nAll commands are case insensitive so yell if you like. Speak slowly though, add spaces between tags so I can understand you.';
                msg += '\nCurly braces `{}` denote optional features explained in the help text for the individual command.';
                msg += '\nFor more detail on individual commands us `~help {command}`.\n\tExample: `~help vs`.';

                msg += '\n`~co`: See `~callon`';
                msg += '\n`~callon`: __Call On Trait__ rerolls all traitor dice. Tracked separatetly from Saving Grace.';
                msg += '\n`~diff X Y`: See `difficulty`';
                msg += '\n`~difficulty X Y`: __Difficulty Calculator__ Returns if a roll of `X` dice against an Ob of `Y` is Routine, Difficult or Challenging.';
                msg += '\n`~dof {tags...}`: __Die of Fate__ Rolls a single die.';
                msg += '\n`~fate`: See `~luck`.';
                msg += '\n`~grace`: __Saving Grace, Deeds Point__: Rerolls all traitor dice, tracked separately from Call-on.';
                msg += '\n`~help {command}`: __Specific Help__ gives more details about individual commands.';
                msg += "\n`~luck`: __Luck, Fate point__: Rerolls all 6s in the previous roll if it wasn't open-ended or one traitor die if it was. Only useable once per roll";
                msg += '\n`~pr {@user}`: See `~prev`';
                msg += '\n`~prev {@user}`: __Previous Roll__: displays the previous roll.';
                msg += '\n`~prob`: __Probability__: **Unimplemented** calculates the possible outcomes of a given roll.';
                msg += '\n`~rdc X Y`: See `difficulty`';
                msg += '\n`~test`: __How Can I Help?__ displays a list of things that need testing.';
                msg += '\n`~vs {@user...}`: __Versus Test__ Pits two or more rolls against eachother.';
                msg += '\n\n`~b#{!}`, `~g#{!}`, `~w#{!}` all include `{tags...}`. Rolls a pool of `#` [0-99] black, grey or white dice respectively.\n\ttype `~help roll` for more info on how to roll.';

                msg += '\n\nPlease PM Saelvarath if you find any bugs or have other comments or suggestions!';
            }
        }
      // Call On trait
        else if ( firstCmd === 'co' || firstCmd === 'callon' || firstCmd === 'grace' )
        {
            let prevPool = client.rollMap.get( message.author.id );

            if ( prevPool.calledOn && firstCmd.startsWith( 'c' ) )
                {   msg += 'You have already used a Call-on trait for this roll.';   }
            else if ( prevPool.graced && firstCmd === 'grace' )
                {   msg += `You already had a Saving Grace.`;   }
            else
            {
                let prevShade = prevPool.shade;                
                let astroTally = 0;
                let expoTally = 0;
                let result = 0;

              // Check Astrology pool
                let a = 0;
                while ( prevPool.astroPool[a] != null )
                {
                    let newRoll = [];
                    
                    if ( prevPool.astroPool[a] < prevShade )
                    {
                        result = roll();
                        newRoll.push( result ); 
                        astroTally += result >= prevShade;

                      // explode 6s
                        while ( result === 6 )
                        {
                            result = roll();
                            newRoll.push( result ); 
                            astroTally += result >= prevShade;
                        }

                      // reroll 1s
                        if ( result === 1 )
                        {
                            result = roll();
                            newRoll.push( result ); 
                            astroTally -= result <= prevShade;
                        }

                        if ( prevPool.astroPool[a] === 1 )
                        {
                            astroTally += prevPool.astroPool[ a + 1 ] < prevShade;
                            prevPool.astroPool.splice( a, 2, ...newRoll);
                        }
                        else
                            {   prevPool.astroPool.splice( a, 1, ...newRoll );    }
                    }
                    a += newRoll.length ? newRoll.length : 1;
                }

                prevPool.astroResult += astroTally;

              // Check exponent Pool (1Dim Array)
                prevPool.basePool.slice().forEach( ( die, dI, dC ) =>
                {
                    let newRoll = [];

                    if ( die < prevShade )
                    {
                        result = roll();
                        newRoll.push( result );
                        expoTally += result >= prevShade;
                        while ( prevPool.isOpenEnded && result === 6 )
                        {
                            result = roll();
                            newRoll.push( result );
                            expoTally += result >= prevShade;
                        }
                        prevPool.basePool.splice( dI, 1, ...newRoll );
                    }
                });

              // Check Helper pool (2Dim Array)
                prevPool.helperPool.slice().forEach( ( helper, hI, hC ) =>
                {
                    helper.forEach( ( hDie, dII, dC ) =>
                    {
                        let newRoll = [];

                        if ( hDie < prevShade )
                        {
                            result = roll();
                            newRoll.push( result );
                            expoTally += result >= prevShade;
                            while ( prevPool.isOpenEnded && result === 6 )
                            {
                                result = roll();
                                newRoll.push( result );
                                expoTally += result >= prevShade;
                            }
                            prevPool.helperPool[hI].splice( dII, 1, ...newRoll );
                        }
                    });
                });

              // output
                if ( result === 0 )
                {
                    msg += 'There was nothing to reroll...'
                }
                else
                {
                    if ( firstCmd.startsWith( 'c' ) )
                        {   prevPool.calledOn = true;   }
                    else if ( firstCmd === 'grace' )
                        {   prevPool.graced = true;   }
                    
                    prevPool.successes += expoTally;
                    client.rollMap.set( message.author.id, prevPool );
                    msg += `your rerolls net you ${astroTally + expoTally} successes.\n${prevPool.printPool()}`;
                }
            }
        }
      // Test Difficulty calculator
        //+ add Ob addition/multiplication?
        else if ( firstCmd === 'diff' || firstCmd === 'difficulty' || firstCmd === 'rdc' )
        {
        // has required arguments
            if ( args[2] )
            {
                let d = Number.parseInt( args[1] );
                let o = Number.parseInt( args[2] );

            // improper argument types
                if ( isNaN(o) || isNaN(d) )
                {
                    msg += 'those are not valid numbers.';
                }
            // proper argument types
                else
                {
                // array index out of bounds prevention
                    if ( d > routineTest.length )
                    {
                        msg += "Whoa there friend... That's an awful lot of dice you're slinging there...\n What do you think you are playing? Shadowrun? *Exalted?*";
                    }
                // negative dice rolled or Negative Ob
                    else if ( o <= 0 || d < 0 )
                    {
                        msg += 'https://qph.fs.quoracdn.net/main-qimg-527daeca7d4b6d4ef11607e548f576dd-c';
                    }
                // proper input
                    else if ( o > 0 )
                    {
                        msg += `${d}D rolled Versus an Ob of ${o}?\nWhy, that would be a ${RDC( d, o )} test!`;
                    }
                }
            }
        // fewer than 2 arguments
            else
            {
                msg += 'I need 2 numbers to compare. first, the number of dice rolled; second the Obstacle of the test.';
            }
        }
      // Die of Fate
        else if ( firstCmd === 'dof' )
        {
            let bonus = 0;
            const DoFPattern = RegExp( '([+|-])([1-9])', 'i' );

          // Interpret Flags
            args.forEach( token =>
            {
                let flag = DoFPattern.exec( token );

                if ( flag )
                {
                    switch ( flag[1] )
                    {
                        case '+':
                            bonus += Number( flag[2] );
                            break;
                        case '-':
                            bonus -= Number( flag[2] );
                            break;
                    }
                }
            });
          // Roll
            let DoF = roll();

          // Output
            msg += `${message.author} rolled a Die of Fate`;
            if ( bonus > 0 )
                {   msg += ` + ${bonus}`;   }
            else if ( bonus < 0 ) 
                {   msg += ` ${bonus}`;   }

            msg += `!\n[${DoF + bonus}]`;
        }
      // Inheritors Easter Egg
        else if ( firstCmd === 'inheritors' )
        {
            msg += '\nThe king on the throne, alone one day,\nTook the words in his mouth and threw them away,\nFirst came the servants, the first of the seen,\nWho built him a house, and kept his hearth clean\nNext came the tall men of stone and cold fire,\nTo seek out all sinners and add to the pyre.\nThen came the beloved, the storied and told,\nThe first to lay claim to the cosmos of old.\nLast came the white ones of bones, teeth and eyes,\nWho swallow all truths and spit out only lies.';
        }
      // Knights Easter Egg
        else if ( firstCmd === 'knights')
        {
            msg += 'What makes a knight?\nA shining blade or bloody battered steel?\nLet us name the Orders Four and the truth within reveal.\n\nTHE GEAS KNIGHT unknown by name, the seeker proud and true,\nHis endless quest hath rent the stars yet known is he by few,\n\nTHE PEREGRINE, whose bell always rings the crack of breaking day,\nIt’s nameless peal will drive the ceaseless evil from the ways,\n\nTHE BLOODY KNIGHT, belligerent, her edge tastes skulls and lives,\nThe viscera of common men and royalty besides,\n\nTHE MENDICANT, the beggar knight, roughly clad and shod,\nHe lives as though he were a beast, but fights he as a God.';
        }
      // Luck; Fate point, retroactively make a roll Open-Ended or reroll one die
        //+ if there is a mention; use that roll?
        else if ( firstCmd === 'luck' || firstCmd === 'fate' )
        {
            let prevPool = client.rollMap.get( message.author.id );

            if ( prevPool !== null && !prevPool.fated )
            {
              // Roll is Open-Ended
                if ( prevPool.isOpenEnded )
                {
                    let traitor = 0;
                    let traitorType = '';
                    let reroll = 0;

                  //? check for a negatively expoded die in Astrology pool first?
                  /**
                   * Luck— A player may spend a fate point to make the dice of a single roll open—ended (6s rerolled as new dice for additional successes).
                   * If the roll is already open-ended —Steel, Faith, Sorcery— then the player may reroll a single traitor (which is not open—ended).
                   * Luck is purchased after the dice have been rolled.
                   */

                  /**
                   * the Astrology FORK die is different from other FORKS: The die is open-ended.
                   * But unlike standard open—ended dice, it open-ends both ways. 
                   * 6s are rerolled as per the normal open—end rules, but 1s are open-ended as well. 
                   * If a 1 is rolled, reroll the die.
                   * If the second roll is a failure, then a success is subtracted from the result.
                  */

                 /** Certain rolls in Burning Wheel are described as “open—ended.”
                  * This means that any 6s rolled allow the player to pick up another die.
                  * If you hit your difficulty munber or higher, it's a success.
                  * If you don't meet your difficulty number, the die is a traitor. 
                  * If you roll a 6, it counts as a success and you get to roll another die!
                 */

                  // check exponent/Artha/FoRK/Advantage Pool
                    prevPool.basePool.forEach( ( die, index, collection ) =>
                    {
                        if ( traitor === 0 && die < prevPool.shade )
                        {
                            traitor = die;
                            reroll = roll();
                            collection[index] = reroll;
                            traitorType = 'Exponent';
                        }
                    });

                  // check Helper Pool
                    prevPool.helperPool.forEach( helper =>
                    {
                        helper.forEach( ( die, index, collection ) =>
                        {
                            if ( traitor === 0 && die < prevPool.shade )
                            {
                                traitor = die;
                                reroll = roll();
                                collection[index] = reroll;
                                traitorType = 'Helper';
                            }
                        });
                    });

                  // no die to reroll
                    if ( traitor === 0 )
                    {
                        msg += 'Why would you spend Artha on a perfectly good roll?'
                    }
                  // die rerolled
                    else
                    {
                        prevPool.fated = true;
                        msg += reroll >= prevPool.shade ? `Traitorous ${traitorType} die converted!\n${traitor} => ${reroll}\nthat's +1 success for a total of ${++prevPool.successes}` : `Well, you tried...\nI rerolled a ${traitor} from your ${traitorType} dice but only got at ${reroll}`;
                    }
                }
              // Roll Not Open-Ended
                else
                {
                    let rerollBase = [];
                    let rerollHelp = [];
                    let newRoll = 0;

                  // check exponent Pool (1Dim Array)
                    prevPool.basePool.slice().forEach( ( die, dI, dC ) =>
                    {
                        if ( die === 6 )
                        {
                            newRoll = roll();
                            while ( newRoll === 6 )
                            {
                                rerollBase.push( newRoll );
                                prevPool.successes += newRoll >= prevPool.shade;
                                prevPool.basePool.splice( dI + rerollBase.length, 0, newRoll );
                                newRoll = roll();
                            }
                            rerollBase.push( newRoll );
                            prevPool.successes += newRoll >= prevPool.shade;
                            prevPool.basePool.splice( dI + rerollBase.length, 0, newRoll );
                        }
                    });

                  // check Helper Pool (2Dim Array)
                    prevPool.helperPool.slice().forEach( ( helper, hI, hC ) =>
                    {
                        rerollHelp.push( [] );

                        helper.slice().forEach( ( die, dI, dC ) =>
                        {
                            if ( die === 6 )
                            {
                                newRoll = roll();

                                while ( newRoll === 6 )
                                {
                                    rerollHelp[hI].push( newRoll );
                                    prevPool.successes += newRoll >= prevPool.shade;
                                    prevPool.helperPool[hI].splice( dI + rerollHelp[hI].length, 0, newRoll );
                                    newRoll = roll();
                                }
                                rerollHelp[hI].push( newRoll );
                                prevPool.successes += newRoll >= prevPool.shade;
                                prevPool.helperPool[hI].splice( dI + rerollHelp[hI].length, 0, newRoll );
                            }
                        });
                    });

                    prevPool.fated = true;
                    prevPool.isOpenEnded = true;

                    msg += `reroll results: ${prevPool.printPool()}`;
                }

                //+ if there is a mention; log roll under user.id
                client.rollMap.set( message.author.id, prevPool );
            }
          // Fate point already spent
            else
            {
                msg += "No Previous roll or you've already spent a Fate point on that roll";
            }
        }
      //+ Maybe Easter Egg
        else if ( firstCmd === 'maybe' )
        {

        }
      // Meti's Sword Manual
        else if ( firstCmd === 'meti' )
        {
            let verse = typeof args[1] === 'undefined' ? 1 + Math.floor( Math.random() * 30 ) : Number( args[1] );

            if ( verse <= 6 )
                {   msg += "**Argument**\n";  }
            else if ( verse <= 8 )
                {   msg += "**Mastering the Sword**\n"; }
            else if ( verse <= 26 )
                {   msg += `**The 18 Precepts**\n__${ verse - 9 })__: `;   }
            else
                {   msg += "**Closing**\n";   }

            switch ( verse )
            {
                case 1:
                    msg += "Glory to the Divine Corpse, o breaker of infinities.\nI am Meti, of no house but myself. In my 108th year I am surrounded by fools. My compatriots cling obsessively to their destiny, and my only apprentice is an idiot speck of a girl with more talent for eating than skill with the blade. Therefore I have decided to die drowning in the boiling gore of my enemies, of which there are many."; break;
                case 2:
                    msg += "My master was the greatest lord general to the king Au Vam, Ryo-ten-Ryam, who first coaxed me into learning the ways of turning men into ghosts. As his interest quickly turned to the wholly uninteresting and most useless parts of my body, I returned the favor and relieved him of his.";  break;
                case 3:
                    msg += "It is my personal opinion the straight sword is best if you can obtain one, but I also favor the sabre. The spear, stave, or club are peasant's weapons of which I am wholly unfamiliar and so will not speak on them.";    break;
                case 4:
                    msg += "Upon meeting me, you might find that my appearance is quite dreadful and unkempt. I have been spat upon by priest, king, and merchant alike. I have no retainers, and possess nothing except a straight sword six hand spans (five and a half kret) long (this is the proper length). This is because I am Royalty and the undisputed master of the principal art of Cutting. I will fight naked with ten-thousand men.";   break;
                case 5:
                    msg += "When it came time to face my first real opponent, the Colossus of Pardos, in my youthful pride and immense skill, I brought all my training and mastery to bear. Scarcely half a day passed before my sword was shattered into thirty pieces, my right leg was almost torn from its socket, and my honed body was broken pathetically in a hundred and forty places. I defeated him by gouging his brains out through his breathing valves. My thumbs, in this case, proved far more useful.\nAt that moment, with my thumbs in his brains, I had a revelation. I had trained far too broadly. Existence and the act of combat are absolutely no different, and the essence of both, the purity of both, is a singular action, which is Cutting Down Your Opponent. You must resolve to train this action. You must become this action. Truly, there is very little else that will serve you as well in this entire cursed world.";    break;
                case 6:
                    msg += "I hope that by reading this manual, you will be thoroughly encouraged to become a farmer."; break;
                    
                case 7:
                    msg += "YISUN's glory is great, and you may know this by two paths, the sanctioned words, and the sanctioned action.\nThe sanctioned words are YS ATN VARAMA PRESH. The meaning of these words is YISUN and their attainment is Royalty.\nThe sanctioned action is to Cut.\nTo Cut means division by the blade of Want, that parer of potentials that excises infinities."; break;
                    /*YS ATUN VRAMA PRESH
                      YS ATN VARAMA PRESH
                      YS ATUN VARANMA PRESH*/
                case 8:
                    msg += "To train with the sword, first master sweeping. When you have mastered sweeping, you must master the way of drawing water. Once you have learned how to draw water, you must split wood. Once you have split wood, you must learn the arts of finding the fine herbs in the forest, the arts of writing, the arts of paper making, and poetry writing. You must become familiar with the awl and the pen in equal measure. When you have mastered all these things you must master building a house. Once your house is built, you have no further need for a sword, since it is an ugly piece of metal and its adherents idiots."; break;

                case 9:
                    msg += "Consider: there is no such thing as a sword.";
                case 10:
                    msg += "Your stance must be wide. You must not be spare with the fluidity of your wrists or shoulders. You must have grip on the handle that is loose and unstrained. I heard it said you must be tender with your sword grip, as though with a lover. This is patently false. A sword is not your lover. It is a hideous tool for separating men from their vital fluids.";    break;
                case 11:
                    msg += "Going onwards, you must adjust hands as needed, do not keep the blade close to your body, keep your breathing steady. This is the life cut. You must watch your footwork. Your feet must be controlled whether planted on fire, air, water, or earth in equal measure.";    break;
                case 12:
                    msg += "Breathing is very important! Is the violent breath of life in you not hot? Exhale! Exult!";    break;
                case 13:
                    msg += "You must strive for attachment-non-attachment when cutting. Your cut must be sticky and resolute. A weak, listless cut is a despicable thing. But you must also not cling to your action, or its result. Clinging is the great error of men. A man who strikes without thought of his action can cut God.";    break;
                case 14:
                    msg += "To cut properly, you must continually self-annihilate when cutting. Your hand must become a hand that is cutting, your body a body that is cutting, your mind, a mind that is cutting. You must instantaneously destroy your fake pre-present self. It is a useless hanger on.";   break;
                case 15:
                    msg += "A brain is useful only up until the point when you are faced with your enemy. Then it is useless. The only truly useful thing in this cursed world is will. You must suffuse your worthless body with its terrible heat. You must be so hot that even if your enemy should strike your head off, you shall continue to decapitate ten more men. Your boiling blood must spring forth from your neck and mutilate the survivors!";  break;
                case 16:
                    msg += "You must never make 'multiple' cuts. Each must be singular in its beauty, no matter how many precede it. You must make your enemies weep with admiration, and likewise should your head be shorn off by such an object of beauty, you must do your best to shed tears of respect.";    break;
                case 17:
                    msg += "When decapitating an enemy, it is severe impoliteness to use more than one blow."; break;
                case 18:
                    msg += "A man who finds pleasure in the result of cutting is the most hateful, crawling creature there is. A man who finds pleasure in the act of cutting is an artisan."; break;
                case 19:
                    msg += "Man always strives to cut man. Therefore he who draws his sword the fastest is the survivor. To pre-empt this, you must live, eat, and shit as a person who has their sword drawn. It doesn't matter whether your blade, in actuality, is always out of its sheathe, though you will look like an idiot if it is.";    break;
                case 20:
                    msg += "Consider: The undefeated swordsman must be exceptionally poor.";   break;
                case 21:
                    msg += "The weak swordsman reserves his sword strokes. He clings excessively to his blade. His footwork is unsteady. His grip is too hard and he is afraid to crack the earth with his step. He has a shallow and wandering gaze, his tongue is sluggish and pale. He refuses to exhale the hot breath of the Flame Immortal.";    break;
                case 22:
                    msg += "The weak swordsman clings to victory. He thinks of his life, his obligations, the outcome of the battle, his hatred for his opponent, his training, his pride in his mastery. By doing so, he is an imperfect vessel for the terrible fires of Will. He will surely crack. He will not laugh uproariously if he is cleft in two by his opponent’s blade. When his sword is shattered, his hands will be too reserved to tear his enemies’ flesh."; break;
                case 23:
                    msg += "The weak swordsman strikes his enemy down and thinks his task done. He relishes in victory. He casts away his sword and returns to his lover. Little does he know his single cut will encircle the world five times and strike him down fifty-fold.";  break;
                case 24:
                    msg += "The weak swordsman clings to his instrument. It is better you have a sword, but death must lie under your fingernails, if need be. Learn death with your elbows, death with your knees, and death with your thumbs and fingertips. It is said death with the tongue is useful, but I find words too soft an instrument to smash a man’s skull";    break;
                case 25:
                    msg += "In manners of terrain, you must learn to cut yourself from it. You must cut even your footprints from it, if need be. Have complete awareness of each crawling thing and each precious flower, each blade of sweet grass and each clod of bitter earth, each beating heart and each being that thrums with love, hope, and admiration. Only then are you qualified to be their annihilator.";  break;
                case 26:
                    msg += "Excess heat and excess coldness are undesirable. Learn to read the weather.";  break;

                case 27:
                    msg += "It is said the greatest warrior-kings may sublime violence and forget all they learn about the sword. This is true. But the only true path to kingship lies through regicide./nMoreover, only the worst kind of idiot strives to be king."; break;
                case 29:
                    msg += "My extreme hope is that some measure of wisdom will penetrate the thick skull of my apprentice. If not, may reading this manual demonstrate your powerful disinterest in it, and may its true value die with me."; break;
                case 30:
                    msg += "Reach heaven by violence."; break;
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
      //+ Dice result probability calculator
        else if ( firstCmd === 'prob' )
        {
            msg += 'Probability math is hard. it will be a while before this gets completed.';
        }
      // Psalms Easter Egg
        else if ( firstCmd === 'psalms' )
        {

            let verse = typeof args[1] === 'undefined' ? Math.floor( Math.random() * 19 ) : Number( args[1] );

            if ( verse <= 7 )
                {   msg += "**I. ROYALTY** - ";  }
            else if ( verse <= 14 )
                {   msg += "**II. THE KING IN THE TOWER** - "; }
            else if ( verse <= 18 )
                {   msg += `**III. THE GRAND ENEMY CALLED I** - `;   }

            switch ( verse ) 
            {
                case 0:
                    msg += 'The Holy Septagrammaton -\n- YS ATUN VRAMA PRESH -';    break;
                    /*YS ATUN VRAMA PRESH
                      YS ATN VARAMA PRESH
                      YS ATUN VARANMA PRESH*/
                case 1:
                    msg += 'i.\nYISUN said: let there not be a genesis, for beginnings are false and I am a consummate liar.';    break;
                case 2:
                    msg += 'ii.\nThe full of it is this –\nthe circular suicide of God is the perfection of matter.';    break;
                case 3:
                    msg += 'iii.\nYISUN lied once and said they had nine hundred and ninety nine thousand names.\nThis is true, but it is also a barefaced lie.\nThe true name of God is I.';    break;
                case 4:
                    msg += 'iv.\nLiving is an exercise of violence.\nExercise of violence is the fate of living';    break;
                case 5:
                    msg += 'v.\nViolence is circular.\nPerception is not circular and lacks flawlessness-\ntherefore, rejoice in imperfect things, for their rareness is not lacking!';    break;
                case 6:
                    msg += 'vi.\nLove of self is the true exercise of the God called I.';    break;
                case 7:
                    msg += 'vii.\nOnly an idiot cannot place his absolute certainty in paradoxes.\nThe divine suicide is a perfect paradox.\nA man cannot exist without paradox –\nthat is the full of it.';    break;
                case 8:
                    msg += 'i.\nYISUN is the supreme king. It is impossible for YISUN to have any rivals – you will see this.\nYISUN does not aspire to royalty: YISUN is the two-syllable name of the seven syllable name of royalty revealed.\nOnly those who can invert a path can know the secret name of YISUN.';    break;
                case 9:
                    msg += 'ii.\nIt was once said that YISUN had many names.\nThis is true, but all of them are false save the name YISUN, which in itself is a paradox.';    break;
                case 10:
                    msg += 'iii.\nYISUN is the weakest thing there is and the smallest crawling thing, and the worm upon the earth and in the earth.';    break;
                case 11:
                    msg += 'iv.\nYISUN is capable of contemplating nothing.';    break;
                case 12:
                    msg += 'v.\nTo speak general truths about YISUN is to lie intimately;\nin truth one must learn the tongues but the matter remains that YISUN is the unparalleled master of the fundamental art of lying.\nThe best practice of lying is self deception.';    break;
                case 13:
                    msg += 'vi.\nYISUN once said:\n‘Selfish tongues revolt and refuse to invert the contents of their brains – even if it were a lie, this insurrection of our flesh would do us great offense.’';    break;
                case 14:
                    msg += 'vii.\nYISUN is the untouchable and prime master of all seven syllables of royalty and once told four lies.\ni. The lie of the giant and the ant\nii. The lie of the iron plum\niii. The lie of the water house\niv. The lie of the small light';    break;
                case 15:
                    msg += ' __The Lie of the Giant and the Ant__\n\nYISUN sat once with his disciple Hansa in YISUN’s second clockwise glass palace. Hansa was one of his most ardent students and a grand questioner of YISUN. Unlike Yisun’s other disciple, Pree Ashma, he had no hunger in his heart for dominion of the universe, but a miserly scrutiny and a heart of iron nails. He was not an aspirant for royalty, and thereby attained it through little effort.\nHansa’s questions were thus:\n\n‘Lord, how must I question space?’\n‘With an age, an ant may encircle a giant five million times,’ spoke YISUN.\n\n‘Lord, how then may I question time?’\n‘A giant’s stride takes an ant a week to surpass.’ YISUN spoke and smiled in the 4th way.\nHansa was discontent with this answer and rubbed the stem of his long and worn pipe which he always kept with him and would eventually lead to his annihilation. Since he was royalty, he knew this, and kept it close to him as a reminder of his circular death.\n\n‘Lord, then which should I be, the giant or the ant?’\n‘Both,’ spoke YISUN,’ or either, when it suits you. Destroy the grand enemy called ‘I’.’\n\nHansa contemplated this in silence. Later he would recount this proverb to his daughter.';    break;
                case 16:
                    msg += ' __The Lie of the Iron Plum__\n\n';    break;
                    /*There was once a king named UN-Payam who sat at the right hand of YISUN’s throne and ruled a palace of burnished gold and fire and dispensed justice in all things. It was let known once that Payam had grown an extraordinary plum – enormous in size, with adamant skin that was burnished as a breastplate and fifty times as hardy. Payam was desirous of a pillow friend of fiery heart and excellent skill with their mouth and let know that whosoever could break the skin of that plum with their teeth he would swear to share his bed with for three nights in whatever disposition they may desire.
                    Many gods were in attendance at Payam’s hall on the first day, and even more on the second day, but by the third day of this strange contest few remained who had not tested their mettle, for the plum remained implacable and immaculate and turned many away with sore teeth and roiling frustration in their brains. A great cry rose up and YISUN was called forth from the twenty third clockwise palace of carbon where YISUN had been meditating on the point of a thirty acre long spear of crystallized time. In companionship with YISUN was Hansa, who followed along.
                    “See this Payam!” cried the gods, “He deceives us! He cruelly abuses our lustful hearts!”
                    YISUN was very fond of plums and immediately grasped the iron plum and took a long, succulent bite, praising its merits to the amazement of all.
                    “How!” wailed the attended.
                    “Why, it is a plum of flesh, and quite ripe as well,” said YISUN plainly, and indeed, it was apparent to those gathered that it was the case. The plum was passed around and touched and indeed it was sensual and soft and pliant. Hansa was not so convinced. “It is still a plum of iron,” said he, “there is some trickery here, oh master of masters.”
                    “Indeed, it is so,” said YISUN, and it was again apparent to those gathered that the flesh of that plum was as hard and impermeable as a fortress. “How can it be so?” said Hansa, “How comes this fickle nature? Plums and the fifty winds are not so alike I think.”
                    YISUN said, “I told you of this and, believing it, it was so. In truth, it is whichever you prefer. In truth, there is no plum at all, just as there is no YISUN.  A plum has no shape, form, or color at all, in truth, but these are all things I find pleasing about it. A plum has no taste at all for it has no flesh or substance, but I find its sweetness intoxicating. A plum is a thing that does not exist. But it is my favorite fruit.”
                    “A pipe is a thing that does exist, and it is my favorite past time,” said Hansa, lacking understanding, and growing in cynicism.
                    “What a paradox!” said YISUN, smiling, “I shall share my love tenderly with Payam.”*/
                case 17:
                    msg += ' __The Lie of the Water House__\n\n';    break;
                    /*YISUN and Hansa walked the king’s road once, drinking plum wine. They were enfleshed as maidens at the time, for boastful, drunken Ogam swore on his high seat at the speaking house that any feat accomplished by his brothers he could redouble seven times again. Hansa, of crafty mind, and bearing little love for a brother whose raucous singing frequently interrupted his philosophical fugues, immediately saw an opportunity to deprive Ogam of his prized and well-boasted-about manhood for a fortnight, and challenged him to a contest of womanly love-making, sewing, and hearth sweeping, and for a time there was great mirth in the Red City.
                    “Dearest Un-Hansa,” spoke YISUN, after a moment, as they strolled along an expanse of fractal glass and cold fire, “Art thou not flesh of my self love? Springst thou not from my recursive womb?”
                    “Sprung I from your brow, for it is my lot in life to beat my hands against it in return for ejecting me,” said Hansa, in jest, but in truth he listened.
                    “Knowst thou the meaning of my name Y-S-U-N is the true name of sovereignty?” spoke YISUN plainly.
                    ” I do,” spoke Hansa, for it was true.
                    YISUN then assumed a speaking form that was bright and very cold, from her breath she inhaled the void, and when she exhaled, beautiful water came forth from her pliant lips in great rushing gasps, and there was a sound like a clear bell that meant emptiness. Hansa was very moved by this display and watched as the shining water curved and bent upon itself and crystallized, and suddenly before the pair was a great, beautiful house, translucent and all filled with light of many colors.
                    “Observe my work,” said YISUN, pleased.
                    “It is an astounding work,” said Hansa, clearly impressed. They strode inside the house at YISUN’s bidding. The walls were clear and smooth as crystal, and warm to the touch. It had a wide hall, and a full hearth, and was full of light and air, and the openness of the place with the starkness of the void was incredibly pleasing. Hansa would have given half his lordship for such a house, in truth, for his own was a dark and cramped tomb of iron and dust.
                    “Observe again,” said YISUN, with a keen eye. Hansa did, and as he looked closer, he saw the walls, the floor, the vaulted roof, the wall coverings, and even the altar with the flowers in the visiting hall were all made of water – water as clear and still and solid as smooth and perfect glass.
                    “Water, lord?” spoke Hansa, sensing some purpose.
                    “What,” spoke YISUN playfully, “is the meaning of this allegory?”
                    They reposed for a while as Hansa thought, in the resting hall of that great water house, and gazed through the shining rim of that house across the great void, where the empty sky was perfect in its nothingness. The house rung gently like a bell and it was pleasing to Hansa as he sat in his woman’s flesh and thought.
                    After a while, he said this:
                    “The house is a man’s life.”
                    “Why this?” answered YISUN, as was the fashion.
                    “Because although it is very beautiful and filled with many fine things, it is only water, after all. It would be poor to rely on its existence –  it is only water pretending to be a house. In truth, there is no real house here at all, just as there is no Hansa, or no plums.”
                    “This is a good answer,” said YISUN, and made a small motion with her long white fingers, and smiled.
                    “It is an infuriating answer,” said Hansa, his mood darkening, and his borrowed brow furrowing, “As is common with you. How can one grant themselves the pleasure to enjoy such a fine thing? It sparkles and shines like a gorgeous jewel, but its sparkle is an intimate falsehood.”
                    “Death is my gift to you,” spoke YISUN in reply.
                    “What’s the point,” spoke Hansa, bitterly,”Of such a fine house, if it is only a lie? What is the point of Hansa, if Hansa is only a lie?”
                    “I am a fine liar,” spoke YISUN in reply.
                    Hansa was silent a moment.
                    “It is a beautiful house,” he admitted, after some time, “It is a beautiful lie.”
                    “Our self-realization is the most beautiful lie there is. I am the most conceited and prime liar. Lies are the enemy of stagnation and my self-salvation. How could we appreciate the shining beauty of my house of lies,” spoke YISUN, arching her supple back, “if there was always such a house? How could we appreciate Hansa if there was always such a Hansa?”
                    They sat in stillness a while longer.
                    “In truth, we would get very bored,” said Hansa, after a while.
                    “In truth, we would,” said YISUN.*/
                case 18:
                    msg += ' __The lie of the small light__\n\nHansa was of sound mind and proud soul and only once asked YISUN a conceited question, when he was very old and his bones were set about with dust and bent with age. It was about his own death.\n\n“Lord,” said Hansa, allowing a doubt to blossom, “What is ending?”\nIt was said later he regretted this question but none could confirm the suspicion.\n“Ending is a small light in a vast cavern growing dim,” said YISUN, plainly, as was the manner.\n\n“When the light goes out, what will happen to the cavern?”\n“It and the universe will cease to exist, for how can we see anything without any light, no matter how small?” said YISUN.\nHansa was somewhat dismayed, but sensed a lesson, as was the manner.\n\n“Darkness is the natural state of caverns,” said he, vexingly, “if I were a cavern, I would be glad to be rid of the pest of light and exist obstinately anyway!”\n“Hansa is observant,” said YISUN.';    break;
            }        
        }
      //+ Spasms Easter Egg
        else if ( firstCmd === 'spasms' ) 
        {
            let verse = typeof args[1] === 'undefined' ? 0 /*//- Math.floor( Math.random() * 30 )*/ : Number( args[1] );

            switch ( verse )
            {
                case 8:
                    msg += "YISUN was questioned once by their disciples at their speaking house. The questions were the following:\n\n'What is the ultimate reason for existence?'\nTo which YISUN replied, 'Self-deception.'\n\n'How can a man live in perfect harmony?'\nTo which YISUN replied, 'Non-existence.'\n\n'What is the ultimate result of all action?'\nTo which YISUN replied, 'Futility.'\n\n'How best can we serve your will?'\nTo which YISUN replied, 'Kindly ignore my first three answers.'";    break;
                case 30:
                    msg += "Prim and the Mendicant Knight";    break;
                case 31:
                    msg += "A Conquering King must come with violence in his self of selves. He must splay the guts of his enemy with no weapon but his heartstrings. His lips must spit sweet music that pulverizes his enemies, and his eyes must tell a brain-cleaving tale of loveliness. He must quench the sword of his tongue in the love of his enemies.\n\tSpasms 31:12";    break;
            }
         }
      // Areas of improvement
        else if ( firstCmd === 'test' )
        {
            msg += '***Murder the Gods and topple their thrones!***\nIf they cannot bear the weight of your worship they are undeserving of Royalty.\nSo test your gods, beat them where they are weakest until they break.\nIf they are worthy they will come back stronger.';
            msg += '\n\nKnown weakenesses of the White God Arenjii are:';
              msg += '\n\t-__Obstacle Multiplication__: Several new verses to the prayer of rolling have been uncovered, invoke them with `ox#`, `ds#` and `bl`.';
              msg += '\n\t-__Dice Math__: In additon the `ad#`, `fk#` and `di` verses have been unlocked, with so many new commands it may be possible to overwhelm him.';
              msg += '\n\t-__Rerolls__: The `~fate`, `~callon` and `~grace` mantras are now functional. Make sure Un-Arenjii honours your well earned rerolls.';
              msg += '\n\t-__Versus Tests__: Conflicts are messy affairs, especially when Obstacle multipliers become involved. find a friend, better two, and watch Un-Arenjii squirm!';
            msg += '\nReach heaven through violence.';
        }
      // Versus Test
        else if ( firstCmd === 'vs' )
        {
            let contenders = [];
            let firstDoS;

          // No mentions
            if ( message.mentions.users.keyArray().length === 0 )
            {
                contenders = client.rollMap.get( message.channel.id );

                if ( contenders !== null && contenders.length > 1 )
                {
                    msg += 'Let the games begin!';
                    client.rollMap.set( message.channel.id, [] );
                }
                else
                {
                    msg += '\nThe VS Stack is empty...';
                }
            }
          // One mention
            else if ( message.mentions.users.keyArray().length === 1 )
            {
                let contA = client.rollMap.get( message.author.id );
                let contB = client.rollMap.get( message.mentions.users.firstKey() );

                if ( contA !== null && contB !== null )
                {
                    contenders.push( contA, contB );
                    msg += `You VS ${contB.owner.username}`;
                }
                else
                {
                    msg += contA === null ? "\nYou haven't made a roll yet." : "";
                    msg += contB === null ? `\n${message.mentions.users.array()[0].username} has not made a roll yet.` : "";
                }
            }
          // 2+ mentions
            else
            {
                message.mentions.users.array().forEach( mention =>
                {
                    let cont = client.rollMap.get( mention.id );

                    if ( cont !== null ) //+ don't add duplicate mentions. 
                    {
                        contenders.push( cont );
                    }
                    else
                    {
                        msg += `\n${mention.username} hasn't made a roll yet`;
                    }
                });

                if ( contenders.length < 2 )
                    {   msg += 'Insufficient contestants.';   }
                else if ( contenders.length === 2 )
                    {   msg += `${contenders[0].owner.username} VS ${contenders[1].owner.username}`;   }
                else
                    {   msg += `A free for all!`;   }
            }

            if ( contenders !== null && contenders.length > 0 )
            {
              //order by degree of success
                contenders.sort( function( a, b ) { return ( ( b.successes + b.astroResult - b.ObAddition ) / b.ObMultiplier - a.successes + a.astroResult - a.ObAddition ) / a.ObMultiplier; } );
                firstDoS = ( contenders[0].successes + contenders[0].astroResult - contenders[0].ObAddition ) / contenders[0].ObMultiplier;

              // Output
                if ( contenders.length >= 2 )
                {
                    //+ let winner = '';

                    contenders.forEach( ( contestant, cI, cC ) =>
                    {
                        contestant.obstacle = firstDoS;

                        let totalSuc = contestant.successes + contestant.astroResult;
                        let totalOb = contestant.obstacle * contestant.ObMultiplier + contestant.ObAddition;
                        let totalPool = contestant.exponent + contestant.nonArtha + contestant.astroDice + contestant.helperDice;

                        msg += `\n${contestant.owner} rolled ${totalSuc} against and Ob of ${totalOb}`

                        if ( contestant.ObMultiplier > 1 || contestant.ObAddition > 0 )
                        {
                            msg +=  ` [${Math.floor( 100 * contestant.obstacle ) / 100}`;
                            msg += contestant.ObMultiplier > 1 ? ` * ${contestant.ObMultiplier}` : '';
                            msg += contestant.ObAddition !== 0 ? ` + ${contestant.ObAddition}]` : ']';
                        }
                        
                        if ( contestant.beginnersLuck )
                        {
                            let testDiff = RDC( totalPool, totalOb / 2 );

                            if ( testDiff === 'Routine' )
                            {
                                msg += totalSuc >= totalOb ? `, passing by ${totalSuc - totalOb} and showing Aptitude for a new Skill` : `, failing, but advancing towards a new Skill`
                            }
                            else
                            {
                                msg += totalSuc >= totalOb ? `, passing a ${testDiff} test for the Root Stat by ${totalSuc - totalOb}` : `, failing a ${testDiff} test for the Root Stat`
                            }
                        }
                        else
                        {
                            msg += totalSuc >= totalOb ? `, passing a ${RDC( totalPool, totalOb )} test by ${totalSuc - totalOb}` : `, failing a ${RDC( totalPool, totalOb )} test`;
                        }

                        client.rollMap.set( contestant.owner, contestant )
                    });
                }
                else 
                    {   msg += '/nYou need two to tango.';   }
            }
            /*
            In a versus test,
            Everyone has to roll before anyone knows their base Ob.
            Once everyone has rolled, they each announce what degree of success they would have gotten in a graduated test (as if their base Ob was 0, essentially), but without rounding
            Then you listen for the maximum degree of success among those you're testing against and take the maximum of those and use it as your base Ob.
            Now calculate whether you succeeded or failed as normal (any 2x/4x/8x penalty and any +Ob penalty modifying that possibly-fractional base),
                if you succeeded, how many extra successes you got (at this point, round down).
            Anyone who succeeded is eligible to win the versus test.
            Whoever had the most extra successes actually does win, and their margin of success (actual extra successes) is the difference.
            If you fail you count as having 0 extra successes. If there is a tie, the versus test is tied.
            Note that if you fail, but your only opponent succeeds with 0 extra successes, (TODO: this should be verified) the versus test is still a tie.
            */
        }
      // Yisun easter egg
        else if ( firstCmd === 'yisun' )
        {
            switch ( Number( args[1] ) )
            {
                case 1:
                    msg += 'The name of YISUN that can be spoken is not the name of YISUN.\nThe name that can be named is not the eternal name!\nNameless: it is the source of Is and Is Not.\nThe Nameless has nine hundred and ninety nine thousand names that combine into the true name of God:\nI';    break;
                case 2:
                    msg += 'When the people of the world all know Truth, there arises the recognition of Lies. When they know there is such a thing as Illusion, there arises the idea of Reality.\n\nTherefore Reality and Illusion produce each other, Truth and Lies trick each other.'; break;
                case 3:
                    msg += 'To speak general truths about YISUN is to lie intimately; in truth YISUN is the unparalleled master of the fundamental art of lying. The best practice of lying is self deception.';    break;
                case 4:
                    msg += 'The Nameless way of YISUN is empty.\nWhen utilised, it is not filled up.\nInfinitely deep! This is YISUN: it is everything, including itself.'; break;
                case 5:
                    msg += 'The space between The Wheel and void\nIs it not like a bellows?\nEmpty, and yet never exhausted\nIt moves, and produces more';  break;
                case 6:
                    msg += 'The valley spirit, undying\nIs called the Mystic YS\n\nThe gate of the Mystic Female\nIs called the root of The Wheel and Void\n\nIt flows continuously, barely perceptible\nUtilize it; it is never exhausted.';   break;
                case 7:
                    msg += 'The Wheel and Void are everlasting\nThe reason the Wheel and Void can last forever\nIs that they do not exist for themselves\nThus they can last forever.'; break;
                case 8:
                    msg += 'Be fire: A burning will that consumes everything in its path to survive. Dance a dance of destruction and rebirth'; break;
                case 9:
                    msg += 'YS ATUN VRAMA PRESH';   break;
            }
        }
      // Standard Test
        else if ( rollPattern.test( firstCmd ) )
        {
          // setup
            let firstExp = rollPattern.exec( firstCmd );

            var currPool = new diePool();

            currPool.owner = message.author;
            currPool.exponent = Number( firstExp[2] );
            currPool.totalRolled = currPool.exponent;
            currPool.isOpenEnded = firstExp[3] === '!';

          // read and interpret each token
            args.forEach( token =>
            {
                let flag = testPattern.exec( token.toLowerCase() );

                if ( flag )
                {
                    let amount = Number( flag[2] );

                    switch ( flag[1] )
                    {
                        case 'ad':  // Advantage dice
                            //+ restrict to +2D
                        case 'fk':  // FoRK dice
                            currPool.nonArtha += amount;
                            break;
                        case 'as':  // Astrology
                            if ( amount !== 0 && currPool.astroDice === 0)
                            {
                                currPool.astroDice++;

                                if ( amount >= 5 )
                                {
                                    currPool.astroDice++;
                                }
                            }
                            break;
                        case 'bl':  // Beginner's Luck
                            if ( !currPool.beginnersLuck )
                            {
                                currPool.ObMultiplier *= 2;
                                currPool.beginnersLuck = true;
                            }
                            break;
                        case 'bn':  // Boon; Persona Point - +1D-3D to a roll
                            if ( currPool.booned < 3 )
                            {
                                if ( amount + currPool.booned >= 3 )
                                {
                                    currPool.arthaDice = 3;
                                    currPool.booned = 3;
                                }
                                else
                                {
                                    currPool.arthaDice += amount;
                                    currPool.booned += amount;
                                }
                            }
                            break;
                        case 'di':  // Divine Inspiration; Deeds Point - doubles base Exponen
                            if ( !currPool.inspired )
                            {
                                currPool.arthaDice += currPool.exponent;
                                currPool.inspired = true;
                            }
                            break;
                        case 'ds':  // Disadvantage
                            currPool.ObAddition += amount;
                            break;
                        case 'he':  // Helper dice
                            if ( amount > 6 )
                            {
                                currPool.helperPool.push( [0, 0] );
                                currPool.helperDice += 2;
                            }
                            else
                            {
                                currPool.helperPool.push( [0] );
                                currPool.helperDice++;
                            }
                            currPool.helperExponent.push( amount );
                            break;
                        case 'ns':  // No save
                            saveRoll = false;
                            break;
                        case 'ob':  // Base obstacle
                            currPool.obstacle = amount;
                            break;
                        case 'ox':  // Base Obstacle multiplier
                            currPool.ObMultiplier *= amount > 0 ? amount : 1;
                            break;
                        case 'vs':  // this is a VS test?
                            isVS = true;
                            break;
                    }
                }
            });

          // Find total dice rolled
            currPool.totalRolled = currPool.exponent + currPool.arthaDice + currPool.nonArtha + currPool.astroDice + currPool.helperDice;

          // determine shade
            switch ( firstExp[1].toLowerCase() )
            {
                case 'b':
                    currPool.shade = 4;
                    break;
                case 'g':
                    currPool.shade = 3;
                    break;
                case 'w':
                    currPool.shade = 2;
                    break;
            }

          // roll astrology dice
            for ( a = 0; a < currPool.astroDice; a++ )
            {
                let astRoll = roll();
                currPool.astroResult += astRoll >= currPool.shade;
                currPool.astroPool.push( astRoll );

                while( astRoll === 6 )
                {
                astRoll = roll();
                currPool.astroResult += astRoll >= currPool.shade;
                currPool.astroPool.push( astRoll );
                }

                if ( astRoll === 1 )
                {
                astRoll = roll();
                currPool.astroResult -= astRoll < currPool.shade;
                currPool.astroPool.push( astRoll );
                }
            }

          // roll helper dice
            for ( h = 0; h < currPool.helperPool.length; h++ )
            {
                let helpRoll = [];

                for ( h2 = 0; h2 < currPool.helperPool[h].length; h2++ )
                {
                    let r = roll();
                    currPool.successes += r >= currPool.shade;
                    helpRoll.push( r );

                    while( currPool.isOpenEnded && r === 6 )
                    {
                        r = roll();
                        currPool.successes += r >= currPool.shade;
                        helpRoll.push( r );
                    }
                }

                currPool.helperPool[h] = helpRoll;
            }

          // Roll Exponent dice
            for ( d = 0; d < Number( currPool.exponent ) + Number( currPool.arthaDice ); d++ )
            {
                let r = roll();

                if ( r >= currPool.shade ) 
                    {   currPool.successes++;   }
                if ( currPool.isOpenEnded && r === 6 ) 
                    {   d--;   }

                currPool.basePool.push( r );
            }

          // VS Test
            if ( isVS )
            {
                let vsRolls = client.rollMap.get( message.channel.id );

                if ( vsRolls === null )
                {
                    vsRolls = [];
                }

                vsRolls.push( currPool );

                client.rollMap.set( message.channel.id, vsRolls );

                msg += `${message.author.username} added a roll to the VS pile.`;
            }

          // Output
            if ( !isVS )
            {
                msg += currPool.printPool();
            }

          // Save Roll
            if ( saveRoll )
            {
                //- client.rollMap.set( message.channel.id, currPool ); //- is there any reason to save this?
                client.rollMap.set( message.author.id, currPool );
            }
        }
      // Invalid command
        else
        {
            msg += "That's not a valid command.";
        }

      // Output
        if ( msg !== '' )
        {
            message.channel.send( msg );
        }
    }
});

function roll ()
{
    return  1 + Math.floor( Math.random() * 6 );
}

function RDC (Pool, Obstacle)
{
    /*
        Challenging = # of dice rolled +1
        Difficult = # of dice rolled and below but above RoutineChallenge
        if diceRolled > routineTest.length us use diceRolled-3?
    */
    if ( Obstacle > Pool )
        {   return 'Challenging';   }
    else if ( Obstacle > routineTest[Pool] )
        {   return 'Difficult';   }
    else
        {   return 'Routine';   }
}

// WARNING: Illegible mess.
function diceSugar( pool, shade, open )
{
    let msg = '[';

    if ( Array.isArray( pool ) )
    {
      // for each element
        for ( let d = 0; d < pool.length; d++ )
        {
          // iterate through N dimentional arrays
            if ( Array.isArray( pool[d] ) )
            {
                msg += diceSugar( pool[d], shade, open );
            }
          // if dice explode
            else if ( open != 0 && ( pool[d] === 6 || pool[d] === 1 ) )
            {
                if ( pool[d]  === 6 )
                {
                    msg += ( d === 0 ? `__**${pool[d]}` : `, __**${pool[d]}` );

                    while ( pool[d + 1] === 6 )
                    {
                        msg += `, ${pool[++d]}`;
                    }

                    if ( open == 2 && pool[d + 1] === 1 )
                    {
                        msg += `**, ~~${pool[++d]}, ${pool[++d]}~~`;
                    }
                    else
                    {
                        msg += ( pool[++d] >= shade ? `, ${pool[d]}**` : `**, ${pool[d]}`);
                    }

                    msg += '__';
                }
              // if 1s explode
                else if ( open == 2 && pool[d] ===1 && d != pool.length )
                {
                    msg += ( d === 0 ? `~~${pool[d]}, ${pool[++d]}~~` : `, ~~${pool[d]}, ${pool[++d]}~~` );
                }
              // if 1s don't explode
                else
                {
                    msg += ( d === 0 ? pool[d] : `, ${pool[d]}` );
                }
            }
            else if ( pool[d] >= shade )
            {
                msg += ( d === 0 ? `**${pool[d]}**` : `, **${pool[d]}**` );
            }
            else
            {
                msg += ( d === 0 ? pool[d] : `, ${pool[d]}` );
            }
      }
      msg += ']';
    }

    return msg;
}

client.login( config.token );