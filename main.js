// inisialisasi saat halaman dimuat
window.onload = function () {
  // menambahkan aksi ketika file input dipilih
  var input = document.getElementById("file");
  input.addEventListener("change", importImage);

  // menambahkan aksi ketika tombol encode diklik
  var encodeButton = document.getElementById("encode");
  encodeButton.addEventListener("click", encode);

  // menambahkan aksi ketika tombol decode diklik
  var decodeButton = document.getElementById("decode");
  decodeButton.addEventListener("click", decode);
};

// membatasi ukuran pesan secara buatan
var maxMessageSize = 1000;

// fungsi untuk mengimpor dan menampilkan gambar ke dalam canvas
var importImage = function (e) {
  var reader = new FileReader();

  // ketika file selesai dibaca
  reader.onload = function (event) {
    // menampilkan gambar preview
    document.getElementById("preview").style.display = "block";
    document.getElementById("preview").src = event.target.result;

    // membersihkan semua field input
    document.getElementById("message").value = "";
    document.getElementById("password").value = "";
    document.getElementById("password2").value = "";
    document.getElementById("messageDecoded").innerHTML = "";

    // membaca gambar ke dalam elemen canvas
    var img = new Image();
    img.onload = function () {
      var ctx = document.getElementById("canvas").getContext("2d");
      ctx.canvas.width = img.width;
      ctx.canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // memulai proses decoding setelah gambar dimuat
      decode();
    };
    img.src = event.target.result;
  };

  reader.readAsDataURL(e.target.files[0]);
};

// fungsi untuk menyembunyikan pesan ke dalam gambar (encode)
var encode = function () {
  var message = document.getElementById("message").value;
  var password = document.getElementById("password").value;
  var output = document.getElementById("output");
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");

  if (password === "") {
    alert("Password belum diisi");
    return;
  }
  // mengenkripsi pesan menggunakan password jika diberikan
  if (password.length > 0) {
    message = sjcl.encrypt(password, message);
  } else {
    message = JSON.stringify({ text: message });
  }

  // menghentikan proses jika pesan terlalu besar untuk gambar
  var pixelCount = ctx.canvas.width * ctx.canvas.height;
  if ((message.length + 1) * 16 > pixelCount * 4 * 0.75) {
    alert("Pesan terlalu besar untuk gambar.");
    return;
  }

  // menghentikan proses jika pesan melebihi batas maksimal
  if (message.length > maxMessageSize) {
    alert("Pesan terlalu besar.");
    return;
  }

  // menyembunyikan pesan ke dalam data gambar
  var imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  encodeMessage(imgData.data, sjcl.hash.sha256.hash(password), message);
  ctx.putImageData(imgData, 0, 0);

  // menampilkan gambar baru yang sudah diencode
  alert("Selesai! Setelah gambar muncul, simpan dan bagikan gambar ini.");

  output.src = canvas.toDataURL();
};

// fungsi untuk mendekode gambar dan menampilkan isi pesan jika ada
var decode = function () {
  var password = document.getElementById("password2").value;
  var passwordFail = "Password salah atau tidak ada pesan yang ditemukan.";

  // mendekode pesan dari gambar dengan password yang diberikan
  var ctx = document.getElementById("canvas").getContext("2d");
  var imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  var message = decodeMessage(imgData.data, sjcl.hash.sha256.hash(password));

  // mencoba mem-parsing pesan sebagai JSON
  var obj = null;
  try {
    obj = JSON.parse(message);
  } catch (e) {
    // menampilkan tampilan "choose" jika gagal mem-parsing
    document.getElementById("choose").style.display = "block";
    document.getElementById("reveal").style.display = "none";

    if (password.length > 0) {
      alert(passwordFail);
    }
  }

  // jika berhasil, menampilkan pesan yang terdekripsi
  if (obj) {
    document.getElementById("choose").style.display = "none";
    document.getElementById("reveal").style.display = "block";

    // mendekripsi pesan jika diperlukan
    if (obj.ct) {
      try {
        obj.text = sjcl.decrypt(password, message);
      } catch (e) {
        alert(passwordFail);
      }
    }

    // menampilkan pesan yang didekripsi dan menanganinya agar HTML aman
    var escChars = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
      "/": "&#x2F;",
      "\n": "<br/>",
    };
    var escHtml = function (string) {
      return String(string).replace(/[&<>"'\/\n]/g, function (c) {
        return escChars[c];
      });
    };
    document.getElementById("messageDecoded").innerHTML = escHtml(obj.text);
  }
};

// mengembalikan bit ke-1 atau ke-0 pada lokasi tertentu
var getBit = function (number, location) {
  return (number >> location) & 1;
};

// mengubah bit pada lokasi tertentu menjadi nilai 'bit' (1 atau 0)
var setBit = function (number, location, bit) {
  return (number & ~(1 << location)) | (bit << location);
};

// mengembalikan array bit (1 dan 0) untuk sebuah angka 2-byte
var getBitsFromNumber = function (number) {
  var bits = [];
  for (var i = 0; i < 16; i++) {
    bits.push(getBit(number, i));
  }
  return bits;
};

// mengembalikan angka 2-byte berikutnya berdasarkan array byte
var getNumberFromBits = function (bytes, history, hash) {
  var number = 0,
    pos = 0;
  while (pos < 16) {
    var loc = getNextLocation(history, hash, bytes.length);
    var bit = getBit(bytes[loc], 0);
    number = setBit(number, pos, bit);
    pos++;
  }
  return number;
};

// mengembalikan array bit (1 dan 0) untuk sebuah pesan (string)
var getMessageBits = function (message) {
  var messageBits = [];
  for (var i = 0; i < message.length; i++) {
    var code = message.charCodeAt(i);
    messageBits = messageBits.concat(getBitsFromNumber(code));
  }
  return messageBits;
};

// menentukan lokasi bit berikutnya untuk disimpan
var getNextLocation = function (history, hash, total) {
  var pos = history.length;
  var loc = Math.abs(hash[pos % hash.length] * (pos + 1)) % total;
  while (true) {
    if (loc >= total) {
      loc = 0;
    } else if (history.indexOf(loc) >= 0) {
      loc++;
    } else if ((loc + 1) % 4 === 0) {
      loc++;
    } else {
      history.push(loc);
      return loc;
    }
  }
};

// menyembunyikan pesan ke dalam array warna pixel
var encodeMessage = function (colors, hash, message) {
  // membuat array bit dari panjang pesan
  var messageBits = getBitsFromNumber(message.length);
  messageBits = messageBits.concat(getMessageBits(message));

  // menyimpan warna pixel yang sudah dimodifikasi
  var history = [];

  // menyembunyikan bit pesan ke dalam pixel gambar
  var pos = 0;
  while (pos < messageBits.length) {
    // menyimpan bit berikutnya ke dalam nilai warna pixel
    var loc = getNextLocation(history, hash, colors.length);
    colors[loc] = setBit(colors[loc], 0, messageBits[pos]);

    // menetapkan nilai alpha pada pixel untuk memastikan alpha tidak berubah
    while ((loc + 1) % 4 !== 0) {
      loc++;
    }
    colors[loc] = 255;

    pos++;
  }
};

// mengembalikan pesan yang terencode dalam array warna pixel
var decodeMessage = function (colors, hash) {
  var history = [];

  // membaca ukuran pesan
  var messageSize = getNumberFromBits(colors, history, hash);

  // menghentikan jika pesan terlalu besar
  if ((messageSize + 1) * 16 > colors.length * 0.75) {
    return "";
  }

  // menghentikan jika pesan melebihi batas yang ditetapkan
  if (messageSize === 0 || messageSize > maxMessageSize) {
    return "";
  }

  // membangun pesan karakter dari array byte
  var message = [];
  for (var i = 0; i < messageSize; i++) {
    var code = getNumberFromBits(colors, history, hash);
    message.push(String.fromCharCode(code));
  }

  // mengembalikan pesan sebagai string
  return message.join("");
};
