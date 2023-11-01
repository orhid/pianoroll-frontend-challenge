import PianoRoll from './pianoroll.js';

// # useful elements
const pianoRollSpotlight = document.getElementById('pianoRollSpotlight');
const pianoRollGrid = document.getElementById('pianoRollGrid');
let canvas;
let context;

// # globals
let start = {};
let selections = [];

// # helper functions

function putMeInSpotlight() {
  // remove previous piano roll from spotlight, if any
  while (pianoRollSpotlight.firstChild) {
    const child = pianoRollSpotlight.firstChild;
    child.addEventListener('click', putMeInSpotlight);
    child.firstChild.removeChild(document.getElementById('selections'));
    pianoRollSpotlight.removeChild(child);
    pianoRollGrid.appendChild(child);
  }

  // apend to spotlight
  this.removeEventListener('click', putMeInSpotlight);
  pianoRollSpotlight.appendChild(this);

  // create canvas for selection feature
  canvas = document.createElement('canvas');
  context = canvas.getContext('2d');
  selections = []; // clear selections from previous selection

  canvas.id = 'selections';
  canvas.addEventListener('mouseup', endSelection);
  canvas.addEventListener('mousedown', startSelection);
  canvas.addEventListener('mousemove', drawMove);

  this.firstChild.appendChild(canvas);
}

// using 'evnt' since 'event' is a keyword
function getMousePosition(canvas, evnt) { 
  let selection = canvas.getBoundingClientRect();
  return {
    x: (evnt.clientX - selection.left) * canvas.width / selection.width,
    y: (evnt.clientY - selection.top) * canvas.height / selection.height,
  };
}

function startSelection(evnt) {
  start = getMousePosition(canvas, evnt);
}

function endSelection(evnt) {
  let { x, y } = getMousePosition(canvas, evnt);
  selections.push({x: start.x, y: 0, width: x - start.x, height: canvas.height});
  console.log(start.x, x-start.x); // print output
  start = {};
  draw();
}

function drawMove(evnt) {
  if (start.x) {
    draw()
    let { x, y } = getMousePosition(canvas, evnt)
    context.fillStyle = 'rgba(148, 64, 56, 0.72)';
    context.fillRect(start.x, 0, x - start.x, canvas.height);
  }
}

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  selections.forEach(rect => {
    context.fillStyle = 'rgba(148, 64, 56, 0.48)';
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
  }); 
}

// - - -

class PianoRollDisplay {
  constructor(csvURL) {
    this.csvURL = csvURL;
    this.data = null;
  }

  async loadPianoRollData() {
    try {
      const response = await fetch('https://pianoroll.ai/random_notes');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      this.data = await response.json();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  preparePianoRollCard(rollId) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('piano-roll-card');
    cardDiv.style.order = `${rollId}`;

    // Create and append other elements to the card container as needed

    // create container for svg and canvas to hack overlay
    const canvasAndSVGContainerDiv = document.createElement('div');
    canvasAndSVGContainerDiv.classList.add('canvas-and-svg-container-hack');
    cardDiv.appendChild(canvasAndSVGContainerDiv);

    // create and append the SVG to the card container
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('piano-roll-svg');
    canvasAndSVGContainerDiv.appendChild(svg);

    // create and append the description to the card container
    const descriptionDiv = document.createElement('div');
    descriptionDiv.classList.add('description');
    descriptionDiv.textContent = `This is a piano roll number ${rollId}`;
    cardDiv.appendChild(descriptionDiv);

    // add event listener for spotlight
    cardDiv.addEventListener('click', putMeInSpotlight);

    return { cardDiv, svg }
  }

  async generateSVGs() {
    if (!this.data) await this.loadPianoRollData();
    if (!this.data) return;
    
    pianoRollGrid.innerHTML = '';
    for (let it = 0; it < 20; it++) {
      const start = it * 60;
      const end = start + 60;
      const partData = this.data.slice(start, end);

      const { cardDiv, svg } = this.preparePianoRollCard(it)

      pianoRollGrid.appendChild(cardDiv);
      const roll = new PianoRoll(svg, partData);
    }
  }
}

document.getElementById('loadCSV').addEventListener('click', async function() {
  const csvToSVG = new PianoRollDisplay();
  await csvToSVG.generateSVGs();
  this.style.display = 'none';
});
