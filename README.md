# http-up

Simple index folder via http with upload

Multiple files upload to current showed folder

Also you can download any files inside current folder, just click on them

`npm i http-up`

`http-up --port 4000 .` or `./node_modules/.bin/http-up .`



![alt text](https://github.com/western/http-up/blob/dev/doc/screen.png?raw=true&18)

![alt text](https://github.com/western/http-up/blob/dev/doc/screen_mobile.png?raw=true&18)

## Notes

- If you run application under some User, this user should be have privileges to write current folder
- App using temporary folder for upload form, usually it /tmp/httpup, do not forget to clean it

## History

### 1.0.17 features
- [x] - change temp folder to /tmp/httpup
- [x] - change copy function to rename
- [x] - fix multiple upload

### 1.0.16 features
- [x] - add config file

### 1.0.15 features
- [x] - make folder by enter

### 1.0.14 features
- [x] - swap bg color between folder and file

### 1.0.13 features
- [x] - decomposition for lib/http-up.js

### 1.0.12 features
- [x] - make new folder via web interface

### 1.0.11 features
- [x] - refresh npm modules with clear recreate lock file

### 1.0.10 features
- [x] - refresh bootstrap
- [ ] - refresh npm modules with clear recreate lock file
- [x] - public folder argument (if need)
- [ ] - public folder automake (if not exist)
- [x] - file size warning show
- [ ] - file size show in page
- [x] - add prettier for code


## Join to dev

clone repo:
`https://github.com/western/http-up`

download necessary packs:
`npm i`

run instance:
`npm run start` or `./bin/http-up`
