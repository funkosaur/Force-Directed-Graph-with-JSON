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

// Fetch and parse the JSON data
fetch("metadata.json")
  .then((response) => response.json())
  .then((data) => {
    const nodes = [];
    const links = [];

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
            timeline: item["timeline"],
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
        nodes.forEach((nodeA, indexA) => {
          nodes.forEach((nodeB, indexB) => {
            if (nodeA.date === nodeB.date && nodeA.id !== nodeB.id) {
              links.push({ source: nodeA.id, target: nodeB.id });
            }
          });
        });

        renderGraph(nodes, links, canvas, context);

        timelineButton.addEventListener("click", () => applyForce(nodes, "date"));
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
  const xCenter = getCategoryCenters(nodes, category, 140); // Increase spacing here

  simulation
    .force("x", d3.forceX().x((d) => xCenter[d[category]]).strength(0.9)) // Increase strength here
    .force("y", d3.forceY(canvas.height / 2).strength(0.1))
    .force("collision", d3.forceCollide().radius(55)) // Increase collision radius
    .alpha(1)
    .restart();
}

function getCategoryCenters(nodes, category, spacing) {
  const uniqueValues = Array.from(new Set(nodes.map(node => node[category])));
  const xCenter = {};
  uniqueValues.forEach((value, index) => {
    xCenter[value] = (index + 1) * (spacing * 2); // More spacing between groups
  });
  return xCenter;
}

function renderGraph(nodes, links, canvas, context) {
  simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(100))
    .force("charge", d3.forceManyBody().strength(-50)) // Adjust strength
    .force("center", d3.forceCenter(canvas.width / 2, canvas.height / 2))
    .force("collision", d3.forceCollide().radius(55)) // Increase collision radius
    .on("tick", () => {
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
    });

  // Add zoom and pan functionality
  d3.select(canvas)
    .call(d3.zoom().scaleExtent([0.5, 5]).on("zoom", ({transform}) => {
      context.save();
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.translate(transform.x, transform.y);
      context.scale(transform.k, transform.k);

      links.forEach((link) => {
        context.beginPath();
        context.moveTo(link.source.x, link.source.y);
        context.lineTo(link.target.x, link.target.y);
        context.strokeStyle = "#999";
        context.lineWidth = 2 / transform.k; // Adjust line width based on zoom level
        context.stroke();
      });

      nodes.forEach((node) => {
        context.drawImage(node.image, node.x - 25, node.y - 25, 50, 50);
      });

      context.restore();
    }));
}