const RDC = require("./rdc")
//+ TODO
	//+ Optimize Fate/Luck?
	//+ Ensure Versus test are correct?


class DicePool
{
  // Constructor
	constructor( )
	{
		this.arthaDice = 0;			// number of dice added through spending Artha
		this.astroDice = 0;			// number of dice added through Astrology FoRK
		this.astroPool = [];			// results of astrological FoRKs/Help
		this.astroResult = 0;		  // Successes gained or lost through Astrology
		this.beginnersLuck = false;	// do you actually have the right skill for the job?
		this.booned = 0;				// How many Persona Points have been spent on this roll?
		this.basePool = [];			// array of dice results, includes FoRKs, Artha Dice, Advantage Dice
		this.calledOn = false;		 // if a Call-on Trait has been used on this roll.
		this.exponent = 0;			 // BASE number of dice rolled, Exponent of the roll.
		this.fated = false;			// if a Fate point has been spent on this roll
		this.graced = false;			// if a Saving Grace has been employed on this roll
		this.helperDice = 0;			// number of dice added by helpers
		this.helperExponent = [];	  // the exponent of your helpers
		this.helperPool = [];		  // how much your companions 'helped' you
		this.openEndedDice = 0;		// how many dice or independantly open-ended (before explosions)
		this.openEndedPool = [];		// dice that are open ended regardless of the base roll
		this.inspired = false;		 // has Divine Inspiration struck this roll?
		this.isOpenEnded = false;	  // do dice explode?
		this.nonArtha = 0;			 // the number of non-artha dice added to the roll
		this.ObAddition = 0;			// added to Base Obstacle after it's multiplied
		this.ObMultiplier = 1;		 // for all you double Ob needs.
		this.obstacle = 0;			 // BASE obstacle of the roll
		this.owner = 'Hugh Mann';	  // Who rolled the dice
		this.reps = 0;				 // rank in the VS Stack
		this.shade = 4;				// shade of the roll, 4 = black, 3 = grey, 2 = white
		this.successes = 0;			// the number of successes gained through rolls
		this.totalRolled = 0;		  // how many dice ultimately end up being rolled (before explosions)
	}
	/**
	 * @returns {number}
	 */
	/**
	 * Rolls the dice with the given roller
	 * @param {rollderFunc} roller - the die roller to use
	 */
	/*roll( roller )
	{
		// roll astrology dice
		for ( a = 0; a < this.astroDice; a++ )
		{
			let astRoll = roller();
			this.astroResult += astRoll >= this.shade;
			this.astroPool.push( astRoll );
			
			while ( astRoll === 6 )
			{
				astRoll = roller();
				this.astroResult += astRoll >= this.shade;
				this.astroPool.push( astRoll );
			}
			
			if ( astRoll === 1 )
			{
				astRoll = roller();
				this.astroResult -= astRoll < this.shade;
				this.astroPool.push( astRoll );
			}
		}

		// roll Independantly Open-Ended dice
		for ( o = 0; o < this.openEndedDice; o++ )
		{
			let openRoll = roller();
			
			if ( openRoll >= this.shade ) 
			{	this.successes++;	}
			if ( openRoll === 6 ) 
			{	o--;	}
			
			this.openEndedPool.push( openRoll );
		}

		// roll helper dice
		for ( h = 0; h < this.helperPool.length; h++ )
		{
			let helpRoll = [];
			
			for ( h2 = 0; h2 < this.helperPool[h].length; h2++ )
			{
				let r = roller();
				this.successes += r >= this.shade;
				helpRoll.push( r );
				
				while ( this.isOpenEnded && r === 6 )
				{
					r = roller();
					this.successes += r >= this.shade;
					helpRoll.push( r );
				}
			}
			
			this.helperPool[h] = helpRoll;
		}

		// Roll Exponent dice
		for ( d = 0; d < Number( this.exponent ) + Number( this.arthaDice ); d++ )
		{
			let r = roller();
			
			if ( r >= this.shade ) 
			{	this.successes++;	}
			if ( this.isOpenEnded && r === 6 ) 
			{	d--;	}
			
			this.basePool.push( r );
		}
		this.totalRolled = this.exponent + this.arthaDice + this.nonArtha + this.openEndedDice + this.astroDice + this.helperDice;
	}*/
  // DiePool.printPool()
	printPool()
	{
		let msg = `${this.owner} rolled ${this.totalRolled}`;

	  // determine shade
		switch ( this.shade )
		{
			case 4:
				msg += ' Black ';	break;
			case 3:
				msg += ' Grey ';	break;
			case 2:
				msg += ' White ';	break;
		}

		msg += this.isOpenEnded ? 'Open-Ended dice' : 'shaded dice';

		msg += this.beginnersLuck ? ", Beginner's Luck," : '';

		msg += this.obstacle > 0 ? ` against an Ob of ${this.obstacle * this.ObMultiplier + this.ObAddition}` : '';

		msg += this.ObMultiplier > 1 && this.obstacle > 0 ? ` [${this.obstacle}*${this.ObMultiplier}+${this.ObAddition}].` : '.';

	  // print base dice
		if ( this.basePool.length )
		{
			msg += `\nExponent dice: ${diceSugar( this.basePool, this.shade, this.isOpenEnded )}`;
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
			msg += `\nFortune Dice: ${diceSugar( this.astroPool, this.shade, 2 )}`
			msg += `\nThe Stars were ${this.astroResult > 0 ? 'right' : 'wrong'} and their fate gives them ${this.astroResult} success this roll`;
		}

	  // determine Main test difficulty
		let totesSuccessess = this.successes + this.astroResult;
		let totesObstacle = this.obstacle * this.ObMultiplier + this.ObAddition;

		if ( this.obstacle > 0 )
		{
			msg += totesSuccessess >= totesObstacle ? `\nThats a success with a margin of ${totesSuccessess - totesObstacle} and they got to mark off a ` : `\nTraitorous dice! Thats a *failure* of ${totesObstacle - totesSuccessess}...\nAt least they got to mark off a `;

			let bl = RDC( this.exponent + this.nonArtha + this.astroDice + this.helperDice, this.obstacle + this.ObAddition );

			if ( this.beginnersLuck )
			{
				msg += bl === 'Routine' ? 'test towards learning a **new Skill**!' : `${bl} test towards advancing their **Root Stat**!`;
			}
			else
			{
				msg += `${bl} test.`;
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
				msg += totesSuccessess > 0 ? `\nThats ${totesSuccessess} succes${totesSuccessess === 1 ? 's' : 'es'}!` : '\nNo successes? looks like things are about to get interesting!';
			}
		}
		return msg;
	}
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

module.exports = DicePool