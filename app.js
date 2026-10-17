// 1. Import the Supabase library directly via web CDN
import { createClient } from 'https://jsdelivr.net'

// 2. Replace these with your actual keys from the Settings > API tab
const SUPABASE_URL = 'ysrykjfdtlpjzxatadmo';
const SUPABASE_ANON_KEY = 'sb_publishable_2d_cB4iFio1Rb_CZuFocyw_O_dpZSCO';

// 3. Initialize the connection
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 4. Target your HTML elements
const photoInput = document.getElementById('photo-input');
const uploadBtn = document.getElementById('upload-btn');
const photoGallery = document.getElementById('photo-gallery');

// ==========================================
// 5. LIVE UPLOAD CONTROL LOGIC
// ==========================================
uploadBtn.addEventListener('click', async () => {
    const files = photoInput.files;
    
    // Safety check: Make sure they actually picked an image file
    if (files.length === 0) {
        alert('Pick a beautiful photo first before hitting upload! (BAYOOOTTT)');
        return;
    }

    // FIX: Grab the actual FIRST raw image file inside the list array container
    const file = files[0]; 
    
    // Generate a clean unique name
    const uniqueFileName = `gallery_${Date.now()}_${file.name}`;

    try {
        uploadBtn.innerText = "Uploading...";
        uploadBtn.disabled = true;

        // Push the correct, individual raw file up to the Supabase Storage Bucket
        const { data, error } = await supabase.storage
            .from('photos')
            .upload(uniqueFileName, file);

        if (error) throw error;

        // Fetch the permanent public link for the image card
        const { data: urlData } = supabase.storage
            .from('photos')
            .getPublicUrl(uniqueFileName);

        // Display instantly on the feed screen
        displayImageInGrid(urlData.publicUrl);

        photoInput.value = '';
        alert('Photo successfully dropped into the cloud space! 🚀');

    } catch (error) {
        console.error("Upload crashed:", error.message);
        alert('Upload failed! Double check that your Supabase Bucket name is exactly "photos".');
    } finally {
        uploadBtn.innerText = "Upload";
        uploadBtn.disabled = false;
    }
});

// 6. GALLERY RENDER LOGIC
function displayImageInGrid(imageUrl) {
    const newImage = document.createElement('img');
    newImage.src = imageUrl;
    newImage.alt = "Barkada Shared Memory";
    photoGallery.insertBefore(newImage, photoGallery.firstChild);
}

// Automatically load every single image inside the folder when the app starts up
async function loadEntireGallery() {
    try {
        const { data, error } = await supabase.storage.from('photos').list();
        if (error) throw error;

        for (const file of data) {
            const { data: urlData } = supabase.storage.from('photos').getPublicUrl(file.name);
            displayImageInGrid(urlData.publicUrl);
        }
    } catch (error) {
        console.warn("Gallery load state setup placeholder:", error.message);
    }
}

loadEntireGallery();
