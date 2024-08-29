const { Events, ActivityType } = require( 'discord.js' );

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute( client ) {
		console.log( `Ready for testing! Logged in as ${client.user.tag}` );

		client.user.setActivity( { name: `Now with Slash-Commands`, type: ActivityType.Custom } );
	},
};