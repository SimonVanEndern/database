function db () {
	this.db = {};
	return this;
}

db.prototype.addSchema = function (name, keys) {
	if (!keys) {
		return null;
	}

	if (!keys.constructor === Array) {
		return null;
	}

	if (!name) {
		return null;
	} else {
		this.db[name] = {
			entries: [],
			keys: keys,
			id: 1
		};
		return name;
	}
}

db.prototype.save = function (schema, object) {
	if (!schema) {
		return null;
	}

	if (!this.db[schema]) {
		return null;
	}

	var toSave = {
		id: this.db[schema]['id']++
	};
	var keys = this.db[schema]['keys'];
	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];

		if (!object[key]) {
			return null;
		}

		toSave[key] = object[key];
	}

	this.db[schema]['entries'].push(toSave);
	return toSave;
}

db.prototype.delete = function (schema, object) {
	var entries = this.db[schema]['entries'];

	var result = [];

	var hit = true;

	for(var i = 0; i < entries.length; i++) {
		var hit = true;

		var entry = entries[i];

		var keys = Object.keys(object);
		for (var j = 0; j < Object.keys(object).length; j++) {
			var key = keys[j];
			if (entry[key] !== object[key]) {
				hit = false;
				break;
			}
		}

		if (hit) {
			result.push(entry);
		}
	}

	return result;
}

db.prototype.getById = function (schema, id) {
	var entries = this.db[schema]['entries'];
	for(var i = 0; i < entries.length; i++) {
		var entry = entries[i];

		if (entry['id'] == id) {
			return entry;
		}
	}

	return null;
}

db.prototype.getByObject = function (schema, object) {
	var entries = this.db[schema]['entries'];

	var result = [];

	var hit = true;

	for(var i = 0; i < entries.length; i++) {
		var hit = true;

		var entry = entries[i];

		var keys = Object.keys(object);
		for (var j = 0; j < Object.keys(object).length; j++) {
			var key = keys[j];
			if (entry[key] !== object[key]) {
				hit = false;
				break;
			}
		}

		if (hit) {
			result.push(entry);
		}
	}

	return result;
}

db.prototype.get = function (schema, query) {
	if (!schema) {
		return null;
	}

	if (!this.db[schema]) {
		return null;
	}

	if (typeof query === "number") {
		return this.getById(schema, query);
	}

	if (Object.prototype.toString.call(query) === "[object Object]") {
		return this.getByObject(schema, query);
	}
}

db.prototype.getAll = function (schema) {
	if (!schema) {
		return null;
	}

	if (!this.db[schema]) {
		return null;
	}

	return this.db[schema]['entries'];
}

db.prototype.print = function () {
	return this.db;
}


//Testing
function test1 () {
	var testdatabase = new db();
	testdatabase.addSchema("person");
	testdatabase.save("person", {id:1, name: "Simon"});
	testdatabase.save("person", {id:2, name: "Thomas"});
	return testdatabase.getAll("person");
}

function testrunner () {
	console.log(test1());
}