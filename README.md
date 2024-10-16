# http-up

Simple index folder via http with upload

Multiple files upload to current showed folder

Also you can download any files inside current folder, just click on them

## Fast running without install

`npx http-up .`

or

`npx http-up --port 3999 .`

basic auth

`npx http-up --user login1 --password password .`

## Desktop window
<p align="center">
  <img src="https://github.com/western/http-up/blob/dev/doc/screen.png?raw=true&18" />
</p>

## Mobile window
<p align="center">
  <img src="https://github.com/western/http-up/blob/dev/doc/screen_mobile.png?raw=true&26" />
</p>

## Notes

- Be careful, if you start this App on public network interface, anybody can work with it
- If you run application under some User, this user should be have privileges to write current folder
- App using temporary folder for upload form, usually it /tmp/httpup, do not forget to clean it

## History

### http-up 1.0.26
- [x] - change stdout log info
- [x] - change file listing view to full row
- [x] - move uploader and folder create interfaces up
- [ ] - arg --log to file

### 1.0.25 features
- [x] - show files_count_max warning

### 1.0.21 features
- [x] - add basic auth

### 1.0.19 features
- [x] - remove H1
- [x] - autoclean temp folder
- [x] - change breadcrumbs font
- [x] - change list font

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
- [x] - file size warning show
- [x] - add prettier for code
- [ ] - refresh npm modules with clear recreate lock file
- [ ] - public folder automake (if not exist)
- [ ] - file size show in page


## Join to dev

clone repo:
`https://github.com/western/http-up`

download necessary packs:
`npm i`

run instance:
`npm run start` or `./bin/http-up`
