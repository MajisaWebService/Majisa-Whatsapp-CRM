import ChatState from "../models/ChatState.js";

// Get existing state or create one (always grabs the latest one)
export const getChatState = async (customerId) => {
    let state = await ChatState.findOne({ customerId }).sort({ createdAt: -1 });

    if (!state) {
        state = await ChatState.create({
            customerId,
            state: "WELCOME",
            service: "",
            data: {}
        });

        console.log("🆕 New ChatState Created");
        console.log(state);
    }

    return state;
};

// Create a brand new ChatState session
export const createNewChatState = async (customerId) => {
    const state = await ChatState.create({
        customerId,
        state: "WELCOME",
        service: "",
        data: {}
    });

    console.log("🆕 New ChatState Created (New Session)");
    console.log(state);

    return state;
};

// Update Chat State (always updates the latest session)
export const updateChatState = async (
    customerId,
    newState,
    updateData = {}
) => {
    // Find the latest session first to get its _id
    const latest = await ChatState.findOne({ customerId }).sort({ createdAt: -1 });

    if (!latest) {
        // Fallback if none exists
        const created = await ChatState.create({
            customerId,
            state: newState,
            ...updateData
        });
        return created;
    }

    const updated = await ChatState.findByIdAndUpdate(
        latest._id,
        {
            $set: {
                state: newState,
                invalidAttempts: 0,
                ...updateData
            }
        },
        {
            returnDocument: "after",
            runValidators: true
        }
    );

    console.log("✅ ChatState Updated");
    console.log(updated);

    return updated;
};

// Increment invalid attempts counter for the latest session
export const incrementInvalidAttempts = async (customerId) => {
    const latest = await ChatState.findOne({ customerId }).sort({ createdAt: -1 });
    if (!latest) return 0;

    const updated = await ChatState.findByIdAndUpdate(
        latest._id,
        {
            $inc: { invalidAttempts: 1 }
        },
        { returnDocument: "after" }
    );

    return updated ? updated.invalidAttempts : 0;
};