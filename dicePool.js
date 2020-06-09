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
		let msg = `${this.owner} rolled ${this.totalRolled} ${[ 0, 0, 'White', 'Grey', 'Black' ][ this.shade ]} ${this.isOpenEnded ? 'Open-Ended' : 'shaded'} dice`;
		msg += `${this.beginnersLuck ? `, Beginner's Luck,` : ``}`;
		msg += `${this.obstacle > 0 ? ` against an Ob of ${this.obstacle * this.ObMultiplier + this.ObAddition}` : ''}`;
		msg += `${this.ObMultiplier > 1 && this.obstacle > 0 ? ` [${this.obstacle}*${this.ObMultiplier}${this.ObAddition != 0 ? `+${this.ObAddition}` : ``}].` : '.'}`;

	  // print base dice
		if ( this.basePool.length )
		{
			msg += `\nExponent dice: ${diceSugar( this.basePool, this.shade, this.isOpenEnded )}`;
			msg += this.arthaDice > 0 ? ` ${this.arthaDice} of which were gained by spending Artha` : '';
			//-msg += '\nActual roll: {' + this.basePool.toString() + '}';
		}

	  // Independently Open-Ended dice
		msg += this.openEndedDice > 0 ? `\nOpen-Ended: ${diceSugar( this.openEndedPool, this.shade, 1)}` : '';

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

			msg += this.beginnersLuck ?		bl === 'Routine' ?	`n Advance towards learning a **new Skill**!` :
																` ${bl} test towards their **Root Stat**!` :
										` ${bl} test.`;
		}
		else
		{
			msg += this.ObMultiplier > 1 ?	`\nThat's ${totesSuccessess} in total and effective success of ${Math.floor( ( totesSuccessess - this.ObAddition ) / this.ObMultiplier )} on a graduated test.` :
											totesSuccessess > 0 ?	`\nThats ${totesSuccessess} succes${totesSuccessess === 1 ? 's' : 'es'}!` :
																	'\nNo successes? looks like things are about to get interesting!';
		}
		return msg;
	}
}

// WARNING: Illegible mess.
function diceSugar( pool, shade, open )
{
	// bold			 = success
	// underline	 = explosion chain
	// strikethrough = implosion chain

	function mapper ( val, ind, arr )
	{
		let r = ``;
		let prevVal = arr[ ind - 1 ];
		
	  //prefixes
		//start Explosion
		if ( open > 0 && val == 6 && prevVal !== 6 & prevVal !== 1 )
		{	r += `__`;	}
		
		//start Implosion
		if ( open == 2 && val == 1 && prevVal !== 1 )
		{	r += `~~`;	}
		
	  //Value
		r += val >= shade ? `**${val}**` : val;
		
	  //postfixes
		//end Implosion
		if ( open == 2 && prevVal === 1 && arr[ ind - 2 ] !== 1 )
		{	r += `~~`;	}

		//end Explosion
		if ( open == 2 && prevVal === 6 && val != 6 && val != 1 )
		{	r += `__`;	}
		else if ( open == 2 && prevVal === 1 && arr[ind-2] === 6 )
		{	r += `__`;	}
		else if ( open == 1 && prevVal === 6 && val != 6 )
		{	r += `__`;	}
		
		return r;
	}
	
	return `[${ pool.map( mapper ).join( ", " ) }]`;
}

module.exports = DicePool