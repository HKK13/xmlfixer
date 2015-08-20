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
            //document.getElementById("downloadImage").src = "../images/download164.png";
            $('#downloader').fadeIn(1000);
            var tables = document.getElementsByTagName("td");
            for (var i=tables.length-1; i>=0;i-=1)
                if (tables[i] && tables[i].parentNode.id != "titleTable")
                    tables[i].parentNode.removeChild(tables[i]);


            var mainTable = document.getElementById('tagTable');
            for(var file in data.successLog.files){
                var tr = document.createElement("tr");
                var td = document.createElement("td");
                td.colSpan = 7;
                td.style.borderBottom = "2px solid black";
                td.style.padding = "10px";
                mainTable.appendChild(tr.appendChild(td));
                for(var i=0; i< data.successLog.files[file].events.length;i++){
                    var table = document.createElement("tr");
                    var filenameTD = document.createElement("td");
                    var tagTD = document.createElement("td");
                    var childTD = document.createElement("td");
                    var dataTD = document.createElement("td");
                    var statusTD = document.createElement("td");
                    var linkTD = document.createElement("td");
                    var link = document.createElement("a");
                    filenameTD.innerHTML = file;
                    tagTD.innerHTML = data.successLog.files[file].events[i].tagNo;
                    childTD.innerHTML = data.successLog.files[file].events[i].childNo;
                    dataTD.innerHTML = data.successLog.files[file].events[i].data;
                    statusTD.innerHTML = data.successLog.files[file].events[i].status;
                    if(statusTD.innerHTML == "DELETED")
                        statusTD.style.color = "red";
                    link.innerHTML = "Edit";
                    link.href = data.successLog.files[file].url + "/" + data.successLog.files[file].events[i].tagname + "/" + tagTD.innerHTML;
                    link.target = "_blank";
                    linkTD.appendChild(link);
                    table.appendChild(filenameTD);
                    table.appendChild(tagTD);
                    table.appendChild(childTD);
                    table.appendChild(dataTD);
                    table.appendChild(statusTD);
                    table.appendChild(linkTD);
                    mainTable.appendChild(table);
                }
            }
            var tr = document.createElement("tr");
            var td = document.createElement("td");
            td.colSpan = 7;
            td.innerHTML = "DONE."
            mainTable.appendChild(tr.appendChild(td));

            $('#errorTable').remove();
            var table = document.createElement("ul");
            table.id = "errorTable";
            for(var i =0; i < data.errors.length; i++) {
                var innerData = data.errors[i];
                var item = document.createElement("li");
                item.innerHTML = innerData;
                table.appendChild(item);
            }

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
});