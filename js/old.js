const videoWidth = 600;
const videoHeight = 500;
const frameRate = 100;
const imageScaleFactor = 0.8;
const flipHorizontal = false;
const outputStride = 16;

window.onload = function(){

    var canvas = document.querySelector('canvas');
    canvas.width  = videoWidth
    canvas.height = videoHeight

    var context = canvas.getContext('2d');

    // Add starting image and text to canvas
    var imageObj = new Image();
    imageObj.onload = function(){
        context.drawImage(imageObj, 0, 0, videoWidth, videoHeight);
        context.font = "40pt Calibri";
        context.fillStyle = "#00ff00";
        context.fillText("Start Game!", 150, 120);
    };
    imageObj.src = "./media/deloitte.jpeg";

    // Remove loading block and show game
    document.getElementById('loading').style.display = 'none';
    document.getElementById('main').style.display = 'block';

    canvas.addEventListener('click', function() {
        startGame(canvas, context)
    }, false);

};

// function loadModel() {
//     const net = await posenet.load();

//     // const net = await posenet.load({
//     //     inputResolution: { width: 640, height: 480 },
//     //     scale: 0.8,
//     //   });
//     console.log('model is loaded')
//     return net
// }

function startVideo(video) {
    navigator.mediaDevices.getUserMedia({
        video: {
        width:     videoWidth,
        height:    videoHeight,
        frameRate: frameRate
        }
    }
    ).then(function(stream) {
    //let video = document.querySelector('video');
    video.srcObject = stream;
    video.onloadedmetadata = function(e) {
        video.play();
    };
    }).catch(function(err) {
    // Deal with an error (such as no webcam)
    let info = document.getElementById('info');
    info.textContent = "this browser does not support video capture, or this device does not have a camera";
    info.style.display = 'block';
    throw err;
    });
}

function draw(video, canvas, context, frameRate) {
    // Draw video on canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Make sure the contxt gets updated with the latest video image
    setTimeout(draw, 1/frameRate, video, canvas, context, frameRate);
}

async function detectPoseInRealTime(canvas, context, video, net) {
    console.log('detecting pose')

    pose = await net.estimateSinglePose(video, imageScaleFactor, flipHorizontal, outputStride);
    console.log(pose)

    // // Make sure the function runs for the latest video image
    // setTimeout(detectPoseInRealTime, 1/frameRate, video, canvas, context, frameRate);
}


async function startGame(canvas, context) {
    // Start video from webcam
    const video = document.querySelector('video');
    startVideo(video)

    // Load the TensorFlow.js model
    const net = await posenet.load({
        inputResolution: { width: videoWidth, height: videoHeight },
        scale: imageScaleFactor,
        })

    // Clear the canvas
    context.clearRect(0, 0, videoWidth, videoHeight);

    detectPoseInRealTime(canvas, context, video, net)

    // Video 'play' event listener
    // video.addEventListener('play', function() {
    //     detectPoseInRealTime(canvas, context, video, net)

        // Make sure the function runs for the latest video image
        // setTimeout(detectPoseInRealTime, 1/frameRate, video, canvas, context, frameRate);

        // // Draw video on canvas
        // draw(video, canvas, context, frameRate)
    // }, false);

}