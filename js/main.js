
document.addEventListener('DOMContentLoaded', () => {
  initNavScroll();
  initSpeedLines();
  initScrollReveal();
  initHorizontalGallery();
  initLiquidInverseCanvas();
});

// NAV SCROLL
function initNavScroll() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
  });
}

// SPEED LINES
function initSpeedLines() {
  const container = document.querySelector('.hero-lines');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < 14; i++) {
    const line = document.createElement('span');
    line.style.cssText = `top:${Math.random()*100}%;animation-delay:${Math.random()*3}s;animation-duration:${2+Math.random()*2}s;`;
    container.appendChild(line);
  }
}

// SCROLL REVEAL
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
}

// HORIZONTAL GALLERY
function initHorizontalGallery() {
  const track = document.getElementById('gallery-track');
  const wrapper = document.querySelector('.gallery-track-wrapper');
  const progressBar = document.getElementById('gallery-progress-bar');
  if (!track || !wrapper) return;

  window.addEventListener('scroll', () => {
    const rect = wrapper.getBoundingClientRect();
    const wrapperH = wrapper.offsetHeight - window.innerHeight;
    const scrolled = -rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / wrapperH));
    const maxSlide = track.scrollWidth - window.innerWidth + 96;
    track.style.transform = `translateX(-${progress * maxSlide}px)`;
    if (progressBar) progressBar.style.width = (progress * 100) + '%';
  });
}

// INVERSE COMPOSITING LIQUID BLOB TRAIL ENGINE (NO BORDER + 1.75X SCALE + CLEAN EXIT)
function initLiquidInverseCanvas() {
  const canvas = document.getElementById('hero-canvas');
  const visualArea = document.querySelector('.hero-visual-area');
  if (!canvas || !visualArea) return;

  const ctx = canvas.getContext('2d');

  // Load Assets
  const ganpatiImg = new Image();
  ganpatiImg.src = 'images/ganpati.png';

  const groupImg = new Image();
  groupImg.src = 'images/group.jpg';

  let imagesLoaded = false;
  let nativeW = 0;
  let nativeH = 0;

  groupImg.onload = () => {
    nativeW = groupImg.naturalWidth;
    nativeH = groupImg.naturalHeight;
    canvas.width = nativeW;
    canvas.height = nativeH;
    imagesLoaded = true;
  };

  let mouse = { x: -9999, y: -9999 };
  let smoothMouse = { x: -9999, y: -9999 };
  let isOver = false;

  // Trail System Variables
  let trail = [];
  const TRAIL_LENGTH = 55; 
  
  // Dynamic scaling variables to allow clean evaporation
  let currentRadius = 0;
  const TARGET_RADIUS = 630; 

  visualArea.addEventListener('mouseenter', () => { 
    isOver = true; 
  });
  
  visualArea.addEventListener('mouseleave', () => { 
    isOver = false; 
  });

  visualArea.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = nativeW / rect.width;
    const scaleY = nativeH / rect.height;

    mouse.x = (e.clientX - rect.left) * scaleX;
    mouse.y = (e.clientY - rect.top) * scaleY;
  });

  let timeClock = 0;

  // Custom 24-point organic liquid layout generator
  function drawWobblyPath(contextTarget, centerX, centerY, radiusIn, customSeed) {
    const numPoints = 24;
    contextTarget.beginPath();
    
    let points = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      
      const wave1 = Math.sin(angle * 3 + timeClock + customSeed) * 35;
      const wave2 = Math.cos(angle * 2 - timeClock * 1.5) * 15;
      const r = Math.max(1, radiusIn + wave1 + wave2);
      
      points.push({
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r
      });
    }

    contextTarget.moveTo((points[numPoints - 1].x + points[0].x) / 2, (points[numPoints - 1].y + points[0].y) / 2);
    for (let i = 0; i < numPoints; i++) {
      const current = points[i];
      const next = points[(i + 1) % numPoints];
      contextTarget.quadraticCurveTo(current.x, current.y, (current.x + next.x) / 2, (current.y + next.y) / 2);
    }
    contextTarget.closePath();
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  // Animation Frame Loop
  function draw() {
    if (!imagesLoaded) {
      requestAnimationFrame(draw);
      return;
    }

    timeClock += 0.02;
    ctx.clearRect(0, 0, nativeW, nativeH);

    // Smoothly scale the base radius to 0 when mouse leaves, and up to 630 when inside
    currentRadius = lerp(currentRadius, isOver ? TARGET_RADIUS : 0, 0.12);

    // Positions tracking configurations
    if (smoothMouse.x === -9999) {
      smoothMouse.x = mouse.x;
      smoothMouse.y = mouse.y;
    } else {
      // FIX: If mouse leaves, pull the tracking head cleanly into the retreating tail
      const targetX = isOver ? mouse.x : (trail.length > 0 ? trail[0].x : mouse.x);
      const targetY = isOver ? mouse.y : (trail.length > 0 ? trail[0].y : mouse.y);
      
      smoothMouse.x += (targetX - smoothMouse.x) * 0.13;
      smoothMouse.y += (targetY - smoothMouse.y) * 0.13;
    }

    // Capture positioning history array nodes
    if (isOver || currentRadius > 5) {
      trail.unshift({ x: smoothMouse.x, y: smoothMouse.y });
      if (trail.length > TRAIL_LENGTH) {
        trail.length = TRAIL_LENGTH;
      }
    }

    // Smoothly slice down trail length when mouse leaves to avoid ghost trails lingering
    if (!isOver && trail.length > 0) {
      trail.pop();
    }

    //   MAIN RENDER PIPELINE STAGES  

    // STAGE 1: Draw foreground cutout flat on backdrop
    ctx.globalCompositeOperation = 'source-over';
    if (ganpatiImg.complete) {
      ctx.drawImage(ganpatiImg, 0, 0);
    }

    // Only invoke compositing layers if the liquid mask has a visible volume profile
    if (trail.length > 0 && currentRadius > 2) {
      // STAGE 2: Allocate temporary offscreen drawing channel map
      const offscreen = document.createElement('canvas');
      offscreen.width = nativeW;
      offscreen.height = nativeH;
      const off = offscreen.getContext('2d');

      // Loop through history track from oldest to newest to generate smooth alpha layer masking
      for (let i = trail.length - 1; i >= 0; i--) {
        const t = 1 - i / trail.length;
        const r = currentRadius * (0.15 + 0.85 * t); // Scales proportionally with the dynamic currentRadius
        const alpha = Math.pow(t, 1.8);
        
        off.save();
        drawWobblyPath(off, trail[i].x, trail[i].y, r, i * 0.15);
        off.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        off.fill();
        off.restore();
      }

      // STAGE 3: Inverse crop group image inside the composite channel mask layout window
      off.globalCompositeOperation = 'source-in';
      if (groupImg.complete) {
        off.drawImage(groupImg, 0, 0);
      }

      // STAGE 4: Stamp offscreen composited path tracks directly inside the master viewport display
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(offscreen, 0, 0);
    }

    requestAnimationFrame(draw);
  }

  if (groupImg.complete && groupImg.naturalWidth > 0) {
    nativeW = groupImg.naturalWidth;
    nativeH = groupImg.naturalHeight;
    canvas.width = nativeW;
    canvas.height = nativeH;
    imagesLoaded = true;
  }

  draw();
}

// HYPER-EXTENDED HORIZONTAL STRIP SCROLL ENGINE
function initAlternatingGallery() {
  const rows = document.querySelectorAll('.moment-row-wrapper');
  
  window.addEventListener('scroll', () => {
    const windowHeight = window.innerHeight;

    rows.forEach(row => {
      const rect = row.getBoundingClientRect();
      
    
      if (rect.top < windowHeight && rect.bottom > 0) {
        const strip = row.querySelector('.moment-strip');
        if (!strip) return;

        const totalStripWidth = strip.offsetWidth;
        const viewportWidth = window.innerWidth;
        
      
        const paddingBuffer = 130; 
        const hiddenWidth = (totalStripWidth - viewportWidth) + paddingBuffer;

        if (hiddenWidth <= paddingBuffer) {
          strip.style.transform = 'translateX(0px)';
          return;
        }

        // SCROLL PROGRESS MATRIX (0 to 1)
        const totalDuration = windowHeight + rect.height;
        const currentProgress = (windowHeight - rect.top) / totalDuration;
        
        
        const maxTravelRange = hiddenWidth * 1.45;
        const movement = (currentProgress - 0.15) * maxTravelRange; 

        
        const finalTranslation = Math.max(0, Math.min(movement, hiddenWidth - paddingBuffer));

      
        const direction = row.getAttribute('data-dir');
        if (direction === 'left') {
          
          strip.style.transform = `translateX(${-finalTranslation}px)`;
        } else {
          
          const startOffset = -(hiddenWidth - paddingBuffer);
          strip.style.transform = `translateX(${startOffset + finalTranslation}px)`;
        }
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', initAlternatingGallery);


function initAllMomentsMarquees() {
  const tracks = document.querySelectorAll('.moments-marquee-track');
  if (!tracks.length) return;

  // 1. Instantly trigger the native hardware-accelerated CSS loops
  tracks.forEach(track => {
    const parentRow = track.closest('.moment-row-wrapper');
    const direction = parentRow ? parentRow.getAttribute('data-dir') : 'left';
    
    if (direction === 'right') {
      track.classList.add('move-right', 'autoplay-active');
    } else {
      track.classList.add('move-left', 'autoplay-active');
    }
  });

  // 2. SMOOTH VELOCITY INTERPOLATION
  
  let targetVelocity = 0;
  let currentVelocity = 0;
  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    const delta = Math.abs(currentScrollY - lastScrollY);
    lastScrollY = currentScrollY;

    // Map scroll intensity to a controllable momentum multiplier
    targetVelocity = Math.min(1.8, delta * 0.08);
  }, { passive: true });

  // 3. HARDWARE-ACCELERATED TRANSFORMATION TICKER
  function smoothUpdateTick() {
    // Linear interpolation (lerp) softens abrupt scroll stops to prevent snapping
    currentVelocity += (targetVelocity - currentVelocity) * 0.1;
    targetVelocity *= 0.92; // Decay factor

    tracks.forEach(track => {
      if (currentVelocity > 0.01) {
        const parentRow = track.closest('.moment-row-wrapper');
        const direction = parentRow ? parentRow.getAttribute('data-dir') : 'left';
        
        
        const skewAngle = direction === 'left' ? currentVelocity * -1.5 : currentVelocity * 1.5;
        const pushTranslate = direction === 'left' ? currentVelocity * -25 : currentVelocity * 25;
        
        track.style.transform = `skewX(${skewAngle}deg) translateX(${pushTranslate}px)`;
      } else {
        // Reset directly to base animation state when idle to prevent element drift
        track.style.transform = 'skewX(0deg) translateX(0px)';
      }
    });

    requestAnimationFrame(smoothUpdateTick);
  }

  requestAnimationFrame(smoothUpdateTick);
}

document.addEventListener('DOMContentLoaded', initAllMomentsMarquees);


function initScheduleScrollTrigger() {

  const scheduleCards = document.querySelectorAll('.events-grid .event-card');
  const galleryRows = document.querySelectorAll('.moment-row-wrapper');

  if (!scheduleCards.length) return;

  scheduleCards.forEach(card => {
   
    card.style.cursor = 'pointer';

    card.addEventListener('click', () => {
       
      const titleElement = card.querySelector('.event-title');
      if (!titleElement) return;
      
      let cardText = titleElement.textContent.trim().toLowerCase();

      
      if (cardText.includes('arrival')) {
        cardText = 'sthapana';
      } else if (cardText.includes('cultural')) {
        cardText = 'cultural night';
      } else if (cardText.includes('prasad') || cardText.includes('maha')) {
        cardText = 'mahaprasad';
      } else if (cardText.includes('checkup') || cardText.includes('competition')) {
        cardText = 'competitions';
      } else if (cardText.includes('visarjan')) {
        cardText = 'visarjan';
      }

      
      let matchRow = null;
      galleryRows.forEach(row => {
        const rowTitle = row.querySelector('.moment-row-title');
        if (rowTitle && rowTitle.textContent.trim().toLowerCase().includes(cardText)) {
          matchRow = row;
        }
      });

      // Execute smooth, precise positioning glide down the page
      if (matchRow) {
        const topGapOffset = 100; 
        const elementTopPos = matchRow.getBoundingClientRect().top + window.scrollY;
        
        window.scrollTo({
          top: elementTopPos - topGapOffset,
          behavior: 'smooth'
        });
      }
    });
  });
}


document.addEventListener('DOMContentLoaded', initScheduleScrollTrigger);


