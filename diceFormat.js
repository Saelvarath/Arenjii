function diceSugar (pool, shade, open)
{
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

module.exports = diceSugar

/*/ Spice King Version
function diceSugar (pool, shade, open)
{
	function mapper ( val, ind, arr )
	{
		//open ended
		if ( open > 0 )
		{
			let r = val;

			if ( arr[ind-1] !== 6 && val === 6 )
			{
				r = "__**6"
			}
			else if ( arr[ind-1] == 6 && val !== 6 )
			{
				r = val + "**__"
			}

			// Astro
			if ( open === 2)
			{
				if ( arr[ind-1] !== 1 && val === 1 )
				{
					r = "~~1"
				}
				else if ( arr[ind-1] == 1 && val !== 1 )
				{
					r = val + "~~"
				}
			}

			return r
		}

		return val < shade ? val : `**${val}**`
	}

	return `[${ pool.map( mapper ).join( ", " ) }]`;
}
*/

/*/OLD version
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
		  // if dice explode
			if ( open != 0 && ( pool[d] === 6 || pool[d] === 1 ) )
			{
				if ( pool[d]  === 6 )
				{
					msg += ( d === 0 ?`__**6` : 
									`, __**6` );

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
						msg += ( pool[++d] >= shade ? `, ${pool[d]}**` :
													`**, ${pool[d]}`);
					}

					msg += '__';
				}
			  // if 1s explode
				else if ( open == 2 && pool[d] === 1 && d != pool.length )
				{
					msg += ( d === 0 ?	  `~~${pool[d]}, ${pool[++d]}~~` : 
										`, ~~${pool[d]}, ${pool[++d]}~~` );
				}
			  // if 1s don't explode
				else
				{
					msg += d === 0 ? 	pool[d]:
									`, ${pool[d]}`;
				}
			}
			//is a success
			else if ( pool[d] >= shade )
			{
				msg +=  d === 0 ?	`**${pool[d]}**` :
									`, **${pool[d]}**`;
			}
			else
			{
				msg +=  d === 0 ?	pool[d] :
									`, ${pool[d]}`;
			}
	  }
	  msg += ']';
	}

	return msg;
}*/