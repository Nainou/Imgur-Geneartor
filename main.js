const imageBox = document.querySelector('.image-box');
const overlay = document.querySelector('.overlay');
const enlargedImage = document.querySelector('.enlarged-image');
const fail=document.getElementById("fail");
const cardLimit = 99;
const cardIncrease = 9;
const pageCount = Math.ceil(cardLimit / cardIncrease);
let failAmount=0;
let currentPage = 1;
let errorCounter = 0;
let currentIndex = 0;
let checkCount = 0;
let lastChecked = 0;

document.addEventListener('keydown', function(e) {
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
    let chars = '01234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghiklmnopqrstuvwxyz'; 
    let text = '';
    let stringlength=document.getElementById("stringlength").value;
    for (let j = 0; j < stringlength; j++) {
      let rnum = Math.floor(Math.random() * chars.length);
      text += chars.substring(rnum,rnum+1);
    }
    let source = 'https://i.imgur.com/' + text + '.jpg';
    let image = new Image();
    image.src = source;
    console.log(source);
    image.classList.add('thumbnail');
    image.addEventListener('click', function() {
      imageBox.style.filter="blur(4px)";
      enlargedImage.innerHTML = '';
      let newImage = new Image();
      newImage.src = source;
      newImage.classList.add('enlarged');
      enlargedImage.appendChild(newImage);
      enlargedImage.style.display = 'block';
      overlay.style.display = 'block';
      let imageIndex = document.querySelectorAll('.thumbnail');
      currentIndex = Array.from(imageIndex).indexOf(image);
      image.addEventListener('mouseover', function() {
        this.style.maxWidth = '200%';
        this.style.maxHeight = '200%';
      });
      image.addEventListener('mouseout', function() {
        this.style.maxWidth = '100%';
        this.style.maxHeight = '100%';
      });
    });
    
    //check if the image is a 404, if it is, generate a new one
    image.addEventListener('error', function() {
      errorCounter++;
      if (errorCounter >= 100) {
        fail.innerHTML="You have been rate limited";
        return;
      }
      failAmount++;
      setTimeout(function() {
        generateImages();
      }, 1000);
        fail.innerHTML="Failed to load "+failAmount+" images";
    });

    image.onload = function() {
      if (this.width !== 161) {
        imageBox.appendChild(image);
        fail.innerHTML="";
        failAmount=0;
        errorCounter = 0;
      } else {
        if(stringlength>5){
        setTimeout(function() {
        generateImages();
      }, 1000);
    }else{
      generateImages();
    }
        failAmount++;
        fail.innerHTML="Failed to load "+failAmount+" images";
      }
    };
}

const handleInfiniteScroll = () => {
  const endOfPage = window.innerHeight + window.pageYOffset >= document.body.offsetHeight;
  if (endOfPage && currentPage < pageCount) {
    for (let i = 0; i < 10; i++) {
      failAmount=0;
    generateImages();
    }
  }
};

//event listeners
window.addEventListener('scroll', function() {
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
    handleInfiniteScroll();
  }
});

overlay.addEventListener('click', function() {
  enlargedImage.style.display = 'none';
  overlay.style.display = 'none';
imageBox.style.filter="blur(0)";
});
enlargedImage.addEventListener('click', function() {
  enlargedImage.style.display = 'none';
  overlay.style.display = 'none';
imageBox.style.filter="blur(0)";
});

//add event listener to esc to close the overlay
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    enlargedImage.style.display = 'none';
    overlay.style.display = 'none';
imageBox.style.filter="blur(0)";
  }
});

function generateAll(){
  for (let i = 0; i < 112; i++) {
    failAmount=0;
    generateImages();
  }
}