const full = "█";
const half = "▌";

module.exports = ( robot ) =>
{
	// const rolls = [];
	const rollCount = new Array(11).fill(0);

	robot.registerCommand( /dicedump\s+(\d+)/i, ( message, test ) =>
	{
		let dice = Number( test[1] );
		if ( dice > 1000000 ) {
			message.reply("why are you trying to dump over a million dice?!?");
			return
		}
		message.reply( `Dumping ${dice} dice.` )
		for ( let index = 0; index < dice; index++ ) {
			robot.utils.roll();
		}
	});

	robot.on( 'roll', ( roll ) =>
	{
		// rolls.push(roll);
		rollCount[roll]++;
	});

	robot.registerCommand( /stats/i, `\`${ robot.config.prefix }stats\` prints out dice statistics`, ( message ) => 
	{
		// console.log(rolls);
		// console.log(rollCount);
		let lines = [];
		let largest = 0;
		rollCount.find( ( num ) => 
		{
			if ( num>largest ) 
				{	largest = num;	}
		});
		let fullBar = largest / 40
		for ( let index = 1; index < rollCount.length; index++ ) {
			const count = rollCount[index];
			let bar = full.repeat( count / fullBar ) + ( Math.round( count / fullBar - Math.floor( count / fullBar ) ) === 1 ? half : "" );
			// console.log(bar)
			bar = bar.padEnd(40, " ");
			// console.log(bar)
			lines[index] = `${index} | ${bar} | ${count}`;
			// console.log(lines[index])
		}
		// console.log(lines)
		message.channel.send(
			"```\n" +
			"		 Dice Stats\n" +
			lines.join("\n") +
			"\n\n	Total dice rolled: " + rollCount.reduce( ( a, c ) => {	return a + c	} ) + "\n```"
		)
	});
}