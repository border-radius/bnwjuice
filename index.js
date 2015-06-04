var request = require('request');
var async = require('async');
var fs = require('fs');

var file = 'bnw-' + new Date().getTime() + '.txt';

console.log('Writing to the file: ' + file);

var queue = async.queue(function (url, next) {

  if (typeof url === 'number') {
    queue.push(url + 1);
    url = 'https://bnw.im/api/show?page=' + url;
  } else {
    url = 'https://bnw.im/api/show?replies=1&message=' + url;
  }

  request({
    url: url,
    json: true
  }, function (error, response, json) {
    console.log('Fetched', url);

    if (!error && response.statusCode !== 200) {
      error = new Error('HTTP ' + response.statusCode + ': ' + url);
    }

    if (error) {
      console.error('>', error);
      return next();
    }

    var text = [];

    if (json.messages) {
      text = json.messages.map(function (message) {
        queue.push(message.id);
        return message.tags.join(' ') + '\n' + message.text;
      });
    } else if (json.replies) {
      text = json.replies.map(function (reply) {
        return reply.text;
      });
    } else {
      console.log('No data found:', url);
    }

    fs.appendFile(file, text.join('\n\n'), {
      encoding: 'utf8'
    }, next);
  });
}, 10);

queue.push(1);