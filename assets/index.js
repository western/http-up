// http-up, index.js

$(document).ready(function () {
    if (typeof folderTree != 'undefined') {
        // --------------------------------------------------------------------------------------------------------------------------------------

        $('#group_move').click((ev) => {
            let checked = [];

            $(':checkbox[name=fold],:checkbox[name=file]').each((indx, el) => {
                if ($(el).prop('checked')) {
                    checked.push($(el).val());
                }
            });

            if (checked.length == 0) {
                alert('You need select something');
            }

            if (checked.length > 0) {
                new bootstrap.Offcanvas('#offcanvasMove').show();
            }
        });

        $('#folderTreeMove').bstreeview({
            data: folderTree,
            expandIcon: 'bi bi-caret-down',
            collapseIcon: 'bi bi-caret-right',
            indent: 1.25,
            parentsMarginLeft: '1.25rem',
            openNodeLinkOnNewTab: true,
        });

        $('#folderTreeMove div.list-group-item').click((ev) => {
            let path = $(ev.target).data('path');
            $('#move_folder_input').val(path);
        });

        $('#move_folder_button').click((ev) => {
            let val = $('#move_folder_input').val();

            if (val.length == 0) {
                alert('Please choose folder');
                return;
            }

            let checked = [];

            $(':checkbox[name=fold],:checkbox[name=file]').each((indx, el) => {
                if ($(el).prop('checked')) {
                    checked.push($(el).val());
                }
            });

            if (checked.length == 0) {
                alert('Please select some file');
            }

            if (checked.length > 0) {
                let formData = new FormData();

                formData.append('to', val);

                $.each(checked, function (indx, val) {
                    formData.append('name', val);
                });

                $.ajax({
                    url: '/api/move',
                    data: formData,
                    type: 'POST',
                    contentType: false,
                    processData: false,
                }).done(function (data) {
                    if (data.code == 200) {
                        location.href = location.href;
                    }
                }).fail(function(data) {
                    if (data.responseJSON.msg) {
                        alert(data.responseJSON.msg);
                    }
                });
            }
        });

        // --------------------------------------------------------------------------------------------------------------------------------------

        // --------------------------------------------------------------------------------------------------------------------------------------

        $('#group_copy').click((ev) => {
            let checked = [];

            $(':checkbox[name=fold],:checkbox[name=file]').each((indx, el) => {
                if ($(el).prop('checked')) {
                    checked.push($(el).val());
                }
            });

            if (checked.length == 0) {
                alert('You need select something');
            }

            if (checked.length > 0) {
                new bootstrap.Offcanvas('#offcanvasCopy').show();
            }
        });

        $('#folderTreeCopy').bstreeview({
            data: folderTree,
            expandIcon: 'bi bi-caret-down',
            collapseIcon: 'bi bi-caret-right',
            indent: 1.25,
            parentsMarginLeft: '1.25rem',
            openNodeLinkOnNewTab: true,
        });

        $('#folderTreeCopy div.list-group-item').click((ev) => {
            let path = $(ev.target).data('path');
            $('#copy_folder_input').val(path);
        });

        $('#copy_folder_button').click((ev) => {
            let val = $('#copy_folder_input').val();

            if (val.length == 0) {
                alert('Please choose folder');
                return;
            }

            let checked = [];

            $(':checkbox[name=fold],:checkbox[name=file]').each((indx, el) => {
                if ($(el).prop('checked')) {
                    checked.push($(el).val());
                }
            });

            if (checked.length == 0) {
                alert('Please select some file');
            }

            if (checked.length > 0) {
                let formData = new FormData();

                formData.append('to', val);

                $.each(checked, function (indx, val) {
                    formData.append('name', val);
                });

                $.ajax({
                    url: '/api/copy',
                    data: formData,
                    type: 'POST',
                    contentType: false,
                    processData: false,
                }).done(function (data) {
                    if (data.code == 200) {
                        location.href = location.href;
                    }
                }).fail(function(data) {
                    if (data.responseJSON.msg) {
                        alert(data.responseJSON.msg);
                    }
                });
            }
        });

        // --------------------------------------------------------------------------------------------------------------------------------------
    }

    // --------------------------------------------------------------------------------------------------------------------------------------

    let make_new_folder = function (ev) {
        let val = $('input[type=text]', ev.target.parentNode).val();
        console.log('val=', val);

        if (val.length == 0) {
            alert('Please fill folder name');
            return;
        }

        let formData = new FormData();

        formData.append('name', val);

        $.ajax({
            url: '/api/folder',
            data: formData,
            type: 'POST',
            contentType: false,
            processData: false,
        }).done(function (data) {
            if (data.code == 200) {
                location.href = location.href;
            }
        }).fail(function(data) {
            if (data.responseJSON.msg) {
                alert(data.responseJSON.msg);
            }
        });
    };

    $('#make_folder_button').click(function (ev) {
        make_new_folder(ev);
    });

    $('#make_folder_input').on('keypress', function (ev) {
        if (ev.which == 13) {
            make_new_folder(ev);
        }
    });

    

    
    
    // --------------------------------------------------------------------------------------------------------------------------------------

    $(':checkbox.head-chk').click((ev) => {
        //let checkboxes = $(':checkbox[name=fold]');
        //console.log('ev.target=', ev.target);

        let chk = $(ev.target).prop('checked') ? true : false;

        $(':checkbox[name=fold]').prop('checked', chk);
        $(':checkbox[name=file]').prop('checked', chk);
    });

    // --------------------------------------------------------------------------------------------------------------------------------------
    
    $('a.del').click((ev) => {
        let el = ev.target;

        
        if (el.tagName == 'I') {
            el = el.parentNode;
            
            if (confirm('Delete "' + $(el).data('name') + '"?')) {
                let formData = new FormData();

                formData.append('name', $(el).data('name'));

                $.ajax({
                    url: '/api/delete',
                    data: formData,
                    type: 'POST',
                    contentType: false,
                    processData: false,
                }).done(function (data) {
                    if (data.code == 200) {
                        location.href = location.href;
                    }
                }).fail(function(data) {
                    if (data.responseJSON.msg) {
                        alert(data.responseJSON.msg);
                    }
                });
            }
        }
    });
    
    $('#group_del').click((ev) => {
        let checked = [];

        $(':checkbox[name=fold],:checkbox[name=file]').each((indx, el) => {
            if ($(el).prop('checked')) {
                checked.push($(el).val());
            }
        });

        if (checked.length == 0) {
            alert('You need select something');
        }

        if (checked.length > 0 && confirm('You really want to del this group?')) {
            let formData = new FormData();

            $.each(checked, function (indx, val) {
                let i = indx + 1;
                formData.append('name', val);
            });

            $.ajax({
                url: '/api/delete',
                data: formData,
                type: 'POST',
                contentType: false,
                processData: false,
            }).done(function (data) {
                if (data.code == 200) {
                    location.href = location.href;
                }
            }).fail(function(data) {
                if (data.responseJSON.msg) {
                    alert(data.responseJSON.msg);
                }
            });
        }
    });

    // --------------------------------------------------------------------------------------------------------------------------------------

    $('#group_zip').click((ev) => {
        let checked = [];

        $(':checkbox[name=fold],:checkbox[name=file]').each((indx, el) => {
            if ($(el).prop('checked')) {
                checked.push($(el).val());
            }
        });

        if (checked.length == 0) {
            alert('You need select something');
        }

        if (checked.length > 0) {
            let formData = new FormData();

            $.each(checked, function (indx, val) {
                let i = indx + 1;
                formData.append('name', val);
            });

            $.ajax({
                url: '/api/zip',
                data: formData,
                type: 'POST',
                contentType: false,
                processData: false,
            }).done(function (data) {
                //console.log('data=', data);

                if (data.code == 200) {
                    location.href = '/__temp/' + data.href;
                } else {
                    alert(data.msg);
                }
            }).fail(function(data) {
                if (data.responseJSON.msg) {
                    alert(data.responseJSON.msg);
                }
            });
        }
    });

    // --------------------------------------------------------------------------------------------------------------------------------------

    $('#set_code_button').click(function (ev) {
        let val = $('#set_code_input').val();
        //document.cookie = "code="+val;
        setCookie('code', val, {});

        location.href = location.href;
    });

    $('#set_code_input').on('keypress', function (ev) {
        if (ev.which == 13) {
            let val = $('#set_code_input').val();
            //document.cookie = "code="+val;
            setCookie('code', val, {});

            location.href = location.href;
        }
    });

    if (getCookie('code')) {
        $('#set_code_input').val(getCookie('code'));
    }

    // --------------------------------------------------------------------------------------------------------------------------------------

    $('#upload_file').on('change', function (ev) {
        $('#signal').removeClass('visually-hidden');
        $(ev.target).prop('disabled', true);

        return ev_target_files(ev.target.files);

        //return ev_target_files_base64(ev.target.files);
    });
});

// --------------------------------------------------------------------------------------------------------------------------------------

function ev_target_files(files) {
    $('#signal').removeClass('visually-hidden');

    if (files.length > config.files_count_max) {
        alert(`Count of files is more than ${config.files_count_max}.`);
        location.href = location.href;
        return;
    }

    let formData = new FormData();
    Array.prototype.forEach.call(files, function (file) {
        if (file.size > config.fieldSize_max) {
            alert('File "' + file.name + `" size is overload "${config.fieldSize_max_human}"`);
        } else {
            formData.append('fileBlob', file);
            formData.append(
                'fileMeta',
                JSON.stringify({
                    lastModified: file.lastModified,
                    lastModifiedDate: file.lastModifiedDate,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                }),
            );
        }
    });

    let submit = async function () {
        /*
        let response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        let result = await response.json();
        if(result.code == 200){
            location.href = location.href;
        }
        */

        $('#progress').attr('max', 100);
        $('#progress').attr('value', 0);
        $('#progress').show();

        let xhr = new XMLHttpRequest();

        xhr.upload.addEventListener(
            'progress',
            function (ev, th) {
                if (ev.lengthComputable) {
                    //let percentComplete = (ev.loaded / ev.total) * 100;
                    //console.log('percentComplete=', percentComplete);

                    $('#progress').attr('max', ev.total);
                    $('#progress').attr('value', ev.loaded);
                }
            },
            false,
        );

        xhr.onreadystatechange = function (ev) {
            
            
            
            if( xhr.readyState == 4 && ev.target.status == 500  ){
                let json = JSON.parse(ev.target.responseText);
                alert( json.msg );
            }
            
            if ( xhr.readyState == 4 && ev.target.status == 200 ) {
                location.href = location.href;
            }
        };
        xhr.open('POST', '/api/upload');
        xhr.send(formData);
    };

    submit();
    return;
}

// --------------------------------------------------------------------------------------------------------------------------------------

function ev_target_files_base64(files) {
    let arr = [];
    let file_meta = [];
    Array.prototype.forEach.call(files, function (file) {
        arr.push(file);
        file_meta.push({
            lastModified: file.lastModified,
            lastModifiedDate: file.lastModifiedDate,
            name: file.name,
            size: file.size,
            type: file.type,
        });
    });

    Promise.all(arr.map(convertFileToBase64)).then((promise_arr_result) => {
        let formData = new FormData();

        promise_arr_result.map(function (pr) {
            formData.append('fileBase', pr.base64_source);
        });

        file_meta.map(function (pr) {
            formData.append('fileMeta', JSON.stringify(pr));
        });

        $.ajax({
            url: '/api/upload',
            data: formData,
            type: 'POST',
            contentType: false,
            processData: false,
        }).done(function (data) {
            if (data.code == 200) {
                location.href = location.href;
            }
        });
    });

    return;
}

const convertFileToBase64 = (file) =>
    new Promise((resolve, reject) => {
        if (file.id) {
            resolve(file);
        } else {
            const reader = new FileReader();
            reader.onload = () => resolve({ rawFile: file, base64_source: reader.result });
            reader.onerror = reject;

            reader.readAsDataURL(file);
        }
    });

// --------------------------------------------------------------------------------------------------------------------------------------

function getCookie(name) {
    let matches = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

function setCookie(name, value, options = {}) {
    options = {
        path: '/',
        ...options,
    };

    if (options.expires instanceof Date) {
        options.expires = options.expires.toUTCString();
    }

    let updatedCookie = encodeURIComponent(name) + '=' + encodeURIComponent(value);

    for (let optionKey in options) {
        updatedCookie += '; ' + optionKey;
        let optionValue = options[optionKey];
        if (optionValue !== true) {
            updatedCookie += '=' + optionValue;
        }
    }

    //console.log('updatedCookie=', updatedCookie);
    document.cookie = updatedCookie;
}

// setCookie('user', 'John', {secure: true, 'max-age': 3600});
