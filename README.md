# http-up

Simple zero-configuration command line http server with lightweight interface to work with files

Share folder via http with upload

Multiple files upload to current showed folder

In extended mode you can doing more

<p align="center">
  <img src="https://github.com/western/http-up/blob/dev/doc/screen-top6.png?raw=true" />
</p>

## Mobile window
<p align="center">
  <img src="https://github.com/western/http-up/blob/dev/doc/screen_mobile4.png?raw=true" />
</p>

## Fast run without install

```console
npx http-up .
```

or

```console
npx http-up --port 3999 /path/to/fold
```

```console
npx http-up --help
```

## If you switch --extend-mode

```console
npx http-up --extend-mode /tmp
```

App will change main list view to table. And you can operate with files - delete, move, copy

<p align="center">
    <img src="https://github.com/western/http-up/blob/dev/doc/panel_buttons2.png?raw=true"  >
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

## Basic auth

> [!IMPORTANT]  
> It is recommend for work on public network interfaces

every time when you start, you get a list of random accounts

```console
npx http-up --basic .
```

or only one basic auth specific user

```console
npx http-up --login login1 --password EAJteG5 .
```

## The safest run

```console
npx http-up --tls --basic /path/to/you
```
read for [TLS Support](#automatic-tls-keys-generate) below

## Only share

```console
npx http-up --share-only /tmp/fold
```
it is disable "upload" and disable "make new folder" buttons

## Online editor

You can online edit files `html, rtf, doc, docx, odt` as office files.

Or `html, txt, js, css, md, sh, json` formats as source code.

Or `md` as markdown.

<p align="center">
    <img src="https://github.com/western/http-up/blob/dev/doc/online_editor_cmp2.png?raw=true"  />
</p>

You need `libreoffice` package for office files.

Office files follow this flow: `file.doc => file.html, edit => file.doc`

## New filename ext

<p align="center">
    <img src="https://github.com/western/http-up/blob/dev/doc/new_filename_ext2.png?raw=true"  />
</p>

If you set extension for file as `rtf, doc, docx, odt`, after create you can edit it with online WYSIWYG.

(For formats `rtf, doc, docx, odt` you need `libreoffice` package)

If you set extension `html, txt, js, css, md, sh, json`, you will edit it with code editor.


## Automatic TLS keys generate

- For start HTTPS server you need `openssl` linux package
- When you start server with `--tls` option, all keys generate automatically

```console
npx http-up --tls .
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

For preview images `jpg, png, gif` you not need anything.

For document preview you need `libreoffice` package. Formats `pdf, rtf, doc, docx, xls, xlsx, odt, ods`

## Linux packages needs for full functional

- `libreoffice` - for doc thumbnails, for doc files online edit
- `openssl` - encrypt file support, package for certs build
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
- [ ] project needs middleware (or module arch) or not
- [ ] TS ?
- [ ] rich frontend (react, vue) ?
- [ ] tabs

### 3.1.0
- [x] thumbnails: rewrite to async
- [x] thumbnails: removed dependence ImageMagick and md5
- [x] api/post_file: rewrite to async
- [x] api/get_all: rewrite to async
- [x] File implementation
- [x] new index4.js
- [x] codemirror bundle update cm6.bundle-20250710.min.js

codemirror:
- [x] disable autocomplete
- [x] disable black theme
- [x] add highlight JSON

editors:
- [x] open SH as CODE
- [x] for new SH file - open CODE online editor
- [x] for new JSON file - open CODE online editor
- [x] for new MD file - open in MARKDOWN editor
- [x] fix: ability to save EMPTY source code file

### 3.0.0
- [x] fresh packages
- [x] code rewrite
- [ ] async everywhere
- [x] new MARKDOWN editor
- [x] database is disabled by default
- [x] log output disable option
- [x] remove jquery
- [x] remove tree_walk, remove bstreeview (rewrite to "clipboard style")
- [ ] can i print without template engine? (remove handlebars?)
- [ ] facilitate css grid
- [ ] combine all css to html page
- [x] remove SHARE option
- [x] remove ADMIN console
- [x] remove file ENCRYPT option



### [other history here](HISTORY.md)


## Any questions

https://github.com/western/http-up/issues

