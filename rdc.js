const routineTest = [ 0, 1, 1, 2, 2, 3, 4, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25 ];

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

module.exports = RDC