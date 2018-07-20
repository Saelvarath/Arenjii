const Discord = require( 'discord.js' );
const config = require( './config.json' );

const Enmap = require('enmap');
//+ const EnmapMongo = require('enmap-mongo');

//+ TODO
    //+ Optimize Fate/Luck?
    //+ Ensure Versus test are correct?
        //+ make a way to privately roll a VS test?
    

class diePool
{
  // Constructor
    constructor( ard = 0, asd = 0, asp = [], asr = 0, bl = false, bp = [], co = false, ex = 0, fd = false, hd = 0, hx = [], hp = [], ins = false, oe = false, na = 0, oa = 0, om = 1, ob = 0, ow = '', sh = 4, sc = 0, tr = 0 )
    {
        this.arthaDice = ard;       // number of dice added through spending Artha
        this.astroDice = asd;       // number of dice added through Astrology FoRK
        this.astroPool = asp;       // results of astrological FoRKs/Help
        this.astroResult = asr;     // Successes gained or lost through Astrology
        this.beginnersLuck = bl;    // do you actually have the right skill for the job?
        this.basePool = bp;         // array of dice results, includes FoRKs, Artha Dice, Advantage Dice
        this.calledOn = co;         // if a Call-on Trait has been used on this roll.
        this.exponent = ex;         // BASE number of dice rolled, Exponent of the roll.
        this.fated = fd;            // if a Fate point has been spent on this roll
        this.helperDice = hd;       // number of dice added by helpers
        this.helperExponent = hx;   // the exponent of your helpers
        this.helperPool = hp;       // how much your companions 'helped' you
        this.inspired = ins;        // has this roll recieved Divine Inspiration?
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

        msg += this.beginnersLuck ? ', Beginner\'s Luck,' : '';

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
                msg += `\nThat\'s ${totesSuccessess} in total and effective success of ${Math.floor( ( totesSuccessess - this.ObAddition ) / this.ObMultiplier )} on a graduated test.`;
            }
            else
            {
                msg += totesSuccessess > 0 ? `\nThats ${totesSuccessess} succes(es)!` : '\nNo successes? looks like things are about to get interesting!';
            }
        }
        return msg;
    }
}

var testRoll = new diePool();

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
        let isTestRoll = false;

        let msg = ''; //- message.author.id === config.boss ? 'Sure thing, Boss!\n' : '';

        const rollPattern = RegExp( '([b|g|w])([0-9]{1,2})(!?)', 'i' );
        const testPattern = RegExp( '([a-z\+]{1,2})([0-9]{0,2})', 'i' );

      // Help
        if ( firstCmd.toLowerCase() === 'help' )
        {
            msg += `**${message.author} has queried the cosmos.**`;

          //Flagged
            if ( args[1] )
            {
                switch ( args[1] )
                {
                    case 'co':
                    case 'callon':
                        msg += '\n__Call on Trait__';
                        msg += '\nFunction: Rerolls all traitor dice. Usable once per roll.';
                        msg += '\nForm: `~co` of `~callon`';
                        break;
                    case 'dof':
                        msg += '\n__Die of Fate__';
                        msg += '\nFunction: Rolls a single die.';
                        msg += '\nForm: `~dof`';
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
                    case 'pr':
                    case 'prev':
                        msg += '\n__Display Previous Roll__';
                        msg += '\nFunction: Prints the previous roll of the mentioned user, including all changes made to it afterwards such as with `~fate` or `~vs`';
                        msg += '\nForm: `~pr` or `~prev` optional: `@user`';
                        msg += '\nNotes: if no users are mentioned it will display *your* last roll.';
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
                        msg += '\nForm: `~vs @user {...}`';
                        msg += '\nNotes:\n\t- One Mention: Mentioned person\'s last roll vs your last roll\n\t- Two+ Mentions: The last rolls of every person mentioned';
                        break;
                    case 'roll':
                        msg += '\n__Roll the Dice__';
                        msg += '\nFunction: Rolls a pool of dice';
                        msg += '\nForm: `~X#{!}`';
                          msg += '\n\t`X` Accepts `b`, `g` or `w`. Determines the Shade (Black, Grey or White respectively) of the roll.';
                          msg += '\n\t`#` the Exponent of the Test to be rolled [0 to 99]. Dice multipliers like the `di` tag only affect this number.';
                          msg += '\n\t`!` *optional*; adding this changes the roll to be Open-Ended';
                        msg += '\nExtra Tags:';
                          msg += '\n\t`ad#` __Advantage__ Adds `#` dice to the roll, unaffected by dice multipliers';
                          msg += '\n\t`as{#}` __Astrology, FoRK__: Adds special Astrology FoRK dice. Rolls 1 die by default. `as2` will roll 2';
                          msg += '\n\t`bl ` __Beginners\' Luck__: Multiplies Base Obstacle by 2, calculates if the test goes towards the ability or the skill';
                          msg += '\n\t`bn#` __Boon, Deeds Point__: Adds `#` [1-3] dice to the roll that do no affect difficulty. Unaffected by dice multipliers';
                          msg += '\n\t`di ` __Divine Inspiration__: Multiplies Exponent Dice by 2 and counts these extra dice as gained through Artha expenditure.';
                          msg += '\n\t`ds#` __Disadvantage__: Adds `#` to the Base Obstacle, unaffected by Ob multipliers.';
                          msg += '\n\t`fk#` __FoRK__: Functionally identical to `ad`. See `as` to FoRK in Astrology';
                          msg += '\n\t`he#` __Helper Exponent__: Adds Help Dice from an Exponent of `#` [1-10]. if an Obstacle is specified I can tell how difficult their test is';
                          msg += '\n\t`ns`  __Not Saved__: Do not save this roll. Several features use your previous roll';
                          msg += '\n\t`ob#` __Obstacle, Base__: Set the Base Obstacle of the task to `#` and returns the difficulty of the test. Obstacle multipliers only affect this number';
                          msg += '\n\t`ox#` __Obstacle, Multiplier__: Multiplies the Base Obstacle of by `#`.';
                          msg += '\n\t`vs ` __Versus Test__: *Unimplemented* Will flag Arenjii to compare this roll with another and declare a winner';
                        msg += '\nNotes:\n\t- Its usually okay to include FoRKs and Advantage dice in your Exponent. The exception being when the `di` tag is included.\n\t- Similarly, unless the `bl` or `ox` tags are included it\'s alright to forgo the `ds` tag';
                        break;
                }
            }
          //No Flags
            else
            {
                msg += '\nI am Arenjii, the White God of Progression.\nI am still in development but I still have a few tricks up my sleeve!';

                msg += '\nAll commands are case insensitive so yell if you like. Speak slowly though, add spaces between tags so I can understand you.';

                msg += '\n`~co`: See `~callon`';
                msg += '\n`~callon`: __Call On Trait__ rerolls all traitor dice';
                msg += '\n`~diff X Y`: See `difficulty`';
                msg += '\n`~difficulty X Y`: __Difficulty Calculator__ Returns if roll of `X` dice against and Ob of `Y` is Routine, Difficult or Challenging.';
                msg += '\n`~dof`: __Die of Fate__ Rolls a single die.';
                msg += '\n`~fate`: See `~luck`.';
                msg += '\n`~help [command]`: __Specific Help__ gives more details about individual commands.';
                msg += "\n`~luck`: __Luck, Fate point__: Rerolls all 6s in the previous roll if it wasn't open-ended or one traitor die if it was. Only useable once per roll";
                msg += '\n`~pr`: See `~prev`';
                msg += '\n`~prev`: __Previous Roll__: displays the previous roll.';
                msg += '\n`~rdc X Y`: See `difficulty`';
                msg += '\n`~test`: __How Can I Help?__ displays a list of things that need testing.';
                msg += '\n`~vs`: __Versus Test__ Pits two rolls against eachother.';
                msg += '\n`~b#`, `~g#`, `~w#` rolls a pool of `#` [0-99] black, grey or white dice respectively. adding a `!` after `#` will make the roll open ended.\n\ttype `~help roll` for more info on how to roll.';

                msg += '\n\nPlease PM Saelvarath if you find any bugs or have other suggestions!';
            }
        }
      // Call On trait
        else if ( firstCmd === 'co' || firstCmd === 'callon' )
        {
            //- msg += 'coming soon to a bot near you.';
            
            let prevPool = client.rollMap.get( message.author.id );

            if ( prevPool.calledOn )
            {
                msg += 'You have already used a Call-on trait for this roll';
            }
            else
            {
                let prevShade = prevPool.shade;                
                let astroTally = 0;
                let expoTally = 0;
                let result = 0;

              //+ Check Astrology pool
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
                            astroTally += prevPool.astroPool[ a + 1 ] < prevShade;    //-
                            prevPool.astroPool.splice( a, 2, ...newRoll);
                        }
                        else
                        {   prevPool.astroPool.splice( a, 1, ...newRoll );    }
                    }
                    a += newRoll.length ? newRoll.length : 1;
                }/**/

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
                            //prevPool.basePool.splice( dII, 1, ...newRoll );
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
                    prevPool.calledOn = true;
                    prevPool.successes += expoTally;
                    client.rollMap.set( message.author.id, prevPool );
                    msg += `your rerolls net you ${astroTally + expoTally} successes.\n${prevPool.printPool()}`;
                }
            }
        }
      // Test Difficulty calculator
        else if ( firstCmd === 'diff' || firstCmd === 'difficulty' || firstCmd === 'rdc' )
        {
        //+ add Ob addition/multiplication?

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
                        msg += 'Whoa there friend... That\'s an awful lot of dice you\'re slinging there...\n What do you think you are playing? Shadowrun? *Exalted?*';
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
        else if ( firstCmd === 'luck' || firstCmd === 'fate' )
        {
            //+ if there is a mention; use that roll?
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
                        msg += reroll >= prevPool.shade ? `Traitorous ${traitorType} die converted!\n${traitor} => ${reroll}\nthat\'s +1 success for a total of ${++prevPool.successes}` : `Well, you tried...\nI rerolled a ${traitor} from your ${traitorType} dice but only got at ${reroll}`;
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

                    msg += `reroll results: ${prevPool.printPool()}`; /*${diceSugar( rerollBase, prevPool.shade, prevPool.isOpenEnded )}`;

                    rerollHelp.forEach( ( helper, hI, hC ) =>
                    {
                        if ( helper.length > 0 )
                        {
                            msg += `\nhelper${hI}: ${diceSugar( helper,  prevPool.shade, prevPool.isOpenEnded )}`;
                        }
                    });*/
                }

                //+ if there is a mention; log roll under user.id
                client.rollMap.set( message.author.id, prevPool );
            }
          // Fate point already spent
            else
            {
                msg += 'No Previous roll or you\'ve already spent a Fate point on that roll';
            }
        }
      //+ Maybe Easter Egg
        else if ( firstCmd === 'maybe' )
        {

        }
      //+ Psalms Easter Egg
        else if ( firstCmd === 'psalms' )
        {
            /*switch ( args[2] ) {
                case 1:
                    msg += '**Royalty**';
                    break;
                case 2:
                    msg += '**The King in the Tower**';
                    break;
                case 2:
                    msg += '**The Grand Enemy Called I**';
                    break;
                case 8:
                    msg += '';
                    break;
                case 10:
                    msg += '';
                    break;
            }

            switch ( args[3] ) {
                case 1:

                    break;
            }*/
        }
      //+ Spasms Easter Egg
        else if ( firstCmd === 'spasms' ) 
        { /**/ }
      // Areas of improvement
        else if ( firstCmd === 'test' )
        {
            msg += '***Murder the Gods and topple their thrones!***\nIf they cannot bear the weight of your worship they are undeserving of Royalty.\nSo test your gods, beat them where they are weakest until they break.\nIf they are worthy they will come back stronger.';
            msg += '\n\nKnown weakenesses of the White God Arenjii are:';
              msg += '\n\t-__Obstacle Multiplication__: Several new verses to the prayer of rolling have been uncovered, invoke them with `ox#`, `ds#` and `bl`.';
              msg += '\n\t-__Dice Math__: In additon the `ad#`, `fk#` and `di` verses have been unlocked, with so many new commands it may be possible to overwhelm him.';
              msg += '\n\t-__Rerolls__: The `~fate` and `~callon` mantras are now functional. Make sure Un-Arenjii honours your well earned rerolls.';
              msg += '\n\t-__Versus Tests__: Conflicts are messy affairs, especially when Obstacle multipliers become involved. find a friend, better two, and watch Un-Arenjii squirm!';
            msg += '\nReach heaven through violence.';
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

            msg += pr === null ? `I got nothin'` : `${pr.owner}'s last roll was:\n${pr.printPool()}`;
        }
      // Versus Test
        else if ( firstCmd === 'vs' )
        {
            let contenders = [];
            let firstDoS;

          // No mentions
            if ( message.mentions.users.keyArray().length === 0 )
            {
                if ( message.author.id === config.boss )
                {
                    msg += 'The Boss vs a test roll';

                    let Boss = client.rollMap.get( message.author.id );


                    let DoSA = ( Boss.successes + Boss.astroResult - Boss.ObAddition ) / Boss.ObMultiplier;
                    let DoSB = ( testRoll.successes + testRoll.astroResult - testRoll.ObAddition ) / testRoll.ObMultiplier;
                    
                    if ( DoSA >= DoSB )
                    {
                        contenders.push( Boss, testRoll );
                        firstDoS = DoSA;
                    }
                    else
                    {
                        contenders.push( testRoll, Boss );
                        firstDoS = DoSB;
                    }
                }
                else
                {   msg += 'please specify whos roll you wish to compare against';   }
            }
          // One mention
            else if ( message.mentions.users.keyArray().length === 1 )
            {
                let contA = client.rollMap.get( message.author.id );
                let contB = client.rollMap.get( message.mentions.users.firstKey() );
                
                if ( contA && contB && contA.owner != contB.owner )
                {
                    msg += `You VS ${contB.owner}`;
                    
                    let DoSA = ( contA.successes + contA.astroResult - contA.ObAddition ) / contA.ObMultiplier;
                    let DoSB = ( contB.successes + contB.astroResult - contB.ObAddition ) / contB.ObMultiplier;
                    
                    if ( DoSA >= DoSB )
                    {
                        contenders.push( contA, contB );
                        firstDoS = DoSA;
                    }
                    else
                    {
                        contenders.push( contB, contA );
                        firstDoS = DoSB;
                    }
                }
                else
                {   msg += '\nRolls not found';   }
            }
          // 2+ mentions
            else
            {
                message.mentions.users.array().forEach( mention =>
                {
                    let cont = client.rollMap.get( mention.id );

                    if ( cont ) //+ don't add the same roll twice. 
                    {
                        
                        let DoS = ( cont.successes + cont.astroResult - cont.ObAddition ) / cont.ObMultiplier;

                        if ( firstDoS === undefined )
                        {
                            contenders.push( cont );
                            firstDoS = DoS;
                        }
                        else if ( DoS >= firstDoS )
                        {
                            contenders.splice( 0, 0, cont );
                            firstDoS = Dos;
                        }
                        else 
                        {   contenders.push( cont );   }
                    }
                });

                if ( contenders.length < 2 )
                {   msg += 'Insufficient contestants.';   }
                else if ( contenders.length === 2 )
                {   msg += `${contenders[0].owner} VS ${contenders[1].owner}`;   }
                else
                {   msg += `A free for all!`;   }
            }

          // Output
            if ( contenders.length >= 2 )
            {
                //+ let winner = '';

                contenders.forEach( ( contestant, cI, cC ) =>
                {
                    if ( cI === 0 )
                    {
                        contestant.obstacle = ( cC[1].successes + cC[1].astroResult - cC[1].ObAddition ) / cC[1].ObMultiplier;
                    }
                    else
                    {   contestant.obstacle = firstDoS;   }

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
                    msg += 'The name of YISUN that can be spoken is not the name of YISUN.\nThe name that can be named is not the eternal name!\nNameless: it is the source of Is and Is Not.\nThe Nameless has nine hundred and ninety nine thousand names that combine into the true name of God:\nI';
                    break;
                case 2:
                    msg += 'When the people of the world all know Truth, there arises the recognition of Lies. When they know there is such a thing as Illusion, there arises the idea of Reality.\n\nTherefore Reality and Illusion produce each other, Truth and Lies trick each other.';
                    break;
                case 3:
                    msg += 'To speak general truths about YISUN is to lie intimately; in truth YISUN is the unparalleled master of the fundamental art of lying. The best practice of lying is self deception.';
                    break;
                case 4:
                    msg += 'The Nameless way of YISUN is empty.\nWhen utilised, it is not filled up.\nInfinitely deep! This is YISUN: it is everything, including itself.';
                    break;
                case 5:
                    msg += 'The space between The Wheel and void\nIs it not like a bellows?\nEmpty, and yet never exhausted\nIt moves, and produces more';
                    break;
                case 6:
                    msg += 'The valley spirit, undying\nIs called the Mystic YS\n\nThe gate of the Mystic Female\nIs called the root of The Wheel and Void\n\nIt flows continuously, barely perceptible\nUtilize it; it is never exhausted.';
                    break;
                case 7:
                    msg += 'The Wheel and Void are everlasting\nThe reason the Wheel and Void can last forever\nIs that they do not exist for themselves\nThus they can last forever.';
                    break;
                case 8:
                    msg += 'Be fire: A burning will that consumes everything in its path to survive. Dance a dance of destruction and rebirth';
                    break;
                case 9:
                    msg += 'YS ATUN VRAMA PRESH';
                    break;
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

                                if ( amount >= 2 )
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
                            //+ disable after 1 invocation
                            amount > 3 ? currPool.arthaDice += 3 : currPool.arthaDice += amount;
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
                        case 'tr':  // set Test Roll
                            isTestRoll = message.author.id === config.boss;
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
                /*let prevPool = client.rollMap.get( mentioned user's roll );

                if ( prevPool !== null )
                {
                  // Set roll obstacles
                    prevPool.obstacle = currPool.successes + currPool.astroResult;
                    currPool.obstacle = prevPool.successes + prevPool.astroResult;

                  // Determine Winner

                  // Output
                    let VSmsg =  `\n\n`;
                }
                else
                {
                    msg += '\nno previous roll to compare with, use the `~vs` command to try again';
                }*/
            }

          // Output
            msg += currPool.printPool();

          // Save Roll
            if ( saveRoll )
            {
                //- client.rollMap.set( message.channel.id, currPool ); // is there any reason to save this?
                client.rollMap.set( message.author.id, currPool );
            }

            if ( isTestRoll )
            {
                testRoll = currPool;
                testRoll.owner = 'Test';
                msg = `Sure thing, Boss!\n${msg}\nThis is now the Versus Test Roll`;
            }
        }
      // Invalid command
        else
        {
            msg += 'That\'s not a valid command.';
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

//+ use this once Fate and Callon are tested
function reroll ( prevPool, shade, open)
{
    
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