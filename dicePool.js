class DicePool
{
  // Constructor
	constructor( rl = 0, kp = 0 )
	{
		this.bonus = 0;
		this.explodeOn = 10;
		this.emphasis = false;
		this.keepHigh = true;
		this.kept = 0;
		this.keptDice = kp;
		this.oopsed = false;
		this.owner = 'Hugh Mann';
		this.pool = [];
		this.raises = 0;
		this.rolledDice = rl;
		this.TN = 0;
	}

  // DiePool.printPool()
	printPool( wordy = true )
	{
		let msg = `${this.owner} rolled **`;
		msg += this.bonus != 0 ? `${this.kept + this.bonus}** (${this.kept} + ${this.bonus})` : `${this.kept}**`;		

		if ( wordy )
		{
			msg += this.explodeOn > 10 ? ` Unskilled` : '';
			msg += this.explodeOn < 10 ? ` with Mastery` : '';
			msg += this.emphasis ? ` with Emphasis` : ``;
			msg += this.keepHigh ? `` : ` keeping low`;

			if ( this.TN != 0 )
			{
				msg += ` against TN ${this.TN + this.raises * 5}`;
				if ( this.raises != 0)
				{
					msg += ` (${this.TN} + ${this.raises} raises)`;
				}
			
				if ( this.kept >= this.TN + this.raises * 5 )
				{
					msg += `\n**Success!** you passed by ${ this. kept - ( this.TN + this.raises * 5 ) }`
				}
				else
				{
					msg += `\n**Failure!** you missed by ${ ( this.TN + this.raises * 5 ) - this. kept }`;
				}
			}

			msg += '\n[ **';
			for ( let k = 0; k < this.keptDice; k++ )
			{
				msg += `${this.pool[k]}`;

				msg += k + 1 < this.pool.length ? ',' : '';
			}

			msg += `**`;

			for ( let r = this.keptDice; r < this.pool.length; r++ )
			{
				msg += `${this.pool[r]}`;
				msg += r + 1 < this.pool.length ? ',' : '';
			}

			msg += ` ]`;

			msg += this.oopsed ? '\n__this roll has been modified__' : '';
		};

		return msg;
	}
}

module.exports = DicePool