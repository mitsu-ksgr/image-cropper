/**
 *  Image Cropper
 */

function getPos(event) {
  let r = event.target.getBoundingClientRect();
  return {
    x: event.clientX - r.left,
    y: event.clientY - r.top,
  };
}

let result = (function() {
  let lbl_is = document.getElementById('r_is');
  let lbl_sr1 = document.getElementById('r_sr1');
  let lbl_sr2 = document.getElementById('r_sr2');

  return {
    setImageSize: function(w, h) {
      lbl_is.innerHTML = `${w} x ${h}`;
    },
    setSelectedRange: function(x, y, w, h) {
      dx = parseInt(x + w);
      dy = parseInt(y + h);
      x = parseInt(x);
      y = parseInt(y);
      w = parseInt(w);
      y = parseInt(y);

      lbl_sr1.innerHTML = `(${x}, ${y}) ~ (${dx}, ${dy})`;
      lbl_sr2.innerHTML = `${x} + ${w}, ${y} + ${h}`;
    },
  }
}());

let cropper = (function() {
  let canvas = document.getElementById('r_canvas');
  let ctx = canvas.getContext('2d');
  let btn = document.getElementById('r_dl');
  let fileinfo = { filename: "", type: "" };

  function reset() {
    canvas.width = 0;
    canvas.height = 0;
    canvas.style.display = 'none';
    btn.style.display = 'none';
    btn.disabled = true;
  }
  reset();

  function filename4dl(filename, w, h) {
    const re = /(?:\.([^.]+))?$/;
    let ext = re.exec(filename)[1];
    if (!ext) return filename;

    let name = filename.substring(0, filename.lastIndexOf(ext) - 1);
    return `${name}_${w}x${h}.${ext}`;
  }

  // download ... https://blog.katsubemakito.net/html5/canvas-download
  btn.addEventListener('click', function(event) {
    // canvas to blob
    const base64 = canvas.toDataURL(fileinfo.type);
    const tmp = base64.split(",");
    const data = window.atob(tmp[1]);
    const mime = tmp[0].split(":")[1].split(";")[0];

    let buff = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      buff[i] = data.charCodeAt(i);
    }

    const blob = new Blob([buff], { type: mime });

    // download
    const e = document.createEvent("MouseEvents");
    e.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    const a = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
    a.href = window.URL.createObjectURL(blob);
    a.download = fileinfo.filename;
    a.dispatchEvent(e);
  });

  return {
    reset: reset,
    set: function(image, imagename, imagetype, x, y, w, h) {
      filename = imagename;
      canvas.width = Math.abs(w);
      canvas.height = Math.abs(h);
      canvas.style.display = 'block';

      if (w < 0) {
        w = Math.abs(w);
        x -= w;
      }
      if (h < 0) {
        h = Math.abs(h);
        y -= h;
      }

      ctx.drawImage(image, x, y, w, y, 0, 0, w, y);

      // DL button
      fileinfo.filename = filename4dl(imagename, w, h);
      fileinfo.type = imagetype;
      btn.style.display = 'block';
      btn.disabled = false;
    },
  }
}());

let painter = (function() {
  let canvas = document.getElementById('canvas');
  let ctx = canvas.getContext('2d');
  let image = null;
  let fileinfo = { filename: "", type: "" };
  let selectedArea = { active: false, x: 0, y: 0, w: 0, y: 0 };

  return {
    setImage: function(img, imgname, type) {
      canvas.width = img.width;
      canvas.height = img.height;
      image = img;
      fileinfo.filename = imgname;
      fileinfo.type = type;

      result.setImageSize(img.width, img.height);
    },
    draw: function() {
      if (image == null) return;
      ctx.drawImage(image, 0, 0);

      if (selectedArea.active) {
        // set line style
        ctx.lineWidth = 2;
        ctx.setLineDash([5]);

        // draw selected area
        ctx.beginPath();
        ctx.rect(selectedArea.x, selectedArea.y, selectedArea.w, selectedArea.h);
        ctx.stroke();
      }
    },
    beginSelect: function(x, y) {
      selectedArea.active = true;
      selectedArea.x = x;
      selectedArea.y = y;
      selectedArea.w = 0;
      selectedArea.h = 0;
      cropper.reset();
    },
    selecting: function(x, y) {
      selectedArea.w = x - selectedArea.x;
      selectedArea.h = y - selectedArea.y;
      result.setSelectedRange(selectedArea.x, selectedArea.y, selectedArea.w, selectedArea.h);
    },
    endSelect: function() {
      if (selectedArea.active) {
        cropper.set(image, fileinfo.filename, fileinfo.type,
          selectedArea.x, selectedArea.y,
          selectedArea.w, selectedArea.h);
      }
      selectedArea.active = false;
    },
    nowSelecting: function() {
      return selectedArea.active;
    },
  };
}());


// Image upload
document.getElementById('img_upload').addEventListener('change', function(e) {
  let reader = new FileReader();
  reader.onload = function(event) {
    image = new Image();
    image.onload = function() {
      file = e.target.files[0];
      painter.setImage(image, file.name, file.type);
      painter.draw();
    }
    image.src = event.target.result;
  }
  reader.readAsDataURL(e.target.files[0]);
});


// Mouse Events
canvas.addEventListener('mousedown', function(event) {
  pos = getPos(event)
  painter.beginSelect(pos.x, pos.y);
});
canvas.addEventListener('mousemove', function(e) {
  if (!painter.nowSelecting()) return;

  pos = getPos(event)
  painter.selecting(pos.x, pos.y);
  painter.draw();
});
canvas.addEventListener('mouseup', function(e) {
  painter.endSelect();
});

