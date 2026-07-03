import CustomerRepository from "../repositories/CustomerRepository.js";
import AuditLogService from "./AuditLogService.js";

class CustomerService {
    // Reusable details validation check
    isQualifiedLead(cust) {
        return (
            cust.name &&
            cust.name !== "WhatsApp Contact" &&
            cust.name !== "Admin/Bot" &&
            cust.company &&
            cust.email &&
            cust.phone
        );
    }

    async getAllCustomers(filters = {}, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const query = {
            isDeleted: { $ne: true },
            name: { $ne: "", $exists: true, $nin: ["WhatsApp Contact", "Admin/Bot"] },
            company: { $ne: "", $exists: true },
            email: { $ne: "", $exists: true },
            phone: { $ne: "", $exists: true }
        };

        if (filters.search) {
            const regex = new RegExp(filters.search, "i");
            query.$or = [
                { name: regex },
                { company: regex },
                { email: regex },
                { phone: regex },
                { city: regex }
            ];
        }

        if (filters.status) {
            query.status = filters.status;
        }

        if (filters.executive) {
            query.assignedTo = filters.executive;
        }

        return CustomerRepository.findAndPaginate(query, skip, limit);
    }

    async getCustomerById(id) {
        const customer = await CustomerRepository.findById(id);
        if (!customer) {
            throw new Error("Customer not found");
        }
        return customer;
    }

    async createCustomer(customerData, adminId, ipAddress = "") {
        const customer = await CustomerRepository.create(customerData);
        await AuditLogService.logAction(
            adminId,
            "CUSTOMER_CREATE",
            { customerId: customer._id, name: customer.name },
            ipAddress
        );
        return customer;
    }

    async updateCustomer(id, updateData, adminId, ipAddress = "") {
        const original = await CustomerRepository.findById(id);
        if (!original) {
            throw new Error("Customer not found or deleted.");
        }

        const customer = await CustomerRepository.update(id, updateData);
        
        // Track differential values for audit compliance
        const changes = {};
        for (const key of Object.keys(updateData)) {
            if (original[key] !== updateData[key]) {
                changes[key] = { before: original[key], after: updateData[key] };
            }
        }

        await AuditLogService.logAction(
            adminId,
            "CUSTOMER_UPDATE",
            { customerId: id, changes },
            ipAddress
        );

        return customer;
    }

    async softDeleteCustomer(id, adminId, ipAddress = "") {
        const customer = await CustomerRepository.softDelete(id);
        if (!customer) {
            throw new Error("Customer not found.");
        }

        await AuditLogService.logAction(
            adminId,
            "CUSTOMER_DELETE",
            { customerId: id, name: customer.name },
            ipAddress
        );
        return customer;
    }

    async toggleBot(id, isBotPaused, adminId, ipAddress = "") {
        const customer = await CustomerRepository.update(id, { isBotPaused });
        if (!customer) {
            throw new Error("Customer not found.");
        }

        await AuditLogService.logAction(
            adminId,
            isBotPaused ? "BOT_PAUSE" : "BOT_RESUME",
            { customerId: id, phone: customer.phone },
            ipAddress
        );
        return customer;
    }
}

export default new CustomerService();
