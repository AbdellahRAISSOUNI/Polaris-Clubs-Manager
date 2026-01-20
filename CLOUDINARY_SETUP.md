# Cloudinary Setup Instructions

Follow these steps to set up Cloudinary for file storage in the Polaris Clubs Manager project.

## Step 1: Create a Cloudinary Account

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Click **"Sign Up"** or **"Start for Free"** in the top right corner
3. Fill in your details:
   - Email address
   - Full name
   - Password
   - Company/Organization (optional)
4. Click **"Create Account"**
5. Verify your email address if prompted

## Step 2: Access Your Dashboard

1. After logging in, you'll be taken to the **Dashboard**
2. On the dashboard, you'll see your **Account Details** including:
   - **Cloud Name** (e.g., `dxy123abc`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (click "Reveal" to see it)

## Step 3: Get Your Credentials

1. In the dashboard, look for the **"Account Details"** section
2. You'll need these three values:
   - **Cloud Name**: Your unique cloud identifier
   - **API Key**: Your API key
   - **API Secret**: Your secret key (click "Reveal" to show it)

## Step 4: Configure Upload Settings (Optional but Recommended)

1. Go to **Settings** (gear icon in the top right)
2. Click on **"Upload"** in the left sidebar
3. Configure upload presets:
   - **Upload Preset**: Create a new preset or use the default
   - **Signing Mode**: Set to **"Unsigned"** for easier integration (or "Signed" for more security)
   - **Folder**: Set a folder name like `polaris-clubs-manager` (optional but recommended)
4. Save your settings

## Step 5: Add Environment Variables

1. Open your `.env.local` file in the project root
2. Add the following variables:

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
CLOUDINARY_UPLOAD_PRESET=your_upload_preset_or_leave_empty
```

3. Replace the placeholder values with your actual Cloudinary credentials:
   - `your_cloud_name_here` → Your Cloud Name from Step 3
   - `your_api_key_here` → Your API Key from Step 3
   - `your_api_secret_here` → Your API Secret from Step 3
   - `your_upload_preset_or_leave_empty` → Your upload preset name (or leave empty if using default)

4. **Important**: Also add these to your `.env.production` file for deployment

## Step 6: Test the Integration

1. Start your development server: `npm run dev`
2. Try uploading an image through the admin panel
3. Check your Cloudinary dashboard's **Media Library** to see if the image was uploaded

## Step 7: Configure Security (Recommended)

1. In Cloudinary Dashboard, go to **Settings** → **Security**
2. Enable **"Restricted media types"** if you want to limit file types
3. Set **"Allowed file formats"** to: `jpg, jpeg, png, gif, webp`
4. Set **"Max file size"** to a reasonable limit (e.g., 10MB)
5. Enable **"Signed URLs"** if you want additional security (requires code changes)

## Troubleshooting

### Issue: "Invalid API Key"
- **Solution**: Double-check your API Key and API Secret in `.env.local`
- Make sure there are no extra spaces or quotes

### Issue: "Upload failed"
- **Solution**: Check that your upload preset is set to "Unsigned" if you're not using signed uploads
- Verify your Cloud Name is correct

### Issue: "File too large"
- **Solution**: Increase the file size limit in Cloudinary Settings → Upload
- Or compress images before uploading

## Next Steps

After completing these steps, the Cloudinary integration will be ready to use. The application will automatically:
- Upload club logos to Cloudinary
- Upload space images to Cloudinary
- Upload admin avatars to Cloudinary
- Store the Cloudinary URLs in MongoDB
- Serve images from Cloudinary's CDN

## Support

- Cloudinary Documentation: [https://cloudinary.com/documentation](https://cloudinary.com/documentation)
- Cloudinary Support: Available in your dashboard

---

**Note**: Keep your API Secret secure and never commit it to version control. Always use environment variables.
