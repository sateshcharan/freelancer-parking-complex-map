import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const containerElement = document.getElementById("container");
const arrow = document.getElementById("arrowImage");
const moreInfo = document.getElementById("moreInfo");

const windowWidth = containerElement.clientWidth;
const windowHeight = containerElement.clientHeight;
let jsonData;
let buildings = []; // Variables to store the buildings

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
const loader = new GLTFLoader();
const camera = new THREE.PerspectiveCamera(
  75,
  windowWidth / windowHeight,
  0.1,
  1000
);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

arrow.addEventListener("click", arrowClick, false);
containerElement.addEventListener("click", onClick, false);
containerElement.addEventListener("mousemove", onMouseMove, false);
// containerElement.addEventListener("mouseover", onMouseOver, false);

function arrowClick() {
  arrow.style.rotate =
    arrow.style.getPropertyValue("rotate") === "90deg" ? "0deg" : "90deg";
  moreInfo.style.display =
    moreInfo.style.getPropertyValue("display") === "block" ? "none" : "block";
}

// Function to update elements with data
function updateElements(data, index = 0, clickedColor) {
  if (data.buildings) {
    document.getElementById("id").textContent =
      data.buildings[index].id.toUpperCase();
    document.getElementById("category").textContent =
      data.buildings[index].info.category.toUpperCase();
    document.getElementById("name").textContent =
      data.buildings[index].info.name;
    document.getElementById("description").textContent =
      data.buildings[index].info.description;
    document.getElementById("distance-t1").textContent =
      data.buildings[index].distance.t1 + " min";
    document.getElementById("distance-t2").textContent =
      data.buildings[index].distance.t2 + " min";
  } else {
    document.getElementById("id").textContent = data[index].id.toUpperCase();
    document.getElementById("category").textContent =
      data[index].info.category.toUpperCase();
    document.getElementById("name").textContent = data[index].info.name;
    document.getElementById("description").textContent =
      data[index].info.description;
    document.getElementById("distance-t1").textContent =
      data[index].distance.t1 + " min";
    document.getElementById("distance-t2").textContent =
      data[index].distance.t2 + " min";
  }
  document.getElementsByClassName("arrow")[0].style.background = clickedColor;
}

function onLabelClick(e) {
  const filteredBuildings = jsonData.buildings.filter((building) => {
    return building.info.category === e.target.textContent;
  });
  let clickedCategory = filteredBuildings[0].info.category;
  let clickedColor = jsonData.category[clickedCategory];
  filteredBuildings.forEach((filteredBuilding) => {
    buildings.forEach((building) => {
      if (
        building.name === filteredBuilding.id &&
        filteredBuilding.available !== ""
      ) {
        building.material.color.set(clickedColor);
      }
    });
  });
  updateElements(filteredBuildings, 0, clickedColor);
}

function createLabel(text, position, color) {
  const div = document.createElement("button"); // Create a div element for the label
  div.className = "label";
  div.textContent = text;
  div.style.background = color;
  div.style.position = "absolute"; // Set the CSS properties for positioning
  div.style.left = position.x + "px";
  div.style.top = position.y + "px";
  div.addEventListener("click", onLabelClick);
  document.getElementById("container").appendChild(div); // Add the label to the container
}

function measureLabelWidth(text) {
  const span = document.createElement("span"); // Create a temporary span element
  span.textContent = text; // Set its text content to the desired text
  span.style.position = "absolute"; // Set its CSS properties to match the label's styles
  span.style.visibility = "hidden";
  span.style.whiteSpace = "nowrap"; // Prevent text from wrapping
  document.body.appendChild(span); // Append the span to the document body
  const width = span.offsetWidth; // Measure the width of the span
  document.body.removeChild(span); // Remove the span from the document body
  return width; // Return the measured width
}

// Function to fetch data from JSON file
function fetchData() {
  fetch("data.json")
    .then((response) => response.json())
    .then((data) => {
      jsonData = data;
      updateElements(data); // Call the updateElements function with the fetched data
      let totalWidth = 0; // Total width of all labels
      const spacing = 20; // Adjust the spacing between labels as needed
      for (const category in data.category) {
        // Calculate the total width of all labels
        const labelWidth = measureLabelWidth(category); // Measure label width
        totalWidth += labelWidth + spacing;
      }
      let offsetX = (750 - totalWidth) / 2; // Calculate the initial x-coordinate offset to center the labels
      for (const category in data.category) {
        // Create labels with even spacing
        const labelWidth = measureLabelWidth(category); // Measure label width
        createLabel(category, { x: offsetX, y: 40 }, data.category[category]);
        offsetX += labelWidth + spacing; // Update the x-coordinate offset for the next label
      }
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
}

fetchData();

camera.position.set(20, 20, 5); // Adjust the position to set the camera further away from the scene
camera.lookAt(scene.position); // Point the camera towards the center of the scene

renderer.setClearColor(0xe7ebed);
renderer.setSize(windowWidth, windowHeight);
containerElement.appendChild(renderer.domElement);

//const controls = new OrbitControls(camera, renderer.domElement);

// Add lighting
scene.add(ambientLight);
directionalLight.position.set(0, 1, 0);
scene.add(directionalLight);

// Load the model
loader.load("./assets/3d/map.glb", async (gltf) => {
  // Store references to the buildings
  await jsonData.buildings.forEach((id) => {
    buildings.push(gltf.scene.getObjectByName(id.id));
  });
  scene.add(gltf.scene);
});

function onMouseMove(event) {
  mouse.x =
    ((event.clientX - (window.innerWidth - windowWidth) / 2) / windowWidth) *
      2 -
    1;

  const rect = containerElement.getBoundingClientRect(); // Get the position of the element relative to the viewport
  const distanceFromTop = rect.top + window.scrollY; // Calculate the distance of the element from the top of the page

  mouse.y = -((event.clientY - distanceFromTop) / windowHeight) * 2 + 1;
}

function onClick(event) {
  raycaster.setFromCamera(mouse, camera); // Update the picking ray with the camera and mouse position

  // Calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object.name; // Perform actions based on the clicked object
    let clickedIndex;
    for (let i = 0; i < buildings.length; i++) {
      if (buildings[i].name === clickedObject) {
        clickedIndex = i;
      }
    }
    let clickedCategory = "";
    jsonData.buildings.forEach((building) => {
      if (building.id === clickedObject) {
        clickedCategory = building.info.category;
      }
    });
    let clickedColor = "";
    for (const category in jsonData.category) {
      if (category === clickedCategory) {
        clickedColor = jsonData.category[category];
      }
    }
    updateElements(jsonData, clickedIndex, clickedColor);
    buildings[clickedIndex].material.color.set(clickedColor);
  }
}

/* function onMouseOver(event) {
  raycaster.setFromCamera(mouse, camera); // Update the picking ray with the camera and mouse position

  // Calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    // Create a new <h1> element
    const h1Element = document.createElement("h1");

    // Set its text content to "Hello, world!"
    h1Element.textContent = "Hello, world!";

    // Append the <h1> element to the document body
    document.body.append(h1Element);
  } else {
    // Hide label if not intersecting with the cube
  }
} */

// Add animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Add window resize handler
window.addEventListener("resize", () => {
  const width = windowWidth;
  const height = windowHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});
