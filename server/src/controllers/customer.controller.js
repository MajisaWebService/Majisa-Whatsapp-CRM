import CustomerService from "../services/CustomerService.js";

// Get all customers with search and pagination
export const getAllCustomers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const filters = {
            search: req.query.search,
            status: req.query.status,
            executive: req.query.assignedTo
        };

        const result = await CustomerService.getAllCustomers(filters, page, limit);

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

// Get single customer
export const getCustomerById = async (req, res, next) => {
    try {
        const customer = await CustomerService.getCustomerById(req.params.id);
        return res.status(200).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

// Update customer details
export const updateCustomer = async (req, res, next) => {
    try {
        const adminId = req.admin._id;
        const ipAddress = req.ip || "";
        const customer = await CustomerService.updateCustomer(req.params.id, req.body, adminId, ipAddress);
        return res.status(200).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

// Soft delete customer
export const deleteCustomer = async (req, res, next) => {
    try {
        const adminId = req.admin._id;
        const ipAddress = req.ip || "";
        await CustomerService.softDeleteCustomer(req.params.id, adminId, ipAddress);
        return res.status(200).json({ success: true, message: "Customer deleted successfully." });
    } catch (error) {
        next(error);
    }
};

// Toggle bot pause state
export const toggleBotPause = async (req, res, next) => {
    try {
        const adminId = req.admin._id;
        const ipAddress = req.ip || "";
        const original = await CustomerService.getCustomerById(req.params.id);
        const nextState = !original.isBotPaused;
        const customer = await CustomerService.toggleBot(req.params.id, nextState, adminId, ipAddress);
        return res.status(200).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

// Change lead status
export const changeLeadStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, message: "Status is required." });
        }
        const adminId = req.admin._id;
        const ipAddress = req.ip || "";
        const customer = await CustomerService.updateCustomer(req.params.id, { status }, adminId, ipAddress);
        return res.status(200).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

// Assign executive
export const assignExecutive = async (req, res, next) => {
    try {
        const { assignedTo } = req.body;
        const adminId = req.admin._id;
        const ipAddress = req.ip || "";
        const customer = await CustomerService.updateCustomer(req.params.id, { assignedTo }, adminId, ipAddress);
        return res.status(200).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

// Add internal notes
export const addNotes = async (req, res, next) => {
    try {
        const { notes } = req.body;
        const adminId = req.admin._id;
        const ipAddress = req.ip || "";
        const customer = await CustomerService.updateCustomer(req.params.id, { notes }, adminId, ipAddress);
        return res.status(200).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};
