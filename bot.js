const Discord = require( 'discord.js' );
const config = require( './config.json' );

const fs = require( 'fs' );

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
		this.arthaDice = 0;			// number of dice added through spending Artha
		this.astroDice = 0;			// number of dice added through Astrology FoRK
		this.astroPool = [];		// results of astrological FoRKs/Help
		this.astroResult = 0;		// Successes gained or lost through Astrology
		this.beginnersLuck = false;	// do you actually have the right skill for the job?
		this.booned = 0;			// How many Persona Points have been spent on this roll?
		this.basePool = [];			// array of dice results, includes FoRKs, Artha Dice, Advantage Dice
		this.calledOn = false;		// if a Call-on Trait has been used on this roll.
		this.exponent = 0;			// BASE number of dice rolled, Exponent of the roll.
		this.fated = false;			// if a Fate point has been spent on this roll
		this.graced = false;		// if a Saving Grace has been employed on this roll
		this.helperDice = 0;		// number of dice added by helpers
		this.helperExponent = [];	// the exponent of your helpers
		this.helperPool = [];		// how much your companions 'helped' you
		this.openEndedDice = 0;		// how many dice or independantly open-ended (before explosions)
		this.openEndedPool = [];	// dice that are open ended regardless of the base roll
		this.inspired = false;		// has Divine Inspiration struck this roll?
		this.isOpenEnded = false;	// do dice explode?
		this.nonArtha = 0;			// the number of non-artha dice added to the roll
		this.ObAddition = 0;		// added to Base Obstacle after it's multiplied
		this.ObMultiplier = 1;		// for all you double Ob needs.
		this.obstacle = 0;			// BASE obstacle of the roll
		this.owner = 'Hugh Mann';	// Who rolled the dice
		this.reps = 0;				// rank in the VS Stack
		this.shade = 4;				// shade of the roll, 4 = black, 3 = grey, 2 = white
		this.successes = 0;			// the number of successes gained through rolls
		this.totalRolled = 0;		// how many dice ultimately end up being rolled (before explosions)
	}

  // DiePool.printPool()
	printPool()
	{
		
		let msg = `${this.owner} rolled ${this.totalRolled} ${[ 0, 0, 'White', 'Grey', 'Black' ][ this.shade ]} ${this.isOpenEnded ? 'Open-Ended' : 'shaded'} dice`;
		msg += `${this.beginnersLuck ? `, Beginner's Luck,` : ``}`;
		msg += `${this.obstacle > 0 ? ` against an Ob of ${this.obstacle * this.ObMultiplier + this.ObAddition}` : ''}`;
		msg += `${this.ObMultiplier > 1 && this.obstacle > 0 ? ` [${this.obstacle}*${this.ObMultiplier}${this.ObAddition != 0 ? `+${this.ObAddition}` : ``}].` : '.'}`;

	  // print base dice
		if ( this.basePool.length )
		{
			msg += `\nExponent dice: ${ diceSugar( this.basePool, this.shade, this.isOpenEnded ) }`;
			msg += this.arthaDice > 0 ? ` ${this.arthaDice} of which were gained by spending Artha` : '';
			//-msg += '\nActual roll: {' + this.basePool.toString() + '}';
		}

	  //+ Independently Open-Ended dice
		if ( this.openEndedDice > 0 )
		{
			msg += `\nOpen-Ended: ${diceSugar( this.openEndedPool, this.shade, 1)}`;
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

	  // tally & output astrology results
		if ( this.astroDice > 0 )
		{
			msg += `\nFortune Dice: ${diceSugar( this.astroPool, this.shade, 2 )}`;
			msg += `\nThe Stars were ${this.astroResult > 0 ? 'right' : 'wrong'} and their fate gives them ${this.astroResult} success this roll`;
		}

	  // determine Main test difficulty
		let totesSuccessess = this.successes + this.astroResult;
		let totesObstacle = this.obstacle * this.ObMultiplier + this.ObAddition;

		if ( this.obstacle > 0 )
		{
			msg += totesSuccessess >= totesObstacle ?	`\nThats a success with a margin of ${totesSuccessess - totesObstacle} and they got to mark off a` : 
														`\nTraitorous dice! Thats a *failure* of ${totesObstacle - totesSuccessess}... \nAt least they got a`;

			let bl = RDC( this.exponent + this.nonArtha + this.astroDice + this.helperDice, this.obstacle + this.ObAddition );

			if ( this.beginnersLuck )
			{
				msg += bl === 'Routine' ? 'n Advance towards learning a **new Skill**!' : ` ${bl} test towards their **Root Stat**!`;
			}
			else
			{
				msg += ` ${bl} test.`;
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
				msg += totesSuccessess > 0 ? `\nThats ${totesSuccessess} succes${totesSuccessess === 1 ? 's' : 'ses'}!` : '\nNo successes? looks like things are about to get interesting!';
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

const prefixes = config.prefixes;

const rollPattern = RegExp( '([bgw])(\\d{1,2})(!?)', 'i' );
const testPattern = RegExp( '\\b([a-z]{1,2})(\\d{0,2})\\b', 'i' );

client.on ( "ready", () => { console.log( "I am ready!" ); });

client.on( 'message', ( message ) =>
{
	if ( !message.author.bot && message.content.length > 1 && prefixes.includes( message.content.charAt(0) ) )
	{

	  // Auto Log
		  fs.appendFile( 'logFile.txt', `\n@${message.author.username},\t\t#${message.channel.name}\t\t\t${message.content}`, function (err) {
			if ( err !== null )
			{
				console.log(`File Error -> ${err}`);
				throw err;
			}
		});

	  // RegEx Setup
		let args = message.content.toLowerCase().slice(1).split(/ +/g)//.slice( config.prefix.length ).trim().split(/ +/g);
		let firstCmd = args[0];

		let isVS = false;
		let saveRoll = true;

		let msg = '';

	  // Standard Test
		if ( rollPattern.test( firstCmd ) )
		{
		  // setup
			let firstExp = rollPattern.exec( firstCmd );

			var currPool = new diePool();

			currPool.owner = message.author;
			currPool.exponent = Number( firstExp[2] );
			currPool.shade = [ 0, 0, 'w', 'g', 'b' ].indexOf( firstExp[1] ); //W = 2, G = 3, B = 4
			currPool.isOpenEnded = firstExp[3] === '!';

		  // read and interpret each token
			args.forEach( token =>
			{
				let flag = testPattern.exec( token );

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
						case 'ar':  //misc artha
							currPool.arthaDice += amount;
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
						case 'di':  // Divine Inspiration; Deeds Point - doubles base Exponent
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
							else if ( amount )
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
						case 'oe':
							currPool.openEndedDice += amount;
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
			currPool.totalRolled = currPool.exponent + currPool.arthaDice + currPool.nonArtha + currPool.openEndedDice + currPool.astroDice + currPool.helperDice;

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

		  // roll Independantly Open-Ended dice
			for ( o = 0; o < currPool.openEndedDice; o++ )
			{
				let openRoll = roll();

				if ( openRoll >= currPool.shade ) 
					{	currPool.successes++;	}
				if ( openRoll === 6 ) 
					{	o--;	}

				currPool.openEndedPool.push( openRoll );
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
			for ( d = 0; d < Number( currPool.exponent ) + Number( currPool.arthaDice ) + Number( currPool.nonArtha ); d++ )
			{
				let r = roll();

				if ( r >= currPool.shade ) 
					{	currPool.successes++;	}
				if ( currPool.isOpenEnded && r === 6 ) 
					{	d--;	}

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

				msg += `${currPool.reps === 0 ? currPool.owner.username : currPool.owner.username + ' ' + currPool.reps} added a roll to the VS pile.`;
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
	  // Help
		else if ( firstCmd === 'help' )
		{
			switch ( args[1] )
			{
				case 'co':
				case 'callon':
					msg += '\n__Call-On Trait__';
					msg += '\nFunction: Rerolls all traitor dice in your previous roll. Usable once per roll.';
					msg += '\nForm: `~co` or `~callon`';
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

				case 'dof':
					msg += '\n__Die of Fate__';
					msg += '\nFunction: Rolls a single die.';
					msg += '\nForm: `~dof {tags}`';
					msg += '\nExtra Tags:';
					msg += '\n\t` +#` adds `#` [1-9] to the result of the roll.';
					msg += '\n\t` -#` subtracts `#` [1-9] to the result of the roll.';
					break;

				case 'dow':
					msg += 'This feature is in testing and has not been completed yet\n';
					msg += '\n__Duel of Wits Guide__';
					msg += '\nFunction: a quick look up for the mechanics and interations of the various Duel of Wits actions.';
					msg += '\nForm: `~dow {action} {action}`';
					msg += '\nNotes:\n\t- No actions: Displays a list of recognized action keywords.\n\t- One action: displays the mechanics of the action .\n\t- Two Actions: displays the interaction when the two actions are scripted against eachother.';
					break;

				case 'fate':
				case 'luck':
					msg += '\n__Luck, Fate point__';
					msg += '\nFunction: Rerolls all 6s in your previous roll if it wasn\'t open-ended or one traitor die if it was. Usable once per roll.';
					msg += '\nForm: `~fate` or `~luck`';
					break;

				case 'grace':
					msg += '\n__Saving Grace, Deeds Point__'
					msg += '\nFunction: Rerolls all Traitor Dice in your previous roll. Usable once per roll.';
					msg += '\nForm: `~grace`';
					break;

				case 'help':
					msg += '\n__Bot Manual__'
					msg += '\nFunction: displays information about Arenjii\'s various uses.';
					msg += '\nForm: `~help {command}`. eg. `~help diff`';
					msg += '\nNotes: if no commands are specified it will display a brief summary of all of Arenjii\'s commands\n\t';
					break;

				case 'pr':
				case 'prev':
					msg += '\n__Display Previous Roll__';
					msg += '\nFunction: Displays your previous roll or that of the mentioned user, including all changes made to it afterwards such as with `~callon`, `~fate` and `~vs`';
					msg += '\nForm: `~pr` or `~prev` optional: `@user`. eg `~prev @Un-Arenjii#4939`';
					break;

				case 'rac':
					msg += 'This feature is in testing and has not been completed yet\n';
					msg += '\n__Range and Cover Guide__';
					msg += '\nFunction: a quick look up for the mechanics and interations of the various Range and Cover Maneuvers.';
					msg += '\nForm: `~rac {action} {action}`';
					msg += '\nNotes:\n\t- No actions: Displays a list of recognized maneuver keywords.\n\t- One action: displays the mechanics of the maneuver .\n\t- Two Actions: displays the interaction when the two maneuvers are scripted against eachother.';
					break;

				case 'roll':
					msg += '\n__Roll the Dice__';
					msg += '\nFunction: Rolls a pool of dice';
					msg += '\nForm: `~X#{!} {Tags...}`';
						msg += '\n\t`X` Accepts `b`, `g` or `w`. Determines the __Shade__ (Black, Grey or White respectively) of the roll.';
						msg += '\n\t`#` the __Base Exponent__ of the Test to be rolled [0-99].';
						msg += '\n\t`!` *optional*; adding this makes the roll Open-Ended';
					msg += '\nExtra Tags:';
						msg += '\n\t`ad#` __Advantage__ Adds `#` advantage dice to the roll.';
						msg += '\n\t`ar#` __Artha__ Adds `#` Artha dice to the roll.';
						/*Greed: 
						- Aids or hinders Resource tests
						- 1Pp: add [1-Greed] dice to a roll. Act as Artha Dice.
						Grief: 
						- 1Dp, add [Grief] dice to a spell/skill song exponent. Independantly Open-Ended.
						Hatred: 
						- 1/session: may test Hatred in place of any skill or stat if appropriate. Open-Ended.
						- 1Dp: add [Hatred] to the roll instead of doubling exponent. Independantly Open-Ended.
						Spite:
						- 1Dp: add [Spite] dice to a roll.
						Corruption: 
						- may test Corruption in place of Forte for spell tax
						- 1Fp: Corruption Exponent helps skill/stat roll. 
						- 1Pp: may test Corruption in place of any skill or stat
						- 1Dp: add [Corruption] to the roll instead of doubling exponent.
						*/
					// Rune Casting, Nature of all things also function like this?
						msg += '\n\t`as#` __Astrology, FoRK__: Adds special Astrology FoRK dice. # = [Astrology exponent].';
						msg += '\n\t`bl ` __Beginners\' Luck__: Multiplies Base Obstacle by 2, calculates if the test goes towards the ability or the skill';
						msg += '\n\t`bn#` __Boon, Deeds Point__: Adds `#` (3 Max) Artha dice to the roll.';
						msg += '\n\t`di ` __Divine Inspiration, Deeds Point__: Adds [Base Exponent] Artha dice to the roll.';
						msg += '\n\t`ds#` __Disadvantage__: Adds `#` to the Base Obstacle.';
						msg += '\n\t`fk#` __FoRK__: Functionally identical to `ad`. See `as` to FoRK in Astrology';
						msg += '\n\t`he#` __Helper Exponent__: Adds Help Dice from an Exponent of `#` [1-10].';
						msg += '\n\t`ns`  __Not Saved__: Do not save this roll. Several features use your previous roll';
						msg += '\n\t`ob#` __Obstacle, Base__: Set the Base Obstacle of the task to `#`.';

						msg += '\n\t`oe#` __Open-Ended__: Adds `#` dice to the roll that are Open-Ended independantly of the base roll';
						
						msg += '\n\t`ox#` __Obstacle, Multiplier__: Multiplies the Base Obstacle by `#`.';
						msg += "\n\t`vs ` __Versus Test__: Hide the results of the roll and add it to this channel's VS Stack. Trigger the Versus Test with `~vs`.";
					msg += '\nNotes:\n\t- Its usually okay to include FoRKs and Advantage dice in your Exponent. The exception being when the `di` tag is included.\n\t- Similarly, unless the `bl` or `ox` tags are included it\'s alright to forgo the `ds` tag';
					break;

				case 'test':
					msg += '\n__Areas for Improvement__';
					msg += '\nFunction: Displays a list of things that need testing.';
					msg += '\nForm: `~test`';
					break;

				case 'vs':
					msg += '\n__Versus Test__';
					msg += '\nFunction: Compares rolls. Which rolls are compared depends on how many mentions follow the command.';
					msg += '\nForm: `~vs {Tags...}`';
                    msg += "\nExtra Tags:\n\t- `clear`: Empties this channel's VS Stack (rolls made with the `vs` tag). \n\t- No Mentions: compares all rolls in this channel's VS stack. Clears the stack if successful.\n\t- One Mention: Compares mentioned person\'s last roll vs your last roll.\n\t- Two+ Mentions: Compares the last rolls of every person mentioned.";
                    msg += "\nNotes:\n\t- The VS Stack is unique to each text channel, rolls made in different places will not be compared.\n\t- Each person's most recent roll is saved, this is independant of the channel it is made in, including DMs to the bot";
					break;

				case 'fight':
				case 'prob':
					msg += 'This feature has not been implemented yet';
					break;

				default:
					msg += '\n\nAll commands are case insensitive so yell if you like. Speak slowly though, add spaces between tags so I can understand you.';
					msg += '\nCurly braces `{}` denote optional features explained in the help text for the individual command.';
					msg += '\nFor more detail on individual commands use `~help {command}`.\n\tExample: `~help vs`.';
	
					msg += '\n\n`~co`: See `~callon`';
					msg += '\n`~callon`: __Call On Trait__ rerolls all traitor dice. Tracked separatetly from Saving Grace.';
					msg += '\n`~diff X Y`: See `difficulty`';
					msg += '\n`~difficulty X Y`: __Difficulty Calculator__ Returns if a roll of `X` dice against an Ob of `Y` is Routine, Difficult or Challenging.';
					msg += '\n`~dof {tags...}`: __Die of Fate__ Rolls a single die.';
					msg += '\n`~dow` __Duel of Wits Guide__ **In Testing**';
					msg += '\n`~fate`: See `~luck`.';
					msg += '\n`~fight` __Fight! Guide__ **Unimplemented**';
					msg += '\n`~grace`: __Saving Grace, Deeds Point__ Rerolls all traitor dice, tracked separately from Call-on.';
					msg += '\n`~help {command}`: __Specific Help__ gives more details about individual commands.';
					msg += '\n`~luck`: __Luck, Fate point__ Rerolls all 6s in the previous roll if it wasn\'t open-ended or one traitor die if it was. Only useable once per roll';
					msg += '\n`~pr {@user}`: See `~prev`';
					msg += '\n`~prev {@user}`: __Previous Roll__: displays the previous roll.';
					msg += '\n`~prob`: __Probability__: **Unimplemented** Calculates the possible outcomes of a given roll.';
					msg += '\n`~rac`__Range and Cover Guide__ **In Testing**';
					msg += '\n`~rdc X Y`: See `difficulty`';
					msg += '\n`~test`: __How Can I Help?__ displays a list of things that need testing.';
					msg += '\n`~vs {@user...}`: __Versus Test__ Pits two or more rolls against eachother.';
					msg += '\n\n`~b#{!}`, `~g#{!}`, `~w#{!}` all include `{tags...}`. Rolls a pool of `#` [0-99] black, grey or white dice respectively.\n\ttype `~help roll` for more info on how to roll.';
	
					msg += '\n\nPlease PM Saelvarath#5785 if you find any bugs or have other comments or suggestions!\n\tA note to all using phones or international keyboards: the `~` can be replaced by `\\` in all commands for less hassle.';

			}

			if ( msg !== "" )
			{
				message.author.send( msg );
				msg = `**${message.author.username} has queried the cosmos.**`;
			}
		}
	  // Call On trait & Deeds point Saving Grace
		else if ( firstCmd === 'co' || firstCmd === 'callon' || firstCmd === 'grace' )
		{
			let prevPool = client.rollMap.get( message.author.id );

			if ( !prevPool )
				{	msg += 'You need to make a roll first';	 }
			else if ( prevPool.calledOn && firstCmd.startsWith( 'c' ) )
				{	msg += 'You have already used a Call-on trait for this roll.';	}
			else if ( prevPool.graced && firstCmd === 'grace' )
				{	msg += `You already had a Saving Grace.`;	}
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
							{	prevPool.astroPool.splice( a, 1, ...newRoll );	}
					}
					a += newRoll.length ? newRoll.length : 1;
				}

				prevPool.astroResult += astroTally;

			  // Check independant Open pool (1Dim Array)
				prevPool.openEndedPool.slice().forEach( ( ioe, iI, iC ) =>
				{
					let newRoll = [];

					if ( ioe < prevShade )
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
						prevPool.openEndedPool.splice( iI, 1, ...newRoll );
					}
				});

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
						{	prevPool.calledOn = true;	}
					else if ( firstCmd === 'grace' )
						{	prevPool.graced = true;	}
					
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
				{	msg += ` + ${bonus}`;	}
			else if ( bonus < 0 ) 
				{	msg += ` ${bonus}`;	}

			msg += `!\n[${DoF + bonus}]`;
		}
	  //+ Duel of Wits Guide
		else if ( firstCmd === 'dow' )
		{
			const DoWInterations =  
			[ 
				[ '-', '-', '-', 1, 'VS', 'VS', '-', '-', '-' ],	// Avoid
				[ 1, 1, 1, 1, 'VS', 1, 'VS', 1, 1 ],	// Dismiss
				[ '-', '-', 'VS', 'VS', 'VS', '-', 1, 1, 1 ],	// Feint
				[ 'VS', "opponent's Will exponent", 'VS', "opponent's Will exponent", 'VS', "opponent's Will exponent", "opponent's Will exponent", "opponent's Will exponent", "opponent's Will exponent" ],	// Incite
				[ 'VS', 'VS', 'VS', 'VS', 'VS', 'VS', 'VS', 1, 1 ],	// Obfuscate
				[ 'VS', 1, 1, 1, 'VS', 1, 'VS', 1, 1 ],	// Point
				[ '-', 'VS', '-', '-', 'VS', 'VS', '-', 0, 0 ],	// Rebuttal
				[ '-', '-', '-', '-', '-', '-', '-', '-', '-' ],	// hesitate
				[ '-', '-', '-', '-', '-', '-', '-', '-', '-' ] 
			];	// casting, praying etc.

		  //[name], [test], [std effect], [VS effect], {special}
			const DoWAction = 
			[ 
				[ "Avoid the Topic",
					"Will",
					"-",
					"Your successes are subtracted from your opponent's successes, reducing their effectiveness.\n\tActions that have their successes reduced to zero fail and their effects are canceled.",
					"Avoid never suffers a double obstacle penalty for stat versus skill.", ],	// Avoid
				[ "Dismiss Opponent", 
					"Coarse Persuasion, Command, Intimidation, Oratory, Religious Diatribe, Rhetoric, Stentorious Debate, Ugly Truth", 
					"Each success subtracts from your opponent's body of argument.",
					"Subtract the margin of success from your opponent's body of argument.\n\tAgainst the Dismiss action the winner subtracts ALL successes instead.",
					"Dismiss adds +2D to the character’s skill.\n\tIf the a Dismiss action fails to win the duel, it's user must change their next volly to a hesitate action." ],	// Dismiss
				[ "Feint",
					"Extortion, Falsehood, Interrogation, Persuasion, Poisonous Platitudes, Religious Diatribe, Rhetoric, Soothing Platitudes, Seduction", 
					"Each success subtracts from your opponent's body of argument.",
					"The margin of success is subtracted from your opponents body of argument." ],	// Feint
				[ "Incite Emotion",
					"Coarse Persuasion, Command, Extortion, Falsehood, Intimidation, Seduction, Ugly Truth",
					"If successful the victim must pass a Steel test or their next volley is changed to a hesitation action.\n\tIf Incite fails the margin of failure is added as advantage dice to the opponent's next test.",
					"If successful the victim must pass a Steel test or their next volley is changed to a hesitation action.\n\tIf Incite fails the margin of failure is added as advantage dice to the opponent's next test." ],	// Incite
				[ "Obfuscate",
					"Falsehood, Oratory, Poisonous Platitudes, Rhetoric, Religious Diatribe, Soothing Platitudes, Stentorious Debate, Suasion, Ugly Truth",
					"-",
					"On a tie the victim loses their current action.\n\tIf Obfusticate exceeds it's Ob, then the victim also suffers +1 Ob to their next action.\n\tIf Obfuscate fails the opponent gains +1D to their next action." ],	// Obfuscate
				[ "Make a Point",
					"Coarse Persuasion, Interrogation, Oratory, Persuasion, Poisonous Platitudes, Rhetoric, Stentorious Debate",
					"Subtract your successes from your opponent's body of argument.",
					"Subtract your margin of success from your opponent's body of argument." ],	// Point
				[ "Rebuttal",
					"Extortion, Interrogation, Oratory, Persuasion, Poisonous Platitudes, Rhetoric, Stentorious Debate, Suasion",
					"-",
					"Successes on attack dice are subtracted from your opponent's Body of Argument.\n\tSuccesses from the defense roll are subtracted from the opponent's successes.",
					"Before you opponent rolls divide your dice between attack and defense. Each pool must have at least one die in it.\n\tAny penalties to the action are applied to both pools but bonuses to the action only apply to one."],
				[ "Hesitate", // Stand and Drool, Run Screaming, Swoon, 
					"-",
					"The character is not actively participating in the Duel of Wits and is vulnerable.", 
					"The chacter can take no other action for now. Better luck with that Steel test next time!" ],
				[ "Special", //spell casting, praying, singing, howling, etc. 
					"Varies", 
					"The character too busy to actively participate in the Duel of Wits and is vulnerable. I hope it's worth it!",
					"The character too busy to actively participate in the Duel of Wits and is vulnerable. I hope it's worth it!"]
			];

		  // no arguements
			if ( args.length === 1 )
			{
				msg += "Recognized actions are:\n\t*avoid, cast, command, dismiss, drool, drop, fall, feint, hesitate, howl, incite, obfuscate, point, pray, prone, rebuttal, run, scream, screaming, sing, spell, spirit, stand, swoon*";
			}
		  // 1 arguement: displays info on specific action.
			else if ( args.length === 2 )
			{
				let act = actionConverter( 'd', args[1] );

				if (  typeof DoWAction[act] != 'undefined' )
				{
					msg += `**${DoWAction[act][0]}**\n*Tests:*\n\t${DoWAction[act][1]}`;

					if (DoWAction[act].length === 5 )
					{
						msg += `\n*Special:*\n\t${DoWAction[act][4]}`;
					}

					msg += `\n*Standard Test Effect:*\n\t${DoWAction[act][2]}`;
					msg += `\n*Versus Test Effect:*\n\t${DoWAction[act][3]}`;

					message.author.send( msg );

					msg =  `**${message.author.username} has queried the cosmos.**`;
				}
				else 
					{	msg += "I don't know that action..."	}
			}
		  // 2 arguements displays info on the interation of the two specified actions.
			else if ( args.length === 3 )
			{
				let a1 = actionConverter( 'd', args[1] );
				let a2 = actionConverter( 'd', args[2] );

				if ( a1 !== -1 && a2 !== -1)
				{
					msg += `Contestant 1's ${DoWAction[a1][0]} action `;

					if ( DoWInterations[a1][a2] === 'VS' )
					{	msg += `makes a VS test against their oppenent's roll\n${DoWAction[a1][3]}`;	}
					else if ( DoWInterations[a1][a2] === '-' )
					{	msg += `is vulnerable against their opponent's action and makes no roll`;	}
					else
					{	msg += `rolls a standard test against and Ob of ${DoWInterations[a1][a2]}\n\t${DoWAction[a1][2]}`;	}

					msg += `\n\nContestant 2's ${DoWAction[a2][0]} action `;

					if ( DoWInterations[a2][a1] === 'VS' )
					{	msg += `makes a VS test against their oppenent's roll\n${DoWAction[a2][3]}`;	}
					else if ( DoWInterations[a2][a1] === '-' )
					{	msg += `is vulnerable against their opponent's action and makes no roll`;	}
					else
					{	msg += `rolls a standard test against and Ob of ${DoWInterations[a2][a1]}\n\t${DoWAction[a2][2]}`;	}
				}
				else
				{	msg += "Use `~dow` to see a list of recognized actions.";	}
			}
			else
			{	msg = "Something isn't right... have you tried the `~help dow` command?";	}
		}
	  //+ Fight! Guide
		else if ( firstCmd === 'fight' )
		{

		}
	  // Invite
		else if ( firstCmd === "invite" )
		{
			const inviteEmbed = 
			{
				"title": "Invite Arenjii to your Discord server",
				"description": "Click [Here](https://discordapp.com/oauth2/authorize?client_id=434471882163748876&scope=bot) to get the Wheel turning.",
				"color": 14951424,
				"thumbnail": 
				{
					"url": "https://upload.wikimedia.org/wikipedia/commons/1/1d/Rotating_Konarka_chaka.gif"
				}
			};
			message.author.send( { embed: inviteEmbed} );

			msg += `**${message.author.username} has queried the cosmos.**`;
		}
	  // Luck; Fate point, retroactively make a roll Open-Ended or reroll one die
		else if ( firstCmd === 'luck' || firstCmd === 'fate' )
		{
			//+ if roll is not open ended but contains asto or independant open dice force choice 
			//+ figure out how astro dice work in this scenario
			//+ figure out how to handle pools with both open and non-open ended dice

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

					if ( prevPool.astroDice !== 0 || prevPool.openEndedDice !== 0 )
					{
						//+ make this work.
						msg += "\n\nI don't know how to deal with a pool is already partially Open-Ended so those dice are ignored.";
					}
				}

				client.rollMap.set( message.author.id, prevPool );
			}
		  // Fate point already spent
			else
			{
				msg += "No Previous roll or you've already spent a Fate point on that roll";
			}
		}
	  // Practice
		else if (  firstCmd === 'practice' )
		{
			const catagory = {};
			const times = { 
						academic: [ 6, 'm', 2, 4, 8 ],
						artistic: [ 1, 'y', 4, 8, 12 ],
						artist: [ 6, 'm', 3, 6, 12 ],
						craftsman: [ 1, 'y', 3, 8, 12 ],
						forester: [ 6, 'm', 3, 6, 12 ],
						martial: [ 1, 'm', 2, 4, 8 ],
						medicinal: [ 1, 'y', 4, 8, 12 ],
						military: [ 6, 'm', 2, 4, 8 ],
						musical: [ 1, 'm', 2, 4, 8 ],
						peasant: [ 3, 'm', 1, 4, 12 ],
						physical: [ 1, 'm', 2, 4, 8 ],
						sot: [ 6, 'm', 3, 6, 12 ],
						seafaring: [ 3, 'm', 2, 4, 8 ],
						social: [ 1, 'm', 2, 4, 8 ],
						sorcerous: [ 1, 'y', 5, 10, 15 ],
						special: [ 3, 'm', 3, 6, 12 ],
						misc: [ 3, 'm', 3, 6, 12 ],
						will: [ 1, 'y', 4, 8, 16 ],
						perception: [ 6, 'm', 3, 6, 12 ],
						agility: [ 3, 'm', 2, 4, 8 ],
						speed: [ 3, 'm', 3, 6, 9 ],
						power: [ 1, 'm', 2, 4, 8 ],
						forte: [ 2, 'm', 4, 8, 16 ],
						faith: [ 1, 'y', 5, 10, 20 ],
						steel: [ 2, 'm', 1, 3, 9 ] };
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
				{	pr = client.rollMap.get( message.author.id );	}

			msg += pr === null ? `I got nothin'...` : `${pr.owner.username}'s last roll was:\n${pr.printPool()}`;
		}
	  //+ Dice result probability calculator
		else if ( firstCmd === 'prob' )
		{
			msg += 'Probability math is hard. it will be a while before this gets completed.';
		}
	  //+ Range and Cover Guide
		else if ( firstCmd === 'rac' )
		{
		  //Name, Test, test type, move type, Effect
			const RaCActions = 
			[
				['Charge', 
					'Steel', 'steel', 
					'advance',
					'If successful your opponent gets one free shot, then you advance one range category.\n\tIf tied, everyone on both teams gets to shoot.\n\tIf failed, your opponent gets two free shots and you hesitate in the next volley.'],
				['Close Distance', 
					'Speed ', 'stat',
					'advance',
					'If successful, advance one range category.'],
				['Fall Back', 
					'Tactics + FoRKs', 'skill',
					'withdraw', 
					"If successful, withdraw one range category.\n\tThen, for two successes, you can re-range all combatant's weapons"],
				['Flank', 
					'Tactics + FoRKs', 'skill',
					'advance',
					'If successful, advance one range category.'],
				['Hold Position', 
					'Perception Vs Stat, Observation Vs Skill', 'special',
					'hold',
					"Special: Advantage dice from a position are carried over into your next maneuver.\n\tFirst, the movement portion of your opponent's maneuver automatically occurs.\n\tThen, take a free shot."], //doesn't get advantage from Stride
				['Maintain Distance', 
					'Speed', 'stat',
					'hold',
					'If successful, previous range catagory is unchanged.'],
				['Retreat', 
					'Steel +1D', 'steel',
					'withdraw', 
					'If successful, your opponent gets a free shot, then you withdraw one range category.\n\tIf tied, your opponent gets two free shots.\n\tIf failed, your opponents gets two free shots plus you hesitate in the next volley.'],
				['Sneak In', 
					'Stealthy + FoRKs', 'skill',
					'advance',
					'If successful, advance one range category.'],
				['Sneak Out', 
					'Stealthy + FoRKs', 'skill',
					'withdraw', 
					'If successful, withdraw one range category.'],
				['Withdraw', 
					'Speed +2D', 'stat',
					'withdraw', 
					"Special: All actions taken cost two successes.\n\tIf successful, withdraw one range category and you can take an action to remain at your current range then re-range all combatant's weapons."],
				['Stand and Drool',
					'-', '-',
					'hold',
					"The Ob for your opponent's Positioning test is 1 and they may take an action to capture you if within optimal range"],
				['Run Screaming',
					'Speed or Steel', 'Stat',
					'withdraw', 
					'You drop what you are holding and flee while screaming.\n\tIf successful, you withdraw one range catagory but can make no aggressive actions.\n\tYour opponent may take an action to capture you if within optimal range'],
				['Fall Prone and Beg for Mercy',
					'-', '-',
					'hold',
					"Your opponent's next positioning test is at Ob 1, but once you recover you have a 2D position"],
				['Swoon',
					'-', '-',
					'hold',
					"Special: Immediately make a free Stealthy or Inconspicuous test against your opponent's Observation.\n\tIf successful they lose track of you and you awake later cold and alone.\n\tIf failed their next positioning test is at Ob 1"]
			];

			// no arguements
			if ( args.length === 1 )
			{
				msg += "Recognized Maneuvers are:\n\t*Charge, Close, Fall, FallBack, Fall_Back, Flank, Hold, Maintain, Retreat, SneakIn, Sneak_In, SneakOut, Sneak_Out, Withdraw*";
				//
			}
			// 1 arguement: displays info on specific action.
			else if ( args.length === 2 )
			{
				let act = actionConverter( 'r', args[1] );
 
				if ( typeof RaCActions[act] != 'undefined' )
				{
					msg += `**${RaCActions[act][0]}**`;
					msg += RaCActions[act][1] !== '-' ? `\n*Tests:*\t${RaCActions[act][1]} + weapon range + position${act != 4 ? ' + stride' : ''}.` : '';

					msg += `\n*Effect:*\n\t${RaCActions[act][4]}`;

					message.author.send( msg );

					msg =  `**${message.author.username} has queried the cosmos.**`;
				}
				else 
					{	msg += "I don't know that maneuver..."	}
			}
		  // 2 arguements displays info on the interation of the two specified actions.
			else if ( args.length === 3 )
			{
				let a1 = actionConverter( 'r', args[1] );
				let a2 = actionConverter( 'r', args[2] );

				if ( a1 !== -1 && a2 !== -1)
				{
					msg += `**${RaCActions[a1][0]}**\nRolls `;

					if (  RaCActions[a1][1] !== '-' )
					{
						if ( RaCActions[a1][2] === 'special' )
						{
							if ( RaCActions[a2][2] !== 'skill')
								{	msg += 'Perception';	}
							else
								{	msg += 'Observation';	}
						}
						else
							{	msg += RaCActions[a1][1];	}

						msg += ` plus modifiers gained from weapon range${a1 != 4 ? `, position and stride` : ` and position`}${ RaCActions[a2][2] === 'skill' && RaCActions[a1][2] === 'stat' ? ' at a __double Ob penalty__' : ''}.`;
					}
					msg += `\n\t${RaCActions[a1][4]}`;


					msg += `\n\n**${RaCActions[a2][0]}**\nRolls `;

					if (  RaCActions[a2][1] !== '-' )
					{
						if ( RaCActions[a2][2] === 'special' )
						{
							if ( RaCActions[a1][2] !== 'skill')
								{	msg += 'Perception';	}
							else
								{	msg += 'Observation';	}
						}
						else
							{	msg += RaCActions[a2][1];	}

						msg += ` plus modifiers gained from weapon range${a2 != 4 ? `, position and stride` : ` and position`}${ RaCActions[a1][2] === 'skill' && RaCActions[a2][2] === 'stat' ? ' at a __double Ob penalty__' : ''}.`;
					}
					msg += `\n\t${RaCActions[a2][4]}`;


				  //+ TIES
					if ( RaCActions[a1][3] === 'advance' && RaCActions[a2][3] === 'advance' )
					{
						/*
						Close VS Flank,					 Close Wins.
						Sneak In VS Close | Charge,		 Sneak In Wins. 
						Flank Vs Sneak In | Charge,		 Flank wins. 
						Charge Vs Close					 Charge wins.
						*/
					}
					else if ( RaCActions[a1][3] === 'withdraw' && RaCActions[a2][3] === 'withdraw' )
					{
						/*
						Withdraw Vs Fall Back				Withdraw wins.
						Sneak Out Vs Withdraw | Retreat,	Sneak Out Wins.
						Fall Back Vs Sneak Out | Retreat,	Fall Back Wins.
						Retreat Vs Withdraw,				Retreat Wins.
						*/
					}
				}
				else
				{	msg += "Use `~rac` to see a list of recognized actions.";	}
			}
			else
			{	msg = "Something isn't right... have you tried the `~help rac` command?";	}		
		}
	  // Areas of improvement
		else if ( firstCmd === 'test' )
		{
			msg += 'Arenjii is a work in progress and the rules for Burning Wheel are intricate. Many interations are not explicitly clarified and I cannot claim to be an expert in the system.\nKeep an eye out to make sure my interpretation of the rules meets your expectations\nThere are some areas where I recommend extra scrutiny:';
			  msg += '\n\t-__Rerolls__: Make sure Arenjii honours your well earned rerolls, particularly if your roll involves astrology or open-ended dice when the pool itself is not open-ended.';
			  msg += '\n\t-__Versus Tests__: Conflicts are messy affairs, especially when Obstacle multipliers become involved.';
			  msg += '\n\t-__Mixed Dice__: open-ended dice in pools that are not open-ended may be excluded from some features or behave oddly';

			//-
			/*msg += '***Murder the Gods and topple their thrones!***\nIf they cannot bear the weight of your worship they are undeserving!\nSo test your gods, beat them where they are weakest until they break.\nIf they are worthy they will come back stronger.';
			msg += '\n\nKnown weakenesses of the White God Arenjii are:';
			  msg += '\n\t-__Obstacle Multiplication__: Several new verses to the prayer of rolling have been uncovered, invoke them with `ox#`, `ds#` and `bl`.';
			  msg += '\n\t-__Rerolls__: The `~fate`, `~callon` and `~grace` mantras are now functional. Make sure Un-Arenjii honours your well earned rerolls.';
			  msg += '\n\t-__Versus Tests__: Conflicts are messy affairs, especially when Obstacle multipliers become involved. find a friend, better two, and watch Un-Arenjii squirm!';
			  msg += '\n\t-__Mixed Dice__: open-ended dice in pools that are not open-ended may be excluded from some features or behave oddly';
			msg += '\nReach heaven through violence.';*/
		}
	  // Versus Test
	  //+ Shade Math
		else if ( firstCmd === 'vs' )
		{
			/* 
			B (B + G + 2) / 2
			G (B + W + 3) / 2
			G (G + W + 3) / 2

			W + W = W. 
			W + G = G. 
			W + B = G.

			G + G = G.
			G + B = B.

			B + W + G 	= B.
			W + G + G 	= G.
			W + W + G 	= G.
			*/
			let contenders = [];
			let firstDoS;

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

		  
			if ( args[1] === "clear")
			{
				client.rollMap.set( message.channel.id, [] );
				contenders = null;
				msg += 'The VS Stack has been emptied.'
			}
		  // No mentions
			else if ( message.mentions.users.keyArray().length === 0 )
			{
				contenders = client.rollMap.get( message.channel.id );

				if ( contenders !== null && contenders.length > 1 )
				{
					msg += 'Let the games begin!';
					client.rollMap.set( message.channel.id, [] );
				}
				else
				{
					msg += '\nI need at least 2 rolls in the VS stack (previous rolls in this channel with the `vs` tag) or a @mention of one person to perform a VS test';
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
					{	msg += 'Insufficient contestants.';	}
				else if ( contenders.length === 2 )
					{	msg += `${contenders[0].owner.username} VS ${contenders[1].owner.username}`;	}
				else
					{	msg += `A free for all!`;	}
			}

		 // Final Calculations
			if ( contenders !== null && contenders.length > 1 )
			{
			  //order by degree of success
				contenders.sort( function( a, b ) { return ( ( b.successes + b.astroResult - b.ObAddition ) / b.ObMultiplier - ( a.successes + a.astroResult - a.ObAddition ) / a.ObMultiplier ); } );
				firstDoS = ( contenders[0].successes + contenders[0].astroResult ) / contenders[0].ObMultiplier;
				secondDoS = ( contenders[1].successes + contenders[1].astroResult ) / contenders[1].ObMultiplier;

			  // Output
				if ( contenders.length >= 2 )
				{
					//+ let winner = '';

					contenders.forEach( ( contestant, cI, cC ) =>
					{
						//+ highest DoS should not face itself
						contestant.obstacle = cI === 0 ? secondDoS : firstDoS;

						let totalSuc = contestant.successes + contestant.astroResult;
						let totalOb = contestant.obstacle * contestant.ObMultiplier + contestant.ObAddition;
						let totalPool = contestant.exponent + contestant.nonArtha + contestant.astroDice + contestant.helperDice;

						msg += `\n${contestant.reps === 0 ? contestant.owner : `**${contestant.owner.username} ${contestant.reps}**`} rolled ${totalSuc} against an Ob of ${totalOb}`;

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
								msg += totalSuc >= totalOb ? `, passing by ${totalSuc - totalOb} and showing Aptitude for a **new Skill**` : `, failing, but advancing towards a **new Skill**`;
							}
							else
							{
								msg += totalSuc >= totalOb ? `, passing a ${testDiff} test for the **Root Stat** by ${totalSuc - totalOb}` : `, failing a ${testDiff} test for the **Root Stat**`;
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
					{	msg += '/nYou need two to tango.';	}
			}
			
		}
	  // Invalid command
		else
		{	msg += "That's not a valid command.";	}

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
		{	return 'Challenging';	}
	else if ( Obstacle > routineTest[Pool] )
		{	return 'Difficult';	}
	else
		{	return 'Routine';	}
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

//DoW, Fight!, RaC keyword conversion
function actionConverter ( type, action )
{
	let act = -1;

	if ( type === 'f')
	{
		
	}
	else if ( type === 'd' )
	{
		switch ( action )
		{
			case "avoid": act = 0; break;
			case "dismiss": act = 1; break;
			case "feint": act = 2; break;
			case "incite": act = 3; break;
			case "obfuscate": act = 4; break;
			case "point": act = 5; break;
			case "rebuttal": act = 6; break;
			case "fall":
			case "prone":
			case "beg":
			case "mercy":
			case "run":
			case "scream":
			case "screaming":
			case "stand":
			case "drool":
			case "swoon":
			case "hesitate": act = 7; break;
			case "command":
			case "spirit":
			case "cast":
			case "drop":
			case "spell":
			case "pray":
			case "sing":
			case "howl": act = 8; break;
		}
	}
	else if ( type === 'r' )
	{
		switch ( action )
		{
			case "charge": act = 0; break;
			case "close": act = 1; break;
			case "fall":
			case "fallback":
			case "fall_back": act = 2; break;
			case "flank": act = 3; break;
			case "hold": act = 4; break;
			case "maintain": act = 5; break;
			case "retreat": act = 6; break;
			case "sneakin":
			case "sneak_in":
			case "fall": act = 7; break;
			case "sneakout":
			case "sneak_out": act = 8; break;
			case "command":
			case "withdraw": act = 9; break;
			case "prone":
			case "beg":
			case "mercy":  act = 10; break;
			case "run":
			case "scream":
			case "screaming": act = 11; break;
			case "stand":
			case "drool": act = 12; break;
			case "swoon": act = 13; break;
		}
	}


	return act;
}

client.login( config.token );