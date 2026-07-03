import { getIO } from "./socketManager.js";
import { EVENTS } from "./events.js";

export const emitWhatsAppStatus = (status) => {
    try {
        getIO().to("admins").emit(EVENTS.WHATSAPP_STATUS, { status });
    } catch (e) {
        console.error("Failed to emit WhatsApp status:", e.message);
    }
};

export const emitWhatsAppQR = (qr) => {
    try {
        getIO().to("admins").emit(EVENTS.WHATSAPP_QR, { qr });
    } catch (e) {
        console.error("Failed to emit QR code:", e.message);
    }
};

export const emitNewCustomer = (customer) => {
    try {
        getIO().to("admins").emit(EVENTS.NEW_CUSTOMER, customer);
    } catch (e) {
        console.error("Failed to emit new customer lead:", e.message);
    }
};

export const emitCustomerUpdated = (customer) => {
    try {
        getIO().to("admins").emit(EVENTS.CUSTOMER_UPDATED, customer);
    } catch (e) {
        console.error("Failed to emit customer update:", e.message);
    }
};

export const emitNewMessage = (message) => {
    try {
        getIO().to("admins").emit(EVENTS.NEW_MESSAGE, message);
    } catch (e) {
        console.error("Failed to emit message:", e.message);
    }
};

export const emitQuotationGenerated = (quotation) => {
    try {
        getIO().to("admins").emit(EVENTS.QUOTATION_GENERATED, quotation);
    } catch (e) {
        console.error("Failed to emit quotation:", e.message);
    }
};

export const emitNotification = (notification) => {
    try {
        getIO().to("admins").emit(EVENTS.NOTIFICATION, notification);
    } catch (e) {
        console.error("Failed to emit notification:", e.message);
    }
};

export const emitTypingStatus = (customerId, isTyping) => {
    try {
        getIO().to("admins").emit("message:typing", { customerId, isTyping });
    } catch (e) {
        console.error("Failed to emit typing status:", e.message);
    }
};

export const emitMessageStatus = (messageId, customerId, status) => {
    try {
        getIO().to("admins").emit("message:status", { messageId, customerId, status });
    } catch (e) {
        console.error("Failed to emit message status:", e.message);
    }
};
