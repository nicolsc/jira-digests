'use strict';

// web.js
var express = require('express');
var jira = require('./modules/jira');

var app = express();

app.get('/', function(req, res) {
    res.send('Welcome');
});


app.get('/activity', function(req, res){
    getActivity(null, req, res);
});

app.get('/activity/:user', function(req, res){
    getActivity(req.params.user, res, res);
});


function getActivity(user, req, res){
    var nbResults = process.env.NB_RESULTS || 100;
    jira.getActivity(user,nbResults, function(err, activity){
        if (err){
            res.status(500);
            res.format({
                json:function(){
                    return res.json({err:err});
                },
                html:function(){
                    return res.send('<h1>An error occured</h1>'+err);
                }
            });
            return false;
        }
        res.format({
            json:function(){
                return res.json({data:activity});
            },
            html:function(){
                res.header('Content-Type', 'text/json');
                return res.json(activity);
                var htmlOutput = activityToHTML(activity);
                return res.send(htmlOutput);
            }
        });
    });
}

function activityToHTML(data){
    var output = '<ul>';

    for (var idx in data){
        output += '<li>'+data[idx].title+'<br />'+data[idx].description+'</li>';
    }
    output += '</ul>';
    return output;
}



var port = process.env.PORT || 40110;
app.listen(port, function() {
    console.log('Listening on ' + port);
});
