class DrawingApp {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        
        this.setupCanvas();
        this.attachEventListeners();
    }
    
    setupCanvas() {
        // Set white background
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set drawing style
        this.ctx.strokeStyle = 'black';
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';
        this.ctx.lineWidth = 15;
    }
    
    attachEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
        
        // Button events
        document.getElementById('clearBtn').addEventListener('click', this.clearCanvas.bind(this));
        document.getElementById('predictBtn').addEventListener('click', this.predict.bind(this));
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        
        this.lastX = x;
        this.lastY = y;
    }
    
    stopDrawing() {
        this.isDrawing = false;
    }
    
    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                         e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }
    
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.setupCanvas();
        document.getElementById('results').classList.add('hidden');
    }
    
    async predict() {
        // Get canvas image as base64
        const imageData = this.canvas.toDataURL('image/png');
        
        try {
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image: imageData })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.displayResults(data.predictions);
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Failed to connect to server: ' + error.message);
        }
    }
    
    displayResults(predictions) {
        const resultsDiv = document.getElementById('results');
        const predictionsDiv = document.getElementById('predictions');
        
        resultsDiv.classList.remove('hidden');
        predictionsDiv.innerHTML = '';
        
        predictions.forEach((pred, index) => {
            const confidence = (pred.confidence * 100).toFixed(1);
            
            const predItem = document.createElement('div');
            predItem.className = 'prediction-item';
            
            predItem.innerHTML = `
                <div class="prediction-digit">${pred.digit}</div>
                <div class="prediction-bar">
                    <div class="prediction-fill" style="width: ${confidence}%">
                        <span class="prediction-percentage">${confidence}%</span>
                    </div>
                </div>
            `;
            
            predictionsDiv.appendChild(predItem);
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DrawingApp();
});