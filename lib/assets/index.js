

$(document).ready(function(){

/*
    let tree = [
  {
    text: "Node 1",
    icon: "bi bi-folder",
    expanded: true,
    nodes: [
      {
        text: "Sub Node 1",
        icon: "bi bi-folder",
        expanded: true,
        nodes: [
          {
            id:    "sub-node-1",
            text:  "Sub Child Node 1",
            icon:  "bi bi-folder",
            class: "nav-level-3",
            href:  "https://google.com"
          },
          {
            text: "Sub Child Node 2",
            icon: "bi bi-folder"
          }
        ]
      },
      {
        text: "Sub Node 2",
         icon: "bi bi-folder"
      }
    ]
  },
  {
    text: "Node 2",
    icon: "bi bi-folder"
  },
  {
    text: "Node 3",
    icon: "bi bi-folder"
  },
  {
    text: "Node 4",
    icon: "bi bi-folder"
  },
  {
    text: "Node 5",
    icon: "bi bi-folder"
  }
];
*/


    $('#treeview1').bstreeview({
        //data: tree,
        data: file_tree1,
        expandIcon: 'bi bi-dash-lg',
        collapseIcon: 'bi bi-plus-lg',
        openNodeLinkOnNewTab: false
    });


    $('#upload_file').on('change', function(ev){

        return ev_target_files(ev.target.files);

        //return ev_target_files_base64(ev.target.files);
    });

    let make_new_folder = function(ev){

        let val = $('input[type=text]', ev.target.parentNode).val();
        console.log('val=', val);

        if ( val.length == 0 ){
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
        }).done(function( data ) {

            if( data.code == 200 ){
                location.href = location.href;
            }
        });

    };

    $('#make_folder_button').click(function(ev){

        make_new_folder(ev);
    });

    $('#make_folder_input').on('keypress', function(ev){

        if(ev.which == 13) {
            make_new_folder(ev);
        }
    });

});


function ev_target_files(files){
    $('#signal').removeClass('visually-hidden');


    if ( files.length > config.files_count_max ){

        alert(`Count of files is more than ${config.files_count_max}.`);
        location.href = location.href;
        return;
    }

    let formData = new FormData();
    Array.prototype.forEach.call(files, function(file) {


        if ( file.size > config.fieldSize_max ){
            alert( 'File "' + file.name + `" size is overload "${config.fieldSize_max_human}"`);
        }else{

            formData.append('fileBlob', file);
            formData.append('fileMeta', JSON.stringify({
                lastModified: file.lastModified,
                lastModifiedDate: file.lastModifiedDate,
                name: file.name,
                size: file.size,
                type: file.type,
            }));
        }
    });

    let submit = async function() {

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

        xhr.upload.addEventListener('progress', function(ev, th){
            if (ev.lengthComputable) {

                //let percentComplete = (ev.loaded / ev.total) * 100;
                //console.log('percentComplete=', percentComplete);

                $('#progress').attr('max', ev.total);
                $('#progress').attr('value', ev.loaded);
            }
        }, false);

        xhr.onreadystatechange = function (ev) {
            if (xhr.readyState == 4) {
                location.href = location.href;
            }
        };
        xhr.open("POST", '/api/upload');
        xhr.send(formData);
    };

    submit();
    return;
}

function ev_target_files_base64(files){
    let arr = [];
    let file_meta = [];
    Array.prototype.forEach.call(files, function(file) {
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
        }).done(function( data ) {

            if( data.code == 200 ){
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
