// PDF.js setup
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.worker.min.js';

// Document elements
const pageNum = document.getElementById('page-num');
const pageCount = document.getElementById('page-count');
const canvas = document.getElementById('pdf-render');
const ctx = canvas.getContext('2d');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const pdfBtns = document.querySelectorAll('.pdf-selection');

// Current state
let pdfDoc = null;
let pageNum_ = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.0;
let currentPDF = 'project_plan/plan.pdf';

// Render the PDF
function renderPage(num) {
    pageRendering = true;

    // Get page
    pdfDoc.getPage(num).then(page => {
        // Adjust canvas size to the page
        const viewport = page.getViewport({ scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page
        const renderContext = {
            canvasContext: ctx,
            viewport
        };

        const renderTask = page.render(renderContext);

        // Wait for rendering to finish
        renderTask.promise.then(() => {
            pageRendering = false;

            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });
    });

    // Update page counter
    pageNum.textContent = num;
}

// Queue rendering if another page is already rendering
function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

// Show previous page
function showPrevPage() {
    if (pageNum_ <= 1) {
        return;
    }
    pageNum_--;
    queueRenderPage(pageNum_);
}

// Show next page
function showNextPage() {
    if (pageNum_ >= pdfDoc.numPages) {
        return;
    }
    pageNum_++;
    queueRenderPage(pageNum_);
}

// Zoom functions
function zoomIn() {
    scale += 0.1;
    queueRenderPage(pageNum_);
}

function zoomOut() {
    if (scale <= 0.2) return;
    scale -= 0.1;
    queueRenderPage(pageNum_);
}

// Load and render PDF
function loadPDF(url) {
    // Load the PDF
    pdfjsLib.getDocument(url).promise.then(pdf => {
        pdfDoc = pdf;
        pageCount.textContent = pdf.numPages;

        // Reset to first page when loading new document
        pageNum_ = 1;
        renderPage(pageNum_);
    }).catch(err => {
        console.error('Error loading PDF:', err);
        alert('Error loading PDF document. Please try again later.');
    });
}

// Initial PDF load
loadPDF(currentPDF);

// Event listeners
prevBtn.addEventListener('click', showPrevPage);
nextBtn.addEventListener('click', showNextPage);
zoomInBtn.addEventListener('click', zoomIn);
zoomOutBtn.addEventListener('click', zoomOut);

// PDF selection buttons
pdfBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        // Remove active class from all buttons
        pdfBtns.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        this.classList.add('active');

        // Load the selected PDF
        currentPDF = this.getAttribute('data-pdf');
        loadPDF(currentPDF);
    });
});

// Add keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight') {
        showNextPage();
    } else if (e.key === 'ArrowLeft') {
        showPrevPage();
    }
});

// Add smooth scrolling for the PDF container
const pdfContainer = document.querySelector('.pdf-container');
pdfContainer.style.scrollBehavior = 'smooth';
