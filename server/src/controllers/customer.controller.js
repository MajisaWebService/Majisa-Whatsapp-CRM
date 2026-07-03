import Customer from "../models/Customer.js";

// Get all customers with search and pagination
export const getAllCustomers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {
            isDeleted: { $ne: true },
            name: { $ne: "", $exists: true, $nin: ["WhatsApp Contact", "Admin/Bot"] },
            company: { $ne: "", $exists: true },
            email: { $ne: "", $exists: true },
            phone: { $ne: "", $exists: true }
        };

        // Search in Name, Company, Email, Phone
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, "i");
            query.$or = [
                { name: searchRegex },
                { company: searchRegex },
                { email: searchRegex },
                { phone: searchRegex }
            ];
        }

        // Exact filters
        if (req.query.status) query.status = req.query.status;
        if (req.query.source) query.source = req.query.source;
        if (req.query.assignedTo) query.assignedTo = req.query.assignedTo;

        // Date range query
        if (req.query.startDate || req.query.endDate) {
            query.createdAt = {};
            if (req.query.startDate) query.createdAt.$gte = new Date(req.query.startDate);
            if (req.query.endDate) query.createdAt.$lte = new Date(req.query.endDate);
        }

        const customers = await Customer.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Customer.countDocuments(query);

        return res.status(200).json({
            success: true,
            data: customers,
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

// Get single customer
export const getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found." });
        }
        return res.status(200).json({ success: true, data: customer });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Update customer details
export const updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found." });
        }
        return res.status(200).json({ success: true, data: customer });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Soft delete customer
export const deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found." });
        }
        return res.status(200).json({ success: true, message: "Customer deleted successfully." });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Toggle bot pause state
export const toggleBotPause = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found." });
        }
        customer.isBotPaused = !customer.isBotPaused;
        await customer.save();
        return res.status(200).json({ success: true, data: customer });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Change lead status
export const changeLeadStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, message: "Status is required." });
        }
        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found." });
        }
        return res.status(200).json({ success: true, data: customer });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Assign executive
export const assignExecutive = async (req, res) => {
    try {
        const { assignedTo } = req.body;
        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            { assignedTo },
            { new: true }
        );
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found." });
        }
        return res.status(200).json({ success: true, data: customer });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Add internal notes
export const addNotes = async (req, res) => {
    try {
        const { notes } = req.body;
        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            { notes },
            { new: true }
        );
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found." });
        }
        return res.status(200).json({ success: true, data: customer });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
