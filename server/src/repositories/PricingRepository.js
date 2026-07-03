import PricingRule from "../models/PricingRule.js";

class PricingRepository {
    async findById(id) {
        return PricingRule.findById(id);
    }

    async findByKey(key) {
        return PricingRule.findOne({ key });
    }

    async create(pricingData) {
        return PricingRule.create(pricingData);
    }

    async update(id, updateData) {
        return PricingRule.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    }

    async delete(id) {
        return PricingRule.findByIdAndDelete(id);
    }

    async findAll() {
        return PricingRule.find().sort({ sortOrder: 1 });
    }

    async findActive() {
        return PricingRule.find({ isActive: true }).sort({ sortOrder: 1 });
    }
}

export default new PricingRepository();
