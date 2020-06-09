const fs = require("fs")
const path = require("path")
const config = require("./config.json");
const prefixes = config.prefixes.map( ( prefix ) => prefix.replace( /[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&' ) );
const RDC = require("./rdc")

const DicePool = require("./dicePool");
//const Storage = require("./storage");
const EventEmitter = require("events").EventEmitter;
//const Enmap = require("enmap");

console.log(prefixes);

class Robot extends EventEmitter
{
	constructor()
	{
		super();
		this.config = config;
		this.commands = new Map();
		this.helpLine = new Set();
		this.helpTopic = new Map();
		//this.storage = new Storage();
		this.rollMap = new Map();
		{
			let bot = this;
			
			this.utils =
			{
				roll: function roll ()
				{
					//TODO: better RNG?
					let roll = 1 + Math.floor( Math.random() * 6 );
					bot.emit ("roll", roll ); // for statistics tracking
					return roll;
				},
				RDC,
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
				fs.appendFile( 'logFile.txt', `\n@${message.author.username},\t\t#${message.channel.name}\t\t\t${message.content}`, function (err) 
				{
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
			{	command = help; help = undefined	}
		
		if ( typeof help === "string" )
			{	this.registerHelpLine( help )	}
		
		if ( !( typeof activator === "string" || activator instanceof RegExp ) )
		{
			//something went wrong.
			//code error throwing later
			return
		}

		activator = this.makeRegExp( activator );
		this.commands.set( activator, command );
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

		//console.log( `^\\s*(?:${prefixes.join('|')})\\s*(?:${source})` );
		return new RegExp( `^\\s*(?:${prefixes.join('|')})\\s*(?:${source})`, flags )
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