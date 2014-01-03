'use strict';
var request = require('request');
var querystring = require('querystring');
var FeedParser = require('feedparser');

/** Get activity

* @param {String} params.user
* @param {int} params.nbResults
* @param {timestamp} params.timestampStart
* @param {timestamp} params.timestampEnd
* @param {function} callback
**/
exports.getActivity = function(params, callback){
	var activity = [];

	var auth = getAuth();
	var domain = getDomain();
	if (!auth  || !domain){
        callback('Environnment variables not set', null);
        return;
    }
    var querystringParams = {
        providers:'issues',
        maxResults: params.nbResults
    };
    if (params.user){
        querystringParams.streams = 'user IS '+params.user;
    }
    //stringify the object right now, as we may add other &streams params
    querystringParams = querystring.stringify(querystringParams);

    if (params.timestampStart){
        if (params.timestampEnd){
            querystringParams+= '&'+querystring.stringify({streams:'update-date BETWEEN '+params.timestampStart+' '+params.timestampEnd});
        }
        else{
            querystringParams+= '&'+querystring.stringify({streams:'update-date AFTER '+params.timestampStart});
        }
    }
    else if (params.timestampEnd){
        querystringParams+= '&'+querystring.stringify({streams:'update-date BEFORE '+params.timestampEnd});
    }

    var call = {
	    url:'http://'+domain+'.atlassian.net/activity?'+querystringParams,
	    headers:{
	        'Authorization': 'Basic '+auth
	    }
	}

    console.log('Calling', call);
    request(call)
    .pipe(new FeedParser())
    .on('error', function(error) {
        console.error('Got an error parsing feed', error);
        callback(error, null);
        return;
    })
    .on('meta', function (meta) {
        console.log('===== %s =====', meta.title);
    })
    .on('readable', function () {
        var stream = this, item;
        while (item = stream.read()) {
            activity.push(processActivityEntry(item));
        }
    })
    .on('end', function(){
        console.log('======= END ==========');
        callback(null, activity);
        return true;
    });
};
function getAuth(){
	return process.env.AUTH;
}
function getDomain(){
    return process.env.ATLASSIAN_DOMAIN;
}
/**
* Input : raw RSS entry processed by feedparser
* Ouput : formatted Object
* @function
* @param {Object} entry
* @return {Object} output
**/
function processActivityEntry(entry){
    var output = {};
	var atomAuthor = entry['atom:author'];


	output.title = entry.title;
	output.link = entry.link;
	output.type = guessActivityType(entry);
    output.project = guessActivityProject(entry);

	output.author = {
		name: atomAuthor['usr:username'] && atomAuthor['usr:username']['#'],
		email : atomAuthor.email && atomAuthor.email['#']
	};
	output.description = entry.description;
	return output;
}
/** Guess activity project
*
**/
function guessActivityProject(activity){
    if (activity['activity:target'] && activity['activity:target'].title && activity['activity:target'].title['#']){
        return activity['activity:target'].title['#'].split('-').shift();
    }
    if (activity.link){
        return activity.link.match(/browse\/([^\-]*)\-/).pop();
    }
    return 'unknown';
}
/** Guess activity type, from title & categories
* @function
* @param {Object} activity raw RSS entry processed by feedparser
* @return {String} type
**/
function guessActivityType(activity){
	if (!activity.title){
		return activity.categories ? activity.categories.join(',') : 'unknown';
	}
	if (activity.title.match(/committed/)){
		return 'commit';
	}
	if (activity.title.match(/created|resolved|closed|reopened|(started progress)|(stopped progress)/)
		|| activity.title.match(/(changed the status)|(changed the Assignee)|(changed the Reporter)|(changed the Due Date)|(added the Component)/)){
		return 'workflow';
	}
	if (activity.title.match(/(commented on)/)){
		return 'comment';
	}
	return 'unknown';
}
