import imageCompression from 'browser-image-compression';

/**
 * Optimizes an image file by compressing it and optionally resizing it.
 * @param {File} file - The original image file.
 * @param {Object} options - Custom options for compression.
 * @returns {Promise<File>} - The compressed image file.
 */
export const optimizeImage = async (file, options = {}) => {
    const defaultOptions = {
        maxSizeMB: 0.8,              // Max size in MB (0.8MB is usually plenty for web)
        maxWidthOrHeight: 1200,      // Max width or height
        useWebWorker: true,
        initialQuality: 0.8,
        ...options
    };

    try {
        const compressedFile = await imageCompression(file, defaultOptions);
        console.log(`Original: ${file.size / 1024 / 1024}MB, Compressed: ${compressedFile.size / 1024 / 1024}MB`);
        return compressedFile;
    } catch (error) {
        console.error('Image optimization failed:', error);
        return file; // Fallback to original if compression fails
    }
};

/**
 * Helper to upload an image to Supabase and return the public URL.
 * @param {Object} supabase - Supabase client instance
 * @param {string} bucket - Bucket name
 * @param {File} file - The file to upload
 * @param {boolean} optimize - Whether to optimize the image before upload
 * @returns {Promise<string>} - Public URL of the uploaded image
 */
export const uploadAndOptimize = async (supabase, bucket, file, optimize = true) => {
    let fileToUpload = file;
    
    if (optimize && file.type.startsWith('image/')) {
        fileToUpload = await optimizeImage(file);
    }
    
    const fileName = `${Date.now()}_${fileToUpload.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, fileToUpload);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicUrl;
};
