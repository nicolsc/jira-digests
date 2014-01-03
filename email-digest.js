'use strict';

var _ = require('underscore');
var request = require('request');
var nodemailer = require('nodemailer');
var transport = nodemailer.createTransport('direct');
var emailTemplates = require('email-templates');
var jira = require('./modules/jira');

emailTemplates(__dirname+'/templates', function(err, template) {

	if (err){
		console.error('Unable to load templates', err);
		process.exit(0);
	}
    //Users to fetch, defaults to global activity
    var users = process.env.USERS ? process.env.USERS.replace(/ /g,'').split(',') : [''];

    var params = {
        nbResults: process.env.NB_RESULTS || 10
    };
    if (process.env.DATE_START){
        try{
            params.timestampStart = new Date(process.env.DATE_START).getTime();
        }
        catch(e){
            console.error('Invalid DATE_START', process.env.DATE_START, e.getMessage());
        }
    }
	if (process.env.DATE_END){
        try{
            params.timestampEnd = new Date(process.env.DATE_END).getTime();
        }
        catch(e){
            console.error('Invalid DATE_END', process.env.DATE_END, e.getMessage());
        }
    }

	var callback = _.after(users.length, function(){
		console.log('=== DONE ===');

	});
	_.each(users, function(user){
        params.user = user;
		jira.getActivity(params, function(err, activity){
			console.log('* processed');
			if (err){
				console.error('An error occured', err);
				return callback();
			}
			if (!activity || !activity.length){
				console.log(user || 'Global', 'no activity');
				return callback();
			}
			//console.log(JSON.stringify(_.countBy(activity, 'project')));
            //return;
			sendEmail({
				user:user,
				types: _.countBy(activity,'type'),
                projects: _.countBy(activity, 'project'),
				list: activity
			});

			return callback();
		});
	});

	function sendEmail(data){
		var subject = '☺ Jira Digest - '+data.user;
		var to = process.env.EMAIL;
		if (!to){
			console.error('No process.env.EMAIL set', 'unable to send email');
			return false;
		}
		template('activity-report', {activity:data}, function(err, html, text) {
			if (err){
				console.log(err);
			}
			else
			{
				// console.log(html);
				transport.sendMail({
				    from: 'Jira Digests <jira@example.com>',
					to: to,
					subject: subject,
					html: html,
					text: text
				},function(error, response) {
					if(error){
						console.error('Email not sent', error);
					}
					else{
						console.log('Email sent', response);
					}
				});
			}
		});
	}
});
