const EventEmitter = require("events").EventEmitter;

class Storage extends EventEmitter {
	constructor()
	{
		super();
	}
}
module.exports = Storage;