#Jira Digests

##What

Extract digests from your Jira onDemand, and send them via email


##Install

`
$ run npm install
`

##Backend

Will listen to /activity/:user

Needs to authenticate on the Jira platform. This is done through two env variables : basic http auth chain & atlassain domain


###Environnment vars

* AUTH = base64(username:password)
* ATLASSIAN_DOMAIN = example (for example.atlassian.com)

###Run

`
$ AUTH=whatever ATLASSIAN_DOMAIN=yourcompany node app.js
`



##Mailer

Designed to be called periodically.

Email is sent anonymously for the moment. As this is using [Nodemailer](https://github.com/andris9/Nodemailer), you can change the code to use a proper SMTP.

##Vars

* EMAIL : the email which will receive the digests
* USERS : the list of users whom activity you want to monitor. Use a comma as a separator
* DATE_START : Beginning of the monitored period. Can be a timestamp or a date string.
* DATE_END: Beginning of the monitored period. Can be a timestamp or a date string.

##Run

`
$ DATE_START=2013-12-31 DATE_END=2014-01-02 USERS=nicolsc,whoever EMAIL=bigbrother@example.com  ATLASSIAN_DOMAIN=myjiraondemand AUTH=base64(user:pass) node email-digest.js
`
##Dependencies

* [Email-templates](https://github.com/niftylettuce/node-email-templates) 0.0.x
* [Express](https://github.com/visionmedia/express) 3.3.x
* [Request](https://github.com/mikeal/request/) 2.30.x
* [Feed-parser](http://github.com/danmactough/node-feedparser) 0.16.x
* [Nodemailer](https://github.com/andris9/Nodemailer) 0.6.x
* [Underscore](https://github.com/jashkenas/underscore) 1.5.x
