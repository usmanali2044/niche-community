import jwt from 'jsonwebtoken';

export const generateTokenandSetCookie = async (res, userId) => {
    const token = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie("Token", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return token;
};
