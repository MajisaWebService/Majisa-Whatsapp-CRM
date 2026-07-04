import Customer from "../models/Customer.js";

class CustomerRepository {
    async findById(id) {
        return Customer.findOne({ _id: id, isDeleted: { $ne: true } });
    }

    async findByCustomerId(customerId) {
        return Customer.findOne({ customerId, isDeleted: { $ne: true } });
    }

    async findByPhone(phone) {
        return Customer.findOne({ phone, isDeleted: { $ne: true } });
    }

    async create(customerData) {
        return Customer.create(customerData);
    }

    async update(id, updateData) {
        return Customer.findOneAndUpdate(
            { _id: id, isDeleted: { $ne: true } },
            updateData,
            { returnDocument: "after", runValidators: true }
        );
    }

    async softDelete(id) {
        return Customer.findByIdAndUpdate(id, { isDeleted: true }, { returnDocument: "after" });
    }

    async findAndPaginate(query, skip, limit) {
        const items = await Customer.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Customer.countDocuments(query);
        return { items, total };
    }

    async count(query) {
        return Customer.countDocuments(query);
    }

    async aggregate(pipeline) {
        return Customer.aggregate(pipeline);
    }
}

export default new CustomerRepository();
