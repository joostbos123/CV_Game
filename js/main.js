// const videoWidth = 600;
// const videoHeight = 500;
const videoWidth = window.screen.width;
const videoHeight = window.screen.height;
const imageScaleFactor = 0.5;
const flipHorizontal = true; // since images are being fed from a webcam
const outputStride = 16;
const minPartConfidence = 0.5;
const minPoseConfidence = 0.1;

window.onload = function() {
    startScreen()
}

async function detectPoseInRealTime(canvas, context, video, net, image) {

    async function poseDetectionFrame() {
    
        pose = await net.estimateSinglePose(video, imageScaleFactor, flipHorizontal, outputStride);
    
        context.clearRect(0, 0, videoWidth, videoHeight);
    
        context.save();
        context.scale(-1, 1);
        context.translate(-videoWidth, 0);
        context.drawImage(video, 0, 0, videoWidth, videoHeight);
        context.restore();

        context.drawImage(image, 400, 200, 100, 100);
        console.log(image)
    
        // Draw keypoints on canvas
        drawKeypoints(pose.keypoints, minPartConfidence, context);

        // Draw forehead keypoint on canvas
        drawForeheadKeypoint(pose.keypoints, minPartConfidence, context)
    
        // draw skeleton on canvas
        //drawSkeleton(pose.keypoints, minPoseConfidence, context);
    
        requestAnimationFrame(poseDetectionFrame);
    }

    poseDetectionFrame();

}

async function startGame(canvas, context) {
    // Start video from webcam
    let video;

    try {
      video = await loadVideo();
    } catch(e) {
      let info = document.getElementById('info');
      info.textContent = "this browser does not support video capture, or this device does not have a camera";
      info.style.display = 'block';
      throw e;
    }

    // Load the TensorFlow.js model
    const net = await posenet.load({
        inputResolution: { width: videoWidth, height: videoHeight },
        scale: imageScaleFactor,
        })

    // Clear the canvas
    context.clearRect(0, 0, videoWidth, videoHeight);

    // Load image of the game
    const image = await loadImage('./media/deloitte_logo.jpeg')

    detectPoseInRealTime(canvas, context, video, net, image)

}

async function startScreen(){

    var canvas = document.querySelector('canvas');
    canvas.width  = videoWidth
    canvas.height = videoHeight

    var context = canvas.getContext('2d');

    // Add starting image and text to canvas
    const image = await loadImage('./media/deloitte.jpeg')

    context.drawImage(image, 0, 0, videoWidth, videoHeight);
    context.font = "40pt Calibri";
    context.fillStyle = "#00ff00";
    context.fillText("Start Game!", 150, 120);

    // Remove loading block and show game
    document.getElementById('loading').style.display = 'none';
    document.getElementById('main').style.display = 'block';

    canvas.addEventListener('click', function() {
        startGame(canvas, context)
    }, false);
}