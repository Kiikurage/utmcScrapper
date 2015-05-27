function Tweet(id, time) {
	this.id = id;
	this.time = time;
	this.text = '';
	this.tokenIds = [];
	this.score = 0;
	Tweet.tweets[id] = this;
}

Tweet.bigramMap = [];
Tweet.tweets = [];

Tweet.getById = function(id) {
	return Tweet.tweets[id];
}

Tweet.prototype.appendToken = function(token) {
	if (this.tokenIds.length > 0) {
		var lastTokenId = this.tokenIds[this.tokenIds.length - 1],
			m = Tweet.bigramMap[lastTokenId];

		if (!m) m = Tweet.bigramMap[lastTokenId] = [];
		m[token.id] = (m[token.id] + 1) || 1;
	}

	this.tokenIds.push(token.id);
	this.text += token.text;

};

Tweet.prototype.hasBygram = function(token1Id, token2Id) {
	var result = 0,
		i = 0;
	while ((i = this.tokenIds.indexOf(token1Id, i)) != -1) {
		if (this.tokenIds[i + 1] == token2Id) result++;
		i++;
	}

	return result;
};

module.exports = Tweet;
