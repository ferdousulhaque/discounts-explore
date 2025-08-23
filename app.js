// --- DOM Elements ---
const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const objectNameSpan = document.getElementById('object-name');
const loadingMessage = document.getElementById('loading-message');
const captureBtn = document.getElementById('capture-btn');
const overlay = document.getElementById('overlay');
const closeOverlayBtn = document.getElementById('close-overlay');

// --- Dynamic Store Database from offers.json ---
let mockStoreDatabase = {};

// Load and process offers data
fetch('offers.json')
    .then(response => response.json())
    .then(offersData => {
        // Process each offer
        offersData.data.forEach(offer => {
            if (offer.tags && offer.thumb_image && offer.thumb_image.length > 0) {
                // Create entry for each tag
                offer.tags.forEach(tag => {
                    if (!mockStoreDatabase[tag]) {
                        mockStoreDatabase[tag] = [];
                    }
                    
                    baseUrl = "https://grameenphone.com"
                    // Add offer to corresponding tag array
                    mockStoreDatabase[tag].push({
                        img: offer.thumb_image[0],
                        alt: `${offer.title} - ${offer.teaser || ''}`,
                        href: baseUrl + offer.path
                    });
                });
            }
        });
    })
    .catch(error => console.error('Error loading offers:', error));

let model = undefined;
let splide = new Splide('#store-carousel', {
    type: 'loop',
    perPage: 1,
    gap: '1rem',
    autoplay: true,
    padding: { left: '1rem', right: '1rem' },
    breakpoints: {
        640: {
            perPage: 1,
            padding: { left: '1rem', right: '1rem' }
        }
    }
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
    // Constraints to request the back camera
    const constraints = {
        video: {
            facingMode: ["environment", "user"]
        }
    };
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints).then(stream => {
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
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
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
            // mock_object = "cup";
            // objectNameSpan.textContent = mock_object;
            // updateStoreCarousel(mock_object);
            // 
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
            return `<li class="splide__slide"><a href="${store.href}"><img src="${store.img}" alt="${store.alt}"></a></li>`;
        });
        splide.add(slides);
    } else {
        // Show a default slide if no offers are found
        const defaultSlide = `<li class="splide__slide"><p style="text-align:center; padding: 20px;">No offers found for this item.</p></li>`;
        splide.add(defaultSlide);
    }
};