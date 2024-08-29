const { RDC } = require( './diceRoller.js' )

//+ TODO
	//+ Optimize Fate/Luck?
	//+ Ensure Versus test are correct?

class DicePool
{
	constructor()
	{
		this.artha_amount = 0;			// number of dice added through spending Artha, don't count towards test difficulty
		this.exponent_base = 0;			// BASE number of dice rolled, Exponent of the skill/attribute rolled.
		this.fortune_pool = 0;			// results of astrological FoRKs/Help
		this.fortune_gains = 0;			// Successes gained or lost through Astrology, Rune Casting or the Nature of All Things
		this.helper_exponent = [];		// the exponents of your helpers
		this.helper_pool = [];			// how much your companions helped you
		this.isBeginnersLuck = false;	// do you actually have the right skill for the job?
		this.isCalledOn = false;		// if a Call-on Trait has been used on this roll.
		this.isFated = false;			// if a Fate point has been spent on this roll
		this.isGraced = false;			// if a Saving Grace has been employed on this roll
		this.isOpenEnded = false;		// do dice explode?
		this.ob_addition = 0;			// added to Base Obstacle after it's multiplied
		this.ob_base = 0;				// BASE obstacle of the roll
		this.ob_multiplier = 1;			// for all you double Ob needs.
		this.open_ended_pool = 0;		// dice that are open ended regardless of the base roll
		this.owner = 'Hugh Mann';		// Who rolled the dice
		this.owner_id = '1234567890';	// ID value of the owner
		this.reps = 0;					// rank in the VS Stack
		this.shade = 4;					// shade of the roll, 4 = black, 3 = grey, 2 = white
		this.total_rolled = 0;			// how many dice ultimately end up being rolled ( before explosions )
		this.unified_pool = 0;			// array of dice results, includes FoRKs, Artha Dice, Advantage Dice		
		this.unified_gains = 0;			// the number of successes gained through rolls
	}

	printPool()
	{
		let msg = `**${this.owner}** rolled ${this.total_rolled}${this.isOpenEnded ? ' Open-Ended ' : ''}${[ 0, 0, ' White', ' Grey', ' Black' ][ this.shade ]} shaded dice`;
		msg += `${this.isBeginnersLuck ? `, Beginner's Luck,` : ``}`;

		if ( this.ob_base > 0 )
		{
			msg += ` against an Ob of __${this.ob_base * this.ob_multiplier + this.ob_addition}__`;
			
			msg += `${this.ob_multiplier > 1 ? ` [${this.ob_base}×${this.ob_multiplier}${this.ob_addition != 0 ? ` +${this.ob_addition}` : ``}].` : '.'}`;
		}
		
	  // print base dice
		msg += `\nBasic dice: ${diceSugar( this.unified_pool, this.shade, this.isOpenEnded )}`;

	  // Independently Open-Ended dice
		msg += this.open_ended_pool.length > 0 ? `\nOpen-Ended: ${diceSugar( this.open_ended_pool, this.shade, 1 )}` : '';

	  // determine helper test difficulty
	  	//this.helper_pool.slice().forEach( ( helper, hI, hC ) =>
		for ( let hI = 0; hI < this.helper_pool.length; hI++ )
		{
			msg += `\nHelper ${hI}: ${diceSugar( this.helper_pool[hI], this.shade, this.isOpenEnded )}`;

			if ( this.ob_base > 0 )
			{
				msg += ` - they earned a ${RDC( this.helper_exponent[hI], this.ob_base * this.ob_multiplier + this.ob_addition )} test${this.isBeginnersLuck ? ' towards their stat.' : '.'}`;
				//If helping with a stat on an unskilled test, the [helper] does not earn a test toward their aptitude for learning the skill, they may earn a test for advancing their stat if the obstacle is appropriate.
			}
		}// );

	  // tally & output astrology results
		if ( this.fortune_pool.length > 0 )
		{
			msg += `\nFortune Dice: ${diceSugar( this.fortune_pool, this.shade, 2 )} - Their fate ${this.fortune_gains >= 0 ? `gave them` : `stole`} ${Math.abs( this.fortune_gains )} succes${this.fortune_gains != 1 ? `ses` : `s`}.`;
		}

	  // determine Main test difficulty
		let totesObstacle = this.ob_base * this.ob_multiplier + this.ob_addition;
		let diff = RDC( this.total_rolled - this.artha_amount, ( this.ob_base * this.ob_multiplier / ( this.isBeginnersLuck ? 2 : 1 ) ) + this.ob_addition );

		msg += `\n**__Results__**`;
		msg += `\n${this.unified_gains} succes${this.unified_gains == 1 ? 's' : 'ses'}`;

		if ( this.ob_base > 0 )
		{
			msg += ` against an Ob of ${totesObstacle}.`;
			msg += `\nThe test is a __${this.unified_gains >= totesObstacle ? `Triumph` : `Failure`}__ and earns a`

			msg += this.isBeginnersLuck ?	diff === 'Routine' ?	`n Advance towards learning a **new Skill**!` :
																` ${diff} test towards their **Root Stat**!` :
											` ${diff} test.`;

			//+add something about Artha dice here?
			//msg += this.artha_amount > 0 ? ` ${this.artha_amount} of which were gained by spending Artha` : '';
		}
		else
		{
			msg += this.ob_multiplier > 1 ?	` in total, effectivly __${Math.floor( ( this.unified_gains - this.ob_addition ) / this.ob_multiplier )}__ on a graduated test.` :
					  this.unified_gains > 0 ?	`` :'\nTraitorous dice! Looks like things are about to get interesting!';
		}
		return msg;
	}
}

// WARNING: Illegible mess. But it works. ( I hope )
function diceSugar( pool, shade, open )
{
	// bold			 = success
	// underline	 = explosion chain
	// strikethrough = implosion chain

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
						msg += ( pool[++d] >= shade ? `, ${pool[d]}**` : `**, ${pool[d]}` );
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

	/*function mapper ( val, ind, arr )
	{
		let r = ``;
		let prevVal = arr[ ind - 1 ];
		
	  //prefixes
		//start Explosion
		if ( open > 0 && val == 6 && prevVal !== 6 && prevVal !== 1 )
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
	
	return `[${ pool.map( mapper ).join( ", " ) }]`;*/
}

module.exports = DicePool