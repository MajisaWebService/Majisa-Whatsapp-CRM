import Quotation from "../models/Quotation.js";
import { getServices, getPageRanges, getFeatures } from "../chatbot/config/pricing.config.js";

// Calculate quotation breakdown for admin before saving
export const calculateQuotationAdmin = async (req, res) => {
    try {
        const {
            serviceKey,
            subTypeKey,
            pageRangeKey,
            selectedFeatureKeys,
            additionalCharges,
            discount,
            tax
        } = req.body;

        const SERVICES = await getServices();
        const PAGE_RANGES = await getPageRanges();
        const FEATURES = await getFeatures();

        const service = SERVICES[serviceKey];
        if (!service) {
            return res.status(400).json({ success: false, message: "Invalid service selection." });
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

        return res.status(200).json({
            success: true,
            data: {
                totalAmount,
                breakdown
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Create and store a new quotation
export const createQuotation = async (req, res) => {
    try {
        const quotation = await Quotation.create(req.body);
        return res.status(201).json({ success: true, data: quotation });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get all quotations with search and filters
export const getAllQuotations = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};
        if (req.query.status) query.status = req.query.status;
        if (req.query.customerId) query.customerId = req.query.customerId;

        if (req.query.startDate || req.query.endDate) {
            query.createdAt = {};
            if (req.query.startDate) query.createdAt.$gte = new Date(req.query.startDate);
            if (req.query.endDate) query.createdAt.$lte = new Date(req.query.endDate);
        }

        const quotations = await Quotation.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Quotation.countDocuments(query);

        return res.status(200).json({
            success: true,
            data: quotations,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get single quotation by ID
export const getQuotationById = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);
        if (!quotation) {
            return res.status(404).json({ success: false, message: "Quotation not found." });
        }
        return res.status(200).json({ success: true, data: quotation });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Update quotation status
export const updateQuotationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, message: "Status is required." });
        }
        const quotation = await Quotation.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!quotation) {
            return res.status(404).json({ success: false, message: "Quotation not found." });
        }
        return res.status(200).json({ success: true, data: quotation });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
