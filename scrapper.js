var fs = require('exfs'),
	twitter = require('twitter');

var Config = JSON.parse(fs.readFileSync('./config.json'));

var MAX_TIME_RANGE = +(new Date(2015, 5 - 1, 1, 18, 0, 0)), //@TODO
	OUTPUT_PATH = './tweets.csv'

var twit = new twitter(Config.twitter);

function getTweets(callback, maxId) {
	var option = {
		q: '#utmc1',
		count: 200,
		result_type: 'recent'
	};

	if (maxId) {
		console.log('maxId: %d', maxId);
		option.max_id = maxId
	}

	twit.get('search/tweets', option, function(err, result, response) {

		if (err) {
			console.log('ERROR: ');
			console.log(err);
			return;
		}

		var tweetTexts = [],
			statuses = result.statuses,
			status,
			finishFlag = false,
			time,
			maxId,
			i;

		for (i = 0; i < statuses.length; i++) {
			status = statuses[i];

			var data = [],
				time = +(new Date(status.created_at));

			if (time < MAX_TIME_RANGE) {
				finishFlag = true;
				break;
			}

			data.push(time);
			data.push(status.text.replace(/[\n,]/g, ''));
			lastTime = time;
			maxId = status.id - 1;
			tweetTexts.push(data.join(','));
		}


		if (finishFlag) {
			fs.appendFileSync(OUTPUT_PATH, tweetTexts.join('\n'), 'utf-8');
			callback();
		} else {
			fs.appendFileSync(OUTPUT_PATH, tweetTexts.join('\n') + '\n', 'utf-8');
			setTimeout(function() {
				getTweets(callback, maxId);
			});
		}
	});
}


function main() {
	fs.writeFileSync(OUTPUT_PATH, '', 'utf-8');
	getTweets(function() {
		console.log('end');
	});
}

main();
