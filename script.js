// Initialize the force-directed graph
const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const context = canvas.getContext("2d");
const timelineButton = document.getElementById("timelineDropdown");
const styleDropdown = document.getElementById("styleDropdown");
const genreButton = document.getElementById("genreDropdown");
const techniqueDropdown = document.getElementById("techniqueDropdown");
const locationDropdown = document.getElementById("locationDropdown");
const creatorButton = document.getElementById("creatorDropdown");

let simulation;
let nodes = [];
let links = [];
let groupLabels = {};

fetch("metadata.json")
  .then((response) => response.json())
  .then((data) => {
    const imageLoadPromises = data.map((item) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = getThumbnailUrl(item.id);
        img.onload = function () {
          nodes.push({
            id: item.id,
            type: "canvas",
            label: item.title,
            image: img,
            date: item["created date"],
            timeline: item["created date"],
            style: item["style"],
            genre: item["genre"],
            technique: item["technique"],
            location: item["location"],
            creator: item["creator"],
          });
          resolve();
        };
        img.onerror = reject;
      });
    });

    Promise.all(imageLoadPromises)
      .then(() => {
        nodes.forEach((nodeA) => {
          nodes.forEach((nodeB) => {
            if (nodeA.date === nodeB.date && nodeA.id !== nodeB.id) {
              links.push({ source: nodeA.id, target: nodeB.id });
            }
          });
        });
        console.log(nodes)
        renderGraph(nodes, links, canvas, context);

        timelineButton.addEventListener("click", () => applyForce(nodes, "timeline"));
        creatorButton.addEventListener("click", () => applyForce(nodes, "creator"));
        genreButton.addEventListener("click", () => applyForce(nodes, "genre"));
      })
      .catch((error) => {
        console.error("Error loading images:", error);
      });
  })
  .catch((error) => {
    console.error("Error fetching JSON data:", error);
  });

function getThumbnailUrl(fullImageUrl) {
  return fullImageUrl.replace("/full/full/0/default.jpg", "/full/200,/0/default.jpg");
}

function applyForce(nodes, category) {
  const xCenter = getCategoryCenters(nodes, category, 150); // Increase spacing
  simulation
    .force("x", d3.forceX().x((d) => xCenter[d[category]]).strength(0.5)) // Stronger force
    .force("y", d3.forceY(canvas.height / 2).strength(0.1))
    .force("collision", d3.forceCollide().radius(55)) // Increase collision radius
    .alpha(1)
    .restart();

  simulation.on("end", () => {
    groupLabels = getGroupLabels(nodes, category, xCenter);
    draw(); // Redraw the canvas with the updated labels
  });
}

function getCategoryCenters(nodes, category, spacing) {
  const uniqueValues = Array.from(new Set(nodes.map(node => node[category])));
  const xCenter = {};
  uniqueValues.forEach((value, index) => {
    xCenter[value] = (index + 1) * (spacing * 2); // More spacing between groups
  });
  return xCenter;
}

function getGroupLabels(nodes, category, xCenter) {
  const groupLabels = {};
  Object.keys(xCenter).forEach(key => {
    const groupNodes = nodes.filter(node => node[category] === key);
    const avgX = d3.mean(groupNodes, node => node.x);
    const maxY = d3.max(groupNodes, node => node.y);
    groupLabels[key] = { x: avgX, y: maxY + 40 }; // Position below the group
  });
  return groupLabels;
}

function renderGraph(nodes, links, canvas, context) {
  simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(100))
    .force("charge", d3.forceManyBody().strength(-50)) // Adjust strength
    .force("center", d3.forceCenter(canvas.width / 2, canvas.height / 2))
    .force("collision", d3.forceCollide().radius(55)) // Increase collision radius
    .on("tick", draw);

  d3.select(canvas)
    .call(d3.zoom().scaleExtent([0.5, 5]).on("zoom", ({ transform }) => {
      context.save();
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.translate(transform.x, transform.y);
      context.scale(transform.k, transform.k);
      draw();
      context.restore();
    }));
}

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  links.forEach((link) => {
    context.beginPath();
    context.moveTo(link.source.x, link.source.y);
    context.lineTo(link.target.x, link.target.y);
    context.strokeStyle = "#999";
    context.lineWidth = 2;
    context.stroke();
  });

  nodes.forEach((node) => {
    context.drawImage(node.image, node.x - 25, node.y - 25, 50, 50);
  });

  // Draw group labels
  context.font = "16px Arial";
  context.fillStyle = "black";
  context.textAlign = "center";
  Object.keys(groupLabels).forEach(key => {
    const label = groupLabels[key];
    context.fillText(key, label.x, label.y);
  });
}