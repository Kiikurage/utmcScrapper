var fs = require('exfs'),
	Token = require('./Token.js'),
	Tweet = require('./Tweet.js');

var INPUT_PATH = './tokenized.csv',
	OUTPUT_PATH_RESULT = './result2.dat',
	OUTPUT_PATH_TOKEN = './generator-token.csv',
	OUTPUT_PATH_BYGRAMCOUNT = './generator-bygramcount.csv';

function loadCSV(path) {
	var data = fs.readFileSync(path, 'utf-8')
		.split('\n')
		.map(function(line) {
			return line.split(',');
		});

	data.forEach(function(csvRow) {
		Token.initWithCSVRow(csvRow);
	});

	Tweet.tweets.forEach(function(tweet) {
		new Token(tweet.time, tweet.id, '。', '文末');
	});
}

function saveCSV(data, path) {
	var text = data.map(function(row) {
		return row.join(',');
	}).join('\n');
	fs.writeFileSync(path, text, 'utf-8');
}

function training(data) {
	fs.writeFileSync(OUTPUT_PATH_TOKEN, Token.texts.join('\n'), 'utf-8');

	//バイグラム毎の登場回数を数える
	saveCSV(Tweet.bigramMap, OUTPUT_PATH_BYGRAMCOUNT);
}

function reverse(arr) {
	return arr.reduce(function(prev, el) {
		prev.unshift(el);
	}, []);
}

function createLine() {
	var tokenId = parseInt(Math.random() * Token.texts.length, 10),
		maxBigramCount = 0,
		line = '',
		i, j, nextTokenId;


	for (i = 0; i < 10; i++) {
		console.log('%d >> %s', tokenId, Token.texts[tokenId]);
		line += Token.texts[tokenId];

		maxBigramCount = 0;
		if (!Tweet.bigramMap[tokenId]) break;

		for (j = 0; j < Token.texts.length; j++) {
			if (Tweet.bigramMap[tokenId][j] >= maxBigramCount) {
				maxBigramCount = Tweet.bigramMap[tokenId][j];
				nextTokenId = j;
			}
		}

		if (nextTokenId === tokenId) break;
		tokenId = nextTokenId;
	}

	return line;
}

//pivotTweetに対する共起回数を計算する
function calcTweetScore(pivotTweet, MAX_TIME_SPAN) {
	MAX_TIME_SPAN = MAX_TIME_SPAN || 30 * 1000 //同様の内容のツイートは前後30秒以内に固まっていると仮定

	var tweets = Tweet.tweets,
		tweet;

	for (var i = 0; i < tweets.length; i++) {
		tweet = tweets[i];
		if (Math.abs(tweet.time - pivotTweet.time) > MAX_TIME_SPAN) continue;

		for (var j = 0; j < pivotTweet.tokenIds.length; j++) {
			if (Token.tokens[pivotTweet.tokenIds[j]].type == '記号') continue;
			if (tweet.tokenIds.indexOf(pivotTweet.tokenIds[j]) !== -1) tweet.score++;
		}
	}

	return;
};

function main() {
	loadCSV(INPUT_PATH);

	var result = '',
		primaryTweets = [],
		primaryTweet,
		BORDER = Tweet.tweets.length / 3 * 2;

	while (true) {
		if (Tweet.tweets.length < BORDER) break;
		// for (var c = 0; c < 30; c++) {

		//スコアのリセット
		for (var i = 0; i < Tweet.tweets.length; i++) {
			Tweet.tweets[i].score = 0;
		}

		//単語の共起回数をとる
		for (var i = 0; i < Tweet.tweets.length; i++) {
			calcTweetScore(Tweet.tweets[i]);
		}

		//長いツイートが好評化されるのを防ぐ
		for (var i = 0; i < Tweet.tweets.length; i++) {
			Tweet.tweets[i].score /= Tweet.tweets[i].tokenIds.length;
		}

		//共起回数で並べ替えてトップを表示
		var primaryTweet = Tweet.tweets
			.slice(0)
			.sort(function(a, b) {
				return a.score > b.score ? -1 : a.score == b.score ? 0 : 1
			})[0];
		// console.log('BEST >>');
		// console.log(primaryTweet.score + ' : ' + primaryTweet.text);
		if (primaryTweet.score < 3) break;
		primaryTweets.push(primaryTweet);

		//トップツイートに対する共起回数を取得
		for (var i = 0; i < Tweet.tweets.length; i++) {
			Tweet.tweets[i].score = 0;
		}
		calcTweetScore(primaryTweet, 24 * 60 * 60 * 1000);

		//共起回数で並べ替えて表示
		// console.log('RELATED >>');
		// Tweet.tweets
		// 	.slice(0)
		// 	.sort(function(a, b) {
		// 		return a.score > b.score ? -1 : a.score == b.score ? 0 : 1
		// 	})
		// 	.splice(0, 20)
		// 	.forEach(function(tweet) {
		// 		console.log('  %d : %s', tweet.score, tweet.text);
		// 	});

		//共起回数が一定数以上だと、同一内容のツイートとみなして削除
		for (i = 0; i < Tweet.tweets.length; i++) {
			if (Tweet.tweets[i] !== primaryTweet &&
				Tweet.tweets[i].score < 6) continue;
			Tweet.tweets.splice(i, 1);
			i--;
		}

	}

	primaryTweets.sort(function(a, b) {
		return a.time < b.time ? -1 : a.time == b.time ? 0 : 1;
	});

	var result = '';

	for (i = 0; i < primaryTweets.length; i++) {
		result += primaryTweets[i].text + '\n';
	}

	fs.writeFileSync(OUTPUT_PATH_RESULT, result, 'utf-8');

	// var lines = [];
	// for (var i = 0; i < 20; i++) {
	// 	lines.push(createLine());
	// }
	// console.log(lines.join('\n'));

}

main();
