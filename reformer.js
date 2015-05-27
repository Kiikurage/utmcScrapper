var fs = require('exfs'),
	MeCab = new require('mecab-async');

var INPUT_PATH = './tweets.csv',
	OUTPUT_PATH1 = './reformed.csv',
	OUTPUT_PATH2 = './tokenized.csv';

function loadCSV(path) {
	return fs.readFileSync(path, 'utf-8')
		.split('\n')
		.map(function(line) {
			return line.split(',');
		});
}

function saveCSV(data, path) {
	var text = data.map(function(row) {
		return row.join(',');
	}).join('\n');
	fs.writeFileSync(path, text, 'utf-8');
}

function reform(data) {
	data.forEach(function(row) {
		var text = row[1] || '';
		if (text) {
			text = text
				.replace(/http[a-zA-Z0-9_\-:\.\/]+/, '') //URL
				.replace(/@[a-zA-Z0-9_]+/g, '') //mention
				.replace(/#[a-zA-Z0-9_]+/g, '') //hashtag
				.replace(/RT : /g, '') //RT
				.replace(/\s/g, '') //invisible character
				.replace(/&[a-zA-Z0-9_]+;/g, ''); //absolute refarence character
		}
		row[1] = text;
	})

	var i, max;
	for (i = 0, max = data.length; i < max; i++) {
		if (data[i] && data[i][1] !== '') continue;

		data.splice(i, 1);
		i--;
		max--;
	}
}

function tokenize(data, callback) {
	var mecab = new MeCab();

	var result = [],
		max = data.length,
		loop = function(i) {
			mecab.parse(data[i][1], function(err, tokenInfos) {
				tokens = tokenInfos.reduce(function(prev, tokenInfo) {
					// if (tokenInfo[1].match(/(助詞|助動詞)/) && prev.length > 0) {
					// 	prev[prev.length - 1][2] += tokenInfo[0];
					// } else {
					prev.push([data[i][0], i, tokenInfo[0], tokenInfo[1]]);
					// }
					return prev;
				}, []);
				result.push.apply(result, tokens);

				i++;
				if (i < max) {
					setTimeout(function() {
						loop(i);
					});
				} else {
					setTimeout(function() {
						callback(result);
					});
				}
			});

		};

	loop(0);
}

function main() {
	data = loadCSV(INPUT_PATH);
	reform(data);
	saveCSV(data, OUTPUT_PATH1);
	tokenize(data, function(tokens) {
		saveCSV(tokens, OUTPUT_PATH2);
	});
}

main();
