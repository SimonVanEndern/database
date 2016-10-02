(function() {
	function db() {
		this.db = {};
		return this;
	}

	db.prototype.addSchema = function(name, keys) {
		if (!keys) {
			return null;
		}

		if (!keys.constructor === Array) {
			return null;
		}

		if (!name) {
			return null;
		}

		name = name.toLowerCase();

		if (this.db[name]) {
			return null;
		} else {
			for (var i = 0; i < keys.length; i++) {
				keys[i] = keys[i].toLowerCase();
			}

			this.db[name] = {
				entries: [],
				keys: keys,
				id: 1
			};
			return name;
		}
	}

	db.prototype.save = function(schema, object) {
		if (!schema) {
			return null;
		}

		schema = schema.toLowerCase();

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

	db.prototype.saveAll = function(schema, objects) {
		if (!schema) {
			return null;
		}

		if (!this.db[schema]) {
			return null;
		}

		if (Object.prototype.toString.call(objects) !== "[object Array]") {
			return null;
		}

		var savedObjects = [];
		for (var i = 0; i < objects.length; i++) {
			savedObjects.push(this.save(objects[i]));
		}
		return savedObjects;
	}

	db.prototype.delete = function(schema, object) {
		var entries = this.db[schema]['entries'];

		var result = [];

		var hit = true;

		for (var i = 0; i < entries.length; i++) {
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

	db.prototype.getById = function(schema, id) {
		var entries = this.db[schema]['entries'];
		for (var i = 0; i < entries.length; i++) {
			var entry = entries[i];

			if (entry['id'] == id) {
				return entry;
			}
		}

		return null;
	}

	db.prototype.getByObject = function(schema, object) {
		var entries = this.db[schema]['entries'];

		var result = [];

		var hit = true;

		for (var i = 0; i < entries.length; i++) {
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

	db.prototype.get = function(schema, query) {
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

	db.prototype.getAll = function(schema) {
		if (!schema) {
			return null;
		}

		if (!this.db[schema]) {
			return null;
		}

		return this.db[schema]['entries'];
	}

	db.prototype.print = function() {
		return this.db;
	}

	db.prototype.sql = function(statement) {
		//Only one single statement allowed so far

		statement = statement.replace(/\s{2,}/g, ' ');

		if (statement.match(/;$/g)) {
			if (statement.match(/;/g).length > 1) {
				return null;
			}
			statement = statement.replace(";", "");
		}


		if (statement.match(/create/gi)) {
			var query = parseCreateStatement(statement);
			return this.addSchema(query.schemaName, query.schema);
		}

		if (statement.match(/insert/gi)) {
			debugger;
			var query = parseInsertStatement(statement);
			return this.save(query.schemaName, query.toInsert);
		}
	}

	parseCreateStatement = function(statement) {
		var regExTableName = /(create\stable\s)([a-z]*)(\s\()/gi;

		var tableName = regExTableName.exec(statement)[2];

		var regExColumnStatement = /(\(\s*)(.*?)(\)$)/g;

		var columnStatement = regExColumnStatement.exec(statement)[2] + ',';

		var regExColumnLines = /([a-z]*.*?,)/g;

		var columnLines = getCommaSeparatedFromString(columnStatement, false, true);

		var columns = [];
		for (var i = 0; i < columnLines.length; i++) {
			var line = columnLines[i];
			if (line.indexOf(' ') != -1) {
				line = line.substring(0, line.indexOf(' '));
			}
			columns.push(line.toLowerCase());
		}

		return {
			schemaName: tableName,
			schema: columns
		}
	}

	parseInsertStatement = function(statement) {
		var regExStatement = /(insert\sinto\s)([a-z]*)(\s*\()(.*?)(\)\s*values\s*\()(.*)(\)$)/gi;

		var result = regExStatement.exec(statement);

		var tableName = result[2];
		var columnStatement = result[4] + ",";
		var valueStatement = result[6] + ",";

		var columns = getCommaSeparatedFromString(columnStatement, false, true);
		var values = getCommaSeparatedFromString(valueStatement, true, false);

		if (columns.length !== values.length) {
			return null;
		}

		var object = {};
		for (var i = 0; i < columns.length; i++) {
			object[columns[i]] = values[i];
		}

		return {
			schemaName: tableName,
			toInsert: object
		}

	}

	getCommaSeparatedFromString = function(string, convertInt, returnLowerCase) {
		var result = [];

		//TODO: If the value contains a comma, there is an error currently
		var regExMatchCommaSeparated = /([a-z]*.*?,)/g;

		var match = regExMatchCommaSeparated.exec(string);
		while (match != null) {
			var tmp = match[1].trim();
			//TODO make this properly
			var tmp = tmp.replace(",", "");
			tmp = tmp.replace('"', "");
			tmp = tmp.replace("'", "");
			if (convertInt === true && !isNaN(parseInt(tmp))) {
				tmp = parseInt(tmp);
			}
			if (returnLowerCase === true) {
				tmp = tmp.toLowerCase();
			}
			result.push(tmp);
			match = regExMatchCommaSeparated.exec(string);
		}

		return result;
	}

	window.db = db;
})();


//Testing

function assertion(testdata) {
	this.testdata = testdata;
	this.toEqual = function(value) {
		if (testdata !== value) {
			return log(testdata, value);
		}
		return true;
	}

	this.notToEqual = function(value) {
		if (testdata === value) {
			return log(testdata, value);
		}
		return true;
	}
	this.toHaveLength = function(value) {
		if (testdata.length !== value) {
			return log(testdata, value);
		}
	}

	function log(testdata, value) {
		console.error("Mismatch", testdata, value);
		return false;
	}
}

function expect(testdata) {
	return new assertion(testdata);
}

function test(name, test) {
	console.log(name);
	test();
}

function randomString(size) {
	var string = "";
	for (var i = 0; i < size; i++) {
		var char = String.fromCharCode(Math.floor(Math.random() * 26) + 65);
		if (Math.random() > 0.5) {
			char = char.toLowerCase();
		}
		string = string + char;
	}
	return string;
}

function test1() {
	var testdatabase = new db();

	test("Testing of Adding a Schema", function() {
		var schemaName = randomString(10);
		var schema = testdatabase.addSchema(schemaName, ["id", "name"]);

		expect(schema).toEqual(schemaName.toLowerCase());
	});

	test("Testing insertion of data into a Schema", function() {
		var schemaName = randomString(10);
		var schema = testdatabase.addSchema(schemaName, ["id", "name"]);

		var person1 = testdatabase.save(schema, {
			id: 1,
			name: "Simon"
		});
		var person2 = testdatabase.save(schema, {
			id: 2,
			name: "Thomas"
		});

		expect(person1).notToEqual(null);
		expect(person2).notToEqual(null);

		var allPersons = testdatabase.getAll(schema);

		expect(allPersons).toHaveLength(2);
	});

	test("Test sql create table statement", function() {
		var tableName = randomString(10);
		var SQL = "CREATE TABLE " + tableName + " (id INT not null, name varchar(13))";

		var schema = testdatabase.sql(SQL);

		expect(schema).toEqual(tableName.toLowerCase());
	});

	test("Test sql insert into table statement",function () {
		var tablename = randomString(10);

		var column1 = randomString(5);
		var column2 = randomString(7);

		var value1 = randomString(4);
		var value2 = 4;

		var schema = testdatabase.addSchema(tablename, new Array(column1, column2));

		var SQL = "INSERT INTO " + tablename + " (" + column1 + ", " + column2 + ") VALUES (" + value1 + ", " + value2 + ");";

		var savedObject = testdatabase.sql(SQL);

		expect(savedObject[column1.toLowerCase()]).toEqual(value1);
		expect(savedObject[column2.toLowerCase()]).toEqual(value2);
	});
}

(function testrunner() {
	test1();
})();