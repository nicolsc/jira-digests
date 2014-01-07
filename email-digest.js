'use strict';

var _ = require('underscore');
var nodemailer = require('nodemailer');
var transport = nodemailer.createTransport('direct');
var emailTemplates = require('email-templates');
var jira = require('./modules/jira');
if (process.env.NODE_DEBUG && process.env.NODE_DEBUG.match(/jira/)){
    console.log('env', process.env);
}
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
		debug('=== DONE ===');

	});
	_.each(users, function(user){
        params.user = user;
		jira.getActivity(params, function(err, activity){
			debug('* processed');
			if (err){
				debug('An error occured', err);
                sendErrorReport({user:user, type:'error', details:err});
				return callback();
			}
			if (!activity || !activity.length){
				debug(user || 'Global', 'no activity');
                sendErrorReport({user:user, type:'no-activity'});
				return callback();
			}
			sendReport({
				user:user,
				types: _.countBy(activity,'type'),
                projects: _.countBy(activity, 'project'),
				list: activity
			});

			return callback();
		});
	});
    function sendErrorReport(data){
        var subject;
        var content = '';
        switch( data.type){
        case 'no-activity':
            subject = '☹ Jira - '+data.user+' - no activity';
            break;
        case 'error':
            subject = '☹ Jira - '+data.user+' - error';
            content = 'Details : '+data.msg;
            break;
        default:
            console.error('Unexpected error type ~'+data.type+'~ // Report not send');
            return false;
        }
        sendEmail('Jira Digests <jira@example.com>',process.env.EMAIL,subject,content,content);


    }
	function sendReport(data){
		var subject = '☺ Jira Digest - '+data.user;
		template('activity-report', {activity:data}, function(err, html, text) {
			if (err){
				console.log(err);
			}
			else
			{
                // console.log(html);
                sendEmail('Jira Digests <jira@example.com>',process.env.EMAIL,subject,html,text);
			}
		});
	}
    function sendEmail(from,to,subject,html,text){
        if (!to){
            console.error('No process.env.EMAIL set', 'unable to send email');
            return false;
        }
        transport.sendMail({
            from: from,
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
    function debug(){
        if (process.env.NODE_DEBUG && process.env.NODE_DEBUG.match(/jira/)){
            console.log.apply(console, arguments);
        }
    }
});
