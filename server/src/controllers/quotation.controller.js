import QuotationService from "../services/QuotationService.js";

// Calculate quotation breakdown for admin before saving
export const calculateQuotationAdmin = async (req, res, next) => {
    try {
        const result = await QuotationService.calculateQuotation(req.body);
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// Create and store a new quotation
export const createQuotation = async (req, res, next) => {
    try {
        const adminId = req.admin._id;
        const ipAddress = req.ip || "";
        const quotation = await QuotationService.createQuotation(req.body, adminId, ipAddress);
        return res.status(201).json({ success: true, data: quotation });
    } catch (error) {
        next(error);
    }
};

// Get all quotations with search and filters
export const getAllQuotations = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const filters = {
            status: req.query.status,
            customerId: req.query.customerId,
            startDate: req.query.startDate,
            endDate: req.query.endDate
        };

        const result = await QuotationService.getQuotations(filters, page, limit);

        return res.status(200).json({
            success: true,
            data: result.items,
            pagination: {
                total: result.total,
                page,
                limit,
                pages: Math.ceil(result.total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get single quotation by ID
export const getQuotationById = async (req, res, next) => {
    try {
        const quotation = await QuotationService.getQuotationById(req.params.id);
        return res.status(200).json({ success: true, data: quotation });
    } catch (error) {
        next(error);
    }
};

// Update quotation status
export const updateQuotationStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, message: "Status is required." });
        }
        
        const adminId = req.admin._id;
        const ipAddress = req.ip || "";
        const quotation = await QuotationService.updateQuotationStatus(req.params.id, status, adminId, ipAddress);
        return res.status(200).json({ success: true, data: quotation });
    } catch (error) {
        next(error);
    }
};
