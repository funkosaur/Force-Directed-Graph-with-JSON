// Initialize the force-directed graph
const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const context = canvas.getContext("2d");

// Fetch and parse the JSON data
fetch("metadata.json")
  .then((response) => response.json())
  .then((data) => {
    // Extract and structure data for D3
    const nodes = [];
    const links = [];

    // Create a promise for each image load operation
    const imageLoadPromises = data.map((item) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = getThumbnailUrl(item.id); // Assuming id contains the image URL
        img.onload = function () {
          nodes.push({
            id: item.id,
            type: "canvas",
            label: item.title,
            image: img,
            date: item["created date"], // Extract the date from JSON
          });
          resolve();
        };
        img.onerror = reject;
      });
    });

    // Wait for all images to load before creating links and rendering the graph
    Promise.all(imageLoadPromises)
      .then(() => {
        // Create links between nodes with the same date
        nodes.forEach((nodeA, indexA) => {
          nodes.forEach((nodeB, indexB) => {
            if (nodeA.date === nodeB.date && nodeA.id !== nodeB.id) {
              links.push({ source: nodeA.id, target: nodeB.id });
            }
          });
        });

        // Render the graph
        renderGraph(nodes, links, canvas, context);
      })
      .catch((error) => {
        console.error("Error loading images:", error);
      });
  })
  .catch((error) => {
    console.error("Error fetching JSON data:", error);
  });

// Function to get thumbnail URL from the full image URL
function getThumbnailUrl(fullImageUrl) {
  return fullImageUrl.replace(
    "/full/full/0/default.jpg",
    "/full/200,/0/default.jpg"
  ); // Adjust URL to request a smaller size
}

function renderGraph(nodes, links, canvas, context) {
  const width = canvas.width;
  const height = canvas.height;
  const imageWidth = 50; // Set the width of the images
  const imageHeight = 50; // Set the height of the images

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance(100)
    )
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

  simulation.on("tick", () => {
    context.clearRect(0, 0, width, height);

    // Draw links
    links.forEach((link) => {
      context.beginPath();
      context.moveTo(link.source.x, link.source.y);
      context.lineTo(link.target.x, link.target.y);
      context.strokeStyle = "#999";
      context.lineWidth = 2;
      context.stroke();
    });

    nodes.forEach((node) => {
      context.drawImage(node.image, node.x, node.y, imageWidth, imageHeight);
    });
  });
}
