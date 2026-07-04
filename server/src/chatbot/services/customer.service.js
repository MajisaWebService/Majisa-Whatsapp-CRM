import Customer from "../../models/Customer.js";
import Notification from "../../models/Notification.js";
import { emitCustomerUpdated, emitNewCustomer, emitNotification } from "../../sockets/emitter.js";

// Create Customer
export const createCustomer = async (customerId) => {

    let customer = await Customer.findOne({ customerId });

    if (!customer) {

        customer = await Customer.create({
            customerId
        });

        console.log("✅ Customer Created");
        emitNewCustomer(customer);

        try {
            const notif = await Notification.create({
                type: "NEW_LEAD",
                title: "New Lead",
                message: `New chat conversation started with ${customerId}.`,
                customerId
            });
            emitNotification(notif);
        } catch (err) {
            console.error("Failed to create new lead notification:", err.message);
        }
    }

    return customer;
};

// Update Customer
export const updateCustomer = async (customerId, updateData) => {

    const customer = await Customer.findOneAndUpdate(
        { customerId },
        {
            $set: updateData
        },
        {
            returnDocument: "after",
            runValidators: true
        }
    );

    console.log("✅ Customer Updated");
    if (customer) {
        emitCustomerUpdated(customer);
    }

    return customer;
};

// Get Customer
export const getCustomer = async (customerId) => {

    return await Customer.findOne({
        customerId
    });

};