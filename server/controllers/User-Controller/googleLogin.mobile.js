const User = require('../../models/User-models/User-models');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

/**
 * ================================
 * MOBILE GOOGLE LOGIN CONTROLLER
 * ================================
 * Android / iOS / React Native / Flutter
 * Uses ID TOKEN ONLY
 */

// Generic verifier (NO client secret)
const googleVerifier = new OAuth2Client();

// Allowed audiences for MOBILE
const GOOGLE_MOBILE_AUDIENCES = [
    process.env.GOOGLE_ANDROID_CLIENT_ID,
    process.env.GOOGLE_IOS_CLIENT_ID,
    process.env.GOOGLE_CLIENT_ID,
].filter(Boolean); // Filter out undefined values to avoid crashes

// Log configuration on startup to help debugging
console.log('--- Google Mobile Login Config ---');
console.log('✅ WEB CLIENT ID:', process.env.GOOGLE_CLIENT_ID);
console.log('✅ ANDROID CLIENT ID:', process.env.GOOGLE_ANDROID_CLIENT_ID);
if (!process.env.GOOGLE_ANDROID_CLIENT_ID) {
    console.warn('⚠️ WARNING: GOOGLE_ANDROID_CLIENT_ID is not set in .env!');
} else {
    console.log('✅ ANDROID CLIENT ID:', process.env.GOOGLE_ANDROID_CLIENT_ID);
}
if (!process.env.GOOGLE_IOS_CLIENT_ID) {
    console.log('ℹ️ GOOGLE_IOS_CLIENT_ID not set (optional for Android-only)');
}
console.log('----------------------------------');


// JWT generator (same style as your existing code)
const generateToken = (user) =>
    jwt.sign(
        {
            userId: user._id,
            username: user.username,
            email: user.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

const googleLoginMobile = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res
                .status(400)
                .json({ success: false, message: 'Google ID token is required' });
        }

        console.log(`[Mobile Login] Verifying token... Length: ${idToken.length}`);
        
        // DEBUG: Log what audiences we're checking for
        console.log('[Mobile Login] Configured audiences:', GOOGLE_MOBILE_AUDIENCES);
        console.log('[Mobile Login] Android Client ID from env:', process.env.GOOGLE_ANDROID_CLIENT_ID);

        // Verify ID token from mobile app
        let ticket;
        try {
            ticket = await googleVerifier.verifyIdToken({
                idToken,
                audience: GOOGLE_MOBILE_AUDIENCES,
            });
        } catch (verifyError) {
            console.error('[Mobile Login] Token Verification Failed:', verifyError.message);
            
            // DEBUG: Try to decode the token without verification to see the audience
            try {
                const decoded = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
                console.log('[Mobile Login] Decoded token (without verification):');
                console.log('- Audience (aud):', decoded.aud);
                console.log('- Issuer (iss):', decoded.iss);
                console.log('- Email:', decoded.email);
            } catch (e) {
                console.log('[Mobile Login] Could not decode token:', e.message);
            }
            
            return res.status(401).json({
                success: false,
                message: 'Invalid Google ID token',
                error: verifyError.message
            });
        }

        const {
            sub: googleId,
            email,
            name: username,
            picture,
            email_verified,
            aud
        } = ticket.getPayload();

        console.log(`[Mobile Login] Verified user: ${email} (${googleId}) for audience: ${aud}`);

        if (!email_verified) {
            return res
                .status(401)
                .json({ success: false, message: 'Google email not verified' });
        }

        // Same user logic as your web controller
        let user = await User.findOne({
            $or: [{ googleId }, { email }],
        });

        if (user) {
            console.log('[Mobile Login] Existing user found');
            if (!user.googleId) {
                console.log('[Mobile Login] Linking Google ID to existing email user');
                user.googleId = googleId;
                user.googleProfilePicture = picture;
                await user.save();
            }
        } else {
            console.log('[Mobile Login] Creating new user');
            user = new User({
                username,
                email,
                googleId,
                googleProfilePicture: picture,
            });
            await user.save();
        }

        const token = generateToken(user);
        console.log('[Mobile Login] JWT Generated successfully');

        res.json({
            success: true,
            message: 'Google mobile login successful',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.googleProfilePicture,
            },
            token,
        });
    } catch (error) {
        console.error('Google MOBILE login error (Unexpected):', error);
        res.status(500).json({
            success: false,
            message: 'Google mobile authentication failed internally',
            error: error.message
        });
    }
};

module.exports = googleLoginMobile;
