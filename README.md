# http-up

Simple index folder via http with upload

Multiple files upload to current showed folder

Also you can download any files inside current folder, just click on them

## Fast running without install

```console
foo@bar:~$ npx http-up .
```

or

```console
foo@bar:~$ npx http-up --port 3999 /path/to/fold
```

basic auth

```console
foo@bar:~$ npx http-up --basic .
```

```console
foo@bar:~$ npx http-up --user login1 --password EAJteG5 .
```



## Desktop window
<p align="center">
  <img src="https://github.com/western/http-up/blob/dev/doc/screen.png?raw=true&34" />
</p>

## Mobile window
<p align="center">
  <img src="https://github.com/western/http-up/blob/dev/doc/screen_mobile.png?raw=true&34" />
</p>

## Notes

> [!CAUTION]
> Be careful, if you start this App on public network interface, anybody can work with it

> [!IMPORTANT]  
> Always run this app only under unprivileged common user

- If you run application under some User, this user should be have privileges to write current folder
- App using temporary folder for upload form, usually it /tmp/httpup, do not forget to clean it

## Automatic TLS keys generate

- For start HTTPS server you need `easyrsa` linux package
- When you start server with `--tls` option, all keys generate automatically

```console
foo@bar:~$ npx http-up . --tls
```

- Server use self signed certs, generated at first time. Thus you need approve this connection on your clients.

<p float="left">
  <img src="https://github.com/western/http-up/blob/dev/doc/chrome_self_signed_cert.png?raw=true" width="45%" >
  <img src="https://github.com/western/http-up/blob/dev/doc/firefox_self_signed_cert.png?raw=true" width="45%" >
</p>

## History

### backlog
- [ ] - add table of files with extended information and sort instead simple list?
- [ ] - need some aside panel with folders tree?
- [ ] - arg --log to file
- [ ] - need tests and vulnerability tests too


### 1.0.37
- [x] - add tls

### 1.0.35
- [x] - security fix - double slashes

### 1.0.34
- [x] - filename and foldername letters extended

### 1.0.32 and 1.0.33
- [x] - security fix - double dot

### 1.0.31
- [x] - catch read errors and new error page

### 1.0.30
- [x] - grouping folders on top of list
- [x] - change stdout log info

### 1.0.29
- [x] - --upload-disable and --folder-make-disable keys

### 1.0.27
- [x] - set right mime type

### 1.0.26
- [x] - change stdout log info
- [x] - change file listing view to full row
- [x] - move uploader and folder create interfaces up
- [ ] - arg --log to file

### 1.0.25
- [x] - show files_count_max warning

### 1.0.21
- [x] - add basic auth

### 1.0.19
- [x] - remove H1
- [x] - autoclean temp folder
- [x] - change breadcrumbs font
- [x] - change list font

### 1.0.17
- [x] - change temp folder to /tmp/httpup
- [x] - change copy function to rename
- [x] - fix multiple upload

### 1.0.16
- [x] - add config file

### 1.0.15
- [x] - make folder by enter

### 1.0.14
- [x] - swap bg color between folder and file

### 1.0.13
- [x] - decomposition for lib/http-up.js

### 1.0.12
- [x] - make new folder via web interface

### 1.0.11
- [x] - refresh npm modules with clear recreate lock file

### 1.0.10
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
