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

/**
 * Draw forehead keypoint onto a canvas
 */
function drawForeheadKeypoint(keypoints, minConfidence, context, radiusForeheadCircle) {
    let leftEye;
    let rightEye;
    let nose;
    let x;
    let y;

    for (let i = 0; i < keypoints.length; i++) {

        if (keypoints[i].part === 'leftEye') {
            leftEye = keypoints[i];
        } 
        else if (keypoints[i].part === 'rightEye') {
            rightEye = keypoints[i];
        }
        else if (keypoints[i].part === 'nose') {
            nose = keypoints[i];
        }
    }
    
    if (leftEye.score > minConfidence && rightEye.score > minConfidence && nose.score > minConfidence) {
        x = leftEye.position.x + rightEye.position.x - nose.position.x
        y = leftEye.position.y + rightEye.position.y - nose.position.y

        x = videoWidth - x; // Bug fix with horizontal flip
        context.beginPath();
        context.arc(x, y, radiusForeheadCircle, 0, 2 * Math.PI);
        context.fillStyle = "rgb(220,20,60, 0.4)";
        context.fill();

        return {x, y}
    }
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
  
      let { y, x } = keypoint.position;
      x = videoWidth - x; // Bug fix with horizontal flip
      context.beginPath();
      context.arc(x * scale, y * scale, 3, 0, 2 * Math.PI);
      context.fillStyle = "#00ff00";
      context.fill();
    }
}

/**
 * Draws a line on a canvas, i.e. a joint
 */
function drawSegment([ay, ax], [by, bx], scale, context) {
    context.beginPath();
    context.moveTo(ax * scale, ay * scale);
    context.lineTo(bx * scale, by * scale);
    context.lineWidth = 1;
    context.strokeStyle = "#00ff00";
    context.stroke();
}

function toTuple({ y, x }) {
    return [y, x];
}

/**
 * Draws a pose skeleton by looking up all adjacent keypoints/joints
 */
function drawSkeleton(keypoints, minConfidence, context, scale = 1) {
    const adjacentKeyPoints = posenet.getAdjacentKeyPoints(
      keypoints,
      minConfidence
    );
  
    adjacentKeyPoints.forEach((keypoints) => {
      drawSegment(
        toTuple(keypoints[0].position),
        toTuple(keypoints[1].position),
        scale,
        context
      );
    });
}

async function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener('load', () => resolve(img));
        img.addEventListener('error', () => {
            reject(new Error(`Failed to load ${url}`));
        });
        img.src = url;
    });
}