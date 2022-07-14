const imageScaleFactor = 0.5;
const flipHorizontal = true; // since images are being fed from a webcam
const outputStride = 16;
const minPartConfidence = 0.5;
const minPoseConfidence = 0.1;
const radiusTarget = 50
const radiusForeheadCircle = 16

const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');
const videoHeight = canvas.clientHeight
const videoWidth = canvas.clientWidth

let timeStart;

window.onload = function() {
    startScreen()
}

async function detectPoseInRealTime(video, net, image) {

    // Initialize score and time of the game
    var score = 0;
    timeStart = Date.now();

    // Make sure that the target doesn't get too close to the boundaries of the game
    var xTargetCenter = Math.random() * (videoWidth - 40) + 20;
    var yTargetCenter = Math.random() * (videoHeight - 40) + 20;

    async function poseDetectionFrame() {
    
        // Perform pose estimation to get the coordinates of body parts
        pose = await net.estimateSinglePose(video, imageScaleFactor, flipHorizontal, outputStride);
    
        // Clear canvas
        context.clearRect(0, 0, videoWidth, videoHeight);
    
        // Draw image from video camera on canvas
        context.save();
        context.scale(-1, 1);
        context.translate(-videoWidth, 0);
        context.drawImage(video, 0, 0, videoWidth, videoHeight);
        context.restore();

        // Define the left corner coordinates of the target
        let xTargetCorner = xTargetCenter - radiusTarget;
        let yTargetCorner = yTargetCenter - radiusTarget;

        // Draw the target image on canvas
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

            // Calculate difference between the center of the users forehead and target
            let distCenters = Math.sqrt((xTargetCenter - foreheadCoordinates.x)**2 + (yTargetCenter - foreheadCoordinates.y)**2);

            // Check if the target is hit
            if (distCenters < (radiusTarget + radiusForeheadCircle)) {
                console.log('hit!')
                // Update score
                score = score + 1

                // Generate new target coordinates that are not too close to the previous ones
                var xTargetCenterNew = xTargetCenter;
                var yTargetCenterNew = yTargetCenter;
                while (Math.sqrt((xTargetCenter - xTargetCenterNew)**2 + (yTargetCenter - yTargetCenterNew)**2) < 100) {
                    xTargetCenterNew = Math.random() * (videoWidth - 40) + 20;
                    yTargetCenterNew = Math.random() * (videoHeight - 40) + 20;
                }
                xTargetCenter = xTargetCenterNew
                yTargetCenter = yTargetCenterNew
            }
        }

        // Invoke the poseDetectionFrame function for each incoming image from the video camera
        let reqId = requestAnimationFrame(poseDetectionFrame);

        // End game at a score of 5
        if (score === 5) {
            cancelAnimationFrame(reqId);
            stopGame(video, net);
        }
    }

    // Clear the canvas
    context.clearRect(0, 0, videoWidth, videoHeight);

    poseDetectionFrame();

}

async function startGame(net) {
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

    console.log('video ready')

    // image of the game
    const image = await loadImage('./media/football.png')

    // Start function that performs the real-time video processing
    detectPoseInRealTime(video, net, image)
}

async function stopGame(video, net) {
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
    context.fillText("Please click to start over", 100, 150);

    // Add eventlistener that starts the game when user clicks and is removed after click
    function startGameListener() {
        startGame(net);
        canvas.removeEventListener('click', startGameListener);
        canvas.style.cursor = "auto";
    }

    canvas.addEventListener('click', startGameListener);
    canvas.style.cursor = "pointer";
}


async function startScreen(){

    // Make sure that canvas has the correct size
    canvas.width  = videoWidth
    canvas.height = videoHeight

    // Add starting image to the canvas
    const image = await loadImage('./media/deloitte.jpeg')
    context.drawImage(image, 0, 0, videoWidth, videoHeight);

    // Load the TensorFlow.js model
    const net = await posenet.load({
        inputResolution: { width: videoWidth, height: videoHeight },
        scale: imageScaleFactor,
        })
    console.log('model loaded')

    // Add starting text to the canvas
    context.font = "30pt Calibri";
    context.fillStyle = "#00ff00";
    context.fillText("Start Game!", 100, 100);

    // Remove loading block and show game
    document.getElementById('main').style.display = 'block';

    // Add eventlistener that starts the game when user clicks and is removed after click
    function startGameListener() {
        startGame(net);
        canvas.removeEventListener('click', startGameListener);
        canvas.style.cursor = "auto";
    }

    canvas.addEventListener('click', startGameListener);
    canvas.style.cursor = "pointer";
}