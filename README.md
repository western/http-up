# http-up

Simple share folder via http with upload

Multiple files upload to current showed folder

In extended mode you can delete group of files

<p align="center">
  <img src="https://github.com/western/http-up/blob/dev/doc/screen.png?raw=true&35" />
</p>

## Mobile window
<p align="center">
  <img src="https://github.com/western/http-up/blob/dev/doc/screen_mobile.png?raw=true&35" />
</p>

## If you switch --extend-mode

App will change main list view to table.

Below you see display width more than 992 pix (1), less than (2) and mobile window (3):

<p align="center">
    <img src="https://github.com/western/http-up/blob/dev/doc/width_screen_compare3.png?raw=true"  >
    <img src="https://github.com/western/http-up/blob/dev/doc/width_screen_compare4.png?raw=true"  >
</p>

## Fast running without install

```console
npx http-up .
```

or

```console
npx http-up --port 3999 /path/to/fold
```

## Basic auth

> [!IMPORTANT]  
> It is recommend for work on public network interfaces

every time when you start, you get a list of random accounts

```console
npx http-up --basic .
```

or only one basic auth specific user

```console
npx http-up --user login1 --password EAJteG5 .
```




## Notes

> [!CAUTION]
> Be careful, if you start this App on public network interface, anybody can work with it

> [!CAUTION]  
> Always run this app only under unprivileged common user

- If you run application under some User, this user should be have privileges to write current folder
- App using temporary folder for upload form, usually it /tmp/httpup, do not forget to clean it

## Automatic TLS keys generate

- For start HTTPS server you need `easyrsa` linux package
- When you start server with `--tls` option, all keys generate automatically

```console
npx http-up . --tls
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
- [ ] - save whitespaces for filenames?
- [ ] - add arg --tee and --log to file
- [ ] - need tests and vulnerability tests too
- [ ] - what is the lib can resize images enough fast
- [ ] - and how store thumbs (home dot cache folder?)

### 1.2.2
- [x] - change out and path.join everywhere
- [x] - set sendfile

### 1.2.0
twin brother rewrite to v1.2.0
- [x] - add --extend-mode (table view, thumbnails and delete)
- [x] - decomposition of code

### 1.0.57
- [x] - add folder tree

### 1.0.51
- [x] - add two experimental view modes

### 1.0.48
- [x] - show upload progress as simple as possible

### 1.0.47
- [x] - decomposition
- [x] - change default content type
- [x] - set utf charset for js files

### 1.0.44
- [x] - cors for api
- [x] - cmd args configure
- [x] - add folder with tests

### 1.0.43
- [x] - 401 error page show
- [x] - new util.http_path_clear function

### 1.0.42
- [x] - show basic login in log

### 1.0.41
- [x] - basic auth with --basic make list of credentials

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
