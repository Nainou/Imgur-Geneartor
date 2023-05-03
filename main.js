const imageBox = document.querySelector('.image-box');
const overlay = document.querySelector('.overlay');
const enlargedImage = document.querySelector('.enlarged-image');
const fail = document.getElementById("fail");
const checkbox1 = document.getElementById("nsfw");
const loaded = document.getElementById("loaded");
const loadtimer = document.getElementById("loadtime");
const processing_timer = document.getElementById("processing_time");
const loadbutton = document.getElementById("loadbutton");
const generatebutton = document.getElementById("generatebutton");
const nsfwbutton = document.getElementById("nsfwbutton");
const amountInput = document.getElementById("amount");
const pLimitInput = document.getElementById("pLimit");
let failAmount = 0;
let errorCounter = 0;
let currentIndex = 0;
let currentTime = new Date().getTime();
let lastTime = currentTime;
let totalTimeElapsed = 0;
let numImagesShown = 0;
let numProcesses = 0;
let emaFactor = 0.2; // Adjust this factor to control the degree of smoothing
let emaImagesPerSecond = 0;
let emaProcessesPerSecond = 0;

let NSFWfilter = false;
let NSFWmode = false;
let modelLoaded = false;
let _model

document.addEventListener('keydown', function (e) {
  if (e.key === 'ArrowLeft') {
    currentIndex--;
    if (currentIndex < 0) {
      currentIndex = document.querySelectorAll('.thumbnail').length - 1;
    }
    enlargedImage.innerHTML = '';
    let newImage = new Image();
    newImage.src = document.querySelectorAll('.thumbnail')[currentIndex].src;
    newImage.classList.add('enlarged');
    enlargedImage.appendChild(newImage);
  } else if (e.key === 'ArrowRight') {
    currentIndex++;
    if (currentIndex > document.querySelectorAll('.thumbnail').length - 1) {
      currentIndex = 0;
    }
    enlargedImage.innerHTML = '';
    let newImage = new Image();
    newImage.src = document.querySelectorAll('.thumbnail')[currentIndex].src;
    newImage.classList.add('enlarged');
    enlargedImage.appendChild(newImage);
  }
});

const modelFunc = async () => await nsfwjs.load();

async function initialLoad() {
  _model = await modelFunc();
  modelLoaded = true;
  loadbutton.disabled = true;
  generatebutton.disabled = false;
  if (!NSFWfilter) {
    nsfwbutton.disabled = false;
  }
  console.log("Model loaded");
}

function generateImages() {
  return new Promise((resolve, reject) => {
    let chars = '01234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghiklmnopqrstuvwxyz';
    let text = '';
    let stringlength = document.getElementById("stringlength").value;
    for (let j = 0; j < stringlength; j++) {
      let rnum = Math.floor(Math.random() * chars.length);
      text += chars.substring(rnum, rnum + 1);
    }
    let source = 'https://i.imgur.com/' + text + '.jpg';
    let image = new Image();
    image.crossOrigin = "anonymous";
    image.src = source;
    image.classList.add('thumbnail');



    image.addEventListener('click', function () {
      imageBox.style.filter = "blur(4px)";
      enlargedImage.innerHTML = '';
      let newImage = new Image();
      newImage.src = source;
      newImage.classList.add('enlarged');
      enlargedImage.appendChild(newImage);
      enlargedImage.style.display = 'block';
      overlay.style.display = 'block';
      let imageIndex = document.querySelectorAll('.thumbnail');
      currentIndex = Array.from(imageIndex).indexOf(image);
      image.addEventListener('mouseover', function () {
        this.style.maxWidth = '200%';
        this.style.maxHeight = '200%';
      });
      image.addEventListener('mouseout', function () {
        this.style.maxWidth = '100%';
        this.style.maxHeight = '100%';
      });
    });

    //check if the image is a 404, if it is, generate a new one
    image.addEventListener('error', function () {
      //errorCounter++;
      if (errorCounter >= 100) {
        fail.innerHTML = "You have been rate limited";
        return;
      }
      failAmount++;
      console.log(source + " url does not exist");
      fail.innerHTML = "Failed to load " + failAmount + " images";
      reject("Image not found");
      updateProcessTime();
    });

    image.onload = function () {
      if (this.width !== 161) {
        if (NSFWfilter) {

          tf.engine().startScope();
          _model.classify(image).then((predictions) => {
            let sorted = predictions.sort(function (a, b) {
              return b.probability - a.probability;
            });
            //if the image is classified as pornographic, generate a new one
            if (sorted[0].className == "Porn" || sorted[0].className == "Hentai" || sorted[0].className == "Sexy") {
              console.log(source + " image was NSFW")
              failAmount++;
              fail.innerHTML = "Failed to load " + failAmount + " images";
              setTimeout(function () {
                reject("Image not found");
              }, 100);
            } else {
              imageBox.appendChild(image);
              failAmount = 0;
              errorCounter = 0;
              updateLoadTime();
              updateProcessTime();
              resolve();
            }
          });
        } else if (NSFWmode) {
          tf.engine().startScope();
          _model.classify(image).then((predictions) => {
            let sorted = predictions.sort(function (a, b) {
              return b.probability - a.probability;
            });
            //if the image is classified as pornographic, generate a new one
            if (sorted[0].className !== "Porn") {
              console.log(source + " image was not NSFW")
              failAmount++;
              fail.innerHTML = "Failed to load " + failAmount + " images";
              reject("Image not found");
            } else {
              imageBox.appendChild(image);
              failAmount = 0;
              errorCounter = 0;
              updateLoadTime();
              updateProcessTime();
              resolve();
            }
          });
          tf.engine().endScope();

        } else {
          console.log(source + " found");
          imageBox.appendChild(image);
          failAmount = 0;
          errorCounter = 0;
          updateLoadTime();
          updateProcessTime();
          resolve();
        }
      } else {
        failAmount++;
        updateProcessTime();
        console.log(source + " does not exist");
        fail.innerHTML = "Failed to load " + failAmount + " images";
        reject("Image not found");
      }
    };
  }
  )
}

//disable button when clicked
generatebutton.addEventListener('click', function () {
  generatebutton.disabled = true;
  generatebutton.value = "Generating...";
  generatebutton.style.borderColor = "gray";
  generatebutton.style.pointerEvents = "none";
});

nsfwbutton.addEventListener('click', function () {
  nsfwbutton.disabled = true;
  nsfwbutton.value = "Generating...";
  nsfwbutton.style.color = "gray";
  nsfwbutton.style.borderColor = "gray";
  nsfwbutton.style.pointerEvents = "none";
});

checkbox1.addEventListener('click', function () {
  if (checkbox1.checked == false) {
    NSFWfilter = false;
    if (modelLoaded) {
      nsfwbutton.disabled = false;
    }
  } else {
    NSFWfilter = true;
    if (modelLoaded) {
      nsfwbutton.disabled = true;
    }
  }
  console.log(NSFWfilter);
});


overlay.addEventListener('click', function () {
  enlargedImage.style.display = 'none';
  overlay.style.display = 'none';
  imageBox.style.filter = "blur(0)";
});
enlargedImage.addEventListener('click', function () {
  enlargedImage.style.display = 'none';
  overlay.style.display = 'none';
  imageBox.style.filter = "blur(0)";
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    enlargedImage.style.display = 'none';
    overlay.style.display = 'none';
    imageBox.style.filter = "blur(0)";
  }
});

async function generateAll() {
  //empty the image box
  imageBox.innerHTML = "";
  numImagesShown=0;
  let imageAmount = amountInput.value;
  let pLimit = pLimitInput.value;
  let promiseFns = [];
  for (let i = 0; i < imageAmount; i++) {
    promiseFns.push(async () => {
      let imageLoaded = false;
      while (!imageLoaded) {
        try {
          await generateImages();
          imageLoaded = true;
        } catch (e) {
          imageLoaded = false;
        }
      }
    });
  }

  let funcs = promiseFns.map(fn => fn);
  while (funcs.length) {
    await Promise.all(funcs.splice(0, pLimit).map(f => f()));
  }
}

function generateNSFW() {
  NSFWmode = true;
  generateAll();
}

//update when an image is succefully loaded
function updateLoadTime() {
  let now = new Date().getTime();
  let timeElapsed = (now - lastTime) / 1000;
  let instantImagesPerSecond = 1 / (timeElapsed || 1);
  emaImagesPerSecond = emaFactor * instantImagesPerSecond + (1 - emaFactor) * emaImagesPerSecond; // EMA calculation
  totalTimeElapsed += timeElapsed;
  numImagesShown++;
  let avgTimePerImage = totalTimeElapsed / numImagesShown;
  loadtimer.innerHTML = `Last image: ${timeElapsed.toFixed(3)}s - FPS: ${emaImagesPerSecond.toFixed(2)} - Avg. time: ${avgTimePerImage.toFixed(3)}s`;
  lastTime = now;
  loaded.innerHTML = numImagesShown + "/" + amountInput.value;
  //if all images are loaded, enable the button again
  if (numImagesShown == amountInput.value) {
    generatebutton.disabled = false;
    generatebutton.value = "Generate Images";
    generatebutton.style.borderColor = "white";
    generatebutton.style.pointerEvents = "auto";
    nsfwbutton.disabled = false;
    nsfwbutton.value = "Generate NSFW";
    nsfwbutton.style.color = "white";
    nsfwbutton.style.borderColor = "white";
    nsfwbutton.style.pointerEvents = "auto";
    NSFWmode = false;
  }
}

function updateProcessTime() {
  let now = new Date().getTime();
  let timeElapsed = (now - lastTime) / 1000;
  let instantProcessesPerSecond = 1 / (timeElapsed || 1);
  emaProcessesPerSecond = emaFactor * instantProcessesPerSecond + (1 - emaFactor) * emaProcessesPerSecond; // EMA calculation
  totalTimeElapsed += timeElapsed;
  numProcesses++;
  let avgTimePerProcess = totalTimeElapsed / numProcesses;
  processing_timer.innerHTML = `Last process: ${timeElapsed.toFixed(3)}s - FPS: ${emaProcessesPerSecond.toFixed(2)} - Avg. time: ${avgTimePerProcess.toFixed(3)}s`;
  lastTime = now;
}