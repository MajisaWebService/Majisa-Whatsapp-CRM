import Customer from "../../models/Customer.js";

// Create Customer
export const createCustomer = async (customerId) => {

    let customer = await Customer.findOne({ customerId });

    if (!customer) {

        customer = await Customer.create({
            customerId
        });

        console.log("✅ Customer Created");
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
            new: true,
            runValidators: true
        }
    );

    console.log("✅ Customer Updated");
    console.log(customer);

    return customer;
};

// Get Customer
export const getCustomer = async (customerId) => {

    return await Customer.findOne({
        customerId
    });

};