# http-up

Simple share folder via http with upload

Multiple files upload to current showed folder

In extended mode you can doing more

<p align="center">
  <img src="https://github.com/western/http-up/blob/dev/doc/screen-top6.png?raw=true" />
</p>

## Mobile window
<p align="center">
  <img src="https://github.com/western/http-up/blob/dev/doc/screen_mobile4.png?raw=true" />
</p>

## Fast running without install

```console
npx http-up .
```

or

```console
npx http-up --port 3999 /path/to/fold
```

## If you switch --extend-mode

```console
npx http-up --extend-mode /tmp
```

App will change main list view to table. And you can operate with files - delete, move, copy

<p align="center">
    <img src="https://github.com/western/http-up/blob/dev/doc/panel_buttons.png?raw=true"  >
</p>

Below you see display width more than 992 pix (1), less than (2) and mobile window (3):

<p align="center">
    <img src="https://github.com/western/http-up/blob/dev/doc/width_screen_compare10.png?raw=true"  >
    <img src="https://github.com/western/http-up/blob/dev/doc/width_screen_compare11.png?raw=true"  >
</p>

> [!IMPORTANT]  
> During group operations COPY or MOVE all target files/folders will be rewrite

## Preview doc button

<p align="center">
    <img src="https://github.com/western/http-up/blob/dev/doc/preview_doc_button.png?raw=true"  >
    
</p>

For [Thumbnails support](#thumbnails-support) read below

## Buttons share/rename/edit

<p align="center">
    <img src="https://github.com/western/http-up/blob/dev/doc/share_rename_edit.png?raw=true"  >
    
</p>

Edit button work with formats `html, rtf, doc, docx, odt`.

For document online edit you need `libreoffice` package.

## Motivation for share button

Imagine, that you run app with basic auth `npx http-up --user XXX --password YYY --extend-mode .`

And you not want to share with your login/password

And you need to show only one file

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

## The safest run

```console
npx http-up --tls --basic /path/to/you
```
read for [TLS Support](#automatic-tls-keys-generate) below

## Only share

```console
npx http-up --upload-disable --folder-make-disable /tmp/fold
```

## Online editor

You can online edit doc files `html|rtf|doc|docx|odt` as office files.

Or `html|txt|js|css|md` formats as source code.

<p align="center">
    <img src="https://github.com/western/http-up/blob/dev/doc/online_editor_cmp.png?raw=true"  />
</p>

You need `libreoffice` package for office files.

Office files follow this flow: `file.doc => file.html, edit => file.doc`

## New filename ext

<p align="center">
    <img src="https://github.com/western/http-up/blob/dev/doc/new_filename_ext.png?raw=true"  />
</p>

If you set extension for file as `rtf|doc|docx|odt`, after create you can edit it with online WYSIWYG.

If you set extension `html|txt|js|css|md`, you will edit it with code editor.

## File encrypt

> [!IMPORTANT]  
> Be careful. If you download `.crypt` file with WRONG password, it file will be contain MESS of bytes

<br>

<p align="center">
    <img src="https://github.com/western/http-up/blob/dev/doc/code_to_encrypt5.png?raw=true" width="60%"  >
    
</p>

Your server need package `openssl`. It will be use `openssl aes-256-cbc`

```console
npx http-up --extend-mode --crypt /tmp
```

Then, set your passcode to the form. The passcode store on the form between requests and you not need input it every time (if you clear it server will not use openssl).

During the process of uploading, your files will be encrypt and their EXT change to `.crypt`

When files lying on your server, their data is crypted.

If you need decrypt any `.crypt` flles, set your passcode, and click on file. During download this file, it will be decrypt on the fly.

### Server will be encrypt upload file:
```console
npx http-up --extend-mode --crypt /tmp
```
- if you set `--crypt` arg on cmd
- if you set passcode (pass code set by form)

### Server will be decrypt download file:
```console
npx http-up --extend-mode --crypt /tmp
```
- if you set `--crypt` arg on cmd
- if filename contain `.crypt` extension
- if you set right passcode (pass code set by form)

### Server will be decrypt download file (case 2):
```console
npx http-up /tmp
```
- if filename contain `.crypt` extension
- if you get file with `code` param: `/fold3/file.jpg.crypt?code=YOUR_PASS_HERE`






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

## Export log data and how read it

After export log data to file

```console
npx http-up --log-export file.json
```

You can ask `show all data for client "192.168.0.102" ` inside with `jq`:

```console
jq '.[] | select(.ip=="192.168.0.102")' file.json
```

Or `show all events, contain "spring" substring`:

```console
jq '.[] | select(.msg | contains("spring"))' file.json
```

Or you can work with SQL directly inside `.httpup/db` folder

## Magic file index.html inside any folder

If you put inside folder `index.html`, it will be return as content

## Thumbnails support

You need `convert` (ImageMagick package) for preview images `jpg, png, gif`

For document preview you need `libreoffice` package. Formats `pdf, rtf, doc, docx, xls, xlsx, odt, ods`

## Linux packages needs for full functional

- `md5sum` (coreutils package) - make md5 sum of file
- `convert` (ImageMagick package) - for make thumbnails
- `libreoffice` - for thumbnails, for doc files online edit
- `easyrsa` (easy-rsa package) - package for certs build
- `openssl` - encrypt file support
- `zip` - cmd util for zip_and_download


## Notes

> [!CAUTION]
> Be careful, if you start this App on public network interface, anybody can work with it

> [!CAUTION]  
> Always run this app only under unprivileged common user

- If you run application under some User, this user should be have privileges to write target folder



## History

### backlog
- [ ] save whitespaces for filenames?
- [ ] what is the lib can resize images enough fast
- [ ] database migration
- [ ] project needs middleware (or module arch) or not
- [ ] TS ?
- [ ] rich frontend (react, vue) ?
- [x] search
- [ ] should i support no_database version?
- [ ] tabs

### 2.3.0
- [x] new head interface
- [x] search
- [x] create new file

### 2.1.0
- [x] add source code editor for `html|txt|js|css|md`

### 2.0.5
- [x] show monitor page for /admin/

### 2.0.4
- [x] send 404 html page for share problems

### 2.0.3
- [x] remove ansi colors from export string

### 2.0.2
- [x] allow /assets/ prefix without password

### 2.0.0
- [x] database support
- [x] rename button
- [x] share button
- [x] edit button for `html, rtf, doc, docx, odt`
- [x] speed up hash search for thumbnails
- [x] event log
- [x] export event log as JSON
- [x] refactoring

<hr>

### 1.6.5
- [x] add compression

### 1.6.4
- [x] fix upload with code undefined

### 1.6.1
- [x] API: remove target file or folder while COPY or MOVE

### 1.6.0
- [x] file encrypt

### 1.5.0
- [x] move group operation buttons to top panel
- [x] add sort operation
- [x] add move group API (with side panel folder)
- [x] add copy group API (with side panel folder)
- [x] add zip_and_download group API

### 1.4.0
- [x] make root config folder as /home/USERNAME/.httpup/
- [x] temp and easyrsa folder moved to root config folder
- [x] add /__thumb/ preview generator for img and documents



### [other history here](HISTORY.md)


## Any questions

https://github.com/western/http-up/issues

