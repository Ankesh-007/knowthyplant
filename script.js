const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("capture");

const plantName = document.getElementById("plant-name");
const plantDesc = document.getElementById("plant-desc");
const plantConfidence = document.getElementById("plant-confidence");

// Open camera
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(err => {
        alert("Camera access denied");
        console.error("Camera error:", err);
    });

captureBtn.addEventListener("click", async () => {
    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0);
    const imageBase64 = canvas.toDataURL("image/jpeg").split(",")[1];

    identifyPlant(imageBase64);
});

async function identifyPlant(image) {
    // Note: This API Key should ideally be secured in a backend or environment variable for production.
    const API_KEY = "YOUR_PLANT_ID_API_KEY";

    plantName.textContent = "Identifying...";
    plantDesc.textContent = "";
    plantConfidence.textContent = "";

    try {
        const response = await fetch("https://api.plant.id/v2/identify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Api-Key": API_KEY
            },
            body: JSON.stringify({
                images: [image],
                modifiers: ["crops_fast", "similar_images"],
                plant_language: "en",
                plant_details: ["common_names", "description"]
            })
        });

        const data = await response.json();
        displayResult(data);
    } catch (error) {
        console.error("Error identifying plant:", error);
        plantName.textContent = "Error identifying plant.";
    }
}

function displayResult(data) {
    if (!data.suggestions || data.suggestions.length === 0) {
        plantName.textContent = "Plant not recognized";
        return;
    }

    const plant = data.suggestions[0];

    plantName.textContent = "🌿 Name: " + plant.plant_name;
    plantDesc.textContent = "📖 Description: " +
        (plant.plant_details.description?.value || "No description available");

    plantConfidence.textContent =
        "✅ Confidence: " + Math.round(plant.probability * 100) + "%";
}
