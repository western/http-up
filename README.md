# http-up

Simple index folder via http with upload

Multiple files upload to current showed folder

Also you can download any files inside current folder, just click on them

`npm i http-up`

`http-up --port 4000 .` or `./node_modules/.bin/http-up .`

### upload folder

Inside run folder should be exist `public` folder. This is folder for uploading and show.

And if you need, you can define it folder as `npm start foldername1`

or `./node_modules/.bin/http-up foldername2`

or `node ./bin/http-up folder3`

<br><br><br>

![alt text](https://github.com/western/http-up/blob/dev/doc/screen.jpg?raw=true&12)

### http-up features 1.0.13
- [x] - decomposition for lib/http-up.js

### http-up features 1.0.12
- [x] - make new folder via web interface

### http-up features 1.0.11
- [x] - refresh npm modules with clear recreate lock file

### http-up features 1.0.10
- [x] - refresh bootstrap
- [ ] - refresh npm modules with clear recreate lock file
- [x] - public folder argument (if need)
- [ ] - public folder automake (if not exist)
- [x] - file size warning show
- [ ] - file size show in page
- [x] - add prettier for code


### join to dev

clone repo:
`git clone https://github.com/western/http-up`

download necessary packs:
`npm i`

run instance:
`npm run start` or `./bin/http-up`
