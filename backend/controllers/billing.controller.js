import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";

let stripeClient = undefined;

const resolveStripeClient = async () => {
    if (stripeClient) return stripeClient;
    if (!process.env.STRIPE_SECRET_KEY) return null;
    try {
        const stripeModule = await import("stripe");
        const StripeCtor = stripeModule.default;
        stripeClient = new StripeCtor(process.env.STRIPE_SECRET_KEY);
    } catch (error) {
        console.log("Stripe SDK load error:", error.message);
        stripeClient = null;
    }
    return stripeClient;
};

const PREMIUM_ELIGIBLE_TIERS = new Set(["premium", "enterprise"]);

const resolveProfileByStripeEvent = async ({ userId, customerId, subscriptionId }) => {
    if (userId) {
        const profileByUser = await Profile.findOne({ userId });
        if (profileByUser) return profileByUser;
    }
    if (subscriptionId) {
        const profileBySub = await Profile.findOne({ stripeSubscriptionId: subscriptionId });
        if (profileBySub) return profileBySub;
    }
    if (customerId) {
        const profileByCustomer = await Profile.findOne({ stripeCustomerId: customerId });
        if (profileByCustomer) return profileByCustomer;
    }
    return null;
};

// ── Create Stripe Checkout Session (monthly premium subscription) ──────────
export const createCheckoutSession = async (req, res) => {
    try {
        if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PREMIUM_PRICE_ID) {
            return res.status(500).json({
                success: false,
                message: "Stripe is not configured on the server",
            });
        }
        const stripe = await resolveStripeClient();
        if (!stripe) {
            return res.status(500).json({
                success: false,
                message: "Stripe SDK is unavailable or STRIPE_SECRET_KEY is missing",
            });
        }

        const user = await User.findById(req.userId).select("email").lean();
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let profile = await Profile.findOne({ userId: req.userId });
        if (!profile) {
            profile = await Profile.create({ userId: req.userId });
        }

        if (PREMIUM_ELIGIBLE_TIERS.has(profile.tier)) {
            return res.status(400).json({
                success: false,
                message: "You already have an active premium plan",
            });
        }

        let customerId = profile.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { userId: String(req.userId) },
            });
            customerId = customer.id;
            profile.stripeCustomerId = customerId;
            await profile.save();
        }

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer: customerId,
            line_items: [
                {
                    price: process.env.STRIPE_PREMIUM_PRICE_ID,
                    quantity: 1,
                },
            ],
            client_reference_id: String(req.userId),
            success_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/upgrade/cancel`,
            metadata: {
                userId: String(req.userId),
                plan: "premium-monthly",
            },
            subscription_data: {
                metadata: {
                    userId: String(req.userId),
                    plan: "premium-monthly",
                },
            },
        });

        return res.status(200).json({
            success: true,
            url: session.url,
            sessionId: session.id,
        });
    } catch (error) {
        console.log("Error in createCheckoutSession:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── Verify Checkout Session (fallback for when webhooks are unavailable) ────
export const verifyCheckoutSession = async (req, res) => {
    try {
        const { session_id } = req.query;
        if (!session_id) {
            return res.status(400).json({ success: false, message: "session_id is required" });
        }

        const stripe = await resolveStripeClient();
        if (!stripe) {
            return res.status(500).json({ success: false, message: "Stripe is not configured" });
        }

        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status !== "paid") {
            return res.status(400).json({
                success: false,
                message: "Payment has not been completed",
                paymentStatus: session.payment_status,
            });
        }

        // Find the profile by userId from the session metadata or by the logged-in user
        const userId = session.client_reference_id || session.metadata?.userId || req.userId;
        let profile = await Profile.findOne({ userId });
        if (!profile) {
            profile = await Profile.create({ userId });
        }

        // Upgrade to premium
        profile.tier = "premium";
        profile.subscriptionStatus = "active";
        profile.stripeCustomerId = session.customer || profile.stripeCustomerId || null;
        profile.stripeSubscriptionId = session.subscription || profile.stripeSubscriptionId || null;
        await profile.save();

        return res.status(200).json({
            success: true,
            message: "Subscription activated",
            tier: profile.tier,
        });
    } catch (error) {
        console.log("Error in verifyCheckoutSession:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── Stripe Webhook (must receive raw request body) ─────────────────────────
export const stripeWebhook = async (req, res) => {
    let event;

    try {
        if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
            return res.status(500).send("Stripe webhook is not configured");
        }
        const stripe = await resolveStripeClient();
        if (!stripe) {
            return res.status(500).send("Stripe webhook is not configured");
        }

        const signature = req.headers["stripe-signature"];
        if (!signature) {
            return res.status(400).send("Missing Stripe signature");
        }

        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        console.log("Stripe webhook signature verification failed:", error.message);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                const userId = session.client_reference_id || session.metadata?.userId;
                const customerId = session.customer;
                const subscriptionId = session.subscription;

                const profile = await resolveProfileByStripeEvent({
                    userId,
                    customerId,
                    subscriptionId,
                });
                if (!profile) break;

                profile.stripeCustomerId = customerId || profile.stripeCustomerId || null;
                profile.stripeSubscriptionId = subscriptionId || profile.stripeSubscriptionId || null;
                profile.tier = "premium";
                profile.subscriptionStatus = "active";
                await profile.save();
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object;
                const customerId = subscription.customer;
                const subscriptionId = subscription.id;
                const status = subscription.status || "active";

                const profile = await resolveProfileByStripeEvent({
                    customerId,
                    subscriptionId,
                });
                if (!profile) break;

                profile.stripeCustomerId = customerId || profile.stripeCustomerId || null;
                profile.stripeSubscriptionId = subscriptionId || profile.stripeSubscriptionId || null;
                profile.subscriptionStatus = status;
                profile.tier = ["active", "trialing", "past_due"].includes(status) ? "premium" : "free";
                if (profile.tier === "free") profile.stripeSubscriptionId = null;
                await profile.save();
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object;
                const customerId = subscription.customer;
                const subscriptionId = subscription.id;

                const profile = await resolveProfileByStripeEvent({
                    customerId,
                    subscriptionId,
                });
                if (!profile) break;

                profile.subscriptionStatus = "canceled";
                profile.tier = "free";
                profile.stripeSubscriptionId = null;
                await profile.save();
                break;
            }

            default:
                break;
        }

        return res.status(200).json({ received: true });
    } catch (error) {
        console.log("Error in stripeWebhook handler:", error);
        return res.status(500).send("Webhook handler failed");
    }
};
