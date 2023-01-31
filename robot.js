const fs = require('node:fs');
const path = require('node:path');
const config = require( './config.json' );
const prefix = config.prefix;

const DicePool = require("./dicePool");
const EventEmitter = require( "events" ).EventEmitter

class Robot extends EventEmitter
{
	constructor()
	{
		super();
		this.config = config;
		this.commands = new Map();
		this.helpLine = new Set();
		this.helpTopic = new Map();
		this.guideMap = new Map();
		this.rollMap = new Map();
		{
			let bot = this;
			
			this.utils =
			{
				roll: function roll ( exOn = 10, emph = false)
				{
					//+ better RNG?
					let die = 1 + Math.floor( Math.random() * 10 );
					bot.emit ("roll", die ); // for statistics tracking

					if ( emph && die === 1 )
					{
						die = 1 + Math.floor( Math.random() * 10 );
						bot.emit ("roll", die ); // for statistics tracking
					}

					let final = die;
					while ( die >= exOn )
					{
						die = 1 + Math.floor( Math.random() * 10 );
						bot.emit ("roll", die ); // for statistics tracking
						final += die
					}

					return final;
				},
				DicePool
			};
		}
	}

	processRequest( message )
	{
		this.commands.forEach( ( command, activator ) =>
		{
			let test = message.content.match( activator );

			if ( test )
			{
				// Log
				let logMsg = ``;

				//+ needs access to dateOfLastMessage in bot.js
				/*let nd = new Date();
				if ( dateOfLastMessage.getHours() != nd.getHours() )
				{
					logMsg += `\n - - - - - ${nd.toUTCString()} - - - - -`;
					dateOfLastMessage = nd;
				}*/

				logMsg +=`\n@${message.author.username},`;

				for ( let ln = Math.floor( message.author.username.length / 4 );  ln < 10; ln++)
					{	logMsg += `\t`;	}
				logMsg += `${message.content}`;

				fs.appendFile( 'logFile.txt', logMsg , function (err) {
					if ( err !== null )
					{
						console.log(`File Error -> ${err}`);
						throw err;
					}
				});

				command( message, test );
			}
		})
	}

	registerCommand( activator, help, command )
	{
		//magic to skip having help
		if ( !command ) 
			{	command = help; help = undefined;	}
		
		if ( typeof help === "string" )
			{	this.registerHelpLine( help )	}
		
		if ( !( typeof activator === "string" || activator instanceof RegExp ) )
		{
			//something went wrong.
			//+code error throwing later
			return
		}

		activator = this.makeRegExp( activator );
		this.commands.set( activator, command );
	}

	registerGuide ( topic, content )
	{
		//add type checks
		this.guideMap.set( topic, content );
		//console.log (`guide: ${topic}` );
	}

	makeRegExp( activator )
	{
		let source = "";
		let flags = "i";
		if ( typeof activator === 'string' )
		{
			source = activator
		}
		else if ( activator instanceof RegExp )
		{
			source = activator.source;
			flags = activator.flags;
		}

		console.log( `${source}`); //`^\\s*(?:${prefixes.join('|')})\\s*(?:${source})` );
		return new RegExp( `^\\s*(?:${prefix})\\s*(?:${source})`, flags )
		//return new RegExp( `^\\s*(?:${prefixes.join('|')})\\s*(?:${source})`, flags )
	}

	registerHelpLine( help )
	{
		// add checks for type
		this.helpLine.add( help );
	}

	registerHelpTopic( topic, content )
	{
		//add type checks
		this.helpTopic.set( topic, content );
		//console.log( `topic: ${topic}` );
	}

	load( path )
	{
		console.log("Loading files from " + path);

		if ( fs.existsSync( path ) )
		{
			fs.readdirSync( path ).map( file => this.loadFile( path, file ) );
		}
	}
	
	loadFile( filepath, filename )
	{
		const ext = path.extname( filename );
		const fullname = path.resolve (path.join( filepath, filename ) );
		
		// Only load javascript and native addons (crazy buggers)
		if ( [ '.js', '.node' ].indexOf( ext ) === -1 )
			{	return	};
		
		try
		{
			const script = require( fullname )
			
			if ( typeof script === 'function' ) 
			{
				script( this );
			}
			else
			{
				console.warn( `Expected ${ fullname } to assign a function to module.exports, got ${ typeof script }` );
			}
		}
		catch (error)
		{
			console.error( `Failed to load ${ fullname }: ${ error.stack }` );
			process.exit(1);
		}
	}
}

module.exports = Robot;