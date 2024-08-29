const { Collection } = require( "discord.js" );

let ranDumb = [0, 0, 0, 0, 0, 0, 0];

module.exports.rollMap = new Collection();

module.exports.roll = () =>
{
	let result =  1 + Math.floor( Math.random() * 6 );
	ranDumb[result] ++;

	return result;
};

module.exports.rollPool = ( poolSize = 1, shade = 4, isOpen = false, isOminous = false ) =>
{
	let gains = 0;
	let pool = [];
	let die = 0;

	for ( s = 0; s < poolSize; s++ )
	{
		do
		{
			die = this.roll();
			gains += die >= shade;
			pool.push( die );
		}
		while ( isOpen && die === 6 )
		
		if ( isOminous && die === 1 )
		{
			die = this.roll();
			gains -= die < shade;
			pool.push( die );
		}
	}

	return [ gains, pool ];
}

module.exports.stats = () =>
{
	return ranDumb;
};

const routineTest = [ 0, 1, 1, 2, 2, 3, 4];
module.exports.RDC = ( Pool, Obstacle ) =>
{
	/*
	Challenging = # of dice rolled +1
	Difficult = # of dice rolled and below but above RoutineChallenge
	if diceRolled > routineTest.length us use diceRolled-3?
	*/

	/*	
	if ( Obstacle > Pool )
	{	return 'Challenging';	}
	else if ( Obstacle > routineTest[Pool] )
	{	return 'Difficult';	}
	else
	{	return 'Routine';	}
	*/

	if ( Obstacle > Pool )
	{	return 'Challenging';	}
	
	else if ( Pool < 7 )
	{
		if ( Obstacle == 1 && Pool == 1 )
		{	return 'Difficult or Challenging';	}
		
		else if ( Obstacle > routineTest[Pool] )
		{	return 'Difficult';	}
		
		else
		{	return 'Routine';	}
	}
	else
	{
		if ( Obstacle > Pool -3 )
		{	return 'Difficult';	}

		else
		{	return 'Routine';	}
	}
		
		
};

module.exports.reroll_traitors = ( pool = [], shade = 4, isOpen = false, isOminous = false ) =>
{
	let result = 0;
	let tally = 0;
	let newPool = [];
	
	pool.slice().forEach( die =>
	{
		if ( die < shade )
		{
			do
			{
				result = this.roll();
				newPool.push( result );
				tally += result >= shade;
			}
			while ( isOpen && result === 6 )
		} 
		else 
		{	newPool.push ( die );	}
	} );

	return [ tally, newPool ];
};

module.exports.luck = ( pool, shade ) =>
{
	let newPool = [];
	let gains = 0;
	let newRoll = 0;

	pool.slice().forEach( die =>
	{
		newPool.push( die );

		if ( die === 6 )
		{
			do
			{
				newRoll = this.roll();
				newPool.push( newRoll );
				gains += newRoll >= shade;
			}
			while ( newRoll === 6 )
		}
	} );

	return [ gains, newPool ];
}

module.exports.anth_luck = ( anth, pool, shade ) =>
{
	let rerolls = [];
	let toSplice = [];
	let gains = 0;

	pool.slice().forEach( ( die, dI, dC ) =>
		{
			if ( die === 6 && 0 < anth )
			{
				let nRoll = 0;

				do
				{
					nRoll = this.roll();
					gains += nRoll >= shade ? 1 : 0;
					rerolls.push( 6, nRoll );
				}
				while ( nRoll === 6 )

				toSplice.push( dI );
				anth--;
			}
		} );

	//openPool = openPool.concat()
	//openAmount += ;
	

	for ( i = toSplice.length - 1; i >= 0 ; i-- )
	{	pool.splice( toSplice[i], 1 );	
	}
	
	return [ anth, rerolls, toSplice.length, gains ];
};