const { SlashCommandBuilder } = require( 'discord.js' );
const { RDC, rollMap } = require( '../../diceRoller.js' );

/*const dicePool = require( '../../dicePool.js' ); //-
let tRoll = new dicePool;
	tRoll.unified_pool = [1,2,3,4,5,6];
	tRoll.open_ended_pool = [1,2,3,4,5,6,3];
	tRoll.fortune_pool = [1,3,2,3,4,5,6,3]
	tRoll.helper_pool = [[1,2],[3,4],[5,6]];
	tRoll.unified_gains = 9;
	tRoll.total_rolled = 24;
	tRoll.fortune_gains = 2;
	tRoll.isBeginnersLuck = true;
	tRoll.ob_multiplier = 2;*/

module.exports = {
	category: 'Dice',
	cooldown: 5,

	data: new SlashCommandBuilder()
		.setName( 'versus' )
		.setDescription( 'The Vs tool' )

		.addSubcommand( subcommand =>	subcommand.setName( 'help' )
			.setDescription( `learn more about this command` )
		 )

		.addSubcommand( subcommand =>	subcommand.setName( 'clear' )
			.setDescription( `Clear all VS rolls made in this channel and start fresh.` )
		 )

		.addSubcommand( subcommand =>	subcommand.setName( 'brawl' )
			.setDescription( `Compares all vs rolls made in this channel.` )
		 )

		.addSubcommand( subcommand =>	subcommand.setName( 'bout' )
			.setDescription( `Compares the previous rolls of all mentioned users. Don't forget to include yourself!` )
				.addUserOption( option => option.setName( 'contestant1' ) 
					.setDescription( 'The first person\'s roll.' )
					.setRequired( true )
				 )
				.addUserOption( option => option.setName( 'contestant2' )
					.setDescription( `The second person's roll.` )
				 )
				.addUserOption( option => option.setName( 'contestant3' )
					.setDescription( `The third person's roll.` )
				 )
				.addUserOption( option => option.setName( 'contestant4' )
					.setDescription( `The fourth person's roll.` )
				 )
				.addUserOption( option => option.setName( 'contestant5' )
					.setDescription( `The fifth person's roll.` )
				 )
		 ),


	async execute( interaction ) {
		let msg = '';
		let clear = false;

		const subC = interaction.options.getSubcommand();

		//rollMap.set( '439480608943636481' , tRoll ); //- Testbot test roll

		switch ( subC )
		{
			case 'help':
				msg += `## Versus\n\nRolls made with the \`vs_test\` flag set to true are not saved as a user's previous roll. Instead they are all saved as a group with every other VS roll made in that channel.\n\t- All \`\\vs_test\` rolls made in a channel can be pitted against eachother with the \`\\versus brawl\` command.\n- This has the benefit of allowing one person to make multiple rolls say, for NPCs, and doesn't allow for a sneaky user to roll privately until they get a result they like.\n- However; As these rolls are not saved as your previous roll they cannot be manipulated with Artha or call-on traits, so use it wisely.\n\nIf someone made a mistake a channel's VS stack can be cleared out with the \`\\versus clear\` command.\n\nIf you want the option to spend your hard-earned Artha before the results are calculated, use the \`\\versus bout\ command. This takes the last roll mentioned users made *anywhere* and pits them against eachother.\n- If only one valid roll is received, the bot will attempt to add *your* last roll into the mix.`;
				break;

			case 'clear':
				clear = true
				break;

			case 'brawl':
				[ clear , msg ] = versus( rollMap.get( interaction.channel.id ) );
				break;

			case 'bout':
				let contestants = [];

				for ( i = 1; i < 6; i++ )
				{
					let user = interaction.options.getUser( `contestant${i}` ) ?? false;
					let roll = [];

					if ( user )
					{
						roll = rollMap.get( user.id );	

						if ( roll )
						{	contestants.push( roll ) }
						else
						{	msg += `${user.username} has not made a roll yet\n`; }
					}
				}

				if ( contestants.length < 2 && rollMap.has( `${interaction.user.id}` ) )
				{
					contestants.unshift( rollMap.get( `${interaction.user.id}` ) );
				}
				else
				{	msg += `\nYou have not made a roll yet`	}

				msg += versus( contestants )[1];
				break;
		}/**/

		if ( clear )
		{
			rollMap.delete( interaction.channel.id );
			msg += '\nThe VS Stack for this channel has been emptied.';
		}

		await interaction.reply( msg );
	},
};


function versus ( contenders = [] )
{
	let results = '';
	let worked = true;

	//-
		//contenders.push( tRoll );
	//-*/
		
	if ( contenders !== null && contenders.length > 1 )
	{
		//order by degree of success
		contenders.sort( function( a, b ) { return ( ( b.unified_gains - b.ob_addition ) / b.ob_multiplier - ( a.unified_gains - a.ob_addition ) / a.ob_multiplier ); } );

		firstDoS = contenders[0].unified_gains / contenders[0].ob_multiplier;
		secondDoS = contenders[1].unified_gains / contenders[1].ob_multiplier;

		// Output

		contenders.forEach( ( contestant, cI, cC ) =>
		{
			//+ highest DoS should not face itself
			contestant.ob_base = cI === 0 ? secondDoS : firstDoS;

			let totalOb = contestant.ob_base * contestant.ob_multiplier + contestant.ob_addition;

			results += `\n**${contestant.owner}${contestant.reps === 0 ? '' : ` ${contestant.reps}`}** rolled ${contestant.unified_gains} against an Ob of ${totalOb}`;

			if ( contestant.ob_multiplier > 1 || contestant.ob_addition > 0 )
			{
				results +=  ` [${Math.floor( 100 * contestant.ob_base ) / 100}`;
				results += contestant.ob_multiplier > 1 ? ` * ${contestant.ob_multiplier}` : '';
				results += contestant.ob_addition !== 0 ? ` + ${contestant.ob_addition}]` : ']';
			}
			
			if ( contestant.isBeginnersLuck )
			{
				let testDiff = RDC( contestant.total_rolled - contestant.artha_amount, totalOb / 2 );

				if ( testDiff === 'Routine' )
				{
					results += contestant.unified_gains >= totalOb ? `, passing by ${contestant.unified_gains - totalOb} and showing Aptitude for a **new Skill**` : `, failing, but advancing towards a **new Skill**`;
				}
				else
				{
					results += contestant.unified_gains >= totalOb ? `, passing a ${testDiff} test for the **Root Stat** by ${contestant.unified_gains - totalOb}` : `, failing a ${testDiff} test for the **Root Stat**`;
				}
			}
			else
			{
				let diff = RDC( contestant.total_rolled  - contestant.artha_amount, totalOb );
				results += contestant.unified_gains >= totalOb ? `, passing a ${diff} test by ${contestant.unified_gains - totalOb}` : `, failing a ${diff} test`;
			}

			rollMap.set( contestant.owner, contestant )
		} );	
	}
	else 
	{	
		worked = false;
		results += `\nYou need two to tango.`;
	}

		return [ worked, results ];/**/
}/**/






//+ Shade Math?
/* 
B ( B + G + 2 ) / 2
G ( B + W + 3 ) / 2
G ( G + W + 3 ) / 2

W + W = W. 
W + G = G. 
W + B = G.

G + G = G.
G + B = B.

B + W + G 	= B.
W + G + G 	= G.
W + W + G 	= G.
*/

/*
In a versus test,
Everyone has to roll before anyone knows their base Ob.
Once everyone has rolled, they each announce what degree of success they would have gotten in a graduated test ( as if their base Ob was 0, essentially ), but without rounding
Then you listen for the maximum degree of success among those you're testing against and take the maximum of those and use it as your base Ob.
Now calculate whether you succeeded or failed as normal ( any 2x/4x/8x penalty and any +Ob penalty modifying that possibly-fractional base ),
	if you succeeded, how many extra successes you got ( at this point, round down ).
Anyone who succeeded is eligible to win the versus test.
Whoever had the most extra successes actually does win, and their margin of success ( actual extra successes ) is the difference.
If you fail you count as having 0 extra successes. If there is a tie, the versus test is tied.
Note that if you fail, but your only opponent succeeds with 0 extra successes, ( TODO: this should be verified ) the versus test is still a tie.
*/