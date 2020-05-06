function diceSugar (pool, thresh, open)
{
	function mapper (v, i, a)
	{
		if (open > 0)
		{
			let r = v;
			
			if (a[i-1] !== 6 && v === 6)
			{
				r = "__**6"
			} else if (a[i-1] == 6 && v !== 6)
			{
				r = v + "**__"
			}
			if (open === 2)
			{
				if (a[i-1] !== 1 && v === 1)
				{
					r = "~~1"
				}
				else if (a[i-1] == 1 && v !== 1)
				{
					r = v + "~~"
				}
			}
			return r
		}
		return v < thresh ? v : `**${v}**`
	}
	return `[${ pool.map( mapper ).join( ", " ) }]`;
}

module.exports = diceSugar