const imageBox = document.querySelector('.image-box');
const overlay = document.querySelector('.overlay');
const enlargedImage = document.querySelector('.enlarged-image');
const fail = document.getElementById("fail");
const checkbox1 = document.getElementById("nsfw");
const timer = document.getElementById("time");
const cardLimit = 99;
const cardIncrease = 9;
const pageCount = Math.ceil(cardLimit / cardIncrease);
let failAmount = 0;
let currentPage = 1;
let errorCounter = 0;
let currentIndex = 0;
let currentTime = new Date().getTime();
let lastTime = currentTime;
let totalTimeElapsed = 0;
let numImagesShown = 0;
let emaFactor = 0.2; // Adjust this factor to control the degree of smoothing
let emaImagesPerSecond = 0; // Initial value for EMA

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
    errorCounter++;
    if (errorCounter >= 100) {
      fail.innerHTML = "You have been rate limited";
      return;
    }
    failAmount++;
    console.log(source + " url does not exist");
    fail.innerHTML = "Failed to load " + failAmount + " images";
    reject("Image not found");
      reject("Image not found");
  });

  image.onload = function () {
    if (this.width !== 161) {
      if (checkbox1.checked == true) {
        nsfwjs.load().then((model) => {
          model.classify(image).then((predictions) => {
            let sorted = predictions.sort(function (a, b) {
              return b.probability - a.probability;
            });
            //if the image is classified as pornographic, generate a new one
            if (sorted[0].className == "Porn" || sorted[0].className == "Sexy" || sorted[0].className == "Hentai") {
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
              updateTime()
              resolve();
            }
          });
        });
      }  else {
        console.log(source + " found");
        imageBox.appendChild(image);
        failAmount = 0;
        errorCounter = 0;
        fail.innerHTML = "";
        updateTime()
        resolve();
      }
    } else {
      failAmount++;
      console.log(source + " does not exist");
      fail.innerHTML = "Failed to load " + failAmount + " images";
      reject("Image not found");
    }
  };
}
)}

const handleInfiniteScroll = () => {
  const endOfPage = window.innerHeight + window.pageYOffset >= document.body.offsetHeight;
  if (endOfPage && currentPage < pageCount) {
    for (let i = 0; i < 10; i++) {
      failAmount = 0;
      generateImages();
    }
  }
};

//event listeners
window.addEventListener('scroll', function () {
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
    handleInfiniteScroll();
  }
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
  for (let i = 0; i < 112; i++) {
    let imageLoaded = false;
    while (!imageLoaded) {
      try {
        await generateImages();
        imageLoaded = true;
      } catch (e) {
        imageLoaded = false;
      }
  }
}
}

function updateTime() {
  let now = new Date().getTime();
  let timeElapsed = (now - lastTime) / 1000; // convert milliseconds to seconds
  let instantImagesPerSecond = 1 / (timeElapsed || 1);
  emaImagesPerSecond = emaFactor * instantImagesPerSecond + (1 - emaFactor) * emaImagesPerSecond; // EMA calculation
  totalTimeElapsed += timeElapsed;
  numImagesShown++;
  let avgTimePerImage = totalTimeElapsed / numImagesShown;
  timer.innerHTML = `Last image: ${timeElapsed.toFixed(3)}s - FPS: ${emaImagesPerSecond.toFixed(2)} - Avg. time: ${avgTimePerImage.toFixed(3)}s`;
  lastTime = now;
}