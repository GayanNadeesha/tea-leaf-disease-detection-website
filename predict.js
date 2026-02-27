const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('imageUpload');
const detectBtn = document.getElementById('detectBtn');

let predictionResult = null;

// Handle image upload and prediction
uploadForm.addEventListener('submit', function(event) {
  event.preventDefault();

  if (!fileInput.files.length) {
    showErrorModal("Please select an image.");
    return;
  }

  const file = fileInput.files[0];
  
  // Check file type
  if (!file.type.startsWith('image/')) {
    showErrorModal("Please select a valid image file.");
    return;
  }

  const formData = new FormData();
  formData.append('image', file);

  // Show loading indicator
  showLoadingModal("Analyzing image...");

  fetch("http://127.0.0.1:5000/upload", {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    closeLoadingModal();
    
    if (data.prediction) {
      predictionResult = data.prediction;
      showPredictionModal(data.prediction);
    } else if (data.error) {
      showErrorModal(data.error);
    } else {
      showErrorModal("Unexpected response from server.");
    }
  })
  .catch((error) => {
    closeLoadingModal();
    console.error('Error:', error);
    showErrorModal("Server error! Please make sure Flask server is running.");
  });
});

// Handle detect button click (show last prediction or redirect)
detectBtn.addEventListener('click', function() {
  if (predictionResult) {
    showPredictionModal(predictionResult);
  } else {
    showErrorModal("Please upload an image first.");
  }
});

// Show prediction results in a modal
function showPredictionModal(prediction) {
  const modal = document.getElementById('predictionModal');
  const predictionClass = document.getElementById('predictionClass');
  const confidenceText = document.getElementById('confidenceText');
  const allPredictionsDiv = document.getElementById('allPredictions');
  
  predictionClass.textContent = prediction.predicted_class.toUpperCase();
  confidenceText.textContent = `Confidence: ${prediction.confidence}%`;
  
  // Display all predictions
  let predictionsHTML = '<h4>All Predictions:</h4><ul>';
  for (const [className, confidence] of Object.entries(prediction.all_predictions)) {
    predictionsHTML += `<li><strong>${className}:</strong> ${confidence.toFixed(2)}%</li>`;
  }
  predictionsHTML += '</ul>';
  allPredictionsDiv.innerHTML = predictionsHTML;
  
  modal.style.display = 'flex';
}

function closePredictionModal() {
  document.getElementById('predictionModal').style.display = 'none';
}

// Loading modal functions
function showLoadingModal(message) {
  const modal = document.getElementById('loadingModal');
  document.getElementById('loadingText').textContent = message;
  modal.style.display = 'flex';
}

function closeLoadingModal() {
  document.getElementById('loadingModal').style.display = 'none';
}

// Success modal functions
function showSuccessModal(message) {
  const modal = document.getElementById('successModal');
  document.getElementById('successText').textContent = message;
  modal.style.display = 'flex';
}

function closeSuccessModal() {
  document.getElementById('successModal').style.display = 'none';
}

// Error modal functions
function showErrorModal(message) {
  const modal = document.getElementById('errorModal');
  document.getElementById('errorText').textContent = message;
  modal.style.display = 'flex';
}

function closeErrorModal() {
  document.getElementById('errorModal').style.display = 'none';
}