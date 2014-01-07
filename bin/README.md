#Heroku scheduler jobs

This ./bin folder is used by Heroku to run the scheduled jobs

##Heroku setup

To add the scheduler add-on to your already deployed heroku app

`$ heroku addons:add scheduler`

##Setting env vars on heroku
* AUTH = 
* ATLASSIAN_DOMAIN = example (for example.atlassian.com)

* heroku config:set EMAIL=bigbrother@example.com 
* heroku config:set AUTH=base64(username:password)
* heroku config:set ATLASSIAN_DOMAIN=example
* heroku config:set USERS=one,two,three

##Adding a task
Simply create a new file in ./bin

##Schedule task
Open the scheduler's dashboard :
`$ heroku addons:open scheduler`

And setup your job, as explained in [Heroku documentation](https://devcenter.heroku.com/articles/scheduler#scheduling-jobs)




