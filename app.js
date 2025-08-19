// --- DOM Elements ---
const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const objectNameSpan = document.getElementById('object-name');
const loadingMessage = document.getElementById('loading-message');
const captureBtn = document.getElementById('capture-btn');
const overlay = document.getElementById('overlay');
const closeOverlayBtn = document.getElementById('close-overlay');

// --- Mock Store Database ---
// (This remains the same)
const mockStoreDatabase = {
    'person': [{
        img: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDE0fHxjbG90aGluZyUyMHN0b3JlfGVufDB8fHx8MTY3ODg4NjM0OA&ixlib=rb-4.0.3&q=80&w=400',
        alt: 'Clothing store'
    }, ],
    'bottle': [{
        img: 'https://images.unsplash.com/photo-1559825481-12a05cc00344?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDR8fHN1cGVybWFya2V0fGVufDB8fHx8MTY3ODk0NDUwMA&ixlib=rb-4.0.3&q=80&w=400',
        alt: 'Supermarket aisle'
    }, ],
    'cup': [{
        img: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDF8fGNvZmZlZSUyMHNob3B8ZW58MHx8fHwxNjc4OTQ0NTMw&ixlib=rb-4.0.3&q=80&w=400',
        alt: 'Coffee shop'
    }, ],
    'cell phone': [{
        img: 'https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDJ8fGVsZWN0cm9uaWNzJTIwc3RvcmV8ZW58MHx8fHwxNjc4OTQ0NTU1&ixlib=rb-4.0.3&q=80&w=400',
        alt: 'Electronics store'
    }, ]
};

let model = undefined;
let splide = new Splide('#store-carousel', {
    type: 'loop',
    perPage: 3,
    gap: '1rem',
    autoplay: true,
}).mount();

let isDetecting = false; // Flag to control detection

// --- Main Functions ---

// 1. Load the COCO-SSD model
cocoSsd.load().then(function(loadedModel) {
    model = loadedModel;
    loadingMessage.style.display = 'none'; // Hide loading message
    captureBtn.disabled = false; // Enable the capture button
    // 2. Start the camera
    initCamera();
});

// 3. Initialize the camera feed
const initCamera = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
            video: true
        }).then(stream => {
            video.srcObject = stream;
            video.addEventListener('loadeddata', () => {
                // Get initial video dimensions
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            });
        });
    }
};

// 4. Event Listener for the capture button
captureBtn.addEventListener('click', captureAndDetect);

// 5. Event Listener for closing the overlay
closeOverlayBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
    video.play(); // Resume the video
});

// 6. Function to run detection on button click
function captureAndDetect() {
    // Pause the video stream
    video.pause();

    // Run detection on the current video frame
    model.detect(video).then(predictions => {
        // Draw the predictions on the canvas
        drawBoundingBoxes(predictions);

        // Update UI with the top prediction
        if (predictions.length > 0) {
            const detectedObject = predictions.slice().sort((a, b) => b.score - a.score)[0].class; // Get the most confident detection
            objectNameSpan.textContent = detectedObject;
            updateStoreCarousel(detectedObject);
        } else {
            objectNameSpan.textContent = "Nothing Detected";
            updateStoreCarousel(null); // Clear carousel if nothing found
        }

        // Show the overlay with results
        overlay.style.display = 'flex';
    });
};

// 7. Draw bounding boxes and labels on the canvas
const drawBoundingBoxes = (predictions) => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear previous drawings

    predictions.forEach(prediction => {
        const [x, y, width, height] = prediction.bbox;
        const text = `${prediction.class} (${Math.round(prediction.score * 100)}%)`;

        // Style the bounding box
        ctx.strokeStyle = '#1a73e8';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Style the label
        ctx.fillStyle = '#1a73e8';
        ctx.font = '16px Arial';
        ctx.fillText(text, x, y > 10 ? y - 5 : 10); // Draw text above the box
    });
};

// 8. Update the store carousel based on the detected object
const updateStoreCarousel = (objectName) => {
    const stores = mockStoreDatabase?.[objectName] || []; // Safely access the database

    // Clear existing slides
    splide.remove('.splide__slide');

    if (stores.length > 0) {
        const slides = stores.map(store => {
            return `<li class="splide__slide"><img src="${store.img}" alt="${store.alt}"></li>`;
        });
        splide.add(slides);
    } else {
        // Show a default slide if no offers are found
        const defaultSlide = `<li class="splide__slide"><p style="text-align:center; padding: 20px;">No offers found for this item.</p></li>`;
        splide.add(defaultSlide);
    }
};