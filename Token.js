var Tweet = require('./Tweet.js');

function Token(tweetTime, tweetId, text, type) {
	this.text = text;
	this.id = Token.texts.indexOf(text);
	if (this.id == -1) {
		this.id = Token.texts.push(text) - 1;
		Token.tokens[this.id] = this;
	}
	this.type = type;

	this.tweet = Tweet.getById(tweetId);
	if (!this.tweet) {
		this.tweet = new Tweet(tweetId, tweetTime);
	}

	this.tweet.appendToken(this);
}

Token.tokens = [];
Token.texts = [];

Token.initWithCSVRow = function(row) {
	return new Token(row[0], row[1], row[2], row[3]);
};

module.exports = Token;
