const videoWidth = 600;
const videoHeight = 450;
const imageScaleFactor = 0.5;
const flipHorizontal = true; // since images are being fed from a webcam
const outputStride = 16;
const minPartConfidence = 0.5;
const minPoseConfidence = 0.1;
const radiusTarget = 50
const radiusForeheadCircle = 16

var xTargetCenter = Math.random() * (videoWidth - 20) + 10;
var yTargetCenter = Math.random() * (videoHeight - 20) + 10;

var score = 0
var timeStart

window.onload = function() {
    startScreen()
}

async function detectPoseInRealTime(canvas, context, video, net, image) {

    timeStart = Date.now();

    async function poseDetectionFrame() {
    
        pose = await net.estimateSinglePose(video, imageScaleFactor, flipHorizontal, outputStride);
    
        context.clearRect(0, 0, videoWidth, videoHeight);
    
        context.save();
        context.scale(-1, 1);
        context.translate(-videoWidth, 0);
        context.drawImage(video, 0, 0, videoWidth, videoHeight);
        context.restore();

        let xTargetCorner = xTargetCenter - radiusTarget;
        let yTargetCorner = yTargetCenter - radiusTarget;

        context.drawImage(image, xTargetCorner, yTargetCorner, radiusTarget*2, radiusTarget*2);

        // Draw forehead keypoint on canvas
        foreheadCoordinates = drawForeheadKeypoint(pose.keypoints, minPartConfidence, context, radiusForeheadCircle)

        // Draw score on canvas
        context.font = "20pt Calibri";
        context.fillStyle = "#00ff00";
        context.fillText("Score: " + score, 15, 30);

        // Draw keypoints on canvas
        drawKeypoints(pose.keypoints, minPartConfidence, context);
    
        // draw skeleton on canvas
        //drawSkeleton(pose.keypoints, minPoseConfidence, context);

        // Check if the target is hit
        if (foreheadCoordinates !== undefined) {

            let distCenters = Math.sqrt((xTargetCenter - foreheadCoordinates.x)**2 + (yTargetCenter - foreheadCoordinates.y)**2);

            if (distCenters < (radiusTarget + radiusForeheadCircle)) {
                console.log('hit!')
                // Update score
                score = score + 1

                // Generate new target coordinates
                xTargetCenter = Math.random() * videoWidth;
                yTargetCenter = Math.random() * videoHeight;
            }
        }

        let reqId = requestAnimationFrame(poseDetectionFrame);

        if (score === 5) {
            cancelAnimationFrame(reqId);
            stopGame(canvas, context, video);
        }
    }

    poseDetectionFrame();

}



async function startGame(canvas, context) {
    console.log('start game')

    // Play music sound
    //var audio = new Audio('./media/James Hype - Ferrari (Instrumental).mp3');
    //audio.play();

    // Start video from webcam
    let video;

    try {
      video = await loadVideo();
    } catch(e) {
      let info = document.getElementById('info');
      info.innerHTML = `<h5>This browser does not support video capture, or this device does not have a camera</h5>`;
      info.style.display = 'flex';
      throw e;
    }

    // Load the TensorFlow.js model
    const net = await posenet.load({
        inputResolution: { width: videoWidth, height: videoHeight },
        scale: imageScaleFactor,
        })
    console.log('model loaded')

    // Clear the canvas
    context.clearRect(0, 0, videoWidth, videoHeight);

    // image of the game
    const image = await loadImage('./media/football.png')

    detectPoseInRealTime(canvas, context, video, net, image)

}

async function stopGame(canvas, context) {
    // Stop video camera stream
    video.srcObject.getTracks().forEach(function(track) {
        track.stop();
      });

    let timeGame = Math.floor((Date.now() - timeStart) / 1000);

    // clear canvas
    context.clearRect(0, 0, videoWidth, videoHeight);

    // Add starting image and text to canvas
    const image = await loadImage('./media/deloitte.jpeg')

    context.drawImage(image, 0, 0, videoWidth, videoHeight);
    context.font = "20pt Calibri";
    context.fillStyle = "#00ff00";
    context.fillText("Congrats you made it in " + timeGame + " seconds!", 100, 100);
}

async function startScreen(){

    var canvas = document.querySelector('canvas');
    canvas.width  = videoWidth
    canvas.height = videoHeight

    var context = canvas.getContext('2d');

    // Add starting image and text to canvas
    const image = await loadImage('./media/deloitte.jpeg')

    context.drawImage(image, 0, 0, videoWidth, videoHeight);
    context.font = "30pt Calibri";
    context.fillStyle = "#00ff00";
    context.fillText("Start Game!", 100, 100);

    // Remove loading block and show game
    document.getElementById('main').style.display = 'block';

    canvas.addEventListener('click', function() {
        startGame(canvas, context)
    })
}