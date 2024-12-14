$("button.encode, button.decode").click(function(event) {
    event.preventDefault();
});

function previewDecodeImage() {
    var file = document.querySelector("input[name=decodeFile]").files[0];

    previewImage(file, ".decode canvas", function() {
        $(".decode").fadeIn();
    });
}

function previewEncodeImage() {
    var file = document.querySelector("input[name=baseFile]").files[0];

    $(".images .nulled").hide();
    $(".images .message").hide();

    previewImage(file, ".original canvas", function() {
        $(".images .original").fadeIn();
        $(".images").fadeIn();
    });
}

function previewImage(file, canvasSelector, callback) {
    var reader = new FileReader();
    var image = new Image();
    var $canvas = $(canvasSelector);
    var context = $canvas[0].getContext("2d");

    if (file) {
        reader.readAsDataURL(file);
    }

    reader.onloadend = function() {
        image.src = URL.createObjectURL(file);

        image.onload = function() {
            $canvas.prop({
                width: image.width,
                height: image.height,
            });

            context.drawImage(image, 0, 0);

            callback();
        };
    };
}

function encodeMessage() {
    $(".error").hide();
    $(".binary").hide();

    var text = $("textarea.message").val();

    var $originalCanvas = $(".original canvas");
    var $nulledCanvas = $(".nulled canvas");
    var $messageCanvas = $(".message canvas");

    var originalContext = $originalCanvas[0].getContext("2d");
    var nulledContext = $nulledCanvas[0].getContext("2d");
    var messageContext = $messageCanvas[0].getContext("2d");

    var width = $originalCanvas[0].width;
    var height = $originalCanvas[0].height;

    // Check if the image is big enough to hide the message
    if (text.length * 8 > width * height * 3) {
        $(".error").text("Text too long for chosen image....").fadeIn();
        return;
    }

    // Set canvas size
    $nulledCanvas.prop({
        width: width,
        height: height,
    });

    $messageCanvas.prop({
        width: width,
        height: height,
    });

    // Normalize the original image and draw it
    var original = originalContext.getImageData(0, 0, width, height);
    var pixel = original.data;

    // Modifying pixel values (normalize)
    for (var i = 0, n = pixel.length; i < n; i += 4) {
        for (var offset = 0; offset < 3; offset++) {
            if (pixel[i + offset] % 2 != 0) {
                pixel[i + offset]--;
            }
        }
    }
    nulledContext.putImageData(original, 0, 0);

    // Convert the message to a binary string
    var binaryMessage = "";
    for (var i = 0; i < text.length; i++) {
        var binaryChar = text[i].charCodeAt(0).toString(2);
        while (binaryChar.length < 8) {
            // Pad with 0 until length is 8
            binaryChar = "0" + binaryChar;
        }
        binaryMessage += binaryChar;
    }
    $(".binary textarea").text(binaryMessage);

    // Apply the binary string to the image and draw it
    var message = nulledContext.getImageData(0, 0, width, height);
    pixel = message.data;
    var counter = 0;

    for (var i = 0, n = pixel.length; i < n; i += 4) {
        for (var offset = 0; offset < 3; offset++) {
            if (counter < binaryMessage.length) {
                pixel[i + offset] += parseInt(binaryMessage[counter]);
                counter++;
            } else {
                break;
            }
        }
    }
    messageContext.putImageData(message, 0, 0);

    // Download the image with hidden message
    const $inputGambar = $(".input-gambar");
    const files = $inputGambar[0].files; // Mengambil file yang dipilih
    const $textRahasia = $(".text-rahasia");
    const $messageText = $textRahasia.val();
    // Memeriksa apakah ada file yang dipilih
    if (files.length === 0) {
        alert("Gambar belum dipilih");
        return; // Keluar dari fungsi jika tidak ada gambar
    }

    // Memeriksa apakah pesan telah diisi
    if ($messageText.trim() === "") {
        alert("Pesan belum diisi");
        return; // Keluar dari fungsi jika pesan kosong
    }
    downloadCanvasImage($messageCanvas[0], "image-with-message.png");
}

// Function to download image from canvas
function downloadCanvasImage(canvas, filename) {
    var dataURL = canvas.toDataURL("image/png");
    var kode =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWCAYAAABkW7XSAAAAAXNSR0IArs4c6QAABGJJREFUeF7t1AEJAAAMAsHZv/RyPNwSyDncOQIECEQEFskpJgECBM5geQICBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAgQdWMQCX4yW9owAAAABJRU5ErkJggg==";
    if (dataURL === kode) {
        return;
    }
    const $textRahasia = $(".text-rahasia");
    const $messageText = $textRahasia.val();
    console.log($textRahasia.val());
    if ($messageText === " ") {
        return;
    }
    var link = document.createElement("a"); // Create <a> element for download
    link.href = dataURL;
    link.download = filename; // Set the filename for the downloaded image
    link.click(); // Trigger a click to start downloading the image
}

function decodeMessage() {
    const $originalCanvas = $(".decode canvas");
    const originalContext = $originalCanvas[0].getContext("2d");


    const $inputGambarRahasia = $(".input-gambar-rahasia");
    const files = $inputGambarRahasia[0].files;


    if (files.length === 0) {
        alert("Gambar belum dipilih");
        return;
    }

    // Ensure canvas dimensions match the uploaded image dimensions
    const image = new Image();
    const fileReader = new FileReader();

    fileReader.onload = function(e) {
        image.onload = function() {
            // Set canvas size to match the image
            $originalCanvas.attr("width", image.width);
            $originalCanvas.attr("height", image.height);

            originalContext.drawImage(image, 0, 0, image.width, image.height);


            const original = originalContext.getImageData(0, 0, image.width, image.height);
            const pixel = original.data;




            let binaryMessage = "";


            // Extract binary data from pixel LSBs
            for (let i = 0; i < pixel.length; i += 4) { // Only R, G, and B channels (skip alpha)
                for (let offset = 0; offset < 3; offset++) {
                    binaryMessage += pixel[i + offset] % 2;
                    console.log(binaryMessage)
                }
            }

            // Decode binary message to ASCII
            let output = "";
            for (let i = 0; i < binaryMessage.length; i += 8) {
                const byte = binaryMessage.slice(i, i + 8);
                if (/^[01]{8}$/.test(byte)) { // Ensure valid binary string
                    const char = String.fromCharCode(parseInt(byte, 2));
                    if (char === "\0") break; // Stop at null terminator
                    output += char;
                }
            }

            // Display the decoded message
            $(".binary-decode .h-message").text(output || "No hidden message found.");
            $(".binary-decode").fadeIn();
        };

        // Set the source of the image to the uploaded file
        image.src = e.target.result;
    };

    // Read the file as a data URL
    fileReader.readAsDataURL(files[0]);
}