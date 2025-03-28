let myChart = null;
let reportData = '';

// Display image preview when an image is selected
document.getElementById('imageInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const preview = document.getElementById('preview');
      preview.src = e.target.result;
      preview.style.display = "block";
    }
    reader.readAsDataURL(file);
  }
});

// Handle form submission and prediction
document.getElementById('uploadForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const input = document.getElementById('imageInput');
  if (input.files.length === 0) {
    alert("Please select an image file.");
    return;
  }
  const formData = new FormData();
  formData.append('file', input.files[0]);

  fetch('/api/analyze', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    const resultDiv = document.getElementById('result');
    if (data.error) {
      resultDiv.innerText = "Error: " + data.error;
      document.getElementById('downloadBtn').style.display = "none";
    } else {
      // Build report text for download
      reportData = "Lung Cancer Detection Report\n";
      reportData += "------------------------------\n";
      reportData += "Prediction: " + data.class + "\n";
      reportData += "Confidence: " + (data.confidence * 100).toFixed(2) + "%\n\n";
      reportData += "Probabilities:\n";
      const labels = ['Normal', 'Adenocarcinoma', 'Squamous', 'Large cell carcinoma'];
      data.probabilities.forEach((p, idx) => {
        reportData += labels[idx] + ": " + (p * 100).toFixed(2) + "%\n";
      });
      
      resultDiv.innerHTML =
        "<strong>Prediction:</strong> " + data.class + "<br>" +
        "<strong>Confidence:</strong> " + (data.confidence * 100).toFixed(2) + "%";
      document.getElementById('downloadBtn').style.display = "block";
      
      // Render Chart.js bar chart for probabilities
      if (data.probabilities) {
        const ctx = document.getElementById('predictionChart').getContext('2d');
        if (myChart) { myChart.destroy(); }
        myChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Probability',
              data: data.probabilities,
              backgroundColor: [
                'rgba(75, 192, 192, 0.6)',
                'rgba(255, 159, 64, 0.6)',
                'rgba(255, 205, 86, 0.6)',
                'rgba(153, 102, 255, 0.6)'
              ],
              borderColor: [
                'rgba(75, 192, 192, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(255, 205, 86, 1)',
                'rgba(153, 102, 255, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
                max: 1,
                ticks: {
                  callback: function(value) {
                    return (value * 100) + '%';
                  }
                }
              }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return (context.parsed.y * 100).toFixed(2) + '%';
                  }
                }
              }
            }
          }
        });
      }
    }
  })
  .catch(error => {
    console.error('Error:', error);
    document.getElementById('result').innerText = "An error occurred.";
    document.getElementById('downloadBtn').style.display = "none";
  });
});

// Download report as a text file
document.getElementById('downloadBtn').addEventListener('click', function() {
  const blob = new Blob([reportData], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'lung_cancer_report.txt';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
});
