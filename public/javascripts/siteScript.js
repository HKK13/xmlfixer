/**
 * Created by Kaan on 28/07/15.
 */

$body = $("body");
var uploadedFile;

$(document).ready(function () {
    var isOpen = true;

    $(document).mouseup(function (e) {
        var container = $("#container-div");
        if (!container.is(e.target) && container.has(e.target).length === 0 && isOpen) // ... nor a descendant of the container
        {
            $('#container-div').animate({
                marginTop: "-=210px"
            }, 1000);
            $('#process-log').animate({
                marginTop: "-=210px"
            }, 1000);
            $('#downloaderLink').animate({
                paddingTop: "+=210px"
            }, 1000);
            isOpen = false;
        }
    });


    $("#container-div").click(function () {
        if(!isOpen){
            $("#container-div").animate({
                marginTop: "+=210px"
            }, 1000 );
            $('#process-log').animate({
                marginTop: "+=210px"
            }, 1000);
            $('#bottom').animate({
                paddingTop: "-=210px"
            }, 1000);
            isOpen = true;
        }
    });


    $("#uploadForm").submit(function(event) {
        event.preventDefault();
        var formData = new FormData(document.getElementById('uploadForm'));
        $('.loader').show();
        $.ajax({
            type: 'POST',
            processData: false,
            contentType: false,
            url: $('#uploadForm').attr('action'),
            data: formData
        }).done(function (data) {
            if(isOpen){
                $("#container-div").animate({
                    marginTop: "-=210px"
                }, 1000 );
                $('#process-log').animate({
                    marginTop: "-=210px"
                }, 1000);
                $('#bottom').animate({
                    paddingTop: "+=210px"
                }, 1000);
                $('.footer').animate({
                    bottom: "0"
                }, 1000);
                isOpen = false;
            }
            document.getElementById("downloadLink").href = "/Download/" + data.redirectUrl;
            document.getElementById("downloadImage").src = "../images/down.png";
            $('#downloader').fadeIn(1000);
            var tables = document.getElementsByTagName("ul");
            for (var i=tables.length-1; i>=0;i-=1)
                if (tables[i]) tables[i].parentNode.removeChild(tables[i]);
            var table = document.createElement("ul");
            for(var i =0; i < data.successLog.length; i++) {
                var innerData = data.successLog[i];
                var item = document.createElement("li");
                item.innerHTML = innerData;
                table.appendChild(item);
            }
            document.getElementById("success-log").appendChild(table);
            var table = document.createElement("ul");
            for(var i =0; i < data.errors.length; i++) {
                var innerData = data.errors[i];
                var item = document.createElement("li");
                item.innerHTML = innerData;
                table.appendChild(item);
            }

            while (document.getElementById("xmlOnlySelect").hasChildNodes()) {
                document.getElementById("xmlOnlySelect").removeChild(document.getElementById("xmlOnlySelect").lastChild);
            }

            data.fileList.forEach(function (element) {
                if(element.indexOf("MACOSX") === -1) {
                    var option = document.createElement("option");
                    option.value = element;
                    option.innerHTML = element;
                    document.getElementById("xmlOnlySelect").appendChild(option);
                }
            });
            document.getElementById("error-log").appendChild(table);
            $('.loader').hide();
        }).error(function (e) {
            $('.loader').hide();
            alert("Problem :( -> \t" + e.responseText);
        });
    });


    document.getElementById('fileInputButton').addEventListener('click', function () {
        document.getElementById("fileInput").click();
    });


    document.getElementById('fileInput').addEventListener('change', function () {
        uploadedFile = this.value;
        document.getElementById("fileInputButton").value = this.value;
        document.getElementById("footerFileHolder").value = uploadedFile;
    });

    document.getElementById('tagInput').addEventListener('change', function () {
        uploadedFile = this.value;
        document.getElementById("footerTagHolder").value = uploadedFile;
    });


    $('#xmlEditForm').submit(function (event) {
        event.preventDefault();
        var formData = new FormData(document.getElementById('xmlEditForm'));
        $('.loader').show();
        $.ajax({
            type: 'POST',
            processData: false,
            contentType: false,
            url: $('#xmlEditForm').attr('action'),
            data: formData
        }).done(function (data) {
            var li = document.createElement("li");
            li.innerHTML = data.serverMessage;
            var ul = document.createElement("ul").appendChild(li);
            document.getElementById("success-log").appendChild(ul);
            document.getElementById("downloadLink").href = "/Download/" + data.redirectUrl;
            $('.loader').hide();
        }).error(function () {
            $('.loader').hide();
        });
    });
});