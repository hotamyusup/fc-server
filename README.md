Firecloud Server setup
--------------------------

this readme assumes ubuntu, check nodejs.org for other distros
required tools: nodejs, npm, git, mongodb

install node from nodejs.org

1) curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
2) sudo apt-get install -y nodejs
3) sudo apt-get install -y build-essential
4) sudo apt-get install -y git

5) checkout repo from bitbucket (currently, and you are here reading so you have repo)

6) cd into repo directory and run:
 npm install

Local environment (from laptop, to dev server to production) changes such as database, server URL, etc
are stored in distribution files prefixed with 'dist-'

7) copy needed dist- files to local, attention in misc/ and dist-server

8) run server with node: 
 node server.js
