import Quotation from "../models/Quotation.js";

class QuotationRepository {
    async findById(id) {
        return Quotation.findById(id);
    }

    async create(quotationData) {
        return Quotation.create(quotationData);
    }

    async update(id, updateData) {
        return Quotation.findByIdAndUpdate(id, updateData, { returnDocument: "after", runValidators: true });
    }

    async findAndPaginate(query, skip, limit) {
        const items = await Quotation.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Quotation.countDocuments(query);
        return { items, total };
    }
}

export default new QuotationRepository();
