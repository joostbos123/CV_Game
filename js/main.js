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

function isAndroid() {
    return /Android/i.test(navigator.userAgent);
  }
  
  function isiOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }
  
  function isMobile() {
    return isAndroid() || isiOS();
  }
  
  /**
   * Loads a the camera to be used in the demo
   *
   */
async function setupCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw 'Browser API navigator.mediaDevices.getUserMedia not available';
    }
  
    const video = document.getElementById('video');
    video.width = videoWidth;
    video.height = videoHeight;
  
    const mobile = isMobile();
    const stream = await navigator.mediaDevices.getUserMedia({
      'audio': false,
      'video': {
        facingMode: 'user',
        width: mobile ? undefined : videoWidth,
        height: mobile ? undefined: videoHeight}
    });
    video.srcObject = stream;
  
    return new Promise(resolve => {
      video.onloadedmetadata = () => {
        resolve(video);
      };
    });
}
  
async function loadVideo() {
    const video = await setupCamera();
    video.play();
  
    return video;
}

function draw(video, canvas, context, frameRate) {
    // Draw video on canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Make sure the contxt gets updated with the latest video image
    setTimeout(draw, 1/frameRate, video, canvas, context, frameRate);
}

/**
 * Draw pose keypoints onto a canvas
 */
function drawKeypoints(keypoints, minConfidence, context, scale = 1) {
    for (let i = 0; i < keypoints.length; i++) {
      const keypoint = keypoints[i];
  
      if (keypoint.score < minConfidence) {
        continue;
      }
  
      const { y, x } = keypoint.position;
      context.beginPath();
      context.arc(x * scale, y * scale, 3, 0, 2 * Math.PI);
      context.fillStyle = "#00ff00";
      context.fill();
    }
}

/**
 * Draws a line on a canvas, i.e. a joint
 */
function drawSegment([ay, ax], [by, bx], scale, ctx) {
    ctx.beginPath();
    ctx.moveTo(ax * scale, ay * scale);
    ctx.lineTo(bx * scale, by * scale);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#00ff00";
    ctx.stroke();
}

function toTuple({ y, x }) {
    return [y, x];
}

/**
 * Draws a pose skeleton by looking up all adjacent keypoints/joints
 */
function drawSkeleton(keypoints, minConfidence, ctx, scale = 1) {
    const adjacentKeyPoints = posenet.getAdjacentKeyPoints(
      keypoints,
      minConfidence
    );
  
    adjacentKeyPoints.forEach((keypoints) => {
      drawSegment(
        toTuple(keypoints[0].position),
        toTuple(keypoints[1].position),
        scale,
        ctx
      );
    });
}

async function detectPoseInRealTime(canvas, context, video, net) {
    console.log('detecting pose')

    pose = await net.estimateSinglePose(video, imageScaleFactor, flipHorizontal, outputStride);
    console.log(pose)
    console.log(pose.keypoints)
    console.log(pose.minPartConfidence)


    // Draw video on canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw keypoints on canvas
    drawKeypoints(pose.keypoints, pose.minPartConfidence, context);

    // draw skeleton on canvas
    drawSkeleton(pose.keypoints, pose.minPartConfidence, context)

    // // Make sure the function runs for the latest video image
    // setTimeout(detectPoseInRealTime, 1/frameRate, video, canvas, context, frameRate);
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

    detectPoseInRealTime(canvas, context, video, net)

}