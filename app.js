// Target the HTML elements we need to interact with
const photoInput = document.getElementById('photo-input');
const uploadBtn = document.getElementById('upload-btn');
const photoGallery = document.getElementById('photo-gallery');

// Listen for a click on the upload button
uploadBtn.addEventListener('click', () => {
    // Check if the user actually picked a file
    const file = photoInput.files[0];
    
    if (!file) {
        alert('Please select a photo first!');
        return;
    }

    // Generate a temporary local URL for the selected image file
    const imageObjectURL = URL.createObjectURL(file);

    // Create a new image element dynamically
    const newImage = document.createElement('img');
    newImage.src = imageObjectURL;
    newImage.alt = "Friend's Uploaded Photo";

    // Insert the new image card into our gallery grid
    photoGallery.appendChild(newImage);

    // Clear the input field so you can upload another one
    photoInput.value = '';
});
