import QuotationRepository from "../repositories/QuotationRepository.js";
import { getServices, getPageRanges, getFeatures } from "../chatbot/config/pricing.config.js";
import AuditLogService from "./AuditLogService.js";

class QuotationService {
    async calculateQuotation({
        serviceKey,
        subTypeKey,
        pageRangeKey,
        selectedFeatureKeys,
        additionalCharges,
        discount,
        tax
    }) {
        const SERVICES = await getServices();
        const PAGE_RANGES = await getPageRanges();
        const FEATURES = await getFeatures();

        const service = SERVICES[serviceKey];
        if (!service) {
            throw new Error("Invalid service selection.");
        }

        const items = [];
        let totalAmount = 0;

        // 1. Base Price
        if (subTypeKey && service.subTypes && service.subTypes[subTypeKey]) {
            const subType = service.subTypes[subTypeKey];
            items.push({
                name: `${subType.name} (Base Package)`,
                price: subType.basePrice
            });
            totalAmount += subType.basePrice;
        }

        // 2. Extra Pages
        let extraPagesPrice = 0;
        if (pageRangeKey && PAGE_RANGES[pageRangeKey]) {
            const pageRange = PAGE_RANGES[pageRangeKey];
            if (pageRange.extraPages > 0) {
                extraPagesPrice = pageRange.extraPages * pageRange.pricePerPage;
                items.push({
                    name: `Extra Pages (${pageRange.label})`,
                    price: extraPagesPrice
                });
                totalAmount += extraPagesPrice;
            }
        }

        // 3. Selected Features
        let featuresPrice = 0;
        if (selectedFeatureKeys && Array.isArray(selectedFeatureKeys)) {
            for (const key of selectedFeatureKeys) {
                const feature = FEATURES[key];
                if (feature) {
                    items.push({
                        name: feature.name,
                        price: feature.price
                    });
                    featuresPrice += feature.price;
                    totalAmount += feature.price;
                }
            }
        }

        // 4. Additional Charges
        let additionalChargesTotal = 0;
        if (additionalCharges && Array.isArray(additionalCharges)) {
            for (const charge of additionalCharges) {
                if (charge.name && charge.amount) {
                    items.push({
                        name: charge.name,
                        price: charge.amount
                    });
                    additionalChargesTotal += charge.amount;
                    totalAmount += charge.amount;
                }
            }
        }

        // 5. Discount
        let discountAmount = 0;
        if (discount && discount > 0) {
            discountAmount = discount;
            totalAmount -= discountAmount;
        }

        // 6. Tax
        let taxAmount = 0;
        if (tax && tax > 0) {
            taxAmount = Math.round(totalAmount * (tax / 100));
            totalAmount += taxAmount;
        }

        const breakdown = {
            basePrice: items.length > 0 ? items[0].price : 0,
            extraPagesPrice,
            featuresPrice,
            additionalChargesTotal,
            discountAmount,
            taxAmount,
            items
        };

        return {
            totalAmount,
            breakdown
        };
    }

    async createQuotation(quotationData, adminId, ipAddress = "") {
        const quotation = await QuotationRepository.create(quotationData);
        await AuditLogService.logAction(
            adminId,
            "QUOTATION_CREATE",
            { quotationId: quotation._id, customerId: quotation.customerId, total: quotation.totalAmount },
            ipAddress
        );
        return quotation;
    }

    async getQuotations(filters = {}, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const query = {};
        
        if (filters.status) query.status = filters.status;
        if (filters.customerId) query.customerId = filters.customerId;

        if (filters.startDate || filters.endDate) {
            query.createdAt = {};
            if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
            if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
        }

        return QuotationRepository.findAndPaginate(query, skip, limit);
    }

    async getQuotationById(id) {
        const quotation = await QuotationRepository.findById(id);
        if (!quotation) {
            throw new Error("Quotation not found.");
        }
        return quotation;
    }

    async updateQuotationStatus(id, status, adminId, ipAddress = "") {
        const quotation = await QuotationRepository.update(id, { status });
        if (!quotation) {
            throw new Error("Quotation not found.");
        }

        await AuditLogService.logAction(
            adminId,
            "QUOTATION_STATUS_CHANGE",
            { quotationId: id, status },
            ipAddress
        );
        return quotation;
    }
}

export default new QuotationService();
