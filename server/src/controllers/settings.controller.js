import SettingsService from "../services/SettingsService.js";
import AuditLogService from "../services/AuditLogService.js";

// Fetch global settings
export const getSettings = async (req, res, next) => {
    try {
        const settings = await SettingsService.getSettings();
        return res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        next(error);
    }
};

// Update global settings
export const updateSettings = async (req, res, next) => {
    try {
        const adminId = req.admin._id;
        const ipAddress = req.ip || "";
        const settings = await SettingsService.updateSettings(req.body);

        await AuditLogService.logAction(
            adminId,
            "SETTINGS_UPDATE",
            { updatedFields: Object.keys(req.body) },
            ipAddress
        );

        return res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        next(error);
    }
};

// Pack and dump database collections as JSON backup
export const backupDatabase = async (req, res, next) => {
    try {
        const adminId = req.admin._id;
        const adminEmail = req.admin.email;
        const ipAddress = req.ip || "";
        
        const backupData = await SettingsService.backupDatabase(adminEmail);

        await AuditLogService.logAction(
            adminId,
            "DB_BACKUP",
            { file: "JSON export" },
            ipAddress
        );

        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename=majisa_crm_backup_${Date.now()}.json`);
        return res.status(200).send(JSON.stringify(backupData, null, 2));

    } catch (error) {
        next(error);
    }
};
