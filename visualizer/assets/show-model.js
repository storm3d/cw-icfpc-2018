// let showModel = document.getElementById('showModel');
// showModel.onclick = () => {
//     vis.setSize(20, 20, 20);
//     vis.fillMatrix(0, 0, 0, 0, 0, 0);
//     vis.fillMatrix(1, 0, 0, 1, 0, 0);
//     vis.fillMatrix(19, 19, 19, 19, 19, 19);
// }

  var execTrace = document.getElementById('execTrace');
  function onSuccess() {
    if (tgtModelBData && traceBData) {
      execTrace.disabled = false;
    }
  }

  function loadTrace() {
      xmlhttp.onreadystatechange = function(){
      if(xmlhttp.status == 200 && xmlhttp.readyState == 4){
        var reader = new FileReader();
        reader.onload = function(e) {
           traceBData = new Uint8Array(e.target.result);
           onSuccess();
        };
        reader.readAsArrayBuffer(xmlhttp.response);
        onSuccess();
      }
    };
    xmlhttp.open("GET","/trace", true);
    xmlhttp.responseType = "blob";
    xmlhttp.send();
  }

  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function(){
    if(xmlhttp.status == 200 && xmlhttp.readyState == 4){
      var reader = new FileReader();
      reader.onload = function(e) {
        tgtModelBData = new Uint8Array(e.target.result);
        loadTrace();
      };
      reader.readAsArrayBuffer(xmlhttp.response);
    }
  };
  xmlhttp.open("GET","/model",true);
  xmlhttp.responseType = "blob";
  xmlhttp.send();


