import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm'

const SUPABASE_URL = 'https://ysrykjfdtlpjzxatadmo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Q_XQKdq78SzHpIIOwLU68w_BZpDIbf1';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const photoInput = document.getElementById('photo-input');
const nameInput = document.getElementById('name-input');
const uploadBtn = document.getElementById('upload-btn');
const photoGallery = document.getElementById('photo-gallery');

// 1. UPLOAD IMAGE & SAVE TO DATABASE
uploadBtn.addEventListener('click', async () => {
    const files = photoInput.files;
    
    if (files.length === 0) {
        alert('Pick a beautiful photo first before hitting upload! (BAYOOOTTT)');
        return;
    }

    if (!nameInput.value.trim()) {
        alert('Please write your name so your barkada knows who uploaded it!');
        return;
    }

    const file = files[0]; 
    const uniqueFileName = `gallery_${Date.now()}_${file.name}`;

    try {
        uploadBtn.innerText = "Uploading...";
        uploadBtn.disabled = true;

        // Step A: Upload image to Storage Bucket
        const { data: storageData, error: storageError } = await supabase.storage
            .from('photos')
            .upload(uniqueFileName, file);

        if (storageError) throw storageError;

        // Step B: Get the public URL path
        const { data: urlData } = supabase.storage
            .from('photos')
            .getPublicUrl(uniqueFileName);

        const publicUrl = urlData.publicUrl;

        // Step C: Save record to 'user_inputs' table
        const { data: dbData, error: dbError } = await supabase
            .from('user_inputs')
            .insert([
                { 
                    url: publicUrl, 
                    uploader_name: nameInput.value.trim() 
                }
            ]);

        if (dbError) throw dbError;

        photoInput.value = '';
        nameInput.value = ''; 
        alert('Photo successfully dropped into the cloud space! 🚀');

    } catch (error) {
        console.error("Upload crashed:", error.message);
        alert('Upload failed! Check that your table is named "user_inputs" and RLS is off.');
    } finally {
        uploadBtn.innerText = "Upload";
        uploadBtn.disabled = false;
    }
});

// 2. DELETE RECORD FROM DATABASE & FILE FROM STORAGE
async function deletePhoto(id, imageUrl) {
    if (!confirm("Are you sure your barkada wants to delete this photo permanently?")) {
        return;
    }

    try {
        const filename = imageUrl.split('/').pop();

        // Step A: Delete row from the database table
        const { error: dbError } = await supabase
            .from('user_inputs')
            .delete()
            .eq('id', id);

        if (dbError) throw dbError;

        // Step B: Delete asset file from bucket storage
        const { error: storageError } = await supabase.storage
            .from('photos')
            .remove([filename]);

        if (storageError) throw storageError;

        alert('Photo cleared completely!');

    } catch (error) {
        console.error("Deletion crashed:", error.message);
        alert('Failed to completely delete the image asset.');
    }
}

// 3. GENERATE PHOTO CARDS ON THE SCREEN
function displayImageInGrid(id, imageUrl, uploaderName, createdAt) {
    const cardContainer = document.createElement('div');
    cardContainer.className = 'photo-card';
    cardContainer.id = `photo-${id}`;

    const newImage = document.createElement('img');
    newImage.src = imageUrl;
    newImage.alt = "Barkada Shared Memory";

    const uploadDate = new Date(createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'photo-details';
    detailsDiv.innerText = `Dropped by: ${uploaderName}\n(${uploadDate})`;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerText = 'Delete';
    deleteBtn.addEventListener('click', () => deletePhoto(id, imageUrl));

    cardContainer.appendChild(newImage);
    cardContainer.appendChild(detailsDiv);
    cardContainer.appendChild(deleteBtn);

    photoGallery.insertBefore(cardContainer, photoGallery.firstChild);
}

// 4. FETCH DATA FROM DATABASE TABLE
async function loadEntireGallery() {
    try {
        photoGallery.innerHTML = '';

        const { data, error } = await supabase
            .from('user_inputs')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (data) {
            for (const record of data) {
                displayImageInGrid(record.id, record.url, record.uploader_name, record.created_at);
            }
        }
    } catch (error) {
        console.warn("Gallery load issue:", error.message);
    }
}

// 5. LIVE REFRESH REALTIME LISTENER
supabase
  .channel('live_user_inputs')
  .on(
    'postgres_changes', 
    { event: '*', schema: 'public', table: 'user_inputs' }, 
    (payload) => {
        console.log('Realtime shift detected:', payload);
        loadEntireGallery();
    }
  )
  .subscribe();

loadEntireGallery();
