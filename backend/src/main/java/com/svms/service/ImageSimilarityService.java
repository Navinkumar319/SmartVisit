package com.svms.service;

import org.springframework.stereotype.Service;

import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.util.Base64;
import javax.imageio.ImageIO;

@Service
public class ImageSimilarityService {

    /**
     * Extracts the raw base64 data by stripping any data URI prefix (e.g. "data:image/jpeg;base64,").
     */
    private byte[] decodeBase64(String base64Str) throws IllegalArgumentException {
        if (base64Str == null || base64Str.isEmpty()) {
            throw new IllegalArgumentException("Base64 string is null or empty");
        }
        
        String cleanBase64 = base64Str;
        if (base64Str.contains(",")) {
            cleanBase64 = base64Str.split(",")[1];
        }
        
        return Base64.getDecoder().decode(cleanBase64.trim());
    }

    /**
     * Generates a 256-bit perceptual average hash (aHash) for an image.
     * The image is resized to 16x16, converted to grayscale, and each pixel is 
     * checked against the average pixel intensity to produce a bit hash.
     */
    public boolean[] getAverageHash(String base64Image) {
        try {
            byte[] imageBytes = decodeBase64(base64Image);
            ByteArrayInputStream bais = new ByteArrayInputStream(imageBytes);
            BufferedImage originalImage = ImageIO.read(bais);
            
            if (originalImage == null) {
                return null;
            }

            // 1. Resize to 16x16
            BufferedImage resizedImage = new BufferedImage(16, 16, BufferedImage.TYPE_BYTE_GRAY);
            Graphics2D g = resizedImage.createGraphics();
            g.drawImage(originalImage, 0, 0, 16, 16, null);
            g.dispose();

            // 2. Compute the average color intensity
            long sum = 0;
            int[] pixels = new int[256];
            for (int y = 0; y < 16; y++) {
                for (int x = 0; x < 16; x++) {
                    int gray = resizedImage.getRaster().getSample(x, y, 0);
                    pixels[y * 16 + x] = gray;
                    sum += gray;
                }
            }
            double average = sum / 256.0;

            // 3. Generate a 256-bit hash (each pixel is 1 if >= average, else 0)
            boolean[] hash = new boolean[256];
            for (int i = 0; i < 256; i++) {
                hash[i] = pixels[i] >= average;
            }

            return hash;
        } catch (Exception e) {
            System.err.println("[IMAGE SERVICE] Error generating image hash: " + e.getMessage());
            return null;
        }
    }

    /**
     * Computes the similarity score (0.0 to 1.0) between two image hashes.
     * Score is based on the Hamming distance (1.0 = identical, 0.0 = completely opposite).
     */
    public double getSimilarityScore(boolean[] hash1, boolean[] hash2) {
        if (hash1 == null || hash2 == null || hash1.length != 256 || hash2.length != 256) {
            return 0.0;
        }

        int hammingDistance = 0;
        for (int i = 0; i < 256; i++) {
            if (hash1[i] != hash2[i]) {
                hammingDistance++;
            }
        }

        // Return similarity percentage
        return (256 - hammingDistance) / 256.0;
    }
}
