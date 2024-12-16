# http-up

Simple share folder via http with upload

Multiple files upload to current showed folder

In extended mode you can doing more

<p align="center">
  <img src="https://github.com/western/http-up/blob/dev/doc/screen.png?raw=true&35" />
</p>

## Mobile window
<p align="center">
  <img src="https://github.com/western/http-up/blob/dev/doc/screen_mobile.png?raw=true&35" />
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
    <img src="https://github.com/western/http-up/blob/dev/doc/width_screen_compare5.png?raw=true"  >
    <img src="https://github.com/western/http-up/blob/dev/doc/width_screen_compare7.png?raw=true"  >
</p>

## Preview doc button

<p align="center">
    <img src="https://github.com/western/http-up/blob/dev/doc/preview_doc_button.png?raw=true"  >
    
</p>

For [Thumbnails support](#thumbnails-support) read below

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

## File encrypt

> [!IMPORTANT]  
> Be careful. If you download `.crypt` file with WRONG password, it file will be contain MESS of bytes

<br>

<p align="center">
    <img src="https://github.com/western/http-up/blob/dev/doc/code_to_encrypt4.png?raw=true"  >
    
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

## Magic file index.html inside any folder

If you put inside folder `index.html`, it will be return as content

## Thumbnails support

You need `convert` (ImageMagick package) for preview images `jpg, png, gif`

For document preview you need `libreoffice` package. Formats `pdf, rtf, doc, docx, xls, xlsx, odt, ods`

## Linux packages needs for full functional

- `md5sum` (coreutils package) - make md5 sum of file
- `convert` (ImageMagick package) - for thumbnails
- `libreoffice` (free office) - for thumbnails
- `easyrsa` - package for certs build
- `openssl` - encrypt support
- `zip` - cmd util


## Notes

> [!CAUTION]
> Be careful, if you start this App on public network interface, anybody can work with it

> [!CAUTION]  
> Always run this app only under unprivileged common user

- If you run application under some User, this user should be have privileges to write target folder



## History

### backlog
- [ ] - add table of files with extended information and sort instead simple list?
- [ ] - need some aside panel with folders tree?
- [ ] - save whitespaces for filenames?
- [ ] - add arg --tee and --log to file
- [ ] - need tests and vulnerability tests too
- [ ] - what is the lib can resize images enough fast
- [ ] - and how store thumbs (home dot cache folder?)

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
- [x] add zip and download group API

### 1.4.0
- [x] make root config folder as /home/USERNAME/.httpup/
- [x] temp and easyrsa folder moved to root config folder
- [x] add /__thumb/ preview generator for img and documents



### [other history here](HISTORY.md)


## Any questions

https://github.com/western/http-up/issues

